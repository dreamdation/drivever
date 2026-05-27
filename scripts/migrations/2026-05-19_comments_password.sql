-- Drivever Blog: add password_hash column to comments
-- Date: 2026-05-19
--
-- Purpose:
--   Allow commenters to set a 4-digit PIN at write time so the author can
--   later prove ownership (edit/delete) of their own comment.
--
-- Notes:
--   - Hashing is done client-side with SHA-256 (Web Crypto API).
--     The DB only ever sees and stores the hex digest, never the plaintext PIN.
--   - 4-digit PINs are weak by nature (10,000 possibilities). They are intended
--     as a lightweight ownership check, not as cryptographic protection.
--   - The column is nullable so legacy rows written before this migration
--     continue to load. New writes from the updated client always populate it.

ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS password_hash TEXT;
