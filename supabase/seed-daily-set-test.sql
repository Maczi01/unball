-- =====================================================================
-- Test Data: Daily Set for Today with 5 Photos
-- Created: 2025-10-20
-- Purpose: Test data for GET /api/daily/sets/today endpoint
-- =====================================================================

-- Insert 5 test photos
-- Note: Place corresponding images in /public folder:
--   - photo1.jpg, photo2.jpg, photo3.jpg, photo4.jpg, photo5.jpg

INSERT INTO photos (
  id,
  photo_url,
  thumbnail_url,
  event_name,
  competition,
  year_utc,
  place,
  lat,
  lon,
  description,
  source_url,
  license,
  credit,
  is_daily_eligible,
  tags
) VALUES
-- Photo 1: Champions League Final
(
  '11111111-1111-1111-1111-111111111111',
  '/photo1.jpg',
  '/photo1.jpg',
  'Champions League Final 2019',
  'UEFA Champions League',
  2019,
  'Madrid, Spain',
  40.453054,
  -3.688344,
  'Liverpool vs Tottenham Hotspur at Wanda Metropolitano Stadium',
  'https://example.com/source1',
  'CC BY-SA 4.0',
  'Test Photo',
  true,
  ARRAY['club', 'european', 'final']
),

-- Photo 2: World Cup 2014
(
  '22222222-2222-2222-2222-222222222222',
  '/photo2.jpg',
  '/photo2.jpg',
  'FIFA World Cup Final 2014',
  'FIFA World Cup',
  2014,
  'Rio de Janeiro, Brazil',
  -22.912214,
  -43.230182,
  'Germany vs Argentina at Maracanã Stadium',
  'https://example.com/source2',
  'CC BY-SA 4.0',
  'Test Photo',
  true,
  ARRAY['international', 'world-cup', 'final']
),

-- Photo 3: Premier League
(
  '33333333-3333-3333-3333-333333333333',
  '/photo3.jpg',
  '/photo3.jpg',
  'Premier League Match 2023',
  'Premier League',
  2023,
  'Manchester, England',
  53.463056,
  -2.291389,
  'Manchester Derby at Etihad Stadium',
  'https://example.com/source3',
  'CC BY-SA 4.0',
  'Test Photo',
  true,
  ARRAY['club', 'domestic', 'derby']
),

-- Photo 4: La Liga Classic
(
  '44444444-4444-4444-4444-444444444444',
  '/photo4.jpg',
  '/photo4.jpg',
  'El Clásico 2022',
  'La Liga',
  2022,
  'Barcelona, Spain',
  41.380897,
  2.122872,
  'FC Barcelona vs Real Madrid at Camp Nou',
  'https://example.com/source4',
  'CC BY-SA 4.0',
  'Test Photo',
  true,
  ARRAY['club', 'domestic', 'clasico']
),

-- Photo 5: Euro Championship
(
  '55555555-5555-5555-5555-555555555555',
  '/photo5.jpg',
  '/photo5.jpg',
  'UEFA Euro 2020 Final',
  'UEFA European Championship',
  2021,
  'London, England',
  51.556021,
  -0.279519,
  'Italy vs England at Wembley Stadium',
  'https://example.com/source5',
  'CC BY-SA 4.0',
  'Test Photo',
  true,
  ARRAY['international', 'european', 'final']
);

-- Create a daily set for today
INSERT INTO daily_sets (
  id,
  date_utc,
  is_published
) VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  CURRENT_DATE,  -- Today's date in UTC
  true           -- Published and ready to play
);

-- Link the 5 photos to the daily set with positions 1-5
INSERT INTO daily_set_photos (
  daily_set_id,
  photo_id,
  position
) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 1),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 2),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 3),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 4),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', 5);

-- Verification query (optional - run this to verify)
-- SELECT
--   ds.date_utc,
--   ds.is_published,
--   dsp.position,
--   p.event_name,
--   p.competition,
--   p.photo_url
-- FROM daily_sets ds
-- JOIN daily_set_photos dsp ON ds.id = dsp.daily_set_id
-- JOIN photos p ON dsp.photo_id = p.photo_id
-- WHERE ds.date_utc = CURRENT_DATE
-- ORDER BY dsp.position;
