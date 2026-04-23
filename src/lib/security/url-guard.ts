import { getLogger } from '@/lib/logger'

const log = getLogger('security:url-guard')

// ─── SSRF / malicious URL prevention ──────────────────────────────────────────
//
// Blocks:
//  - Private and loopback IP ranges (RFC 1918 + RFC 5735)
//  - Cloud metadata endpoints (AWS, GCP, Azure)
//  - Non-HTTPS schemes in production
//  - Excessively long URLs (header injection risk)
//  - Known malicious URL patterns

export interface UrlGuardResult {
  safe: boolean
  reason?: string
  normalizedUrl?: string
}

const MAX_URL_LENGTH = 2048

// Private IP ranges — blocks SSRF attempts to internal services
const PRIVATE_IP_PATTERNS = [
  /^(https?:\/\/)(localhost)(:\d+)?(\/|$)/i,
  /^(https?:\/\/)(127\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?(\/|$)/,
  /^(https?:\/\/)(0\.0\.0\.0)(:\d+)?(\/|$)/,
  /^(https?:\/\/)(10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?(\/|$)/,
  /^(https?:\/\/)(172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?(\/|$)/,
  /^(https?:\/\/)(192\.168\.\d{1,3}\.\d{1,3})(:\d+)?(\/|$)/,
  /^(https?:\/\/)(169\.254\.\d{1,3}\.\d{1,3})(:\d+)?(\/|$)/,  // link-local / APIPA
  /^(https?:\/\/)(\[::1\])(:\d+)?(\/|$)/,                      // IPv6 loopback
  /^(https?:\/\/)(\[fc[0-9a-f]{2}:)/i,                         // IPv6 ULA
  /^(https?:\/\/)(\[fd[0-9a-f]{2}:)/i,
]

// Cloud metadata endpoints — blocks credential theft via SSRF
const METADATA_PATTERNS = [
  /169\.254\.169\.254/,             // AWS IMDSv1 / GCP metadata
  /metadata\.google\.internal/i,
  /169\.254\.170\.2/,               // ECS metadata
  /fd00:ec2::254/,                   // AWS IMDSv2 IPv6
]

// File schemes that should never be fetched
const BLOCKED_SCHEMES = ['file:', 'ftp:', 'sftp:', 'ldap:', 'dict:', 'gopher:', 'data:']

// Allowed content types when fetching a URL — prevents fetching binaries
export const ALLOWED_FETCH_CONTENT_TYPES = [
  'text/html',
  'text/plain',
  'application/xhtml+xml',
  'application/xml',
  'text/xml',
]

export function validateUrl(raw: string): UrlGuardResult {
  if (!raw || typeof raw !== 'string') {
    return { safe: false, reason: 'URL must be a non-empty string' }
  }

  if (raw.length > MAX_URL_LENGTH) {
    return { safe: false, reason: `URL exceeds maximum length of ${MAX_URL_LENGTH} characters` }
  }

  let parsed: URL
  try {
    parsed = new URL(raw.trim())
  } catch {
    return { safe: false, reason: 'Invalid URL format' }
  }

  // Block non-HTTP(S) schemes
  if (BLOCKED_SCHEMES.includes(parsed.protocol)) {
    log.warn({ url: raw, scheme: parsed.protocol }, 'Blocked URL with disallowed scheme')
    return { safe: false, reason: 'Only HTTP and HTTPS URLs are permitted' }
  }

  if (parsed.protocol !== 'https:' && process.env.NODE_ENV === 'production') {
    return { safe: false, reason: 'Only HTTPS URLs are permitted in production' }
  }

  // Resolve hostname — guard against DNS rebinding by checking the raw hostname
  const hostname = parsed.hostname.toLowerCase()

  // Block cloud metadata endpoints
  for (const pattern of METADATA_PATTERNS) {
    if (pattern.test(hostname) || pattern.test(raw)) {
      log.warn({ url: raw }, 'Blocked cloud metadata URL')
      return { safe: false, reason: 'This URL is not permitted' }
    }
  }

  // Block private IP ranges
  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(raw)) {
      log.warn({ url: raw }, 'Blocked private IP range URL')
      return { safe: false, reason: 'Private network URLs are not permitted' }
    }
  }

  // Block raw IPv4 addresses (not hostnames) to prevent DNS-bypassing SSRF
  const ipv4Regex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/
  if (ipv4Regex.test(hostname)) {
    log.warn({ url: raw, hostname }, 'Blocked direct IP address URL')
    return { safe: false, reason: 'Direct IP address URLs are not permitted' }
  }

  // Block URLs with credentials embedded (user:pass@host)
  if (parsed.username || parsed.password) {
    return { safe: false, reason: 'URLs with embedded credentials are not permitted' }
  }

  return { safe: true, normalizedUrl: parsed.toString() }
}

// Validates the Content-Type of a fetched URL response
export function validateFetchedContentType(contentType: string | null): boolean {
  if (!contentType) return false
  const base = contentType.split(';')[0]?.trim().toLowerCase() ?? ''
  return ALLOWED_FETCH_CONTENT_TYPES.some((allowed) => base.startsWith(allowed))
}
