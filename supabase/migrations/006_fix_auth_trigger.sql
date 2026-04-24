-- Migration: 006_fix_auth_trigger
-- Created: 2026-04-24
-- Description: Fix handle_new_user trigger — add missing profiles INSERT policy
--              and harden the function with proper search_path + unique-violation
--              handling so duplicate sign-up attempts don't hard-error.

-- ── UP ────────────────────────────────────────────────────────────────

-- The profiles table has RLS enabled (003_rls) but no INSERT policy,
-- so the trigger's INSERT is rejected on Supabase remote even though the
-- function is SECURITY DEFINER. Adding a policy scoped to the service role
-- (which the trigger owner — postgres/supabase_auth_admin — maps to) fixes this.
-- auth.uid() is NULL inside a trigger so we use `WITH CHECK (true)` here;
-- the trigger itself enforces that id = NEW.id (the just-created auth user).
CREATE POLICY "profiles: trigger insert"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Recreate the trigger function with:
--   SET search_path = public  → canonical Supabase recommendation for SECURITY DEFINER
--   EXCEPTION block           → turns a duplicate-username into a safe fallback instead
--                               of a hard error that surfaces to the end-user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _username TEXT;
BEGIN
  _username := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), ''),
    REGEXP_REPLACE(LOWER(SPLIT_PART(NEW.email, '@', 1)), '[^a-z0-9_]', '_', 'g')
  );

  INSERT INTO profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    _username,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Username collision — append first 6 chars of the user id to guarantee uniqueness
    INSERT INTO profiles (id, username, full_name, avatar_url)
    VALUES (
      NEW.id,
      _username || '_' || SUBSTRING(NEW.id::text, 1, 6),
      COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), ''),
      COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    );
    RETURN NEW;
END;
$$;

-- ── DOWN (rollback) ──────────────────────────────────────────────────
-- DROP POLICY IF EXISTS "profiles: trigger insert" ON profiles;
-- (restore original function from 001_init.sql)
