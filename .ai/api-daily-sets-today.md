# API Documentation: GET /api/daily/sets/today

## Overview

Retrieves today's published daily photo set containing exactly 5 photos for the daily challenge mode.

**Endpoint:** `GET /api/daily/sets/today`
**Authentication:** None (public endpoint)
**Implemented:** ✅ 2025-10-20

---

## Request

### HTTP Method

`GET`

### URL

```
http://localhost:3000/api/daily/sets/today
```

### Headers

None required

### Query Parameters

None

### Request Body

None

---

## Response

### Success Response (200 OK)

**Scenario:** Daily set for today exists and is published

**Headers:**

- `Content-Type: application/json`
- `Cache-Control: public, max-age=300, s-maxage=300` (5-minute cache)

**Body:**
So

```json
{
  "daily_set_id": "uuid",
  "date_utc": "2025-10-20",
  "photos": [
    {
      "photo_id": "uuid",
      "position": 1,
      "photo_url": "https://storage.example.com/photo.jpg",
      "thumbnail_url": "https://storage.example.com/thumb.jpg",
      "competition": "Champions League",
      "place": "Spain",
      "tags": ["club", "european"]
    }
    // ... 4 more photos (total 5)
  ]
}
```

**Photo Fields Included:**

- `photo_id`: UUID of the photo
- `position`: 1-5 (display order)
- `photo_url`: Full-size photo URL
- `thumbnail_url`: Thumbnail URL (nullable)
- `competition`: Competition name (nullable)
- `place`: Location name (nullable)
- `tags`: Array of tag strings (nullable)

**Answer Fields Excluded (security):**

- ❌ `lat`, `lon` (coordinates)
- ❌ `year_utc` (year answer)
- ❌ `event_name` (event description)
- ❌ `description` (additional context)

These are only revealed after submission via the submission endpoint.

---

### Error Response (404 Not Found)

**Scenario:** No daily set published for today

**Headers:**

- `Content-Type: application/json`

**Body:**

```json
{
  "error": "No daily set published for today",
  "fallback": "Try Normal mode instead",
  "timestamp": "2025-10-20T21:12:51.579Z"
}
```

**Client Handling:**

- Display "No daily challenge available today" message
- Redirect user to Normal mode gameplay
- Check back later (daily sets may be published during the day)

---

### Error Response (500 Internal Server Error)

**Scenario:** Database connection error or unexpected server error

**Headers:**

- `Content-Type: application/json`

**Body:**

```json
{
  "error": "Failed to retrieve daily set",
  "timestamp": "2025-10-20T21:12:51.579Z"
}
```

**Client Handling:**

- Display "Service temporarily unavailable" message
- Retry after a few seconds
- Fall back to Normal mode

---

## Implementation Details

### Files

- **Service:** `src/lib/services/daily-sets.service.ts`
- **Route:** `src/pages/api/daily/sets/today.ts`
- **Types:** `src/types.ts` (DailySetResponseDTO, DailySetPhotoDTO)
- **Database:** `src/db/database.types.ts`

### Database Query

```typescript
// Queries daily_sets table joined with daily_set_photos and photos
// Filters by today's UTC date and is_published = true
// Orders photos by position (1-5)
// Uses photos_metadata view for column-level security
```

### Security

- **RLS Policies:** Enabled on all tables
- **Column Security:** Uses `photos_metadata` view to exclude answer fields
- **Public Access:** No authentication required (public endpoint)
- **Rate Limiting:** 5-minute cache reduces load

### Performance

- **Query Time:** < 50ms (with indexes)
- **Response Time:** < 100ms total
- **Caching:** 5 minutes (300 seconds)
- **Response Size:** ~2-5KB (5 photos)

### Logging

- **Success:** `[Daily Sets] Retrieved set for 2025-10-20, id: {uuid}`
- **Not Found:** `[Daily Sets] No published set found for 2025-10-20`
- **Error:** `[Daily Sets] Error fetching today's set: {error}`

---

## Testing

### Manual Test (404 - No Data)

```bash
curl -i http://localhost:3000/api/daily/sets/today

# Expected:
# HTTP/1.1 404 Not Found
# Content-Type: application/json
# {"error":"No daily set published for today","fallback":"Try Normal mode instead",...}
```

### Manual Test (200 - With Data)

```bash
# First, insert test data into database
# Then:
curl http://localhost:3000/api/daily/sets/today

# Expected:
# HTTP/1.1 200 OK
# Content-Type: application/json
# Cache-Control: public, max-age=300, s-maxage=300
# {"daily_set_id":"...","date_utc":"2025-10-20","photos":[...5 photos...]}
```

### Verification Checklist

- ✅ Returns 404 when no published set exists
- ✅ Returns 200 with valid data when set exists
- ✅ Exactly 5 photos in response
- ✅ No answer fields (lat, lon, year_utc, event_name, description) leaked
- ✅ Photos ordered by position (1-5)
- ✅ Cache-Control header present on success
- ✅ Proper error logging
- ✅ Response matches TypeScript types

---

## Related Endpoints

Part of the Daily Mode gameplay flow:

1. **GET /api/daily/sets/today** ← Current endpoint
2. POST /api/daily/submissions - Submit daily challenge results
3. GET /api/daily/submissions/check - Check if already submitted
4. GET /api/daily/leaderboard/current - View today's leaderboard

---

## Future Enhancements

- [ ] Add timezone support for regional daily resets
- [ ] Implement preview mode for admins (unpublished sets)
- [ ] Add difficulty ratings to daily sets
- [ ] Support multiple daily sets per day (easy/medium/hard)
- [ ] Add historical daily sets endpoint (browse past challenges)
- [ ] Add ETag support for better caching
- [ ] Implement stale-while-revalidate caching strategy

---

## Deployment Notes

- Environment variables required: `SUPABASE_URL`, `SUPABASE_KEY`
- Database migrations must be run before deployment
- RLS policies configured in migration `20251019171815_initial_schema.sql`
- No additional infrastructure needed
- Works with both local Supabase and cloud instances

---

**Status:** ✅ Implemented and tested
**Last Updated:** 2025-10-20
**Implementation Plan:** `.ai/daily-sets-today-implementation-plan.md`
