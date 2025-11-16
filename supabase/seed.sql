-- =====================================================================
-- Seed Data: Daily Set for Today with Test Photos
-- Created: 2025-11-16
-- Purpose: Test data matching scripts/seed-test-data.ts
--          Can be run directly in Supabase SQL Editor or via CLI
-- =====================================================================

-- Insert 8 test photos (5 for daily set + 3 additional)
-- Note: Replace CURRENT_DATE with a specific date if needed
INSERT INTO photos (
  id,
  photo_url,
  place,
  lat,
  lon,
  description,
  license,
  credit,
  is_daily_eligible,
  tags
) VALUES
-- Photo 1: Madrid, Spain
(
  '11111111-1111-1111-1111-111111111111',
  'https://images.unsplash.com/photo-1693668605836-16888b3a2d46?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'Madrid, Spain',
  40.453054,
  -3.688344,
  'Holiday',
  'unsplash',
  'Unsplash',
  true,
  ARRAY['club', 'european', 'final']
),

-- Photo 2: Rio de Janeiro, Brazil
(
  '22222222-2222-2222-2222-222222222222',
  'https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?q=80&w=2126&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'Rio de Janeiro, Brazil',
  -22.912214,
  -43.230182,
  'Holiday',
  'unsplash',
  'Unsplash',
  true,
  ARRAY['international', 'world-cup', 'final']
),

-- Photo 3: Manchester, England
(
  '33333333-3333-3333-3333-333333333333',
  'https://images.unsplash.com/photo-1627226890711-fd1fdc35d77e?q=80&w=1936&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'Manchester, England',
  53.463056,
  -2.291389,
  'Holiday',
  'unsplash',
  'Unsplash',
  true,
  ARRAY['club', 'domestic', 'derby']
),

-- Photo 4: Barcelona, Spain
(
  '44444444-4444-4444-4444-444444444444',
  'https://images.unsplash.com/photo-1583422409516-2895a77efded?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'Barcelona, Spain',
  41.380897,
  2.122872,
  'Holiday',
  'unsplash',
  'Unsplash',
  true,
  ARRAY['club', 'domestic', 'clasico']
),

-- Photo 5: London, England
(
  '55555555-5555-5555-5555-555555555555',
  'https://images.unsplash.com/photo-1506501139174-099022df5260?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'London, England',
  51.556021,
  -0.279519,
  'Holiday',
  'unsplash',
  'Unsplash',
  true,
  ARRAY['international', 'european', 'final']
),

-- Photo 6: Mexico City, Mexico (additional photo, not in daily set)
(
  '22222226-2222-2222-2222-222222222222',
  'https://images.unsplash.com/photo-1682916114863-ba2f7b7d39c9?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'Mexico City, Mexico',
  19.3029,
  -99.1505,
  'Holiday',
  'unsplash',
  'Unsplash',
  true,
  ARRAY['maradona', 'worldcup', 'argentina']
),

-- Photo 7: Istanbul, Turkey (additional photo, not in daily set)
(
  '44444446-4444-4444-4444-444444444444',
  'https://images.unsplash.com/photo-1589561454226-796a8aa89b05?q=80&w=2067&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'Istanbul, Turkey',
  40.987,
  29.0361,
  'Holiday',
  'unsplash',
  'Unsplash',
  true,
  ARRAY['liverpool', 'championsleague', 'comeback']
),

-- Photo 8: Lusail, Qatar (additional photo, not in daily set)
(
  '55555565-aaaa-bbbb-cccc-666666666666',
  'https://images.unsplash.com/photo-1658863714457-d7d16558aa80?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'Lusail, Qatar',
  25.416,
  51.49,
  'Holiday',
  'unsplash',
  'Unsplash',
  true,
  ARRAY['worldcup', 'messi', 'argentina', 'final']
)
ON CONFLICT (id) DO NOTHING;

-- Create a daily set for today
-- Note: CURRENT_DATE uses UTC timezone
INSERT INTO daily_sets (
  id,
  date_utc,
  is_published
) VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  CURRENT_DATE,
  true
)
ON CONFLICT (date_utc) DO UPDATE
SET
  is_published = EXCLUDED.is_published,
  id = EXCLUDED.id;

-- Link the first 5 photos to the daily set (positions 1-5)
-- The remaining 3 photos are available but not linked to any daily set
INSERT INTO daily_set_photos (
  daily_set_id,
  photo_id,
  position
) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 1),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 2),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 3),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 4),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', 5)
ON CONFLICT (daily_set_id, photo_id) DO NOTHING;

-- =====================================================================
-- Verification query (uncomment to run)
-- =====================================================================

-- SELECT
--   ds.id as set_id,
--   ds.date_utc,
--   ds.is_published,
--   dsp.position,
--   p.id as photo_id,
--   p.place,
--   p.description
-- FROM daily_sets ds
-- JOIN daily_set_photos dsp ON ds.id = dsp.daily_set_id
-- JOIN photos p ON dsp.photo_id = p.photo_id
-- WHERE ds.date_utc = CURRENT_DATE
-- ORDER BY dsp.position;

-- =====================================================================
-- Summary
-- =====================================================================
-- This seed creates:
--   - 8 photos total (all marked as daily_eligible)
--   - 1 daily set for today (published)
--   - 5 photos linked to today's daily set (positions 1-5)
--   - 3 additional photos available for future use
--
-- To test the API endpoint after seeding:
--   curl http://localhost:3000/api/daily/sets/today
-- =====================================================================
