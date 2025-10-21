# Test Photos for Daily Set

Place 5 football/soccer photos in this `/public` folder with these exact names:

1. **photo1.jpg** - Champions League themed
2. **photo2.jpg** - World Cup themed
3. **photo3.jpg** - Premier League themed
4. **photo4.jpg** - La Liga themed
5. **photo5.jpg** - Euro Championship themed

## Image Requirements
- Format: JPG, JPEG, PNG, or WebP
- Recommended size: 1920x1080 or similar
- Football/soccer related images

## Quick Test Images
If you need placeholder images quickly, you can:
1. Download free football images from Unsplash/Pexels
2. Or use any football photos you have
3. Rename them to match the names above

## After Adding Photos
Run the SQL seed file to populate the database:

```bash
# If using Supabase CLI
supabase db reset --db-url "postgresql://postgres:postgres@localhost:54322/postgres"

# Or run the seed file directly
psql -h localhost -p 54322 -U postgres -d postgres -f supabase/seed-daily-set-test.sql
```

Then test the endpoint:
```bash
curl http://localhost:3001/api/daily/sets/today
```
