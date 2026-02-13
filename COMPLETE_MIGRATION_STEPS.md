# Complete Supabase Auth Migration Steps

## Overview
This guide walks you through the final steps to complete the RLS and auth migration. The code updates are already committed; now we need to apply the database schema changes and create Auth users.

---

## Phase 1: Apply Database Schema Migration

### Step 1a: Add `auth_id` Column

**IMPORTANT**: This MUST be done first, before creating Auth users.

1. Open your Supabase dashboard: https://app.supabase.com/
2. Navigate to your project (ivhjokefdwospalrqcmk)
3. Go to **SQL Editor**
4. Create a new query and paste this SQL:

```sql
-- Add auth_id column to members table
ALTER TABLE members ADD COLUMN auth_id uuid UNIQUE;

-- Create index for faster lookups
CREATE INDEX members_auth_id_idx ON members (auth_id);

-- Add NOT NULL constraint after data is populated
-- (We'll do this after mapping users)
```

5. Click **Run** (or Cmd+Enter)
6. Confirm the query executed successfully (no errors)

**Verify**: In SQL Editor, run this to confirm the column exists:
```sql
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name='members' AND column_name='auth_id';
```
Should return one row: `auth_id | uuid`

---

### Step 1b: Enable RLS Policies

Once `auth_id` column is confirmed, run the RLS policy SQL:

```sql
-- Enable Row Level Security on members table
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Policy 1: Members can select only their own row
CREATE POLICY members_select_own ON members
FOR SELECT
USING (auth.uid()::text = auth_id::text);

-- Policy 2: Admins can select all rows
CREATE POLICY members_select_admin ON members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM members m 
    WHERE m.auth_id = auth.uid() AND m.is_admin = true
  )
);

-- Policy 3: Members can update their own row
CREATE POLICY members_update_own ON members
FOR UPDATE
USING (auth.uid()::text = auth_id::text);

-- Policy 4: Admins can update any row
CREATE POLICY members_update_admin ON members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM members m 
    WHERE m.auth_id = auth.uid() AND m.is_admin = true
  )
);

-- Policy 5: Only admins can delete members
CREATE POLICY members_delete_admin ON members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM members m 
    WHERE m.auth_id = auth.uid() AND m.is_admin = true
  )
);

-- Enable RLS on Installments table
ALTER TABLE "Installments" ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can insert their own installments
CREATE POLICY installments_insert_own ON "Installments"
FOR INSERT
WITH CHECK (
  member_id IN (
    SELECT id FROM members WHERE auth_id = auth.uid()
  )
);

-- Policy 2: Users can select their own installments
CREATE POLICY installments_select_own ON "Installments"
FOR SELECT
USING (
  member_id IN (
    SELECT id FROM members WHERE auth_id = auth.uid()
  )
);

-- Policy 3: Admins can select all installments
CREATE POLICY installments_select_admin ON "Installments"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM members m 
    WHERE m.auth_id = auth.uid() AND m.is_admin = true
  )
);

-- Policy 4: Only admins can update installment status
CREATE POLICY installments_update_admin ON "Installments"
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM members m 
    WHERE m.auth_id = auth.uid() AND m.is_admin = true
  )
);

-- Policy 5: Only admins can delete installments
CREATE POLICY installments_delete_admin ON "Installments"
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM members m 
    WHERE m.auth_id = auth.uid() AND m.is_admin = true
  )
);
```

**Verify**: Run this to confirm policies are active:
```sql
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies
WHERE tablename IN ('members', 'Installments')
ORDER BY tablename, policyname;
```

Should return 11 rows (5 for members + 5 for Installments + 1 from system)

---

## Phase 2: Create Supabase Auth Users & Map `auth_id`

### Step 2a: Create Auth Users for Existing Members

You can do this two ways:

#### Option A: Via Supabase UI (Recommended for small team)

1. Go to your Supabase dashboard
2. Navigate to **Authentication** → **Users**
3. Click **Add User**
4. For each member that doesn't have a Supabase auth account yet:
   - **Email**: Use their email from the members table
   - **Password**: `Scs@12345`
   - **Email Confirmed**: Check this box
   - Click **Save**
5. Copy the generated **User ID** (UUID)

#### Option B: Via Admin API (For bulk creation)

Use this cURL command for each member email (replace `{EMAIL}` with actual email):

```bash
curl -X POST \
  'https://ivhjokefdwospalrqcmk.supabase.co/auth/v1/admin/users' \
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2aGpva2VmZHdvc3BhbHJxY21rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTg2MTY0OSwiZXhwIjoyMDgxNDM3NjQ5fQ.3Ilfmul7dVrzvvboz74nwUyKuQD34BH_kmpPe5fKt7U' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2aGpva2VmZHdvc3BhbHJxY21rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTg2MTY0OSwiZXhwIjoyMDgxNDM3NjQ5fQ.3Ilfmul7dVrzvvboz74nwUyKuQD34BH_kmpPe5fKt7U' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "{EMAIL}",
    "password": "Scs@12345",
    "email_confirm": true
  }'
```

This will return JSON with the created user's `id` (UUID). Copy that ID for the next step.

---

### Step 2b: Map `auth_id` to Members

After creating each Auth user, update the corresponding member row with their Auth user ID.

In **SQL Editor**, run this update for each member:

```sql
UPDATE members 
SET auth_id = '{USER_ID}'::uuid
WHERE email = '{MEMBER_EMAIL}'
  AND auth_id IS NULL;
```

Replace:
- `{USER_ID}` with the UUID returned from Auth user creation (e.g., `550e8400-e29b-41d4-a716-446655440000`)
- `{MEMBER_EMAIL}` with the member's email

