# Daily Sets Feature - Quick Start Guide

This guide helps you get started with creating and managing daily sets.

## Local Testing

### 1. Generate a CRON_SECRET

```bash
# On macOS/Linux
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Or use any random string generator
# Example output: Xy7pQ9mK4nR2sV8wB1cD6eF3gH5jL0oP
```

### 2. Add to .env

Create or update your `.env` file:

```env
CRON_SECRET=your-generated-secret-here
```

### 3. Verify Database Tables

Ensure these tables exist in your Supabase database:
- `daily_sets`
- `daily_set_photos`
- `photos` (with some photos having `is_daily_eligible = true`)

### 4. Create Your First Daily Set

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Log in as an admin user

3. Navigate to `/admin/daily-sets`

4. Click "Create Daily Set"

5. Select a date (tomorrow or later)

6. Select 5 photos from the grid

7. Click "Create Daily Set"

### 5. Test Auto-Publish Endpoint

**Health Check (no auth required):**
```bash
curl http://localhost:3000/api/cron/publish-daily-set
```

**Test Auto-Publish (with auth):**
```bash
curl -X POST http://localhost:3000/api/cron/publish-daily-set \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

Replace `YOUR_CRON_SECRET` with the value from your `.env` file.

### 6. Test Manual Publish

1. Go to `/admin/daily-sets`
2. Find an unpublished set
3. Click "Publish"
4. Verify it's marked as "Published"

---

## Admin Workflow

### Daily Set Creation Process

1. **Navigate to Daily Sets Manager**
   - Go to Admin Dashboard
   - Click "Daily Sets" card
   - Or visit `/admin/daily-sets` directly

2. **Check Schedule Status**
   - Dashboard shows "Days Scheduled Ahead"
   - **Goal:** Keep at least 7 days scheduled
   - **Warning:** Shows if less than 7 days
   - **Critical:** Shows if less than 3 days

3. **Create a New Set**
   - Click "Create Daily Set" button
   - Select a future date (cannot select past dates)
   - Browse available photos (shows only `is_daily_eligible = true`)
   - Click on 5 photos to select (numbered 1-5 for position)
   - Click "Create Daily Set"

4. **Review and Publish**
   - New set is created as "Draft"
   - Click "View" to see details
   - Verify all 5 photos are correct
   - Click "Publish" when ready

5. **Published Sets**
   - Auto-publish via cron at 00:00 UTC
   - Or manually publish from list or detail page
   - Published sets cannot be deleted or modified
   - Shown with green "Published" badge

### Best Practices

✅ **Schedule ahead:** Create sets for at least 7-14 days in advance
✅ **Diverse content:** Mix different eras, competitions, and regions
✅ **Quality check:** Verify photo quality and metadata before publishing
✅ **Photo variety:** Avoid using the same competition/year too frequently
✅ **Difficulty curve:** Balance easy and hard photos within each set

---

## Photo Selection Tips

### What Makes a Good Daily Photo?

1. **Clear and recognizable imagery**
   - Avoid blurry or low-quality images
   - Identifiable landmarks or distinctive features

2. **Historical significance**
   - Iconic moments in football history
   - Major tournaments and championships
   - Famous stadiums or venues

3. **Geographical diversity**
   - Mix locations across continents
   - Include well-known and lesser-known venues
   - Vary between urban and rural settings

4. **Time period variety**
   - Span different decades
   - Mix classic and modern football
   - Include historic and recent events

5. **Difficulty balance**
   - 1-2 easy photos (famous moments, recognizable stadiums)
   - 2-3 medium photos (requires good football knowledge)
   - 0-1 hard photos (obscure or challenging)

### Photo Grid Features

- **Thumbnail preview:** See the image before selecting
- **Position numbering:** Photos are numbered 1-5 in selection order
- **"Used" badge:** Shows if a photo was used in a previous daily set
- **Event info overlay:** Displays event name and year
- **Pagination:** Browse through all available photos

---

## Monitoring

### Admin Dashboard Stats

The admin dashboard shows:
- **Total Daily Sets:** Number of sets scheduled
- **Days Scheduled Ahead:** How many days are planned
- **Next Unpublished Date:** When the next draft set is scheduled

### Daily Sets List View

For each set, you can see:
- **Date:** The UTC date for the set
- **Status:** Published (green) or Draft (orange)
- **Photo Count:** X/5 photos (incomplete sets are flagged)
- **Actions:** View, Publish (if draft and complete), Delete (if draft)

### Detail View

Clicking "View" on any set shows:
- Complete set information
- All 5 photos with positions
- Publish/Delete actions
- Creation and update timestamps

---

## Troubleshooting

### "No photos available" in modal

**Problem:** Photo selection modal shows no photos.

**Solution:**
1. Verify photos exist in database: `SELECT count(*) FROM photos WHERE is_daily_eligible = true;`
2. Add photos via admin panel at `/admin/photos`
3. Ensure `is_daily_eligible` is set to `true` for some photos

### "Photos are not daily eligible" error

**Problem:** Selected photos cannot be used.

**Solution:**
1. Check photo eligibility in database
2. Update photo settings at `/admin/photos/{id}/edit`
3. Set `is_daily_eligible = true`

### Cannot publish set

**Problem:** Publish button is disabled or fails.

**Solution:**
1. Verify set has exactly 5 photos
2. Check that all photos still exist
3. Ensure set is not already published
4. Check server logs for specific error

### Cron job not running

**Problem:** Daily sets not auto-publishing.

**Solution:**
1. Verify `CRON_SECRET` is set in environment
2. Check cron job is configured (see CRON_SETUP.md)
3. Test endpoint manually with curl
4. Check platform-specific cron logs
5. Verify endpoint URL is correct

### Time zone confusion

**Problem:** Set publishes at wrong time.

**Solution:**
- All dates and times use UTC
- Cron should run at 00:00 UTC
- Date picker shows UTC dates
- Check system time zone settings

---

## API Reference

### Admin Endpoints

#### List Daily Sets
```
GET /api/admin/daily-sets?page=1&limit=20
```

Query params:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `from_date`: Filter from date (YYYY-MM-DD)
- `to_date`: Filter to date (YYYY-MM-DD)
- `is_published`: Filter by status (true/false)

#### Get Available Photos
```
GET /api/admin/daily-sets/available-photos?page=1&limit=50
```

Returns photos where `is_daily_eligible = true`.

#### Create Daily Set
```
POST /api/admin/daily-sets
Content-Type: application/json

