-- Rollback: remove auth_id column and index
BEGIN;

DROP INDEX IF EXISTS members_auth_id_idx;
ALTER TABLE IF EXISTS members DROP COLUMN IF EXISTS auth_id;

COMMIT;
