// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { validateDocument, validateMagicBytes } from '@/lib/security/document-guard'

const PDF_MAGIC = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34])  // %PDF-1.4
const EXE_MAGIC = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00])  // MZ header

describe('validateDocument', () => {
  it('allows valid PDF', () => {
    expect(validateDocument({
      filename: 'my-cv.pdf',
      sizeBytes: 500_000,
      declaredMime: 'application/pdf',
      firstBytes: PDF_MAGIC,
    })).toMatchObject({ safe: true })
  })

  it('blocks files over 10 MB', () => {
    expect(validateDocument({
      filename: 'large.pdf',
      sizeBytes: 11 * 1024 * 1024,
      declaredMime: 'application/pdf',
    })).toMatchObject({ safe: false })
  })

  it('blocks path traversal in filename', () => {
    expect(validateDocument({
      filename: '../../../etc/passwd',
      sizeBytes: 1024,
      declaredMime: 'text/plain',
    })).toMatchObject({ safe: false })
  })

  it('blocks disallowed MIME types', () => {
    expect(validateDocument({
      filename: 'script.js',
      sizeBytes: 1024,
      declaredMime: 'application/javascript',
    })).toMatchObject({ safe: false })

    expect(validateDocument({
      filename: 'app.exe',
      sizeBytes: 1024,
      declaredMime: 'application/x-msdownload',
    })).toMatchObject({ safe: false })
  })

  it('blocks empty files', () => {
    expect(validateDocument({
      filename: 'empty.pdf',
      sizeBytes: 0,
      declaredMime: 'application/pdf',
    })).toMatchObject({ safe: false })
  })
})

describe('validateMagicBytes', () => {
  it('blocks executable disguised as PDF', () => {
    const result = validateMagicBytes(EXE_MAGIC, 'application/pdf')
    expect(result.safe).toBe(false)
    expect(result.detectedMime).toContain('executable')
  })

  it('allows PDF magic bytes with PDF mime', () => {
    expect(validateMagicBytes(PDF_MAGIC, 'application/pdf')).toMatchObject({ safe: true })
  })
})
