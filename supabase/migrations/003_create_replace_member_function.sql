-- Migration: Create a transactional function to replace member records
-- Usage: SELECT public.replace_member_records(old_id, new_id, admin_id, notes, dry_run);

CREATE OR REPLACE FUNCTION public.replace_member_records(
  p_old_id integer,
  p_new_id integer,
  p_admin_id integer DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_dry_run boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_summary jsonb;
BEGIN
  IF p_dry_run THEN
    v_summary := jsonb_build_object(
      'installments', (SELECT count(*) FROM installments WHERE member_id = p_old_id),
      'fixed_deposits', (SELECT count(*) FROM fixed_deposits WHERE member_id = p_old_id),
      'transactions', (SELECT count(*) FROM transactions WHERE member_id = p_old_id)
    );
    RETURN jsonb_build_object('success', true, 'dry_run', true, 'summary', v_summary);
  END IF;

  -- Transfer installments
  UPDATE installments
  SET member_id = p_new_id,
      member_name = (SELECT full_name FROM members WHERE id = p_new_id),
      society_id = (SELECT society_id FROM members WHERE id = p_new_id)
  WHERE member_id = p_old_id;

  -- Transfer fixed deposits
  UPDATE fixed_deposits
  SET member_id = p_new_id,
      society_id = (SELECT society_id FROM members WHERE id = p_new_id)
  WHERE member_id = p_old_id;

  -- Transfer transactions if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions') THEN
    UPDATE transactions
    SET member_id = p_new_id
    WHERE member_id = p_old_id;
  END IF;

  -- Mark old member as deactivated and record replacement
  UPDATE members
  SET status = 'deactivated',
      replaced_by_member_id = p_new_id,
      replaced_at = now(),
      replaced_by_admin_id = p_admin_id
  WHERE id = p_old_id;

  -- Activate new member and mark onboarding type
  UPDATE members
  SET status = 'active',
      onboarding_type = 'full_replacement'
  WHERE id = p_new_id;

  v_summary := jsonb_build_object(
    'installments', (SELECT count(*) FROM installments WHERE member_id = p_new_id),
    'fixed_deposits', (SELECT count(*) FROM fixed_deposits WHERE member_id = p_new_id),
    'transactions', (SELECT count(*) FROM transactions WHERE member_id = p_new_id)
  );

  RETURN jsonb_build_object('success', true, 'summary', v_summary);
EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;
