// Domain types for Ask Me
// Database types are auto-generated in database.ts via `npm run db:types`

export type AiProvider = 'ollama' | 'openai' | 'anthropic'

export type PersonaPurpose = 'job_seeker' | 'creator' | 'freelancer' | 'consultant'

export type DocumentType = 'cv' | 'portfolio' | 'bio' | 'link' | 'certificate' | 'other'

export type DocumentStatus = 'pending' | 'processing' | 'ready' | 'error'

export type PipelineStage =
  | 'pending'
  | 'text_extracting'
  | 'text_extracted'
  | 'extracting_profile'
  | 'embedding'
  | 'profile_extracted'
  | 'embedded'
  | 'complete'
  | 'failed'

export type ContactRequestStatus = 'pending' | 'seen' | 'accepted' | 'declined'

export type MessageRole = 'user' | 'assistant' | 'system'

export type NotificationType = 'new_chat' | 'contact_request' | 'document_ready' | 'document_error'

// ─── Structured Profile (produced by profile-extraction-agent) ────────

export type SkillCategory = 'technical' | 'soft' | 'domain'

export type Seniority =
  | 'intern'
  | 'junior'
  | 'mid'
  | 'senior'
  | 'lead'
  | 'principal'
  | 'director'
  | 'vp'
  | 'c-level'

export type CareerTrajectory = 'ascending' | 'lateral' | 'pivoting'

export type AvailabilityStatus = 'open' | 'actively_looking' | 'passive' | 'not_looking'

export interface ExtractedSkill {
  name: string
  category: SkillCategory
  years?: number
  confidence: number  // 0–1
}

export interface ExtractedExperience {
  company: string
  role: string
  seniority: Seniority
  start_date: string        // "YYYY-MM" or "YYYY"
  end_date: string          // "YYYY-MM" | "YYYY" | "present"
  tenure_months: number
  reportees?: number
  industries?: string[]
  highlights?: string[]     // max 3 key achievements
}

export interface ExtractedEducation {
  institution: string
  degree?: string           // "BSc", "MBA"
  field?: string            // "Computer Science"
  year?: number
}

export interface ExtractedCertification {
  name: string
  issuer?: string
  year?: number
}

export interface StructuredProfile {
  skills: ExtractedSkill[]
  experience: ExtractedExperience[]
  total_years_experience: number
  current_seniority: Seniority
  career_trajectory: CareerTrajectory
  education: ExtractedEducation[]
  certifications?: ExtractedCertification[]
  availability: {
    status: AvailabilityStatus
    available_from?: string
    preferred_work_type?: ('remote' | 'hybrid' | 'onsite')[]
    preferred_locations?: string[]
  }
  industries: string[]
  languages?: { language: string; proficiency: string }[]
  // Extraction metadata
  extraction_version: string
  extracted_at: string
  document_ids: string[]
  confidence_score: number  // 0–1 overall confidence
}

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
  structured_profile: StructuredProfile | null
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
  pipeline_stage: PipelineStage
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

// ─── Content Guard ────────────────────────────────────────────────────────────

export type GuardFlag =
  | 'protected_characteristic'
  | 'prompt_injection'
  | 'pii_request'
  | 'impersonation_abuse'
  | 'off_topic_harmful'

export interface GuardResult {
  decision: 'ALLOW' | 'BLOCK'
  flags: GuardFlag[]
  confidence: number
  canned_response: string | null
  low_confidence_flag?: boolean
}

// ─── Question Suggestions ─────────────────────────────────────────────────────

export type QuestionCategory =
  | 'experience'
  | 'skills'
  | 'availability'
  | 'education'
  | 'projects'
  | 'personality'

export interface QuestionSuggestion {
  id: string
  text: string
  category: QuestionCategory
  source: 'static' | 'profile' | 'popular'
  count?: number  // populated when source is 'popular'
}

// ─── Question Analytics ───────────────────────────────────────────────────────

export interface QuestionAnalytic {
  id: string
  persona_id: string
  topic: string
  sample_question: string | null
  count: number
  last_asked_at: string
  updated_at: string
}

// ─── Guard Log ────────────────────────────────────────────────────────────────

export interface GuardLog {
  id: string
  persona_id: string
  session_id: string | null
  flags: GuardFlag[]
  confidence: number
  message_snippet: string | null
  created_at: string
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface ApiError {
  error: string
  code?: string
}

export type ApiResponse<T> = { data: T; error: null } | { data: null; error: ApiError }
