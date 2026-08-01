-- ISA820 — 005 SECURITY LOCKDOWN
-- =============================================================================
-- CRITICAL. Apply before anything else.
--
-- Migration 001/002 created, on every table:
--     CREATE POLICY "Anon write <table>" ON <table> FOR ALL USING (true) WITH CHECK (true);
--
-- FOR ALL covers INSERT, UPDATE and DELETE, and USING (true) matches every row.
-- The anon key is a public credential — it is compiled into the browser bundle
-- served from isa820.com and is readable by anyone who opens devtools. The two
-- together mean any visitor can destroy the entire database.
--
-- Verified against the live project on 2026-08-01 (anon key only):
--   POST   /rest/v1/knowledge_base   -> 23505 unique-constraint violation
--                                      (RLS passed; the row was accepted and
--                                       only rejected by the topic index)
--   DELETE /rest/v1/{verses, tahot_words, tagnt_words, proper_names,
--           strongs_lexicon, media_assets, standard_documents, knowledge_base}
--                                    -> HTTP 204 on every one
--
-- A single request — DELETE /rest/v1/verses?id=neq.<any-uuid> — would erase
-- 184,609 verse rows. The same shape empties the 439,372 manuscript word rows
-- and every doctrinal document.
--
-- FIX: keep public SELECT (this is a public Bible reader), remove all anon write
-- access. Ingest scripts are unaffected — they authenticate with
-- SUPABASE_SERVICE_ROLE_KEY, and the service role bypasses RLS entirely.
--
-- KNOWN CONSEQUENCE: AdminVaultManager writes from the browser with the anon key,
-- so its save/delete actions will start failing. That is intended. /admin has no
-- authentication of any kind — it is currently a public, unauthenticated delete
-- panel. Restore its function through a server route that holds the service-role
-- key behind an auth check; do not restore it by re-granting anon writes.
-- =============================================================================

BEGIN;

-- 1. Remove every permissive write policy ------------------------------------
DROP POLICY IF EXISTS "Anon write verses"        ON verses;
DROP POLICY IF EXISTS "Anon write strongs"       ON strongs_lexicon;
DROP POLICY IF EXISTS "Anon write strongs_usage" ON strongs_usage;
DROP POLICY IF EXISTS "Anon write knowledge"     ON knowledge_base;
DROP POLICY IF EXISTS "Anon write media"         ON media_assets;
DROP POLICY IF EXISTS "Anon write mappings"      ON topic_mappings;
DROP POLICY IF EXISTS "Anon write documents"     ON standard_documents;
DROP POLICY IF EXISTS "Anon write tahot_words"   ON tahot_words;
DROP POLICY IF EXISTS "Anon write tagnt_words"   ON tagnt_words;
DROP POLICY IF EXISTS "Anon write proper_names"  ON proper_names;
DROP POLICY IF EXISTS "Anon write pno"           ON proper_name_occurrences;
DROP POLICY IF EXISTS "Anon write bible_books"   ON bible_books;

-- Legacy names from earlier drafts, harmless if absent.
DROP POLICY IF EXISTS "Authenticated insert media"    ON media_assets;
DROP POLICY IF EXISTS "Authenticated update media"    ON media_assets;
DROP POLICY IF EXISTS "Authenticated delete media"    ON media_assets;
DROP POLICY IF EXISTS "Authenticated write mappings"  ON topic_mappings;
DROP POLICY IF EXISTS "Authenticated write documents" ON standard_documents;

-- 2. Guarantee RLS is on ------------------------------------------------------
-- Without ENABLE, policies are inert. With no write policy present, writes are
-- denied by default — exactly what we want for anon and authenticated.
ALTER TABLE verses                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE strongs_lexicon         ENABLE ROW LEVEL SECURITY;
ALTER TABLE strongs_usage           ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base          ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets            ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_mappings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE standard_documents      ENABLE ROW LEVEL SECURITY;
ALTER TABLE tahot_words             ENABLE ROW LEVEL SECURITY;
ALTER TABLE tagnt_words             ENABLE ROW LEVEL SECURITY;
ALTER TABLE proper_names            ENABLE ROW LEVEL SECURITY;
ALTER TABLE proper_name_occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE bible_books             ENABLE ROW LEVEL SECURITY;

-- 3. Public read stays — the reader is meant to be open -----------------------
DROP POLICY IF EXISTS "Public read verses"        ON verses;
DROP POLICY IF EXISTS "Public read strongs"       ON strongs_lexicon;
DROP POLICY IF EXISTS "Public read strongs_usage" ON strongs_usage;
DROP POLICY IF EXISTS "Public read knowledge"     ON knowledge_base;
DROP POLICY IF EXISTS "Public read media"         ON media_assets;
DROP POLICY IF EXISTS "Public read mappings"      ON topic_mappings;
DROP POLICY IF EXISTS "Public read documents"     ON standard_documents;
DROP POLICY IF EXISTS "Public read tahot_words"   ON tahot_words;
DROP POLICY IF EXISTS "Public read tagnt_words"   ON tagnt_words;
DROP POLICY IF EXISTS "Public read proper_names"  ON proper_names;
DROP POLICY IF EXISTS "Public read pn_occ"        ON proper_name_occurrences;
DROP POLICY IF EXISTS "Public read bible_books"   ON bible_books;

CREATE POLICY "Public read verses"        ON verses                  FOR SELECT USING (true);
CREATE POLICY "Public read strongs"       ON strongs_lexicon         FOR SELECT USING (true);
CREATE POLICY "Public read strongs_usage" ON strongs_usage           FOR SELECT USING (true);
CREATE POLICY "Public read knowledge"     ON knowledge_base          FOR SELECT USING (true);
CREATE POLICY "Public read media"         ON media_assets            FOR SELECT USING (true);
CREATE POLICY "Public read mappings"      ON topic_mappings          FOR SELECT USING (true);
CREATE POLICY "Public read documents"     ON standard_documents      FOR SELECT USING (true);
CREATE POLICY "Public read tahot_words"   ON tahot_words             FOR SELECT USING (true);
CREATE POLICY "Public read tagnt_words"   ON tagnt_words             FOR SELECT USING (true);
CREATE POLICY "Public read proper_names"  ON proper_names            FOR SELECT USING (true);
CREATE POLICY "Public read pn_occ"        ON proper_name_occurrences FOR SELECT USING (true);
CREATE POLICY "Public read bible_books"   ON bible_books             FOR SELECT USING (true);

-- 4. Defence in depth: revoke the underlying grants ---------------------------
-- RLS alone would suffice, but a future permissive policy — or RLS accidentally
-- disabled on one table — should not silently re-open write access. Removing the
-- table privileges means anon cannot write even if a policy says it may.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON ALL TABLES IN SCHEMA public FROM authenticated;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- Any table created later inherits the same posture.
-- ALTER DEFAULT PRIVILEGES requires the object type (ON TABLES) before FROM.
-- Omitting it is a 42601 syntax error — unlike the plain REVOKE above, which
-- takes `ON ALL TABLES IN SCHEMA`. The two forms are not interchangeable.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLES FROM authenticated;

COMMIT;

-- =============================================================================
-- VERIFICATION — run after COMMIT. (a) and (b) must return zero rows.
-- =============================================================================

-- (a) No policy anywhere may permit a write.
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd <> 'SELECT';

-- (b) anon/authenticated hold no write privilege on any table.
SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated')
  AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE');

-- (c) Confirm reads still work (expect a count, not an error).
SELECT count(*) AS verses_readable FROM verses;
