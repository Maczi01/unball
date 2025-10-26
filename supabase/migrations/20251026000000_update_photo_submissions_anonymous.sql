-- Migration: Update photo_submissions to support anonymous submissions
-- This adds support for users to submit photos without authentication

-- 1. Make user_id nullable to allow anonymous submissions
ALTER TABLE photo_submissions
  ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add fields for anonymous submissions and review tracking
ALTER TABLE photo_submissions
  ADD COLUMN anon_device_token VARCHAR(255),
  ADD COLUMN submitter_email VARCHAR(255),
  ADD COLUMN review_notes TEXT,
  ADD COLUMN approved_photo_id UUID REFERENCES photos(id) ON DELETE SET NULL;

-- 3. Add constraint to ensure either user_id or anon_device_token is set
ALTER TABLE photo_submissions
  ADD CONSTRAINT check_submission_identity
  CHECK (
    (user_id IS NOT NULL AND anon_device_token IS NULL) OR
    (user_id IS NULL AND anon_device_token IS NOT NULL)
  );

-- 4. Create indexes for new columns
CREATE INDEX idx_photo_submissions_device ON photo_submissions(anon_device_token);
CREATE INDEX idx_photo_submissions_status_created ON photo_submissions(status, created_at DESC);
CREATE INDEX idx_photo_submissions_approved_photo ON photo_submissions(approved_photo_id);

-- 5. Drop the old RLS policies that only allowed authenticated users
DROP POLICY IF EXISTS "Authorized users can submit photos" ON photo_submissions;

-- 6. Create new RLS policy for anonymous and authenticated submissions
CREATE POLICY "Anyone can submit photos"
  ON photo_submissions
  FOR INSERT
  WITH CHECK (true); -- Application layer will enforce rate limiting

-- 7. Update the policy for viewing own submissions to support anonymous users
DROP POLICY IF EXISTS "Users can view their own photo submissions" ON photo_submissions;

CREATE POLICY "Users can view their own photo submissions"
  ON photo_submissions
  FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    (anon_device_token IS NOT NULL) -- App validates device token matches requester
  );

-- 8. Update the approve_photo_submission function to handle the new fields
-- Drop the old function first (signature change requires this)
DROP FUNCTION IF EXISTS approve_photo_submission(UUID, UUID);
DROP FUNCTION IF EXISTS approve_photo_submission(UUID, UUID, JSONB, BOOLEAN);

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

  -- Insert into photos table with optional metadata overrides
  INSERT INTO photos (
    event_name, competition, year_utc, place, lat, lon,
    photo_url, thumbnail_url, original_url, description,
    source_url, license, credit, tags, notes, is_daily_eligible
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
    COALESCE((metadata_overrides->>'source_url')::TEXT, submission_record.source_url),
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

-- 9. Update the reject_photo_submission function to use review_notes
-- Drop the old function first (parameter name change requires this)
DROP FUNCTION IF EXISTS reject_photo_submission(UUID, UUID, TEXT);

CREATE FUNCTION reject_photo_submission(
  submission_id UUID,
  admin_id UUID,
  notes TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE photo_submissions
  SET
    status = 'rejected',
    reviewed_by = admin_id,
    reviewed_at = now(),
    review_notes = notes,
    rejection_reason = notes -- Keep both for backward compatibility
  WHERE id = submission_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission not found or already processed';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Add comment explaining the table structure
COMMENT ON TABLE photo_submissions IS 'User-submitted photos pending admin review. Supports both authenticated users (user_id) and anonymous users (anon_device_token).';
COMMENT ON COLUMN photo_submissions.anon_device_token IS 'Anonymous device identifier for unauthenticated submissions. Mutually exclusive with user_id.';
COMMENT ON COLUMN photo_submissions.submitter_email IS 'Optional email address for contact about the submission.';
COMMENT ON COLUMN photo_submissions.review_notes IS 'Admin notes from review process (approval or rejection).';
COMMENT ON COLUMN photo_submissions.approved_photo_id IS 'Links to the photo record created when this submission was approved.';
