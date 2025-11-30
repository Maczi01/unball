-- Migration: Remove time constraint from daily_submissions
-- Since time tracking has been removed from the game, we need to update the check constraint

-- First, find the exact constraint name
-- You can check it with: SELECT conname FROM pg_constraint WHERE conrelid = 'daily_submissions'::regclass;

-- Drop the existing check constraint (replace constraint_name with the actual name)
ALTER TABLE daily_submissions DROP CONSTRAINT IF EXISTS daily_submissions_check;

-- Optionally, you can add a new constraint that only checks for score > 0
-- and allows any positive value for total_time_ms
ALTER TABLE daily_submissions ADD CONSTRAINT daily_submissions_score_check
  CHECK (total_score >= 0);

-- Set a default value for total_time_ms for future inserts
ALTER TABLE daily_submissions ALTER COLUMN total_time_ms SET DEFAULT 1000;
