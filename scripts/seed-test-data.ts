/**
 * Seed Test Data Script
 * Inserts test photos and a daily set for today
 *
 * Usage: npx tsx scripts/seed-test-data.ts
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type { SupabaseClient } from "@/db/supabase.client";

// Load .env.test file if it exists
config({ path: ".env.test" });

const supabaseUrl = process.env.SUPABASE_URL || "http://127.0.0.1:54321";
// Use service role key for seeding (bypasses RLS)
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const supabase: SupabaseClient = createClient<Database>(supabaseUrl, supabaseServiceKey);

// Use the same photo for all entries
const PHOTO_URL =
  "https://plus.unsplash.com/premium_photo-1756131938894-83600503ca8b?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

// First 5 photos for daily set
// Note: event_name, competition, and year_utc columns are commented out in the schema
const photos = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    photo_url: "https://images.unsplash.com/photo-1693668605836-16888b3a2d46?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    place: "Madrid, Spain",
    lat: 40.453054,
    lon: -3.688344,
    description: "Holiday",
    license: "unsplash",
    credit: "Unsplash",
    is_daily_eligible: true,
    tags: ["club", "european", "final"],
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    photo_url: "https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?q=80&w=2126&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    place: "Rio de Janeiro, Brazil",
    lat: -22.912214,
    lon: -43.230182,
    description: "Holiday",
    license: "unsplash",
    credit: "Unsplash",
    is_daily_eligible: true,
    tags: ["international", "world-cup", "final"],
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    photo_url: "https://images.unsplash.com/photo-1627226890711-fd1fdc35d77e?q=80&w=1936&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    place: "Manchester, England",
    lat: 53.463056,
    lon: -2.291389,
    description: "Holiday",
    license: "unsplash",
    credit: "Unsplash",
    is_daily_eligible: true,
    tags: ["club", "domestic", "derby"],
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    photo_url: "https://images.unsplash.com/photo-1583422409516-2895a77efded?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    place: "Barcelona, Spain",
    lat: 41.380897,
    lon: 2.122872,
    description: "Holiday",
    license: "unsplash",
    credit: "Unsplash",
    is_daily_eligible: true,
    tags: ["club", "domestic", "clasico"],
  },
  {
    id: "55555555-5555-5555-5555-555555555555",
    photo_url: "https://images.unsplash.com/photo-1506501139174-099022df5260?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    place: "London, England",
    lat: 51.556021,
    lon: -0.279519,
    description: "Holiday",
    license: "unsplash",
    credit: "Unsplash",
    is_daily_eligible: true,
    tags: ["international", "european", "final"],
  },
];

// Additional photos for variety (not linked to daily set by default)
const morePhotos = [
  {
    id: "22222226-2222-2222-2222-222222222222",
    photo_url: "https://images.unsplash.com/photo-1682916114863-ba2f7b7d39c9?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    place: "Mexico City, Mexico",
    lat: 19.3029,
    lon: -99.1505,
    description: "Holiday",
    license: "unsplash",
    credit: "Unsplash",
    is_daily_eligible: true,
    tags: ["maradona", "worldcup", "argentina"],
  },
  {
    id: "44444446-4444-4444-4444-444444444444",
    photo_url: "https://images.unsplash.com/photo-1589561454226-796a8aa89b05?q=80&w=2067&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    place: "Istanbul, Turkey",
    lat: 40.987,
    lon: 29.0361,
    description: "Holiday",
    license: "unsplash",
    credit: "Unsplash",
    is_daily_eligible: true,
    tags: ["liverpool", "championsleague", "comeback"],
  },
  {
    id: "55555565-aaaa-bbbb-cccc-666666666666",
    photo_url: "https://images.unsplash.com/photo-1658863714457-d7d16558aa80?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    place: "Lusail, Qatar",
    lat: 25.416,
    lon: 51.49,
    description: "Holiday",
    license: "unsplash",
    credit: "Unsplash",
    is_daily_eligible: true,
    tags: ["worldcup", "messi", "argentina", "final"],
  },
];

// Combine all photos for insertion into database
const allPhotos = [...photos, ...morePhotos];

async function seedData() {
  // eslint-disable-next-line no-console
  console.log("🌱 Starting seed...\n");

  // 1. Insert all photos into database
  // eslint-disable-next-line no-console
  console.log(`📸 Inserting ${allPhotos.length} test photos...`);
  const { data: photosData, error: photosError } = await supabase.from("photos").insert(allPhotos).select();

  if (photosError) {
    // eslint-disable-next-line no-console
    console.error("❌ Error inserting photos:", photosError);
    process.exit(1);
  }

  // eslint-disable-next-line no-console
  console.log(`✅ Inserted ${photosData.length} photos\n`);

  // 2. Create daily set for today
  const today = new Date().toISOString().split("T")[0];
  // eslint-disable-next-line no-console
  console.log(`📅 Creating daily set for ${today}...`);

  const { data: dailySetData, error: dailySetError } = await supabase
    .from("daily_sets")
    .insert({
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      date_utc: today,
      is_published: true,
    })
    .select()
    .single();

  if (dailySetError) {
    // eslint-disable-next-line no-console
    console.error("❌ Error creating daily set:", dailySetError);
    process.exit(1);
  }

  // eslint-disable-next-line no-console
  console.log(`✅ Created daily set: ${dailySetData.id}\n`);

  // 3. Link ONLY FIRST 5 photos to daily set (positions 1-5)
  // eslint-disable-next-line no-console
  console.log("🔗 Linking first 5 photos to daily set...");

  const dailySetPhotos = photos.slice(0, 5).map((photo, index) => ({
    daily_set_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    photo_id: photo.id,
    position: index + 1,
  }));

  const { data: linkData, error: linkError } = await supabase.from("daily_set_photos").insert(dailySetPhotos).select();

  if (linkError) {
    // eslint-disable-next-line no-console
    console.error("❌ Error linking photos:", linkError);
    process.exit(1);
  }

  // eslint-disable-next-line no-console
  console.log(`✅ Linked ${linkData.length} photos to daily set\n`);

  // 4. Verify the data
  // eslint-disable-next-line no-console
  console.log("🔍 Verifying data...");

  const { data: verifyData, error: verifyError } = await supabase
    .from("daily_sets")
    .select(
      `
      id,
      date_utc,
      is_published,
      daily_set_photos (
        position,
        photo_id,
        photos (
          place,
          description
        )
      )
    `
    )
    .eq("date_utc", today)
    .single();

  if (verifyError) {
    // eslint-disable-next-line no-console
    console.error("❌ Error verifying:", verifyError);
    process.exit(1);
  }

  // eslint-disable-next-line no-console
  console.log("✅ Verification successful!");
  // eslint-disable-next-line no-console
  console.log(`   Daily Set ID: ${verifyData.id}`);
  // eslint-disable-next-line no-console
  console.log(`   Date: ${verifyData.date_utc}`);
  // eslint-disable-next-line no-console
  console.log(`   Published: ${verifyData.is_published}`);
  // eslint-disable-next-line no-console
  console.log(`   Photos: ${verifyData.daily_set_photos.length}\n`);

  // eslint-disable-next-line no-console
  console.log("📋 Photos in set:");
  //  allow explicit any for dsp
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  verifyData.daily_set_photos.forEach((dsp: any) => {
    // eslint-disable-next-line no-console
    console.log(`   ${dsp.position}. ${dsp.photos.place} - ${dsp.photos.description?.substring(0, 50)}...`);
  });

  // eslint-disable-next-line no-console
  console.log("\n✨ Seed completed successfully!");
  // eslint-disable-next-line no-console
  console.log("\n🧪 Test the endpoint:");
  // eslint-disable-next-line no-console
  console.log("   curl http://localhost:3001/api/daily/sets/today\n");
}
// eslint-disable-next-line no-console
seedData().catch(console.error);
