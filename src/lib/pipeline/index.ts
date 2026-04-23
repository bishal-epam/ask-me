import { getLogger } from '@/lib/logger'
import { createAdminClient } from '@/lib/supabase/server'
import type {
  PipelineContext,
  PipelineResult,
  PipelineStage,
  StageResult,
  TextExtractionOutput,
  ProfileExtractionOutput,
  EmbeddingOutput,
} from './types'

const log = getLogger('pipeline')

// ─── Orchestrator ─────────────────────────────────────────────────────────────
//
// Deterministic state machine — no LLM involved in routing.
// Sequence:
//   1. Text extraction        (serial — downstream stages need the text)
//   2. Profile extraction  ─┐ (parallel — both consume raw text independently)
//      Embedding          ─┘
//   3. Notification           (serial — after both parallel stages settle)
//
// Each stage is independently retryable. A failure in profile extraction does
// not block embedding, and vice versa — the document can still be ready for
// chat even with a partial structured profile.

export async function runDocumentPipeline(ctx: PipelineContext): Promise<PipelineResult> {
  const start = Date.now()
  const stages: StageResult[] = []

  log.info({ documentId: ctx.documentId }, 'Pipeline started')

  // ── Stage 1: Text Extraction ─────────────────────────────────────────────
  await setPipelineStage(ctx.documentId, 'text_extracting')

  const textStage = await timedStage('text_extracting', () => extractText(ctx))
  stages.push(textStage)

  if (!textStage.ok) {
    await failDocument(ctx.documentId, textStage.error ?? 'Text extraction failed')
    return buildResult(ctx.documentId, stages, 'failed', 'text_extracting', start)
  }

  const textOutput = textStage.data as TextExtractionOutput
  await setPipelineStage(ctx.documentId, 'text_extracted')

  const enrichedCtx: PipelineContext = {
    ...ctx,
    rawText: textOutput.content,
    wordCount: textOutput.wordCount,
    sections: textOutput.sections,
    docType: textOutput.docType,
  }

  // ── Stage 2: Profile Extraction + Embedding (parallel) ───────────────────
  await setPipelineStage(ctx.documentId, 'extracting_profile')

  const [profileResult, embeddingResult] = await Promise.allSettled([
    timedStage('extracting_profile', () => extractStructuredProfile(enrichedCtx)),
    timedStage('embedding', () => generateEmbeddings(enrichedCtx)),
  ])

  const profileStage = settledToStageResult(profileResult, 'profile_extracted')
  const embeddingStage = settledToStageResult(embeddingResult, 'embedded')
  stages.push(profileStage, embeddingStage)

  // Log partial failures but do not abort — partial data > no data
  if (!profileStage.ok) {
    log.warn({ documentId: ctx.documentId, error: profileStage.error }, 'Profile extraction failed — continuing')
  } else {
    await setPipelineStage(ctx.documentId, 'profile_extracted')
  }

  if (!embeddingStage.ok) {
    log.warn({ documentId: ctx.documentId, error: embeddingStage.error }, 'Embedding failed — continuing')
  } else {
    await setPipelineStage(ctx.documentId, 'embedded')
  }

  // If BOTH parallel stages failed, the document is not usable
  if (!profileStage.ok && !embeddingStage.ok) {
    await failDocument(ctx.documentId, 'Both profile extraction and embedding failed')
    return buildResult(ctx.documentId, stages, 'failed', 'embedding', start)
  }

  // ── Stage 3: Finalize + Notify ────────────────────────────────────────────
  await markDocumentReady(ctx.documentId)
  await setPipelineStage(ctx.documentId, 'complete')

  const notifyStage = await timedStage('complete', () => notifyOwner(enrichedCtx))
  stages.push(notifyStage)

  log.info({ documentId: ctx.documentId, totalMs: Date.now() - start }, 'Pipeline complete')
  return buildResult(ctx.documentId, stages, 'complete', undefined, start)
}

// ─── Stage implementations (stubs — wired in feature iterations) ──────────────

async function extractText(_ctx: PipelineContext): Promise<TextExtractionOutput> {
  // TODO: implement in document-processing iteration
  // Will use pdfjs-dist / mammoth / URL fetch depending on doc_type
  throw new Error('extractText: not yet implemented')
}

async function extractStructuredProfile(_ctx: PipelineContext): Promise<ProfileExtractionOutput> {
  // TODO: implement in profile-extraction iteration
  // Calls profile-extraction-agent logic
  throw new Error('extractStructuredProfile: not yet implemented')
}

async function generateEmbeddings(_ctx: PipelineContext): Promise<EmbeddingOutput> {
  // TODO: implement in embedding iteration
  // Calls embedding-agent logic (chunks + vector inserts)
  throw new Error('generateEmbeddings: not yet implemented')
}

async function notifyOwner(_ctx: PipelineContext): Promise<void> {
  // TODO: implement notification — sendEmail(documentReadyNotification(...))
}

// ─── State machine helpers ────────────────────────────────────────────────────

// The admin client's update() generic resolves to `never` for partial payloads
// because Supabase's chain types are overly strict. We extract a typed helper
// so the cast is isolated and auditable in one place.
type DocumentPatch = {
  status?: 'pending' | 'processing' | 'ready' | 'error'
  pipeline_stage?: string
  error_message?: string | null
  chunk_count?: number
  updated_at?: string
}

async function patchDocument(documentId: string, patch: DocumentPatch): Promise<void> {
  const supabase = await createAdminClient()
  // Cast required: Supabase generic infers `never` for admin partial updates
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('documents') as any).update(patch).eq('id', documentId)
}

async function setPipelineStage(documentId: string, stage: PipelineStage): Promise<void> {
  await patchDocument(documentId, { pipeline_stage: stage, updated_at: new Date().toISOString() })
}

async function markDocumentReady(documentId: string): Promise<void> {
  await patchDocument(documentId, { status: 'ready', updated_at: new Date().toISOString() })
}

async function failDocument(documentId: string, error: string): Promise<void> {
  await patchDocument(documentId, {
    status: 'error',
    pipeline_stage: 'failed',
    error_message: error,
    updated_at: new Date().toISOString(),
  })
}

// ─── Utilities ────────────────────────────────────────────────────────────────

async function timedStage<T>(
  stage: PipelineStage,
  fn: () => Promise<T>
): Promise<StageResult<T>> {
  const t = Date.now()
  try {
    const data = await fn()
    return { ok: true, stage, durationMs: Date.now() - t, data }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    return { ok: false, stage, durationMs: Date.now() - t, error }
  }
}

function settledToStageResult<T>(
  settled: PromiseSettledResult<StageResult<T>>,
  fallbackStage: PipelineStage
): StageResult<T> {
  if (settled.status === 'fulfilled') return settled.value
  return {
    ok: false,
    stage: fallbackStage,
    durationMs: 0,
    error: settled.reason instanceof Error ? settled.reason.message : String(settled.reason),
  }
}

function buildResult(
  documentId: string,
  stages: StageResult[],
  finalStatus: 'complete' | 'failed',
  failedStage: PipelineStage | undefined,
  startMs: number
): PipelineResult {
  return {
    documentId,
    stages,
    finalStatus,
    totalDurationMs: Date.now() - startMs,
    // exactOptionalPropertyTypes: only include the key if the value is defined
    ...(failedStage !== undefined && { failedStage }),
  }
}
