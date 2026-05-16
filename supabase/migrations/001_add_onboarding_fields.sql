-- Migration: Add onboarding type and replacement tracking fields to members table
-- This allows admins to choose between "Fresh Start" or "Full Replacement" for new members

-- Add onboarding_type column
ALTER TABLE members ADD COLUMN onboarding_type TEXT CHECK (onboarding_type IN ('fresh_start', 'full_replacement')) DEFAULT NULL;

-- Add replaced_at column (timestamp when member was replaced)
ALTER TABLE members ADD COLUMN replaced_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add replaced_by_member_id column (tracks which new member replaced this member)
ALTER TABLE members ADD COLUMN replaced_by_member_id INTEGER DEFAULT NULL;

-- Add FOREIGN KEY constraint for replaced_by_member_id
ALTER TABLE members ADD CONSTRAINT fk_replaced_by_member 
FOREIGN KEY (replaced_by_member_id) REFERENCES members(id) ON DELETE SET NULL;

-- Add comment for documentation
COMMENT ON COLUMN members.onboarding_type IS 'New member onboarding type: fresh_start (starts from current month) or full_replacement (takes over previous member all records)';
COMMENT ON COLUMN members.replaced_at IS 'Timestamp when this member was replaced by a new member';
COMMENT ON COLUMN members.replaced_by_member_id IS 'ID of the new member who replaced this member';
