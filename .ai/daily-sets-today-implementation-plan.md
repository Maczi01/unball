# API Endpoint Implementation Plan: GET /api/daily/sets/today

## 1. Endpoint Overview

This endpoint retrieves today's published daily photo set containing exactly 5 photos. It serves as the primary data source for the daily challenge mode gameplay. The endpoint returns only safe metadata (URLs, competition info, tags) without revealing answers (coordinates, year, event name, description) until after submission.

**Key Requirements:**
- Return today's daily set based on current UTC date
- Only return published sets (`is_published = true`)
- Ensure exactly 5 photos are included, ordered by position
- Exclude answer fields to prevent cheating
- Handle cases where no daily set is available

## 2. Request Details

- **HTTP Method:** `GET`
- **URL Structure:** `/api/daily/sets/today`
- **Authentication:** None required (public endpoint)
- **Headers:** None required
- **Query Parameters:** None
- **Request Body:** None

## 3. Response Details

### Success Response (200 OK)

**Content-Type:** `application/json`

```typescript
{
  "daily_set_id": "uuid",
  "date_utc": "2025-10-19",
  "photos": [
    {
      "photo_id": "uuid",
      "position": 1,
      "photo_url": "https://storage.example.com/photo.jpg",
      "thumbnail_url": "https://storage.example.com/thumb.jpg",
      "competition": "Champions League",
      "place": "Spain",
      "tags": ["club", "european"]
    },
    // ... 4 more photos
  ]
}
```

### Error Response (404 Not Found)

```typescript
{
  "error": "No daily set published for today",
  "fallback": "Try Normal mode instead",
  "timestamp": "2025-10-19T12:30:45Z"
}
```

### Error Response (500 Internal Server Error)

```typescript
{
  "error": "Failed to retrieve daily set",
  "timestamp": "2025-10-19T12:30:45Z"
}
```

## 4. Used Types

### Response DTOs

```typescript
// From src/types.ts
export type DailySetResponseDTO = Pick<DbTable<"daily_sets">, "date_utc"> & {
  daily_set_id: string;
  photos: DailySetPhotoDTO[];
};

export type DailySetPhotoDTO = {
  photo_id: string;
  position: number;
  photo_url: string;
  thumbnail_url: string | null;
  competition: string | null;
  place: string | null;
  tags: string[] | null;
};
```

### Database Types

```typescript
// From src/db/database.types.ts
DbTable<"daily_sets"> // daily_sets table Row type
DbTable<"daily_set_photos"> // daily_set_photos junction table Row type
DbTable<"photos"> // photos table Row type (use photos_metadata view)
```

## 5. Data Flow

### Query Strategy

1. **Get current UTC date:**
   ```typescript
   const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
   ```

2. **Query daily_sets table:**
   - Filter by `date_utc = today`
   - Filter by `is_published = true`
   - Select: `id`, `date_utc`

3. **Join with daily_set_photos:**
   - Get photos for the matching daily_set_id
   - Order by `position ASC`

4. **Join with photos_metadata view:**
   - Retrieve safe metadata fields only
   - Exclude answer fields (lat, lon, year_utc, event_name, description)
   - Use `photos_metadata` view for column-level security

5. **Transform and return:**
   - Map database results to `DailySetResponseDTO`
   - Ensure exactly 5 photos
   - Return 404 if no set found or incomplete

### Database Query Pattern

```typescript
const { data: dailySet, error } = await supabase
  .from('daily_sets')
  .select(`
    id,
    date_utc,
    daily_set_photos!inner (
      position,
      photo_id,
      photos!inner (
        id,
        photo_url,
        thumbnail_url,
        competition,
        place,
        tags
      )
    )
  `)
  .eq('date_utc', today)
  .eq('is_published', true)
  .single();
```

### Service Layer

Create `src/lib/services/daily-sets.service.ts`:

```typescript
import type { SupabaseClient } from '@/db/supabase.client';
import type { DailySetResponseDTO, DailySetPhotoDTO } from '@/types';

export async function getTodaysDailySet(
  supabase: SupabaseClient
): Promise<DailySetResponseDTO | null> {
  const today = new Date().toISOString().split('T')[0];

  // Implementation here
}
```

## 6. Security Considerations

### Data Protection

1. **Answer Field Exclusion:**
   - Use `photos_metadata` view instead of direct `photos` table
   - Never return: `lat`, `lon`, `year_utc`, `event_name`, `description`
   - These fields are only revealed after submission via `photos_with_answers` view

2. **Row-Level Security:**
   - Supabase RLS policies should allow public SELECT on `photos_metadata`
   - Verify RLS is enabled on sensitive tables

3. **SQL Injection Prevention:**
   - Use Supabase parameterized queries (built-in protection)
   - Never concatenate user input into queries (no user input in this endpoint)

### Rate Limiting

```typescript
// Recommended rate limits for public endpoint
{
  windowMs: 60000, // 1 minute
  max: 100, // 100 requests per minute per IP
  message: 'Too many requests, please try again later'
}
```

### CORS Configuration

