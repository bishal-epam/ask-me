-- Migration: 005_analytics
-- Created: 2026-04-23
-- Description: Query persistence (reviewed_at on sessions), question analytics, content guard logs

-- ── UP ────────────────────────────────────────────────────────────────

-- Track when the persona owner last reviewed each conversation.
-- NULL means unseen.
ALTER TABLE chat_sessions
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- ── Question analytics ────────────────────────────────────────────────
-- Tracks frequency of question topics per persona.
-- Topic is a normalized category key (e.g. "years_experience", "remote_work").
-- Populated by the chat API route after a visitor message passes the content guard.

CREATE TABLE IF NOT EXISTS question_analytics (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id     UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  topic          TEXT NOT NULL,          -- normalized category: "experience", "skills", etc.
  sample_question TEXT,                  -- most recent raw question in this topic (display only)
  count          INTEGER NOT NULL DEFAULT 1,
  last_asked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (persona_id, topic)
);

CREATE INDEX IF NOT EXISTS idx_question_analytics_persona
  ON question_analytics(persona_id, count DESC);

CREATE TRIGGER trg_question_analytics_updated_at
  BEFORE UPDATE ON question_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Content guard audit log ───────────────────────────────────────────
-- Persists every BLOCK decision for abuse monitoring and false-positive review.
-- ALLOW decisions are not logged (high volume, low value).

CREATE TABLE IF NOT EXISTS guard_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id  UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  session_id  UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
  flags       TEXT[] NOT NULL DEFAULT '{}',   -- e.g. ['protected_characteristic']
  confidence  NUMERIC(4,3) NOT NULL,
  message_snippet TEXT,                       -- first 120 chars of the blocked message (for review)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guard_logs_persona
  ON guard_logs(persona_id, created_at DESC);

-- ── RLS policies ──────────────────────────────────────────────────────

ALTER TABLE question_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE guard_logs ENABLE ROW LEVEL SECURITY;

-- Persona owners can see analytics and guard logs for their personas
CREATE POLICY "analytics: persona owner read"
  ON question_analytics FOR SELECT
  USING (
    persona_id IN (SELECT id FROM personas WHERE profile_id = auth.uid())
  );

CREATE POLICY "guard_logs: persona owner read"
  ON guard_logs FOR SELECT
  USING (
    persona_id IN (SELECT id FROM personas WHERE profile_id = auth.uid())
  );

-- Service role inserts (via API routes)
CREATE POLICY "analytics: service insert"
  ON question_analytics FOR INSERT WITH CHECK (true);

CREATE POLICY "analytics: service update"
  ON question_analytics FOR UPDATE USING (true);

CREATE POLICY "guard_logs: service insert"
  ON guard_logs FOR INSERT WITH CHECK (true);

-- ── DOWN (rollback) ──────────────────────────────────────────────────
-- DROP POLICY IF EXISTS "guard_logs: service insert" ON guard_logs;
-- DROP POLICY IF EXISTS "analytics: service update" ON question_analytics;
-- DROP POLICY IF EXISTS "analytics: service insert" ON question_analytics;
-- DROP POLICY IF EXISTS "guard_logs: persona owner read" ON guard_logs;
-- DROP POLICY IF EXISTS "analytics: persona owner read" ON question_analytics;
-- DROP TABLE IF EXISTS guard_logs;
-- DROP TABLE IF EXISTS question_analytics;
-- ALTER TABLE chat_sessions DROP COLUMN IF EXISTS reviewed_at;
