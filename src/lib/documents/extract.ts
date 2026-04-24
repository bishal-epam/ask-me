import mammoth from 'mammoth'
import { validateDocument, validateUrl, validateFetchedContentType } from '@/lib/security'
import { createAdminClient } from '@/lib/supabase/server'
import { getLogger } from '@/lib/logger'
import type { PipelineContext, TextExtractionOutput } from '@/lib/pipeline/types'

const log = getLogger('document-processor')

// CV/portfolio sections we actively look for
const KNOWN_SECTIONS = [
  'Summary', 'Objective', 'Profile', 'About',
  'Experience', 'Work History', 'Employment',
  'Education', 'Skills', 'Projects',
  'Certifications', 'Languages', 'Awards',
  'Publications', 'References', 'Interests',
  'Achievements', 'Contact',
]

type FileFormat = 'pdf' | 'docx' | 'doc' | 'text' | 'url'

// ─── Public entry point ───────────────────────────────────────────────────────

export async function extractText(ctx: PipelineContext): Promise<TextExtractionOutput> {
  const supabase = await createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: doc, error } = await (supabase.from('documents') as any)
    .select('file_url, original_name, doc_type')
    .eq('id', ctx.documentId)
    .single()

  if (error || !doc) throw new Error(`Document not found: ${ctx.documentId}`)

  const { file_url: fileUrl, original_name: originalName, doc_type: docType } = doc as {
    file_url: string
    original_name: string
    doc_type: string
  }

  log.info({ documentId: ctx.documentId, docType, originalName }, 'Starting text extraction')

  const format = detectFormat(originalName, fileUrl, docType)
  let text: string
  let pageCount: number | undefined

  if (format === 'url') {
    const urlCheck = validateUrl(fileUrl)
    if (!urlCheck.safe) throw new Error(`URL blocked: ${urlCheck.reason}`)
    ;({ text } = await fetchUrl(urlCheck.normalizedUrl ?? fileUrl))
  } else {
    const buffer = await downloadFile(fileUrl)
    const firstBytes = new Uint8Array(buffer.slice(0, 8))
    const guard = validateDocument({
      filename: originalName,
      sizeBytes: buffer.byteLength,
      declaredMime: mimeFor(format),
      firstBytes,
    })
    if (!guard.safe) throw new Error(`File rejected: ${guard.reason}`)

    if (format === 'pdf') {
      ;({ text, pageCount } = await parsePdf(buffer))
    } else if (format === 'docx' || format === 'doc') {
      text = await parseDocx(buffer)
    } else {
      text = Buffer.from(buffer).toString('utf-8')
    }
  }

  const content = cleanText(text)
  const wordCount = content.split(/\s+/).filter(Boolean).length
  const sections = detectSections(content)

  await patchDocument(ctx.documentId, {
    content,
    word_count: wordCount,
    metadata: {
      sections,
      language: 'en',
      extracted_at: new Date().toISOString(),
      ...(pageCount !== undefined && { page_count: pageCount }),
    },
  })

  log.info({ documentId: ctx.documentId, wordCount, sections: sections.length }, 'Text extraction complete')

  return {
    content,
    docType,
    wordCount,
    sections,
    language: 'en',
    ...(pageCount !== undefined && { pageCount }),
  }
}

// ─── Parsers ──────────────────────────────────────────────────────────────────

async function parsePdf(buffer: ArrayBuffer): Promise<{ text: string; pageCount: number }> {
  // Dynamic import keeps pdfjs-dist out of the client bundle and lets us use
  // the legacy (Node.js-compatible) build that doesn't require DOM APIs.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfjs = (await import('pdfjs-dist/legacy/build/pdf.mjs')) as any
  pdfjs.GlobalWorkerOptions.workerSrc = ''

  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) })
  const pdf = await loadingTask.promise

  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pageText = (content.items as any[])
      .filter(item => 'str' in item)
      .map(item => item.str as string)
      .join(' ')
    pages.push(pageText)
  }

  return { text: pages.join('\n\n'), pageCount: pdf.numPages as number }
}

async function parseDocx(buffer: ArrayBuffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) })
  return result.value
}

// ─── URL fetcher ──────────────────────────────────────────────────────────────