- Already configured in Astro middleware
- Allow origins: Production domain + localhost
- Allow methods: GET, OPTIONS
- No credentials needed for this endpoint

### Input Validation

- No user input to validate
- Internal date validation: Ensure UTC format is correct
- Response validation: Verify exactly 5 photos before returning

## 7. Error Handling

### Error Scenarios and Responses

| Scenario | Status Code | Response | Action |
|----------|-------------|----------|--------|
| No daily set for today | 404 | `{ error: "No daily set published for today", fallback: "Try Normal mode instead" }` | Log warning, suggest Normal mode |
| Set exists but not published | 404 | Same as above | Log info about unpublished set |
| Set has wrong photo count | 500 | `{ error: "Daily set incomplete" }` | Log critical error, alert admin |
| Database connection error | 500 | `{ error: "Failed to retrieve daily set" }` | Log error with stack trace |
| Supabase timeout | 500 | `{ error: "Service temporarily unavailable" }` | Log error, retry logic in service |

### Error Handling Pattern

```typescript
// Route handler (src/pages/api/daily/sets/today.ts)
export const GET: APIRoute = async ({ locals }) => {
  try {
    const dailySet = await getTodaysDailySet(locals.supabase);

    if (!dailySet) {
      return new Response(
        JSON.stringify({
          error: 'No daily set published for today',
          fallback: 'Try Normal mode instead',
          timestamp: new Date().toISOString()
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(dailySet), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[GET /api/daily/sets/today] Error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to retrieve daily set',
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

### Logging Strategy

```typescript
// Success
console.info(`[Daily Sets] Retrieved set for ${today}, id: ${dailySet.id}`);

// Not found
console.warn(`[Daily Sets] No published set found for ${today}`);

// Incomplete set
console.error(`[Daily Sets] Set ${dailySet.id} has ${photos.length} photos (expected 5)`);

// Database error
console.error(`[Daily Sets] Database error:`, error);
```

## 8. Performance Considerations

### Optimization Strategies

1. **Database Indexes:**
   - Index on `daily_sets(date_utc, is_published)`
   - Index on `daily_set_photos(daily_set_id, position)`
   - These indexes already exist per db-plan.md

2. **Caching:**
   ```typescript
   // Cache daily set for 5 minutes (300 seconds)
   headers: {
     'Content-Type': 'application/json',
     'Cache-Control': 'public, max-age=300, s-maxage=300'
   }
   ```
   - Daily sets don't change frequently during the day
   - Invalidate cache at midnight UTC (daily set rotation)

3. **Query Optimization:**
   - Use single query with joins instead of multiple queries
   - Select only needed columns
   - Use `single()` instead of array query for better performance

4. **Response Compression:**
   - Enable gzip compression for JSON responses > 1KB
   - Already configured in Astro

### Expected Performance

- **Database Query Time:** < 50ms
- **Total Response Time:** < 100ms
- **Response Size:** ~2-5KB (5 photos with metadata)
- **Concurrent Requests:** Handle 100+ req/sec with caching

## 9. Implementation Steps

### Step 1: Create Service Layer

**File:** `src/lib/services/daily-sets.service.ts`

```typescript
import type { SupabaseClient } from '@/db/supabase.client';
import type { DailySetResponseDTO, DailySetPhotoDTO } from '@/types';

/**
 * Retrieves today's published daily set with photos
 * @param supabase - Supabase client from context.locals
 * @returns Daily set with 5 photos, or null if not found
 */
export async function getTodaysDailySet(
  supabase: SupabaseClient
): Promise<DailySetResponseDTO | null> {
  const today = new Date().toISOString().split('T')[0];

  try {
    const { data, error } = await supabase
      .from('daily_sets')
      .select(`
        id,
        date_utc,
        daily_set_photos!inner (
          position,
          photo_id,
          photos!inner (
            id,
            photo_url,
            thumbnail_url,
            competition,
            place,
            tags
          )
        )
      `)
      .eq('date_utc', today)
      .eq('is_published', true)
      .order('position', {
        foreignTable: 'daily_set_photos',
        ascending: true
      })
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - normal case when no set published
        console.warn(`[Daily Sets] No published set found for ${today}`);
        return null;
      }
      throw error;
    }

    if (!data) {
      return null;
    }

    // Transform database result to DTO
    const photos: DailySetPhotoDTO[] = data.daily_set_photos.map((dsp: any) => ({
      photo_id: dsp.photos.id,
      position: dsp.position,
      photo_url: dsp.photos.photo_url,
      thumbnail_url: dsp.photos.thumbnail_url,
      competition: dsp.photos.competition,
      place: dsp.photos.place,
      tags: dsp.photos.tags
    }));

    // Validate photo count
    if (photos.length !== 5) {
      console.error(
        `[Daily Sets] Invalid photo count for set ${data.id}: ${photos.length} (expected 5)`
      );
      throw new Error('Daily set incomplete');
    }

    const response: DailySetResponseDTO = {
      daily_set_id: data.id,
      date_utc: data.date_utc,
      photos
    };

    console.info(`[Daily Sets] Retrieved set for ${today}, id: ${data.id}`);
    return response;

  } catch (error) {
    console.error('[Daily Sets] Error fetching today\'s set:', error);
    throw error;
  }
}
```

### Step 2: Create API Route

**File:** `src/pages/api/daily/sets/today.ts`

```typescript
import type { APIRoute } from 'astro';
import { getTodaysDailySet } from '@/lib/services/daily-sets.service';

