-- =====================================================================
-- Migration: Fix approve_photo_submission function
-- Created: 2025-11-06
-- Description: Updates approve_photo_submission to work with refactored
--              photo_sources table instead of photos.source_url column
--
-- Changes:
--   - Remove source_url from photos INSERT (column no longer exists)
--   - Add source_url insertion into photo_sources table
-- =====================================================================

-- Drop the existing function
DROP FUNCTION IF EXISTS approve_photo_submission(UUID, UUID, JSONB, BOOLEAN);

-- Recreate with corrected logic
CREATE FUNCTION approve_photo_submission(
  submission_id UUID,
  admin_id UUID,
  metadata_overrides JSONB DEFAULT NULL,
  set_daily_eligible BOOLEAN DEFAULT true
)
RETURNS UUID AS $$
DECLARE
  new_photo_id UUID;
  submission_record RECORD;
BEGIN
  -- Get submission record
  SELECT * INTO submission_record
  FROM photo_submissions
  WHERE id = submission_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission not found or already processed';
  END IF;

  -- Insert into photos table (WITHOUT source_url)
  INSERT INTO photos (
    event_name, competition, year_utc, place, lat, lon,
    photo_url, thumbnail_url, original_url, description,
    license, credit, tags, notes, is_daily_eligible
  )
  VALUES (
    COALESCE((metadata_overrides->>'event_name')::TEXT, submission_record.event_name),
    COALESCE((metadata_overrides->>'competition')::TEXT, submission_record.competition),
    COALESCE((metadata_overrides->>'year_utc')::INTEGER, submission_record.year_utc),
    COALESCE((metadata_overrides->>'place')::TEXT, submission_record.place),
    COALESCE((metadata_overrides->>'lat')::DECIMAL, submission_record.lat),
    COALESCE((metadata_overrides->>'lon')::DECIMAL, submission_record.lon),
    submission_record.photo_url,
    submission_record.thumbnail_url,
    submission_record.original_url,
    COALESCE((metadata_overrides->>'description')::TEXT, submission_record.description),
    COALESCE((metadata_overrides->>'license')::TEXT, submission_record.license),
    COALESCE((metadata_overrides->>'credit')::TEXT, submission_record.credit),
    CASE
      WHEN metadata_overrides ? 'tags' THEN
        ARRAY(SELECT jsonb_array_elements_text(metadata_overrides->'tags'))::TEXT[]
      ELSE submission_record.tags
    END,
    COALESCE((metadata_overrides->>'notes')::TEXT, submission_record.notes),
    set_daily_eligible
  )
  RETURNING id INTO new_photo_id;

  -- Insert source_url into photo_sources table if it exists
  IF COALESCE((metadata_overrides->>'source_url')::TEXT, submission_record.source_url) IS NOT NULL THEN
    INSERT INTO photo_sources (photo_id, url, position)
    VALUES (
      new_photo_id,
      COALESCE((metadata_overrides->>'source_url')::TEXT, submission_record.source_url),
      1
    );
  END IF;

  -- Update submission status and link to approved photo
  UPDATE photo_submissions
  SET
    status = 'approved',
    reviewed_by = admin_id,
    reviewed_at = now(),
    approved_photo_id = new_photo_id
  WHERE id = submission_id;

  RETURN new_photo_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- END OF MIGRATION
-- =====================================================================
