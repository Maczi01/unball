/**
 * Seed Test Data Script
 * Inserts 5 test photos and a daily set for today
 *
 * Usage: npx tsx scripts/seed-test-data.ts
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types.ts";

// Load .env.test file if it exists
config({ path: ".env.test" });

const supabaseUrl = process.env.SUPABASE_URL || "http://127.0.0.1:54321";
// Use service role key for seeding (bypasses RLS)
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

const photos = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    photo_url: "https://tomkinstimes.com/wp-content/uploads/2020/02/Origi-v-Spurs-CL-final-e1581933165219.jpg",
    event_name: "Champions League Final 2019",
    competition: "UEFA Champions League",
    year_utc: 2019,
    place: "Madrid, Spain",
    lat: 40.453054,
    lon: -3.688344,
    description: "Liverpool vs Tottenham Hotspur at Wanda Metropolitano Stadium",
    license: "CC BY-SA 4.0",
    credit: "Test Photo",
    is_daily_eligible: true,
    tags: ["club", "european", "final"],
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    photo_url:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Germany_and_Argentina_face_off_in_the_final_of_the_World_Cup_2014_-2014-07-13_%286%29.jpg/1280px-Germany_and_Argentina_face_off_in_the_final_of_the_World_Cup_2014_-2014-07-13_%286%29.jpg",
    event_name: "FIFA World Cup Final 2014",
    competition: "FIFA World Cup",
    year_utc: 2014,
    place: "Rio de Janeiro, Brazil",
    lat: -22.912214,
    lon: -43.230182,
    description: "Germany vs Argentina at Maracanã Stadium",
    license: "CC BY-SA 4.0",
    credit: "Test Photo",
    is_daily_eligible: true,
    tags: ["international", "world-cup", "final"],
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    photo_url:
      "https://www.reuters.com/resizer/v2/ISCEQPPMMBJFVOQUDIAMNVYZYU.jpg?auth=9b9c07fca45d702010a4c4bb49ad7c95b2ac5504330234871600e8c85f6a562d&width=640&quality=80",
    event_name: "Premier League Match 2023",
    competition: "Premier League",
    year_utc: 2023,
    place: "Manchester, England",
    lat: 53.463056,
    lon: -2.291389,
    description: "Manchester Derby at Etihad Stadium",
    license: "CC BY-SA 4.0",
    credit: "Test Photo",
    is_daily_eligible: true,
    tags: ["club", "domestic", "derby"],
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    photo_url:
      "https://phantom.estaticos-marca.com/7f8fa237b1a0575e2d50b938a5ad01fa/crop/0x4/2046x1152/resize/660/f/webp/assets/multimedia/imagenes/2022/03/20/16478074388951.jpg",
    event_name: "El Clásico 2022",
    competition: "La Liga",
    year_utc: 2022,
    place: "Barcelona, Spain",
    lat: 41.380897,
    lon: 2.122872,
    description: "FC Barcelona vs Real Madrid at Camp Nou",
    license: "CC BY-SA 4.0",
    credit: "Test Photo",
    is_daily_eligible: true,
    tags: ["club", "domestic", "clasico"],
  },
  {
    id: "55555555-5555-5555-5555-555555555555",
    photo_url: "https://cdn.punchng.com/wp-content/uploads/2021/07/11233524/Italy-vs-Englad.jpg",
    event_name: "UEFA Euro 2020 Final",
    competition: "UEFA European Championship",
    year_utc: 2021,
    place: "London, England",
    lat: 51.556021,
    lon: -0.279519,
    description: "Italy vs England at Wembley Stadium",
    license: "CC BY-SA 4.0",
    credit: "Test Photo",
    is_daily_eligible: true,
    tags: ["international", "european", "final"],
  },
];

// Additional photos for variety (not linked to daily set by default)
const morePhotos = [
  // 1️⃣ 1966 FIFA World Cup Final — England vs West Germany (Wembley)
  {
    id: "11111116-1111-1111-1111-111111111111",
    photo_url: "https://upload.wikimedia.org/wikipedia/commons/8/8c/Geoff_Hurst_goal_1966_World_Cup_final.jpg",
    event_name: "1966 FIFA World Cup Final",
    competition: "FIFA World Cup",
    year_utc: 1966,
    place: "London, England",
    lat: 51.556021,
    lon: -0.279519,
    description:
      'England beats West Germany 4–2 at Wembley. Geoff Hurst scores a hat-trick and the iconic "did it cross the line?" goal.',
    license: "CC BY-SA 4.0",
    credit: "Getty Images",
    is_daily_eligible: true,
    tags: ["worldcup", "final", "england"],
  },

  // 2️⃣ 1986 World Cup QF — Maradona's "Hand of God" & "Goal of the Century"
  {
    id: "22222226-2222-2222-2222-222222222222",
    photo_url: "https://upload.wikimedia.org/wikipedia/commons/1/1b/Maradona_hand_of_god_goal_1986.jpg",
    event_name: "1986 FIFA World Cup Quarter-final",
    competition: "FIFA World Cup",
    year_utc: 1986,
    place: "Mexico City, Mexico",
    lat: 19.3029,
    lon: -99.1505,
    description:
      'Diego Maradona scores the infamous "Hand of God" goal and later the "Goal of the Century" as Argentina beats England 2–1.',
    license: "CC BY-SA 4.0",
    credit: "El Gráfico",
    is_daily_eligible: true,
    tags: ["maradona", "worldcup", "argentina"],
  },

  // 3️⃣ 1999 UEFA Champions League Final — Manchester United comeback vs Bayern
  {
    id: "33333336-3333-3333-3333-333333333333",
    photo_url: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Man_United_1999_final_celebration.jpg",
    event_name: "1999 UEFA Champions League Final",
    competition: "UEFA Champions League",
    year_utc: 1999,
    place: "Barcelona, Spain",
    lat: 41.3809,
    lon: 2.1228,
    description:
      "Manchester United scores twice in stoppage time to defeat Bayern Munich 2–1 in a dramatic comeback at Camp Nou.",
    license: "CC BY-SA 4.0",
    credit: "UEFA",
    is_daily_eligible: true,
    tags: ["championsleague", "comeback", "manutd"],
  },

  // 4️⃣ 2005 UEFA Champions League Final — Liverpool's Miracle of Istanbul
  {
    id: "44444446-4444-4444-4444-444444444444",
    photo_url: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Liverpool_AC_Milan_2005_final_penalties.jpg",
    event_name: "2005 UEFA Champions League Final",
    competition: "UEFA Champions League",
    year_utc: 2005,
    place: "Istanbul, Turkey",
    lat: 40.987,
    lon: 29.0361,
    description:
      "Liverpool comes back from 3–0 down to draw 3–3 and beat AC Milan on penalties in the most famous comeback in football history.",
    license: "CC BY-SA 4.0",
    credit: "UEFA",
    is_daily_eligible: true,
    tags: ["liverpool", "championsleague", "comeback"],
  },

  // 5️⃣ 2022 FIFA World Cup Final — Argentina vs France (Messi vs Mbappé)
  {
    id: "55555565-aaaa-bbbb-cccc-666666666666",
    photo_url: "https://upload.wikimedia.org/wikipedia/commons/5/5d/Messi_World_Cup_2022_trophy.jpg",
    event_name: "2022 FIFA World Cup Final",
    competition: "FIFA World Cup",
    year_utc: 2022,
    place: "Lusail, Qatar",
    lat: 25.416,
    lon: 51.49,
    description:
      "Argentina defeats France on penalties after a 3–3 thriller. Messi finally lifts the World Cup, Mbappé scores a hat-trick.",
    license: "CC BY-SA 4.0",
    credit: "FIFA/Getty Images",
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
          event_name,
          competition
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
    console.log(`   ${dsp.position}. ${dsp.photos.event_name} (${dsp.photos.competition})`);
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
