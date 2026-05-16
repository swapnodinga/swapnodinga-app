# How to Apply Step 1: Database Migration

## **Instructions to Run the Migration in Supabase**

### **Option 1: Using Supabase Dashboard (Recommended)**
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** → Click **"New Query"**
4. Copy the entire content from `supabase/migrations/001_add_onboarding_fields.sql`
5. Paste it into the SQL editor
6. Click **"Run"** button
7. You should see: "Query successful" with 6 statements executed

### **Option 2: Verify the Changes**
After running the migration, verify in SQL Editor with this query:
```sql
-- Check if new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'members' 
AND column_name IN ('onboarding_type', 'replaced_at', 'replaced_by_member_id')
ORDER BY column_name;
```

Expected result: 3 rows with the new columns

### **What This Migration Does**
- ✅ Adds `onboarding_type` field (can be 'fresh_start' or 'full_replacement')
- ✅ Adds `replaced_at` timestamp (when a member was replaced)
- ✅ Adds `replaced_by_member_id` reference (tracks who replaced them)
- ✅ Sets up proper foreign key relationship
- ✅ Includes documentation/comments

---

## **Next Steps**
Once you've confirmed the migration worked locally:
1. Verify the columns exist in your Supabase database
2. Reply with confirmation
3. We'll proceed to **Step 2: Update approval UI to let admin choose onboarding type**
