-- Rollback: drop policies created by 002_create_policies.up.sql
BEGIN;

DROP POLICY IF EXISTS members_select_own ON members;
DROP POLICY IF EXISTS members_insert_self ON members;
DROP POLICY IF EXISTS members_update_own ON members;
DROP POLICY IF EXISTS members_delete_admin ON members;

DROP POLICY IF EXISTS installments_insert_owner ON Installments;
DROP POLICY IF EXISTS installments_select_owner_or_admin ON Installments;
DROP POLICY IF EXISTS installments_update_admin ON Installments;

COMMIT;
