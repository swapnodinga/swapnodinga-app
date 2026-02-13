# Auth Migration Instructions

Follow these steps to migrate the app to Supabase Auth and enable RLS safely.

1. Backup
   - Create a manual backup in Supabase Dashboard > Database > Backups.
   - Download or save `policies_backup.sql` if you exported policies.

2. Apply schema migrations
   - Run `migrations/001_add_auth_id.up.sql` in Supabase SQL editor.
   - Run `migrations/002_create_policies.up.sql` to add RLS policies.

3. Migrate existing users
   - For each existing member, create a Supabase Auth user (email + temporary password) via the Dashboard or Admin API.
   - Capture each new `user.id` and update the corresponding `members.auth_id`:
     ```sql
     UPDATE members SET auth_id = '<user-id>' WHERE email = '<member-email>';
     ```
   - Optionally notify members to reset password.

4. Test flows
   - Use the app to sign up, sign in, submit installment, and confirm admin approvals work as expected.

5. Cleanup
   - Remove plaintext `password` column from `members` when all users migrated:
     ```sql
     ALTER TABLE members DROP COLUMN IF EXISTS password;
     ```

6. Rollback (if needed)
   - Run `migrations/002_create_policies.down.sql` then `migrations/001_add_auth_id.down.sql`.
