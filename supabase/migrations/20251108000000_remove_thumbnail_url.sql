-- =====================================================================
-- Migration: Remove thumbnail_url columns
-- Created: 2025-11-08
-- Description: Removes thumbnail_url from photos and photo_submissions tables
--              and updates related views. We'll use resized photo_url instead.
--
-- Affected tables:
--   - photos: Drop thumbnail_url column
--   - photo_submissions: Drop thumbnail_url column
--
-- Affected views:
--   - photos_metadata: Remove thumbnail_url from SELECT
--   - photos_with_answers: Remove thumbnail_url from SELECT
-- =====================================================================

-- =====================================================================
-- Step 1: Drop views that depend on thumbnail_url columns
-- =====================================================================

DROP VIEW IF EXISTS photos_metadata;
DROP VIEW IF EXISTS photos_with_answers;

-- =====================================================================
-- Step 2: Drop columns from tables
-- =====================================================================

-- Drop thumbnail_url from photos table
ALTER TABLE photos DROP COLUMN IF EXISTS thumbnail_url;

-- Drop thumbnail_url from photo_submissions table
ALTER TABLE photo_submissions DROP COLUMN IF EXISTS thumbnail_url;

-- =====================================================================
-- Step 3: Recreate views without thumbnail_url
-- =====================================================================

-- View: photos_metadata
-- Purpose: Safe view for active gameplay - excludes answer fields
-- Exposes: URLs, competition, place, tags
-- Hides: event_name, year_utc, lat, lon, description
CREATE OR REPLACE VIEW photos_metadata AS
SELECT
  id,
  photo_url,
  competition,
  place,
  tags
FROM photos;

-- View: photos_with_answers
-- Purpose: Complete photo data including answers (for post-submission reveal)
-- Note: Application layer enforces that this view is only called after submission
CREATE OR REPLACE VIEW photos_with_answers AS
SELECT
  id,
  photo_url,
  event_name,
  competition,
  year_utc,
  place,
  lat,
  lon,
  description,
  credit,
  license,
  tags
FROM photos;

-- =====================================================================
-- END OF MIGRATION
-- =====================================================================
