-- Migration: 001_init
-- Created: 2026-04-22
-- Description: Core tables — profiles, personas, documents, chat, notifications

-- ── UP ────────────────────────────────────────────────────────────────

-- Extend auth.users with public profile data
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT UNIQUE NOT NULL,
  full_name     TEXT,
  avatar_url    TEXT,
  bio           TEXT,
  website_url   TEXT,
  is_public     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- A person can have multiple public personas (job seeker, creator, freelancer)
CREATE TABLE IF NOT EXISTS personas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  slug          TEXT UNIQUE NOT NULL,          -- URL: /username/slug
  title         TEXT NOT NULL,                 -- "Senior Engineer", "Visual Artist"
  purpose       TEXT NOT NULL                  -- 'job_seeker' | 'creator' | 'freelancer' | 'consultant'
                  CHECK (purpose IN ('job_seeker', 'creator', 'freelancer', 'consultant')),
  description   TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  chat_enabled  BOOLEAN NOT NULL DEFAULT true,
  chat_greeting TEXT,                          -- Custom opening message
  metadata      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Uploaded files and links attached to a persona
CREATE TABLE IF NOT EXISTS documents (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id     UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  profile_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  original_name  TEXT NOT NULL,
  doc_type       TEXT NOT NULL DEFAULT 'other'
                   CHECK (doc_type IN ('cv', 'portfolio', 'bio', 'link', 'certificate', 'other')),
  file_url       TEXT,                         -- Supabase Storage URL or external URL
  content        TEXT,                         -- Extracted plain text
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'processing', 'ready', 'error')),
  error_message  TEXT,
  chunk_count    INTEGER NOT NULL DEFAULT 0,
  word_count     INTEGER,
  metadata       JSONB NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chat sessions (one per visitor × persona interaction)
CREATE TABLE IF NOT EXISTS chat_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id       UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  visitor_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  visitor_email    TEXT,
  visitor_name     TEXT,
  visitor_purpose  TEXT,                       -- Why they're visiting (free text)
  session_metadata JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Individual chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content     TEXT NOT NULL,
  metadata    JSONB NOT NULL DEFAULT '{}',     -- sources, fitment data, etc.
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Interview/collab requests initiated from a chat session
CREATE TABLE IF NOT EXISTS contact_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  persona_id       UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  requester_email  TEXT NOT NULL,
  requester_name   TEXT NOT NULL,
  requester_org    TEXT,
  subject          TEXT NOT NULL,              -- "Interview Request" | "Collaboration" | etc.
  message          TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'seen', 'accepted', 'declined')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Email notification queue
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,                   -- 'new_chat' | 'contact_request' | 'document_ready'
  subject     TEXT NOT NULL,
  payload     JSONB NOT NULL DEFAULT '{}',
  sent_at     TIMESTAMPTZ,
  error       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_personas_profile_id ON personas(profile_id);
CREATE INDEX IF NOT EXISTS idx_personas_slug ON personas(slug);
CREATE INDEX IF NOT EXISTS idx_documents_persona_id ON documents(persona_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_persona_id ON chat_sessions(persona_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_persona_id ON contact_requests(persona_id);
CREATE INDEX IF NOT EXISTS idx_notifications_profile_id ON notifications(profile_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON notifications(sent_at) WHERE sent_at IS NULL;

-- ── updated_at triggers ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_personas_updated_at
  BEFORE UPDATE ON personas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_contact_requests_updated_at
  BEFORE UPDATE ON contact_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── DOWN (rollback) ──────────────────────────────────────────────────
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS handle_new_user();
-- DROP FUNCTION IF EXISTS update_updated_at();
-- DROP TABLE IF EXISTS notifications;
-- DROP TABLE IF EXISTS contact_requests;
-- DROP TABLE IF EXISTS chat_messages;
-- DROP TABLE IF EXISTS chat_sessions;
-- DROP TABLE IF EXISTS documents;
-- DROP TABLE IF EXISTS personas;
-- DROP TABLE IF EXISTS profiles;