async function fetchUrl(url: string): Promise<{ text: string }> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AskMeBot/1.0)' },
    signal: AbortSignal.timeout(30_000),
  })

  if (!res.ok) throw new Error(`Failed to fetch URL: HTTP ${res.status}`)

  const contentType = res.headers.get('content-type')
  if (!validateFetchedContentType(contentType)) {
    throw new Error(`Unexpected content type from URL: ${contentType}`)
  }

  const html = await res.text()
  return { text: extractTextFromHtml(html) }
}

function extractTextFromHtml(html: string): string {
  // Remove scripts, styles, and their content first
  let text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')

  // Prefer main content blocks when available
  const mainMatch = text.match(/<(?:main|article)[\s>][^]*?<\/(?:main|article)>/i)
  if (mainMatch) text = mainMatch[0]

  // Strip all remaining tags, decode common entities
  return text
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, ' ')
}

// ─── File download ────────────────────────────────────────────────────────────

// The documents bucket is private. Files are always downloaded via the admin
// client — never via a public URL. External URLs (doc_type='link') use fetch.
async function downloadFile(fileUrl: string): Promise<ArrayBuffer> {
  if (!fileUrl.startsWith('http://') && !fileUrl.startsWith('https://')) {
    // Bare storage path (e.g. "user-id/persona-id/timestamp-file.pdf")
    return downloadFromStorage(fileUrl)
  }

  // Supabase storage URL — extract the path and download via admin client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  if (supabaseUrl && fileUrl.startsWith(supabaseUrl) && fileUrl.includes('/storage/v1/')) {
    const match = fileUrl.match(/\/storage\/v1\/object\/[^/]+\/documents\/(.+)/)
    if (match?.[1]) return downloadFromStorage(decodeURIComponent(match[1]))
  }

  // Fully external URL (link doc_type) — plain fetch
  const res = await fetch(fileUrl, { signal: AbortSignal.timeout(30_000) })
  if (!res.ok) throw new Error(`Failed to download file: HTTP ${res.status}`)
  return res.arrayBuffer()
}

async function downloadFromStorage(storagePath: string): Promise<ArrayBuffer> {
  const supabase = await createAdminClient()
  const { data, error } = await supabase.storage.from('documents').download(storagePath)
  if (error || !data) throw new Error(`Storage download failed: ${error?.message ?? 'unknown'}`)
  return data.arrayBuffer()
}

// ─── Format detection ─────────────────────────────────────────────────────────

function detectFormat(originalName: string, fileUrl: string, docType: string): FileFormat {
  if (docType === 'link') return 'url'

  const name = originalName.toLowerCase()
  if (name.endsWith('.pdf')) return 'pdf'
  if (name.endsWith('.docx')) return 'docx'
  if (name.endsWith('.doc')) return 'doc'
  if (name.endsWith('.txt') || name.endsWith('.md') || name.endsWith('.csv')) return 'text'

  // Fall back to inspecting the storage URL path
  try {
    const path = new URL(fileUrl).pathname.toLowerCase()
    if (path.endsWith('.pdf')) return 'pdf'
    if (path.endsWith('.docx')) return 'docx'
    if (path.endsWith('.doc')) return 'doc'
  } catch { /* not a URL */ }

  return 'text'
}

function mimeFor(format: Exclude<FileFormat, 'url'>): string {
  switch (format) {
    case 'pdf': return 'application/pdf'
    case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    case 'doc': return 'application/msword'
    default: return 'text/plain'
  }
}

// ─── Section detection ────────────────────────────────────────────────────────

function detectSections(text: string): string[] {
  const found = new Set<string>()
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.length > 60) continue
    const lower = trimmed.toLowerCase().replace(/:$/, '')
    for (const section of KNOWN_SECTIONS) {
      if (lower === section.toLowerCase() || lower.startsWith(section.toLowerCase())) {
        found.add(section)
        break
      }
    }
  }
  return Array.from(found)
}

// ─── Text cleaning ────────────────────────────────────────────────────────────

function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, '  ')
    .replace(/[ \t]+$/gm, '')   // trailing whitespace per line
    .replace(/\n{3,}/g, '\n\n') // collapse 3+ blank lines to 2
    .trim()
}

// ─── DB write-back ────────────────────────────────────────────────────────────

async function patchDocument(
  documentId: string,
  patch: { content: string; word_count: number; metadata: Record<string, unknown> }
): Promise<void> {
  const supabase = await createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('documents') as any)
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', documentId)
}
