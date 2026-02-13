-- Create secure RLS policies for members and Installments
BEGIN;

-- Members
CREATE POLICY IF NOT EXISTS members_select_own ON members FOR SELECT USING (auth.uid() = auth_id);
CREATE POLICY IF NOT EXISTS members_insert_self ON members FOR INSERT WITH CHECK (auth.uid() = new.auth_id);
CREATE POLICY IF NOT EXISTS members_update_own ON members FOR UPDATE USING (auth.uid() = auth_id) WITH CHECK (auth.uid() = auth_id);
CREATE POLICY IF NOT EXISTS members_delete_admin ON members FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM members m WHERE m.auth_id = auth.uid() AND m.is_admin = true
  )
);

-- Installments
CREATE POLICY IF NOT EXISTS installments_insert_owner ON Installments FOR INSERT WITH CHECK (
  auth.uid() = (SELECT auth_id FROM members WHERE id = new.member_id)
);

CREATE POLICY IF NOT EXISTS installments_select_owner_or_admin ON Installments FOR SELECT USING (
  auth.uid() = (SELECT auth_id FROM members WHERE id = member_id)
  OR EXISTS (
    SELECT 1 FROM members m WHERE m.auth_id = auth.uid() AND m.is_admin = true AND m.society_id = Installments.society_id
  )
);

CREATE POLICY IF NOT EXISTS installments_update_admin ON Installments FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM members m WHERE m.auth_id = auth.uid() AND m.is_admin = true
  )
);

COMMIT;
