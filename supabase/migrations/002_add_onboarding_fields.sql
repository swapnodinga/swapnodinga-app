-- Migration: Add onboarding and replacement audit fields to members
-- Adds: onboarding_type, replaced_by_member_id, replaced_at, replaced_by_admin_id

BEGIN;

ALTER TABLE IF EXISTS members
  ADD COLUMN IF NOT EXISTS onboarding_type VARCHAR(32) DEFAULT 'fresh_start';

ALTER TABLE IF EXISTS members
  ADD COLUMN IF NOT EXISTS replaced_by_member_id INTEGER;

ALTER TABLE IF EXISTS members
  ADD COLUMN IF NOT EXISTS replaced_at TIMESTAMPTZ;

ALTER TABLE IF EXISTS members
  ADD COLUMN IF NOT EXISTS replaced_by_admin_id INTEGER;

-- Optional indexes to speed up queries
CREATE INDEX IF NOT EXISTS idx_members_onboarding_type ON members(onboarding_type);
CREATE INDEX IF NOT EXISTS idx_members_replaced_by_member_id ON members(replaced_by_member_id);

COMMIT;
