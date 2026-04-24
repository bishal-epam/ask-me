import { embedMany } from 'ai'
import { getEmbeddingModel } from '@/lib/ai'
import { createAdminClient } from '@/lib/supabase/server'
import { getLogger } from '@/lib/logger'
import type { PipelineContext, EmbeddingOutput } from '@/lib/pipeline/types'

const log = getLogger('embedding')

const CHUNK_WORDS = 400   // ~512 tokens
const OVERLAP_WORDS = 50  // ~64 tokens overlap
const BATCH_SIZE = 10     // embed 10 chunks per API call

// ─── Public entry point ───────────────────────────────────────────────────────

export async function generateEmbeddings(ctx: PipelineContext): Promise<EmbeddingOutput> {
  const text = ctx.rawText ?? ''
  if (!text.trim()) throw new Error('No text content to embed')

  log.info({ documentId: ctx.documentId, chars: text.length }, 'Starting embedding')

  const chunks = chunkText(text, ctx.documentId, ctx.personaId, ctx.docType ?? 'other')
  log.debug({ chunks: chunks.length }, 'Text chunked')

  // Remove existing chunks for this document before re-inserting (idempotent re-runs)
  const supabaseForDelete = await createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabaseForDelete.from('document_chunks') as any).delete().eq('document_id', ctx.documentId)

  const batches = toBatches(chunks, BATCH_SIZE)
  let successCount = 0
  let failCount = 0

  for (const batchChunks of batches) {
    const contents = batchChunks.map(c => c.content)

    let embeddings: number[][]
    try {
      // maxRetries=1 → SDK will try twice total before throwing
      const result = await embedMany({ model: getEmbeddingModel(), values: contents, maxRetries: 1 })
      embeddings = result.embeddings
    } catch (err) {
      log.warn({ err, count: batchChunks.length }, 'Batch embed failed — skipping chunks')
      failCount += batchChunks.length
      continue
    }

    const supabase = await createAdminClient()
    const rows = batchChunks.map((chunk, i) => ({
      document_id: ctx.documentId,
      persona_id: ctx.personaId,
      content: chunk.content,
      // pgVector expects the vector as a bracketed string: "[0.1,0.2,...]"
      embedding: formatVector(embeddings[i] ?? []),
      chunk_index: chunk.chunkIndex,
      metadata: chunk.metadata,
    }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('document_chunks') as any).insert(rows)
    if (error) {
      log.warn({ error, count: rows.length }, 'Chunk insert failed')
      failCount += rows.length
    } else {
      successCount += rows.length
    }
  }

  await updateChunkCount(ctx.documentId, successCount)

  log.info({ documentId: ctx.documentId, successCount, failCount }, 'Embedding complete')
  return { chunkCount: successCount, failedChunks: failCount }
}

// ─── Chunking ─────────────────────────────────────────────────────────────────

interface Chunk {
  content: string
  chunkIndex: number
  metadata: {
    document_id: string
    persona_id: string
    chunk_index: number
    section: string
    source_type: string
    doc_type: string
  }
}

function chunkText(text: string, documentId: string, personaId: string, docType: string): Chunk[] {
  const tokens = tokenizeWithPositions(text)
  if (tokens.length === 0) return []

  const sections = detectSections(text)
  const chunks: Chunk[] = []
  let start = 0
  let chunkIndex = 0

  while (start < tokens.length) {
    let end = Math.min(start + CHUNK_WORDS, tokens.length)

    // Prefer to end at a sentence boundary — search back up to 20 words from the target end
    if (end < tokens.length) {
      const searchFrom = Math.max(end - 20, start + 1)
      for (let i = end - 1; i >= searchFrom; i--) {
        const w = tokens[i]?.word ?? ''
        if (w.endsWith('.') || w.endsWith('!') || w.endsWith('?')) {
          end = i + 1
          break
        }
      }
    }

    const content = tokens.slice(start, end).map(t => t.word).join(' ')
    const chunkPos = tokens[start]?.charOffset ?? 0
    const section = sectionAt(sections, chunkPos)

    chunks.push({
      content,
      chunkIndex,
      metadata: { document_id: documentId, persona_id: personaId, chunk_index: chunkIndex, section, source_type: docType, doc_type: docType },
    })

    chunkIndex++
    // Slide forward by chunk size minus overlap; always advance at least 1
    start += Math.max(end - start - OVERLAP_WORDS, 1)
  }

  return chunks
}

// ─── Tokeniser ────────────────────────────────────────────────────────────────

interface WordToken {
  word: string
  charOffset: number
}

function tokenizeWithPositions(text: string): WordToken[] {
  const tokens: WordToken[] = []
  const re = /\S+/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    tokens.push({ word: m[0], charOffset: m.index })
  }
  return tokens
}

// ─── Section detection ────────────────────────────────────────────────────────

interface SectionHeader {
  name: string
  charOffset: number
}

// Common CV/document section keywords
const SECTION_RE =
  /^(experience|work\s+history|employment|education|skills|summary|objective|profile|projects|certifications|languages|awards|publications|references|qualifications|achievements|interests|about|contact)/i

function detectSections(text: string): SectionHeader[] {
  const headers: SectionHeader[] = []
  let charOffset = 0

  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.length > 0 && trimmed.length <= 60) {
      const isAllCaps = trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)
      const isKnownHeader = SECTION_RE.test(trimmed)
      // Short line, no terminal punctuation, ≤ 5 words — looks like a header
      const looksLikeHeader =
        !trimmed.endsWith('.') &&
        !trimmed.endsWith(',') &&
        !trimmed.endsWith(';') &&
        trimmed.split(/\s+/).length <= 5

      if (isAllCaps || isKnownHeader || (looksLikeHeader && trimmed.split(/\s+/).length <= 3)) {
        headers.push({ name: trimmed, charOffset })
      }
    }
    charOffset += line.length + 1 // +1 for the newline
  }

  return headers
}

function sectionAt(headers: SectionHeader[], charOffset: number): string {
  let current = ''
  for (const h of headers) {
    if (h.charOffset <= charOffset) current = h.name
    else break
  }
  return current
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatVector(embedding: number[]): string {
  return `[${embedding.join(',')}]`
}

function toBatches<T>(items: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size))
  }
  return result
}

async function updateChunkCount(documentId: string, count: number): Promise<void> {
  const supabase = await createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('documents') as any)
    .update({ chunk_count: count, updated_at: new Date().toISOString() })
    .eq('id', documentId)
}
