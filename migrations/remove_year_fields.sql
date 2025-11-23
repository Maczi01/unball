-- Migration: Remove year-related fields from database
-- This migration removes year_utc fields from photos and photo_submissions tables
-- and updates views that reference these fields.

-- Step 1: Drop dependent views first (they reference year_utc)
DROP VIEW IF EXISTS public.photos_with_answers;
DROP VIEW IF EXISTS public.photos_metadata;

-- Step 2: Remove year_utc column from photos table
ALTER TABLE public.photos
DROP COLUMN IF EXISTS year_utc;

-- Step 3: Remove year_utc column from photo_submissions table
ALTER TABLE public.photo_submissions
DROP COLUMN IF EXISTS year_utc;

-- Step 4: Recreate photos_metadata view without year_utc
CREATE OR REPLACE VIEW public.photos_metadata AS
SELECT
  id,
  photo_url,
  competition,
  place,
  tags
FROM public.photos;

-- Step 5: Recreate photos_with_answers view without year_utc
CREATE OR REPLACE VIEW public.photos_with_answers AS
SELECT
  id,
  photo_url,
  competition,
  place,
  tags,
  credit,
  license,
  description,
  event_name,
  lat,
  lon
FROM public.photos;

-- Migration complete
-- After running this migration:
-- 1. Regenerate TypeScript types: npx supabase gen types typescript --linked > src/db/database.types.ts
-- 2. Update application code to remove year-related logic

CREATE POLICY "Users can upload to submissions"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'photos' AND (storage.foldername(name))[1] = 'submissions');
