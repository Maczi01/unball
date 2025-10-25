# 🌱 Seed Test Data Instructions

This guide will help you insert test data into your Supabase database to test the `GET /api/daily/sets/today` endpoint.

## 📋 What Gets Inserted

- **5 Photos** with football/soccer themes:
  1. Champions League Final 2019 (Madrid)
  2. FIFA World Cup Final 2014 (Brazil)
  3. Premier League Match 2023 (Manchester)
  4. El Clásico 2022 (Barcelona)
  5. UEFA Euro 2020 Final (London)

- **1 Daily Set** for today's date (published and ready to play)

- **5 Links** connecting the photos to the daily set (positions 1-5)

---

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
npm install
```

This will install `tsx` (TypeScript executor) needed to run the seed script.

### Step 2: (Optional) Add Real Photos

Replace the placeholder files in `/public` folder with actual football photos:

- `photo1.jpg` - Champions League themed
- `photo2.jpg` - World Cup themed
- `photo3.jpg` - Premier League themed
- `photo4.jpg` - La Liga themed
- `photo5.jpg` - Euro Championship themed

**Note:** The endpoint will work even with placeholder files, but you won't see actual images.

### Step 3: Make Sure Supabase is Running

Ensure your local Supabase instance is running at `http://127.0.0.1:54321`

### Step 4: Run the Seed Script

```bash
npm run seed
```

You should see output like:

```
🌱 Starting seed...

📸 Inserting 5 test photos...
✅ Inserted 5 photos

📅 Creating daily set for 2025-10-20...
✅ Created daily set: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa

🔗 Linking photos to daily set...
✅ Linked 5 photos to daily set

🔍 Verifying data...
✅ Verification successful!
   Daily Set ID: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
   Date: 2025-10-20
   Published: true
   Photos: 5

📋 Photos in set:
   1. Champions League Final 2019 (UEFA Champions League)
   2. FIFA World Cup Final 2014 (FIFA World Cup)
   3. Premier League Match 2023 (Premier League)
   4. El Clásico 2022 (La Liga)
   5. UEFA Euro 2020 Final (UEFA European Championship)

✨ Seed completed successfully!

🧪 Test the endpoint:
   curl http://localhost:3001/api/daily/sets/today
```

### Step 5: Test the Endpoint

Start your dev server (if not already running):

```bash
npm run dev
```

Then test in another terminal:

```bash
curl http://localhost:3001/api/daily/sets/today
```

Or test in **Postman**:

- Method: `GET`
- URL: `http://localhost:3001/api/daily/sets/today`

### Expected Response (200 OK):

```json
{
  "daily_set_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "date_utc": "2025-10-20",
  "photos": [
    {
      "photo_id": "11111111-1111-1111-1111-111111111111",
      "position": 1,
      "photo_url": "/photo1.jpg",
      "thumbnail_url": "/photo1.jpg",
      "competition": "UEFA Champions League",
      "place": "Madrid, Spain",
      "tags": ["club", "european", "final"]
    }
    // ... 4 more photos
  ]
}
```

---

## 🔧 Troubleshooting

### Error: "duplicate key value violates unique constraint"

The data already exists. To re-seed:

1. Delete existing data manually via Supabase Studio, or
2. Change the UUIDs in `scripts/seed-test-data.ts`, or
3. Reset your database

### Error: "relation 'photos' does not exist"

Run migrations first:

```bash
# Using Supabase CLI (if installed)
supabase db reset

# Or apply migrations manually
```

### Error: "tsx: command not found"

Install dependencies:

```bash
npm install
```

### Dev server on different port

If your dev server runs on a different port, update the test curl command accordingly.

---

## 🗂️ File Locations

- **Seed Script:** `scripts/seed-test-data.ts`
- **SQL Version:** `supabase/seed-daily-set-test.sql` (alternative approach)
- **Placeholder Photos:** `public/photo1.jpg` - `public/photo5.jpg`
- **API Endpoint:** `src/pages/api/daily/sets/today.ts`
- **Service Layer:** `src/lib/services/daily-sets.service.ts`

---

## 🧹 Clean Up Test Data

To remove the test data, delete from Supabase Studio or run:

```sql
-- Delete in reverse order to respect foreign keys
DELETE FROM daily_set_photos WHERE daily_set_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
DELETE FROM daily_sets WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
DELETE FROM photos WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555'
);
```

---

## 📚 Next Steps

Once the endpoint is working:

1. Test with Postman (import curl commands)
2. Verify no answer fields are leaked (lat, lon, year_utc, event_name, description)
3. Check caching headers (`Cache-Control: public, max-age=300`)
4. Test error cases (unpublish the set to get 404)

---

**Need help?** Check the API documentation at `.ai/api-daily-sets-today.md`
