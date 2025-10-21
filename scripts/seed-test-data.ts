/**
 * Seed Test Data Script
 * Inserts 5 test photos and a daily set for today
 *
 * Usage: npx tsx scripts/seed-test-data.ts
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/db/database.types';

const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
// Use service role key for seeding (bypasses RLS)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

const photos = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    photo_url: '/photo1.jpg',
    thumbnail_url: '/photo1.jpg',
    event_name: 'Champions League Final 2019',
    competition: 'UEFA Champions League',
    year_utc: 2019,
    place: 'Madrid, Spain',
    lat: 40.453054,
    lon: -3.688344,
    description: 'Liverpool vs Tottenham Hotspur at Wanda Metropolitano Stadium',
    source_url: 'https://example.com/source1',
    license: 'CC BY-SA 4.0',
    credit: 'Test Photo',
    is_daily_eligible: true,
    tags: ['club', 'european', 'final']
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    photo_url: '/photo2.jpg',
    thumbnail_url: '/photo2.jpg',
    event_name: 'FIFA World Cup Final 2014',
    competition: 'FIFA World Cup',
    year_utc: 2014,
    place: 'Rio de Janeiro, Brazil',
    lat: -22.912214,
    lon: -43.230182,
    description: 'Germany vs Argentina at Maracanã Stadium',
    source_url: 'https://example.com/source2',
    license: 'CC BY-SA 4.0',
    credit: 'Test Photo',
    is_daily_eligible: true,
    tags: ['international', 'world-cup', 'final']
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    photo_url: '/photo3.jpg',
    thumbnail_url: '/photo3.jpg',
    event_name: 'Premier League Match 2023',
    competition: 'Premier League',
    year_utc: 2023,
    place: 'Manchester, England',
    lat: 53.463056,
    lon: -2.291389,
    description: 'Manchester Derby at Etihad Stadium',
    source_url: 'https://example.com/source3',
    license: 'CC BY-SA 4.0',
    credit: 'Test Photo',
    is_daily_eligible: true,
    tags: ['club', 'domestic', 'derby']
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    photo_url: '/photo4.jpg',
    thumbnail_url: '/photo4.jpg',
    event_name: 'El Clásico 2022',
    competition: 'La Liga',
    year_utc: 2022,
    place: 'Barcelona, Spain',
    lat: 41.380897,
    lon: 2.122872,
    description: 'FC Barcelona vs Real Madrid at Camp Nou',
    source_url: 'https://example.com/source4',
    license: 'CC BY-SA 4.0',
    credit: 'Test Photo',
    is_daily_eligible: true,
    tags: ['club', 'domestic', 'clasico']
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    photo_url: '/photo5.jpg',
    thumbnail_url: '/photo5.jpg',
    event_name: 'UEFA Euro 2020 Final',
    competition: 'UEFA European Championship',
    year_utc: 2021,
    place: 'London, England',
    lat: 51.556021,
    lon: -0.279519,
    description: 'Italy vs England at Wembley Stadium',
    source_url: 'https://example.com/source5',
    license: 'CC BY-SA 4.0',
    credit: 'Test Photo',
    is_daily_eligible: true,
    tags: ['international', 'european', 'final']
  }
];

async function seedData() {
  console.log('🌱 Starting seed...\n');

  // 1. Insert photos
  console.log('📸 Inserting 5 test photos...');
  const { data: photosData, error: photosError } = await supabase
    .from('photos')
    .insert(photos)
    .select();

  if (photosError) {
    console.error('❌ Error inserting photos:', photosError);
    process.exit(1);
  }

  console.log(`✅ Inserted ${photosData.length} photos\n`);

  // 2. Create daily set for today
  const today = new Date().toISOString().split('T')[0];
  console.log(`📅 Creating daily set for ${today}...`);

  const { data: dailySetData, error: dailySetError } = await supabase
    .from('daily_sets')
    .insert({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      date_utc: today,
      is_published: true
    })
    .select()
    .single();

  if (dailySetError) {
    console.error('❌ Error creating daily set:', dailySetError);
    process.exit(1);
  }

  console.log(`✅ Created daily set: ${dailySetData.id}\n`);

  // 3. Link photos to daily set
  console.log('🔗 Linking photos to daily set...');

  const dailySetPhotos = photos.map((photo, index) => ({
    daily_set_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    photo_id: photo.id,
    position: index + 1
  }));

  const { data: linkData, error: linkError } = await supabase
    .from('daily_set_photos')
    .insert(dailySetPhotos)
    .select();

  if (linkError) {
    console.error('❌ Error linking photos:', linkError);
    process.exit(1);
  }

  console.log(`✅ Linked ${linkData.length} photos to daily set\n`);

  // 4. Verify the data
  console.log('🔍 Verifying data...');

  const { data: verifyData, error: verifyError } = await supabase
    .from('daily_sets')
    .select(`
      id,
      date_utc,
      is_published,
      daily_set_photos (
        position,
        photo_id,
        photos (
          event_name,
          competition
        )
      )
    `)
    .eq('date_utc', today)
    .single();

  if (verifyError) {
    console.error('❌ Error verifying:', verifyError);
    process.exit(1);
  }

  console.log('✅ Verification successful!');
  console.log(`   Daily Set ID: ${verifyData.id}`);
  console.log(`   Date: ${verifyData.date_utc}`);
  console.log(`   Published: ${verifyData.is_published}`);
  console.log(`   Photos: ${verifyData.daily_set_photos.length}\n`);

  console.log('📋 Photos in set:');
  verifyData.daily_set_photos.forEach((dsp: any) => {
    console.log(`   ${dsp.position}. ${dsp.photos.event_name} (${dsp.photos.competition})`);
  });

  console.log('\n✨ Seed completed successfully!');
  console.log('\n🧪 Test the endpoint:');
  console.log('   curl http://localhost:3001/api/daily/sets/today\n');
}

seedData().catch(console.error);
