// Domain types for Ask Me
// Database types are auto-generated in database.ts via `npm run db:types`

export type AiProvider = 'ollama' | 'openai' | 'anthropic'

export type PersonaPurpose = 'job_seeker' | 'creator' | 'freelancer' | 'consultant'

export type DocumentType = 'cv' | 'portfolio' | 'bio' | 'link' | 'certificate' | 'other'

export type DocumentStatus = 'pending' | 'processing' | 'ready' | 'error'

export type ContactRequestStatus = 'pending' | 'seen' | 'accepted' | 'declined'

export type MessageRole = 'user' | 'assistant' | 'system'

export type NotificationType = 'new_chat' | 'contact_request' | 'document_ready' | 'document_error'

// ─── Profile ──────────────────────────────────────────────────────────

export interface Profile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  website_url: string | null
  is_public: boolean
  created_at: string
  updated_at: string
}

// ─── Persona ──────────────────────────────────────────────────────────

export interface Persona {
  id: string
  profile_id: string
  slug: string
  title: string
  purpose: PersonaPurpose
  description: string | null
  is_active: boolean
  chat_enabled: boolean
  chat_greeting: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface PersonaWithProfile extends Persona {
  profile: Pick<Profile, 'username' | 'full_name' | 'avatar_url'>
}

// ─── Document ─────────────────────────────────────────────────────────

export interface Document {
  id: string
  persona_id: string
  profile_id: string
  name: string
  original_name: string
  doc_type: DocumentType
  file_url: string | null
  content: string | null
  status: DocumentStatus
  error_message: string | null
  chunk_count: number
  word_count: number | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

// ─── Chat ─────────────────────────────────────────────────────────────

export interface ChatSession {
  id: string
  persona_id: string
  visitor_id: string | null
  visitor_email: string | null
  visitor_name: string | null
  visitor_purpose: string | null
  session_metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  session_id: string
  role: MessageRole
  content: string
  metadata: {
    sources?: string[]
    fitment?: FitmentReport
    [key: string]: unknown
  }
  created_at: string
}

// ─── Fitment ──────────────────────────────────────────────────────────

export interface FitmentReport {
  persona_id: string
  job_title: string
  overall_score: number
  recommendation: 'strong_fit' | 'possible_fit' | 'poor_fit'
  matched_skills: string[]
  missing_skills: string[]
  experience_match: boolean
  summary: string
  talking_points: string[]
  generated_at: string
}

// ─── Contact Request ──────────────────────────────────────────────────

export interface ContactRequest {
  id: string
  session_id: string
  persona_id: string
  requester_email: string
  requester_name: string
  requester_org: string | null
  subject: string
  message: string
  status: ContactRequestStatus
  created_at: string
  updated_at: string
}

// ─── API Response ─────────────────────────────────────────────────────

export interface ApiError {
  error: string
  code?: string
}

export type ApiResponse<T> = { data: T; error: null } | { data: null; error: ApiError }