**Example**:
```sql
UPDATE members 
SET auth_id = '550e8400-e29b-41d4-a716-446655440000'::uuid
WHERE email = 'john@example.com'
  AND auth_id IS NULL;
```

**Repeat** this for all members.

---

### Step 2c: Verify All Members Have `auth_id`

In **SQL Editor**, run:

```sql
SELECT id, name, email, auth_id, is_admin, status 
FROM members 
ORDER BY id;
```

**Expected**: All rows should have a UUID in the `auth_id` column. If any are NULL, go back to Step 2b and map those users.

---

## Phase 3: Test the Migration

### Test 3a: Signup (New Member)

1. Go to http://localhost:5173 (assuming dev server is running)
2. Click **Sign Up**
3. Fill in a test email (e.g., `test@example.com`) and password
4. Submit
5. **Expected**: New member created, auth flow works, no RLS errors

### Test 3b: Login (Existing Member)

1. Clear browser cache/session
2. Click **Login**
3. Use email and password `Scs@12345` for any of your created members
4. **Expected**: Login succeeds, dashboard loads, data is correct

### Test 3c: Member Submits Installment

1. As logged-in member, go to **Make Payment** → **Submit Installment**
2. Fill out and submit
3. **Expected**: Installment record created, visible in member's dashboard

### Test 3d: Admin Approves Payment

1. Switch to an admin account email (use login/logout)
2. Go to **Admin Dashboard** → **Payments**
3. Approve the payment from Test 3c
4. **Expected**: No RLS errors, payment status updates

### Test 3e: Verify Member Dashboard Totals

1. Log back in as the test member
2. Check **Member Dashboard**
3. **Expected**: 
   - "My Contribution" = sum of approved installments
   - "My Total Benefit" = society property / total members (or based on your logic)
   - Values should match when calculated from filtered data

---

## Phase 4: Cleanup & Security

### Step 4a: Drop Plaintext Password Column

Once you've verified all auth flows work (Phase 3), remove the old plaintext password column:

```sql
ALTER TABLE members 
DROP COLUMN IF EXISTS password;
```

**WARNING**: Only do this after confirming no client code references it.

### Step 4b: Rotate Service Role Key

The service role key has been exposed in this migration guide. For security:

1. Go to Supabase Dashboard → **Project Settings** → **API Keys**
2. Find "service_role" key
3. Click the rotate icon
4. Copy the new key
5. Update any environment variables/configs that reference the old key
6. The old key will stop working within a few minutes

### Step 4c: Review Storage Bucket Permissions

Check your storage buckets (`payments`, `avatars`, `fd-slips`):

1. Go to **Storage** in Supabase
2. For each bucket, ensure RLS policies are set (can tighten permissions if needed)
3. Ensure anon key cannot delete/modify files (only read/write own)

---

## Rollback (If Something Goes Wrong)

If you need to undo the migration:

### Disable RLS & Drop Policies

```sql
-- Drop all policies
DROP POLICY IF EXISTS members_select_own ON members;
DROP POLICY IF EXISTS members_select_admin ON members;
DROP POLICY IF EXISTS members_update_own ON members;
DROP POLICY IF EXISTS members_update_admin ON members;
DROP POLICY IF EXISTS members_delete_admin ON members;
DROP POLICY IF EXISTS installments_insert_own ON "Installments";
DROP POLICY IF EXISTS installments_select_own ON "Installments";
DROP POLICY IF EXISTS installments_select_admin ON "Installments";
DROP POLICY IF EXISTS installments_update_admin ON "Installments";
DROP POLICY IF EXISTS installments_delete_admin ON "Installments";

-- Disable RLS
ALTER TABLE members DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Installments" DISABLE ROW LEVEL SECURITY;
```

### Drop `auth_id` Column

```sql
ALTER TABLE members 
DROP COLUMN IF EXISTS auth_id;

DROP INDEX IF EXISTS members_auth_id_idx;
```

---

## Summary of What Will Change

| Aspect | Before | After |
|--------|--------|-------|
| **Authentication** | Plaintext password in DB, checked by client | Supabase Auth service, JWTs |
| **Authorization** | Manual checks in code (easily bypassed) | RLS policies enforced at DB level |
| **User Identity** | `id` (numeric, client-assigned) | `id` (numeric) + `auth_id` (UUID from Auth) |
| **Password Storage** | Plain text in `members.password` | Hashed in Supabase Auth (not in DB) |
| **Admin Bypass** | Server endpoints used for admin operations | Still needed; RLS policies allow admin select/update/delete |
| **Security** | Low (plaintext passwords) | High (proper hashing, RLS, JWT-based) |

---

## Notes

- **Service Key Expiry**: The provided key expires in year 2036. After rotation, update any stored references.
- **Common Password**: `Scs@12345` was used for all users for ease of testing. In production, send reset links so users set their own passwords.
- **RLS Policies**: Policies use `auth.uid()` to determine the authenticated user. Only signed-in users can access data (not anon key anymore).
- **Admin Data Access**: The `/api/members` and `/api/transactions` server endpoints still exist to allow admins to fetch all data (bypassing client-side RLS).

---

## Next Steps

1. **Apply migration SQL** (Phase 1a & 1b) in Supabase SQL Editor
2. **Create Auth users & map auth_id** (Phase 2a, 2b, 2c) via UI or Admin API
3. **Run tests** (Phase 3a–3e) to verify app functionality
4. **Cleanup** (Phase 4a–4c) once verified
5. **Deploy** to production after successful testing

Good luck! If you run into issues, check the [Supabase RLS docs](https://supabase.com/docs/guides/auth/row-level-security) or reach out.
