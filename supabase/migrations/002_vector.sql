-- Migration: 002_vector
-- Created: 2026-04-22
-- Description: pgVector extension + document_chunks table for RAG

-- ── UP ────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS vector;

-- Chunked document text with vector embeddings for similarity search
-- EMBEDDING_DIMENSIONS: 768 = nomic-embed-text (Ollama), 1536 = text-embedding-3-small (OpenAI)
-- Change the dimension here if switching embedding providers.
CREATE TABLE IF NOT EXISTS document_chunks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id  UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  persona_id   UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  embedding    vector(768),                    -- UPDATE if switching to 1536-dim model
  chunk_index  INTEGER NOT NULL DEFAULT 0,
  metadata     JSONB NOT NULL DEFAULT '{}',    -- section, source_type, page_number, etc.
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chunks_persona_id ON document_chunks(persona_id);
CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON document_chunks(document_id);

-- IVFFlat index for approximate nearest-neighbor search
-- lists = sqrt(row_count) is a common heuristic; rebuild after bulk inserts
CREATE INDEX IF NOT EXISTS idx_chunks_embedding
  ON document_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ── Vector search function ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION search_chunks(
  query_embedding  vector(768),
  target_persona   UUID,
  match_threshold  FLOAT DEFAULT 0.3,
  match_count      INT   DEFAULT 6
)
RETURNS TABLE (
  id          UUID,
  content     TEXT,
  metadata    JSONB,
  similarity  FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.content,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  WHERE
    dc.persona_id = target_persona
    AND dc.embedding IS NOT NULL
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ── DOWN (rollback) ──────────────────────────────────────────────────
-- DROP FUNCTION IF EXISTS search_chunks;
-- DROP TABLE IF EXISTS document_chunks;
-- DROP EXTENSION IF EXISTS vector;
