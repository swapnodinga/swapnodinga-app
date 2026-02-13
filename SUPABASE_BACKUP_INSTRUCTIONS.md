# Supabase Backup Instructions

Before applying any migrations or policy changes, export your database and policies so you can fully restore state if needed.

1. Database dump (recommended):
   - In Supabase Dashboard, go to "Database" → "Backups" and create a manual backup.
   - Or run `pg_dump` from your local machine against the Supabase Postgres endpoint.

2. Export current RLS policies and functions:
   - Open Supabase SQL editor and run the queries to inspect policies, or use the Dashboard > Authentication/Policies UI to copy policy SQL.
   - Save the SQL into a file named `policies_backup.sql` in a secure location.

3. Export Authentication users (optional):
   - In Supabase Dashboard > Authentication > Users, export or note users you will modify.

4. Storage files:
   - In Supabase Dashboard > Storage, list and download any files you want to preserve.

5. Rollback plan:
   - To revert schema/policy changes created by these migrations, run the corresponding `*.down.sql` files located in `migrations/`.
