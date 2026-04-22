-- Migration: 003_rls
-- Created: 2026-04-22
-- Description: Row Level Security policies for all tables

-- ── UP ────────────────────────────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ── profiles ─────────────────────────────────────────────────────────

-- Anyone can read public profiles
CREATE POLICY "profiles: public read"
  ON profiles FOR SELECT
  USING (is_public = true);

-- Users can read their own profile (even if private)
CREATE POLICY "profiles: own read"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles: own update"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ── personas ─────────────────────────────────────────────────────────

-- Anyone can read active public personas
CREATE POLICY "personas: public read"
  ON personas FOR SELECT
  USING (is_active = true);

-- Owners can manage their personas
CREATE POLICY "personas: owner manage"
  ON personas FOR ALL
  USING (
    profile_id = auth.uid()
  );

-- ── documents ────────────────────────────────────────────────────────

-- Only owners can see their documents (content is private)
CREATE POLICY "documents: owner only"
  ON documents FOR ALL
  USING (profile_id = auth.uid());

-- ── document_chunks ──────────────────────────────────────────────────

-- Chunks are read via the search_chunks function (SECURITY DEFINER)
-- Direct reads only for owners
CREATE POLICY "chunks: owner only"
  ON document_chunks FOR ALL
  USING (
    persona_id IN (
      SELECT id FROM personas WHERE profile_id = auth.uid()
    )
  );

-- ── chat_sessions ────────────────────────────────────────────────────

-- Persona owners can see all sessions for their personas
CREATE POLICY "sessions: persona owner read"
  ON chat_sessions FOR SELECT
  USING (
    persona_id IN (
      SELECT id FROM personas WHERE profile_id = auth.uid()
    )
  );

-- Visitors (authenticated) can see their own sessions
CREATE POLICY "sessions: visitor read"
  ON chat_sessions FOR SELECT
  USING (visitor_id = auth.uid());

-- Anyone can create a chat session (visitors may be anonymous)
-- Service role handles anonymous creation via API route
CREATE POLICY "sessions: insert via service"
  ON chat_sessions FOR INSERT
  WITH CHECK (true);

-- ── chat_messages ────────────────────────────────────────────────────

-- Persona owners can read all messages in their sessions
CREATE POLICY "messages: persona owner read"
  ON chat_messages FOR SELECT
  USING (
    session_id IN (
      SELECT cs.id FROM chat_sessions cs
      JOIN personas p ON cs.persona_id = p.id
      WHERE p.profile_id = auth.uid()
    )
  );

-- Anyone can insert messages (API route validates session ownership)
CREATE POLICY "messages: insert via service"
  ON chat_messages FOR INSERT
  WITH CHECK (true);

-- ── contact_requests ─────────────────────────────────────────────────

-- Persona owners can read and update their contact requests
CREATE POLICY "requests: persona owner manage"
  ON contact_requests FOR ALL
  USING (
    persona_id IN (
      SELECT id FROM personas WHERE profile_id = auth.uid()
    )
  );

-- Anyone can create a contact request
CREATE POLICY "requests: public insert"
  ON contact_requests FOR INSERT
  WITH CHECK (true);

-- ── notifications ────────────────────────────────────────────────────

-- Users can only see their own notifications
CREATE POLICY "notifications: own read"
  ON notifications FOR SELECT
  USING (profile_id = auth.uid());

-- ── DOWN (rollback) ──────────────────────────────────────────────────
-- DROP POLICY IF EXISTS "notifications: own read" ON notifications;
-- (... drop all policies in reverse order)
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
-- (... disable RLS on all tables)