{
  "date_utc": "2025-11-10",
  "photo_ids": ["uuid1", "uuid2", "uuid3", "uuid4", "uuid5"]
}
```

#### Get Daily Set Details
```
GET /api/admin/daily-sets/{id}
```

#### Publish Daily Set
```
POST /api/admin/daily-sets/{id}/publish
```

#### Delete Daily Set
```
DELETE /api/admin/daily-sets/{id}
```

Only works if not published and has no submissions.

### Cron Endpoint

#### Auto-Publish Today's Set
```
POST /api/cron/publish-daily-set
Authorization: Bearer {CRON_SECRET}
```

#### Health Check
```
GET /api/cron/publish-daily-set
```

No auth required, returns status only.

---

## Database Schema Quick Reference

### daily_sets
```sql
id               UUID PRIMARY KEY
date_utc         DATE UNIQUE NOT NULL
is_published     BOOLEAN DEFAULT false
created_at       TIMESTAMP
updated_at       TIMESTAMP
```

### daily_set_photos
```sql
daily_set_id     UUID REFERENCES daily_sets(id) ON DELETE CASCADE
photo_id         UUID REFERENCES photos(id) ON DELETE RESTRICT
position         INTEGER NOT NULL (1-5)
created_at       TIMESTAMP

PRIMARY KEY (daily_set_id, photo_id)
UNIQUE (daily_set_id, position)
```

### Relevant photos fields
```sql
is_daily_eligible        BOOLEAN DEFAULT true
first_used_in_daily_date DATE NULL
```

---

## Next Steps

1. ✅ Create your first daily set in admin panel
2. ✅ Test the auto-publish endpoint locally
3. ✅ Schedule 7-14 days of daily sets
4. ✅ Set up automated cron job (see CRON_SETUP.md)
5. ✅ Configure monitoring and alerts
6. ✅ Test with real players at `/daily` route

Happy scheduling! 🎉
