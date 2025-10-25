-- Migration: Add authentication and photo moderation system
-- Run this in Supabase SQL Editor

-- 1. Create enum for user roles
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- 2. Create enum for photo submission status
CREATE TYPE submission_status AS ENUM ('pending', 'approved', 'rejected');

-- 3. Extend users table with auth fields
ALTER TABLE users
  ADD COLUMN email TEXT UNIQUE,
  ADD COLUMN role user_role NOT NULL DEFAULT 'user',
  ADD COLUMN can_add_photos BOOLEAN NOT NULL DEFAULT false;

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);

-- 4. Create photo_submissions table for user-submitted photos awaiting moderation
CREATE TABLE photo_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Photo metadata (same as photos table)
  event_name TEXT NOT NULL,
  competition TEXT,
  year_utc INTEGER NOT NULL CHECK (year_utc >= 1880 AND year_utc <= 2025),
  place TEXT,
  lat DECIMAL(9, 6) NOT NULL CHECK (lat >= -90 AND lat <= 90),
  lon DECIMAL(9, 6) NOT NULL CHECK (lon >= -180 AND lon <= 180),
  photo_url TEXT NOT NULL,
  thumbnail_url TEXT,
  original_url TEXT,
  description TEXT,
  source_url TEXT,
  license TEXT NOT NULL,
  credit TEXT NOT NULL,
  tags TEXT[],
  notes TEXT,

  -- Moderation fields
  status submission_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for photo_submissions
CREATE INDEX idx_photo_submissions_user_id ON photo_submissions(user_id);
CREATE INDEX idx_photo_submissions_status ON photo_submissions(status);
CREATE INDEX idx_photo_submissions_created_at ON photo_submissions(created_at DESC);

-- 5. Add trigger to auto-update updated_at for photo_submissions
CREATE TRIGGER update_photo_submissions_updated_at
  BEFORE UPDATE ON photo_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Update function to auto-create user profile (now includes email)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, now(), now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Row Level Security (RLS) Policies

-- Enable RLS on photo_submissions
ALTER TABLE photo_submissions ENABLE ROW LEVEL SECURITY;

-- Users can read their own submissions
CREATE POLICY "Users can view their own photo submissions"
  ON photo_submissions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users with can_add_photos can insert submissions
CREATE POLICY "Authorized users can submit photos"
  ON photo_submissions
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND can_add_photos = true
    )
  );

-- Admins can view all submissions
CREATE POLICY "Admins can view all photo submissions"
  ON photo_submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Admins can update submissions (approve/reject)
CREATE POLICY "Admins can update photo submissions"
  ON photo_submissions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Update RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view their own profile"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own nickname
CREATE POLICY "Users can update their own nickname"
  ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users"
  ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Admins can update user permissions
CREATE POLICY "Admins can update user permissions"
  ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Update daily_submissions RLS (only logged-in users can submit)
ALTER TABLE daily_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone can read leaderboard
CREATE POLICY "Anyone can view leaderboard"
  ON daily_submissions
  FOR SELECT
  USING (true);

-- Only authenticated users can insert submissions
CREATE POLICY "Authenticated users can submit scores"
  ON daily_submissions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

-- 8. Helper function to approve photo submission and move to photos table
CREATE OR REPLACE FUNCTION approve_photo_submission(submission_id UUID, admin_id UUID)
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

  -- Insert into photos table
  INSERT INTO photos (
    event_name, competition, year_utc, place, lat, lon,
    photo_url, thumbnail_url, original_url, description,
    source_url, license, credit, tags, notes, is_daily_eligible
  )
  VALUES (
    submission_record.event_name,
    submission_record.competition,
    submission_record.year_utc,
    submission_record.place,
    submission_record.lat,
    submission_record.lon,
    submission_record.photo_url,
    submission_record.thumbnail_url,
    submission_record.original_url,
    submission_record.description,
    submission_record.source_url,
    submission_record.license,
    submission_record.credit,
    submission_record.tags,
    submission_record.notes,
    true -- is_daily_eligible
  )
  RETURNING id INTO new_photo_id;

  -- Update submission status
  UPDATE photo_submissions
  SET
    status = 'approved',
    reviewed_by = admin_id,
    reviewed_at = now()
  WHERE id = submission_id;

  RETURN new_photo_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Helper function to reject photo submission
CREATE OR REPLACE FUNCTION reject_photo_submission(
  submission_id UUID,
  admin_id UUID,
  reason TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE photo_submissions
  SET
    status = 'rejected',
    reviewed_by = admin_id,
    reviewed_at = now(),
    rejection_reason = reason
  WHERE id = submission_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission not found or already processed';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create view for leaderboard that includes user nicknames
CREATE OR REPLACE VIEW leaderboard_with_users AS
SELECT
  ds.id,
  ds.date_utc,
  ds.total_score,
  ds.total_time_ms,
  ds.submission_timestamp,
  COALESCE(u.nickname, ds.nickname) as nickname,
  ds.user_id,
  CASE
    WHEN ds.user_id IS NOT NULL THEN true
    ELSE false
  END as is_authenticated
FROM daily_submissions ds
LEFT JOIN users u ON ds.user_id = u.id
ORDER BY ds.total_score DESC, ds.total_time_ms ASC, ds.submission_timestamp ASC;

COMMENT ON VIEW leaderboard_with_users IS 'Leaderboard view that prefers user.nickname over submission.nickname';
