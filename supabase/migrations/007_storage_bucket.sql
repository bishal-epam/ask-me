-- Migration: 007_storage_bucket
-- Created: 2026-04-24
-- Description: Create the documents storage bucket and its RLS policies

-- ── UP ────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  10485760,  -- 10 MB
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'text/markdown',
    'text/x-markdown',
    'text/csv'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Users can read their own files
CREATE POLICY "documents storage: owner read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can upload to their own folder
CREATE POLICY "documents storage: owner insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own files
CREATE POLICY "documents storage: owner delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── DOWN (rollback) ──────────────────────────────────────────────────
-- DROP POLICY IF EXISTS "documents storage: owner delete" ON storage.objects;
-- DROP POLICY IF EXISTS "documents storage: owner insert" ON storage.objects;
-- DROP POLICY IF EXISTS "documents storage: owner read"   ON storage.objects;
-- DELETE FROM storage.buckets WHERE id = 'documents';
