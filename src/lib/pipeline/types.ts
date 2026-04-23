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

export interface PipelineContext {
  documentId: string
  personaId: string
  profileId: string
  // Populated by text extraction, consumed by downstream stages
  rawText?: string
  wordCount?: number
  sections?: string[]
  docType?: string
}

export interface StageResult<T = unknown> {
  ok: boolean
  stage: PipelineStage
  durationMs: number
  data?: T
  error?: string
}

export interface PipelineResult {
  documentId: string
  stages: StageResult[]
  finalStatus: 'complete' | 'failed'
  failedStage?: PipelineStage
  totalDurationMs: number
}

// What text extraction produces — passed to both parallel stages
export interface TextExtractionOutput {
  content: string
  docType: string
  wordCount: number
  sections: string[]
  language: string
  pageCount?: number
}

// What profile extraction produces
export interface ProfileExtractionOutput {
  structuredProfile: Record<string, unknown>
  confidenceScore: number
}

// What embedding produces
export interface EmbeddingOutput {
  chunkCount: number
  failedChunks: number
}
