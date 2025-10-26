# Migration Instructions

This guide explains how to apply the photo_submissions migration and regenerate TypeScript types.

## Migration File

**Location:** `supabase/migrations/20251026000000_update_photo_submissions_anonymous.sql`

**What it does:**
- Updates `photo_submissions` table to support anonymous submissions
- Adds `anon_device_token`, `submitter_email`, `review_notes`, and `approved_photo_id` columns
- Updates RLS policies to allow anonymous submissions
- Updates helper functions for approve/reject workflows

---

## Option 1: Using Supabase SQL Editor (No CLI Required)

### Step 1: Run the Migration

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Create a new query
5. Copy the entire contents of `supabase/migrations/20251026000000_update_photo_submissions_anonymous.sql`
6. Paste into the SQL Editor
7. Click **Run** button

### Step 2: Generate TypeScript Types

You'll need to install Supabase CLI to generate types:

```bash
# Install Supabase CLI globally
npm install -g supabase

# Login to Supabase
supabase login

# Link your project (you'll need your project ref from dashboard)
supabase link --project-ref YOUR_PROJECT_REF

# Generate TypeScript types
supabase gen types typescript --linked > src/db/database.types.ts
```

**Find your project ref:**
- Go to Supabase Dashboard
- Select your project
- Go to Settings > General
- Copy the "Reference ID"

---

## Option 2: Using Supabase CLI (Local + Remote Sync)

### Step 1: Install Supabase CLI

```bash
npm install -g supabase
```

### Step 2: Login and Link Project

```bash
# Login to Supabase
supabase login

# Link to your remote project
supabase link --project-ref YOUR_PROJECT_REF
```

### Step 3: Push Migration to Remote

```bash
# This will apply all pending migrations
supabase db push
```

### Step 4: Generate TypeScript Types

```bash
# Generate types from the remote database
supabase gen types typescript --linked > src/db/database.types.ts
```

---

## Option 3: Local Development with Supabase CLI

If you want to run Supabase locally:

### Step 1: Start Local Supabase

```bash
# Start local Supabase (Docker required)
supabase start
```

### Step 2: Apply Migration Locally

```bash
# Reset local database and apply all migrations
supabase db reset

# Or apply specific migration
supabase migration up
```

### Step 3: Generate Types from Local Database

```bash
# Generate types from local database
supabase gen types typescript --local > src/db/database.types.ts
```

---

## Verification

After running the migration, verify the changes:

### Check Table Structure

Run this in SQL Editor:

```sql
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'photo_submissions'
ORDER BY ordinal_position;
```

You should see new columns:
- `anon_device_token` (varchar, nullable)
- `submitter_email` (varchar, nullable)
- `review_notes` (text, nullable)
- `approved_photo_id` (uuid, nullable)

### Check Constraints

```sql
SELECT
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'photo_submissions';
```

You should see the `check_submission_identity` constraint.

---

## Troubleshooting

### Error: "column already exists"

If you get duplicate column errors, the migration may have been partially applied. You can:

1. Check which columns exist:
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'photo_submissions';
   ```

2. Manually comment out the `ALTER TABLE ADD COLUMN` lines for columns that already exist

### Error: "relation does not exist"

Make sure the previous migrations have been applied:
```bash
# Check migration status
supabase migration list

# Apply all pending migrations
supabase db push
```

### Types Not Generated

Make sure you're linked to the correct project:
```bash
# Check current link
supabase status

# Relink if needed
supabase link --project-ref YOUR_PROJECT_REF
```

---

## Next Steps

After completing the migration:

1. ✅ Verify types are updated in `src/db/database.types.ts`
2. ✅ Test the API endpoints work with the new schema
3. ✅ Implement the photo submission endpoints according to `.ai/api-plan.md`
4. ✅ Test anonymous submission workflow

---

## Additional Resources

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Supabase Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [TypeScript Type Generation](https://supabase.com/docs/guides/api/rest/generating-types)
