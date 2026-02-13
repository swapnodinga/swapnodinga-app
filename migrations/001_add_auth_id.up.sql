-- Add auth_id to members for mapping Supabase Auth users
BEGIN;

ALTER TABLE IF EXISTS members ADD COLUMN IF NOT EXISTS auth_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS members_auth_id_idx ON members (auth_id);

COMMIT;
