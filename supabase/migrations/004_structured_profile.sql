-- Migration: 004_structured_profile
-- Created: 2026-04-23
-- Description: Add structured_profile to personas and pipeline_stage to documents

-- ── UP ────────────────────────────────────────────────────────────────

-- Structured JSON profile extracted by profile-extraction-agent.
-- Populated after document processing; merged on each new document upload.
ALTER TABLE personas
  ADD COLUMN IF NOT EXISTS structured_profile JSONB NOT NULL DEFAULT '{}';

-- Fine-grained pipeline stage within the broader status field.
-- status is the coarse view (pending/processing/ready/error);
-- pipeline_stage is the detailed view for the orchestrator to act on.
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS pipeline_stage TEXT NOT NULL DEFAULT 'pending'
    CHECK (pipeline_stage IN (
      'pending',
      'text_extracting',
      'text_extracted',
      'extracting_profile',
      'embedding',
      'profile_extracted',
      'embedded',
      'complete',
      'failed'
    ));

-- Index: orchestrator polls for documents in terminal per-stage states
CREATE INDEX IF NOT EXISTS idx_documents_pipeline_stage
  ON documents(pipeline_stage)
  WHERE pipeline_stage NOT IN ('complete', 'failed');

-- Index: fast lookup of structured_profile existence for the chat agent
CREATE INDEX IF NOT EXISTS idx_personas_has_profile
  ON personas ((structured_profile != '{}'))
  WHERE structured_profile != '{}';

-- ── DOWN (rollback) ──────────────────────────────────────────────────
-- DROP INDEX IF EXISTS idx_personas_has_profile;
-- DROP INDEX IF EXISTS idx_documents_pipeline_stage;
-- ALTER TABLE documents DROP COLUMN IF EXISTS pipeline_stage;
-- ALTER TABLE personas DROP COLUMN IF EXISTS structured_profile;
