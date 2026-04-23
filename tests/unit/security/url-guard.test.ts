// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { validateUrl } from '@/lib/security/url-guard'

describe('validateUrl', () => {
  it('allows valid public HTTPS URLs', () => {
    expect(validateUrl('https://linkedin.com/in/alice')).toMatchObject({ safe: true })
    expect(validateUrl('https://github.com/alice')).toMatchObject({ safe: true })
  })

  it('blocks localhost', () => {
    expect(validateUrl('http://localhost:3000/secret')).toMatchObject({ safe: false })
    expect(validateUrl('https://localhost/api')).toMatchObject({ safe: false })
  })

  it('blocks loopback IPs', () => {
    expect(validateUrl('http://127.0.0.1/etc/passwd')).toMatchObject({ safe: false })
    expect(validateUrl('http://127.1.2.3/')).toMatchObject({ safe: false })
  })

  it('blocks private RFC-1918 ranges', () => {
    expect(validateUrl('http://10.0.0.1/')).toMatchObject({ safe: false })
    expect(validateUrl('http://192.168.1.1/')).toMatchObject({ safe: false })
    expect(validateUrl('http://172.16.0.1/')).toMatchObject({ safe: false })
    expect(validateUrl('http://172.31.255.255/')).toMatchObject({ safe: false })
  })

  it('blocks link-local / APIPA', () => {
    expect(validateUrl('http://169.254.169.254/latest/meta-data/')).toMatchObject({ safe: false })
  })

  it('blocks cloud metadata endpoints', () => {
    expect(validateUrl('http://169.254.169.254/metadata')).toMatchObject({ safe: false })
    expect(validateUrl('http://metadata.google.internal/')).toMatchObject({ safe: false })
  })

  it('blocks direct IPv4 addresses', () => {
    expect(validateUrl('https://8.8.8.8/')).toMatchObject({ safe: false })
  })

  it('blocks non-HTTP schemes', () => {
    expect(validateUrl('file:///etc/passwd')).toMatchObject({ safe: false })
    expect(validateUrl('ftp://files.example.com')).toMatchObject({ safe: false })
    expect(validateUrl('data:text/html,<script>alert(1)</script>')).toMatchObject({ safe: false })
  })

  it('blocks URLs with embedded credentials', () => {
    expect(validateUrl('https://user:pass@example.com/')).toMatchObject({ safe: false })
  })

  it('blocks excessively long URLs', () => {
    const long = 'https://example.com/' + 'a'.repeat(2100)
    expect(validateUrl(long)).toMatchObject({ safe: false })
  })

  it('rejects invalid URL format', () => {
    expect(validateUrl('not-a-url')).toMatchObject({ safe: false })
    expect(validateUrl('')).toMatchObject({ safe: false })
  })
})