export const prerender = false;

/**
 * GET /api/daily/sets/today
 * Retrieves today's published daily set with 5 photos
 *
 * @returns 200 - Daily set with photos
 * @returns 404 - No daily set published for today
 * @returns 500 - Server error
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    const dailySet = await getTodaysDailySet(locals.supabase);

    if (!dailySet) {
      return new Response(
        JSON.stringify({
          error: 'No daily set published for today',
          fallback: 'Try Normal mode instead',
          timestamp: new Date().toISOString()
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    return new Response(
      JSON.stringify(dailySet),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300, s-maxage=300'
        }
      }
    );

  } catch (error) {
    console.error('[GET /api/daily/sets/today] Error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to retrieve daily set',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
};
```

### Step 3: Add Type Exports (Already Done)

The necessary types are already defined in `src/types.ts`:
- `DailySetResponseDTO`
- `DailySetPhotoDTO`

### Step 4: Configure Supabase RLS Policies

Ensure the following policies exist:

```sql
-- Enable RLS on daily_sets
ALTER TABLE daily_sets ENABLE ROW LEVEL SECURITY;

-- Allow public read access to published daily sets
CREATE POLICY "Public read access to published daily sets"
ON daily_sets FOR SELECT
USING (is_published = true);

-- Enable RLS on daily_set_photos
ALTER TABLE daily_set_photos ENABLE ROW LEVEL SECURITY;

-- Allow public read access to daily set photos
CREATE POLICY "Public read access to daily set photos"
ON daily_set_photos FOR SELECT
USING (true);

-- photos_metadata view already has public SELECT access
GRANT SELECT ON photos_metadata TO anon, authenticated;
```

### Step 5: Test the Endpoint

**Manual Testing:**

```bash
# Test successful retrieval
curl http://localhost:3000/api/daily/sets/today

# Expected 200 response with daily set

# Test 404 when no set published
# (Set date to future or unpublish today's set)
```

**Automated Tests:**

```typescript
// tests/api/daily-sets-today.test.ts
import { describe, it, expect } from 'vitest';

describe('GET /api/daily/sets/today', () => {
  it('should return today\'s daily set with 5 photos', async () => {
    const response = await fetch('/api/daily/sets/today');
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('daily_set_id');
    expect(data).toHaveProperty('date_utc');
    expect(data.photos).toHaveLength(5);

    // Verify no answer fields leaked
    data.photos.forEach((photo: any) => {
      expect(photo).not.toHaveProperty('lat');
      expect(photo).not.toHaveProperty('lon');
      expect(photo).not.toHaveProperty('year_utc');
      expect(photo).not.toHaveProperty('event_name');
    });
  });

  it('should return 404 when no set published', async () => {
    // Test scenario where no set exists
    const response = await fetch('/api/daily/sets/today');
    expect([200, 404]).toContain(response.status);
  });
});
```

### Step 6: Monitor and Log

**Monitoring Checklist:**
- [ ] Log all 404 responses (expected, but good to track frequency)
- [ ] Alert on 500 errors (unexpected, requires investigation)
- [ ] Track response times (should be < 100ms)
- [ ] Monitor cache hit rates
- [ ] Track daily API call volume

**CloudWatch/Logging Example:**

```typescript
// Add structured logging
console.info('[Daily Sets API]', {
  endpoint: '/api/daily/sets/today',
  status: 200,
  responseTime: Date.now() - startTime,
  setId: dailySet.daily_set_id,
  photoCount: dailySet.photos.length
});
```

## 10. Deployment Checklist

- [ ] Types defined in `src/types.ts` ✓ (already done)
- [ ] Service layer implemented in `src/lib/services/daily-sets.service.ts`
- [ ] API route implemented in `src/pages/api/daily/sets/today.ts`
- [ ] Supabase RLS policies configured
- [ ] Database indexes verified
- [ ] Rate limiting configured (if using middleware)
- [ ] Caching headers configured
- [ ] Error logging implemented
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] Monitoring/alerts configured

## 11. Related Endpoints

This endpoint is part of the Daily Mode gameplay flow:

1. **GET /api/daily/sets/today** ← Current endpoint
2. POST /api/daily/submissions - Submit daily challenge results
3. GET /api/daily/submissions/check - Check if already submitted
4. GET /api/daily/leaderboard/current - View today's leaderboard

## 12. Future Enhancements

- [ ] Add timezone support for regional daily resets
- [ ] Implement preview mode for admins (show unpublished sets)
- [ ] Add difficulty ratings to daily sets
- [ ] Support multiple daily sets per day (easy/medium/hard)
- [ ] Add historical daily sets endpoint (browse past challenges)
