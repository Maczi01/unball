-- Migration: Remove competition and event_name fields from database
-- This migration removes football-specific fields from photos and photo_submissions tables
-- and updates views that reference these fields.

-- Step 1: Drop dependent views first (they reference competition and event_name)
DROP VIEW IF EXISTS public.photos_with_answers;
DROP VIEW IF EXISTS public.photos_metadata;

-- Step 2: Remove competition and event_name columns from photos table
ALTER TABLE public.photos
DROP COLUMN IF EXISTS competition,
DROP COLUMN IF EXISTS event_name;

-- Step 3: Remove competition and event_name columns from photo_submissions table
ALTER TABLE public.photo_submissions
DROP COLUMN IF EXISTS competition,
DROP COLUMN IF EXISTS event_name;

-- Step 4: Recreate photos_metadata view without competition and event_name
CREATE OR REPLACE VIEW public.photos_metadata AS
SELECT
  id,
  photo_url,
  place,
  tags
FROM public.photos;

-- Step 5: Recreate photos_with_answers view without competition and event_name
CREATE OR REPLACE VIEW public.photos_with_answers AS
SELECT
  id,
  photo_url,
  place,
  tags,
  credit,
  license,
  description,
  lat,
  lon
FROM public.photos;

-- Migration complete
-- After running this migration:
-- 1. Regenerate TypeScript types: npx supabase gen types typescript --linked > src/db/database.types.ts
-- 2. Update application code to remove competition/event_name references
