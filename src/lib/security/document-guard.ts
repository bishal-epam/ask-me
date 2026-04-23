import { getLogger } from '@/lib/logger'

const log = getLogger('security:document-guard')

// ─── File safety validation ────────────────────────────────────────────────────
//
// Runs before any document processing. Checks:
//  - File size within limit
//  - MIME type is in the allowlist
//  - Magic bytes match the declared MIME type (prevents MIME spoofing)
//  - Filename is safe (no path traversal, no null bytes)

export interface DocumentGuardResult {
  safe: boolean
  reason?: string
  detectedMime?: string
}

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  // 10 MB

export const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword',                                                        // .doc (legacy)
  'text/plain',
  'text/markdown',
  'text/csv',
])

// Magic byte signatures — first N bytes identify the real file type
// Used to catch files that lie about their extension/MIME type
const MAGIC_SIGNATURES: { mime: string; bytes: number[]; offset?: number }[] = [
  { mime: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] },  // %PDF
  {
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    bytes: [0x50, 0x4b, 0x03, 0x04],  // ZIP header (docx is a ZIP)
  },
  { mime: 'application/msword', bytes: [0xd0, 0xcf, 0x11, 0xe0] },  // OLE header
  // Executables — always block
  { mime: 'application/x-executable', bytes: [0x4d, 0x5a] },         // MZ (Windows PE)
  { mime: 'application/x-elf', bytes: [0x7f, 0x45, 0x4c, 0x46] },   // ELF (Linux binary)
  { mime: 'application/x-mach-o', bytes: [0xce, 0xfa, 0xed, 0xfe] }, // Mach-O (macOS)
]

const BLOCKED_EXECUTABLE_MIMES = new Set([
  'application/x-executable',
  'application/x-elf',
  'application/x-mach-o',
  'application/x-msdownload',
  'application/x-sh',
  'application/javascript',
  'text/javascript',
  'application/x-python',
])

// ─── Filename safety ───────────────────────────────────────────────────────────

export function validateFilename(filename: string): DocumentGuardResult {
  if (!filename || typeof filename !== 'string') {
    return { safe: false, reason: 'Filename is required' }
  }

  // Path traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    log.warn({ filename }, 'Blocked path traversal in filename')
    return { safe: false, reason: 'Invalid filename' }
  }

  // Null bytes
  if (filename.includes('\0')) {
    return { safe: false, reason: 'Invalid filename' }
  }

  // Excessively long
  if (filename.length > 255) {
    return { safe: false, reason: 'Filename is too long' }
  }

  return { safe: true }
}

// ─── File size ─────────────────────────────────────────────────────────────────

export function validateFileSize(sizeBytes: number): DocumentGuardResult {
  if (sizeBytes <= 0) {
    return { safe: false, reason: 'File is empty' }
  }
  if (sizeBytes > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (sizeBytes / 1024 / 1024).toFixed(1)
    return { safe: false, reason: `File size (${sizeMb} MB) exceeds the 10 MB limit` }
  }
  return { safe: true }
}

// ─── MIME type allowlist ───────────────────────────────────────────────────────

export function validateMimeType(declaredMime: string): DocumentGuardResult {
  const normalized = declaredMime.split(';')[0]?.trim().toLowerCase() ?? ''

  if (BLOCKED_EXECUTABLE_MIMES.has(normalized)) {
    log.warn({ mime: normalized }, 'Blocked executable MIME type')
    return { safe: false, reason: 'This file type is not permitted' }
  }

  if (!ALLOWED_MIME_TYPES.has(normalized)) {
    return {
      safe: false,
      reason: `Unsupported file type. Accepted types: PDF, DOCX, DOC, TXT, Markdown`,
    }
  }

  return { safe: true }
}

// ─── Magic byte verification ───────────────────────────────────────────────────
// Reads the first 8 bytes of the file to detect what it actually is,
// regardless of what the extension or Content-Type header claims.

export function validateMagicBytes(
  firstBytes: Uint8Array,
  declaredMime: string
): DocumentGuardResult {
  const normalized = declaredMime.split(';')[0]?.trim().toLowerCase() ?? ''

  for (const sig of MAGIC_SIGNATURES) {
    const matches = sig.bytes.every(
      (byte, i) => firstBytes[(sig.offset ?? 0) + i] === byte
    )

    if (matches) {
      // Block executables regardless of declared MIME
      if (BLOCKED_EXECUTABLE_MIMES.has(sig.mime)) {
        log.warn({ detectedMime: sig.mime, declaredMime }, 'Blocked executable disguised as document')
        return {
          safe: false,
          detectedMime: sig.mime,
          reason: 'File content does not match its declared type',
        }
      }

      // Warn if declared MIME doesn't match detected MIME (but don't always block —
      // text/plain files have no magic bytes and will fail signature matching)
      if (sig.mime !== normalized && normalized !== 'text/plain' && normalized !== 'text/markdown') {
        log.warn({ detectedMime: sig.mime, declaredMime }, 'MIME mismatch detected')
        // Block the mismatch — legitimate files don't masquerade as other types
        return {
          safe: false,
          detectedMime: sig.mime,
          reason: 'File content does not match its declared type',
        }
      }
    }
  }

  return { safe: true }
}

// ─── Combined file validator ───────────────────────────────────────────────────

export function validateDocument(opts: {
  filename: string
  sizeBytes: number
  declaredMime: string
  firstBytes?: Uint8Array
}): DocumentGuardResult {
  const filenameCheck = validateFilename(opts.filename)
  if (!filenameCheck.safe) return filenameCheck

  const sizeCheck = validateFileSize(opts.sizeBytes)
  if (!sizeCheck.safe) return sizeCheck

  const mimeCheck = validateMimeType(opts.declaredMime)
  if (!mimeCheck.safe) return mimeCheck

  if (opts.firstBytes && opts.firstBytes.length >= 4) {
    const magicCheck = validateMagicBytes(opts.firstBytes, opts.declaredMime)
    if (!magicCheck.safe) return magicCheck
  }

  return { safe: true }
}
