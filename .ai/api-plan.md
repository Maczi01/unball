# REST API Plan - FootyGuess Daily

## 1. Resources

| Resource | Database Table(s) | Description |
|----------|-------------------|-------------|
| Photos | `photos` | Game photos with metadata and eligibility tracking |
| Daily Sets | `daily_sets`, `daily_set_photos` | Pre-scheduled daily photo collections |
| Daily Submissions | `daily_submissions` | First-attempt daily game submissions |
| Leaderboard | `daily_submissions` (aggregated) | Top-10 rankings for daily challenges |
| Device Nicknames | `device_nicknames` | Nicknames for anonymous players |
| User Profiles | `users` | Profile data for registered users (optional in MVP) |
| Analytics Events | `analytics_events` | Product analytics and telemetry |
| Credits | `photos` (aggregated) | Photo attribution and licensing information |

---

## 2. Endpoints

### 2.1 Normal Mode Gameplay

#### GET `/api/normal/photos`
**Description:** Retrieve a random set of 5 photos for Normal mode gameplay. Returns metadata only (no answers).

**Authentication:** None required

**Query Parameters:** None

**Response Payload:**
```json
{
  "round_id": "uuid-v4",
  "photos": [
    {
      "id": "uuid",
      "photo_url": "https://storage.example.com/photo.jpg",
      "thumbnail_url": "https://storage.example.com/thumb.jpg",
      "competition": "World Cup",
      "place": "Europe",
      "tags": ["tournament", "final"]
    }
  ]
}
```

**Success Response:**
- **Code:** 200 OK
- **Content:** Array of 5 photo objects with metadata only

**Error Responses:**
- **Code:** 503 Service Unavailable
- **Content:** `{ "error": "Insufficient photos available" }`

---

#### POST `/api/normal/calculate-score`
**Description:** Calculate scores for Normal mode guesses. Returns per-photo feedback and total score. Does not persist results.

**Authentication:** None required

**Request Payload:**
```json
{
  "round_id": "uuid-v4",
  "guesses": [
    {
      "photo_id": "uuid",
      "guessed_lat": 48.8566,
      "guessed_lon": 2.3522,
      "guessed_year": 1998
    }
  ],
  "total_time_ms": 245000
}
```

**Response Payload:**
```json
{
  "total_score": 85420,
  "total_time_ms": 245000,
  "photos": [
    {
      "photo_id": "uuid",
      "location_score": 8750,
      "time_score": 8670,
      "total_score": 17420,
      "km_error": 250.5,
      "year_error": 3,
      "correct_lat": 51.5074,
      "correct_lon": -0.1278,
      "correct_year": 1966,
      "event_name": "1966 FIFA World Cup Final",
      "description": "England wins their first and only World Cup...",
      "source_url": "https://example.com/source",
      "license": "CC-BY-SA 4.0",
      "credit": "Photographer Name"
    }
  ]
}
```

**Validation Rules:**
- All photo_ids must be valid UUIDs from the provided round
- Coordinates must be valid: lat [-90, 90], lon [-180, 180]
- Year must be in range [1880, 2025]
- total_time_ms must be > 0
- Must provide exactly 5 guesses matching the round photos

**Success Response:**
- **Code:** 200 OK
- **Content:** Score breakdown with revealed answers

**Error Responses:**
- **Code:** 400 Bad Request
- **Content:** `{ "error": "Invalid guess data", "details": ["guessed_lat must be between -90 and 90"] }`
- **Code:** 404 Not Found
- **Content:** `{ "error": "Round not found or expired" }`

---

### 2.2 Daily Mode Gameplay

#### GET `/api/daily/sets/today`
**Description:** Retrieve today's published daily set (5 photos). Returns metadata only, no answers.

**Authentication:** None required

**Query Parameters:** None

**Response Payload:**
```json
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
    }
  ]
}
```

**Success Response:**
- **Code:** 200 OK
- **Content:** Daily set with 5 photos in order

**Error Responses:**
- **Code:** 404 Not Found
- **Content:** `{ "error": "No daily set published for today", "fallback": "Try Normal mode instead" }`

---

#### GET `/api/daily/submissions/check`
**Description:** Check if the current device/user has already submitted today's daily challenge.

**Authentication:** Optional (Supabase Auth token or anon_device_token header)

**Headers:**
- `X-Device-Token` (string, optional): Anonymous device identifier
- `Authorization` (string, optional): Bearer token for registered users

**Query Parameters:** None

**Response Payload:**
```json
{
  "has_submitted": true,
  "submission": {
    "id": "uuid",
    "total_score": 87500,
    "total_time_ms": 180000,
    "submission_timestamp": "2025-10-19T08:23:15Z",
    "leaderboard_rank": 7
  }
}
```

**Success Response:**
- **Code:** 200 OK
- **Content:** Submission status and details if exists

**Error Responses:**
- **Code:** 400 Bad Request
- **Content:** `{ "error": "Device token or auth required" }`

---

#### POST `/api/daily/submissions`
**Description:** Submit first-attempt daily challenge results. Validates scores server-side and enforces first-attempt rule.

**Authentication:** Required (Supabase Auth token or anon_device_token header)

**Headers:**
- `X-Device-Token` (string): Anonymous device identifier (required if not authenticated)
- `Authorization` (string): Bearer token for registered users (optional)

**Request Payload:**
```json
{
  "daily_set_id": "uuid",
  "date_utc": "2025-10-19",
  "nickname": "FootyFan123",
  "consent_given": true,
  "guesses": [
    {
      "photo_id": "uuid",
      "guessed_lat": 48.8566,
      "guessed_lon": 2.3522,
      "guessed_year": 1998
    }
  ],
  "total_time_ms": 245000
}
```

**Response Payload:**
```json
{
  "submission_id": "uuid",
  "total_score": 85420,
  "total_time_ms": 245000,
  "leaderboard_rank": 8,
  "photos": [
    {
      "photo_id": "uuid",
      "location_score": 8750,
      "time_score": 8670,
      "total_score": 17420,
      "km_error": 250.5,
      "year_error": 3,
      "correct_lat": 51.5074,
      "correct_lon": -0.1278,
      "correct_year": 1966,
      "event_name": "1966 FIFA World Cup Final",
      "description": "England wins their first and only World Cup...",
      "source_url": "https://example.com/source",
      "license": "CC-BY-SA 4.0",
      "credit": "Photographer Name"
    }
  ]
}
```

**Validation Rules:**
- Server recalculates all scores to prevent cheating
- date_utc must match current UTC date
- daily_set_id must match today's published set
- Nickname: 3-20 chars, alphanumeric + spaces/hyphens/underscores only
- Profanity filter applied to nickname
- consent_given must be true for first submission
- Coordinates must be valid: lat [-90, 90], lon [-180, 180]
- Year must be in range [1880, 2025]
- total_time_ms must be > 0 and < 86400000 (24 hours)
- Must provide exactly 5 guesses for all photos in set
- Device token or user must not have existing submission for this date

**Success Response:**
- **Code:** 201 Created
- **Content:** Submission details with revealed answers and leaderboard position

**Error Responses:**
- **Code:** 400 Bad Request
- **Content:** `{ "error": "Invalid submission data", "details": ["nickname contains profanity"] }`
- **Code:** 409 Conflict
- **Content:** `{ "error": "You have already submitted today's challenge", "existing_submission_id": "uuid" }`
- **Code:** 422 Unprocessable Entity
- **Content:** `{ "error": "Score mismatch detected", "calculated_score": 85420, "submitted_score": 90000 }`
- **Code:** 429 Too Many Requests
- **Content:** `{ "error": "Rate limit exceeded", "retry_after": 60 }`

---

### 2.3 Leaderboard

#### GET `/api/daily/leaderboard/{date}`
**Description:** Retrieve Top-10 leaderboard for a specific date with tie-breaking applied.

**Authentication:** None required

**URL Parameters:**
- `date` (string, required): UTC date in format YYYY-MM-DD

**Query Parameters:**
- `limit` (integer, optional): Number of results to return (default: 10, max: 100)

**Response Payload:**
```json
{
  "date_utc": "2025-10-19",
  "leaderboard": [
    {
      "rank": 1,
      "nickname": "FootyLegend",
      "total_score": 98750,
      "total_time_ms": 120000,
      "submission_timestamp": "2025-10-19T05:15:30Z"
    },
    {
      "rank": 2,
      "nickname": "MapMaster",
      "total_score": 98750,
      "total_time_ms": 125000,
      "submission_timestamp": "2025-10-19T06:20:45Z"
    }
  ],
  "total_submissions": 245
}
```

**Success Response:**
- **Code:** 200 OK
- **Content:** Ranked leaderboard with tie-breaking (score DESC, time ASC, timestamp ASC)

**Error Responses:**
- **Code:** 400 Bad Request
- **Content:** `{ "error": "Invalid date format" }`
- **Code:** 404 Not Found
- **Content:** `{ "error": "No daily set for this date" }`

---

#### GET `/api/daily/leaderboard/current`
**Description:** Retrieve Top-10 leaderboard for today's date (convenience endpoint).

**Authentication:** None required

**Query Parameters:**
- `limit` (integer, optional): Number of results to return (default: 10, max: 100)

**Response Payload:** Same as GET `/api/daily/leaderboard/{date}`

**Success Response:**
- **Code:** 200 OK
- **Content:** Today's leaderboard

---

### 2.4 Nickname Management

#### GET `/api/devices/nickname`
**Description:** Retrieve the current nickname for an anonymous device.

**Authentication:** Required (anon_device_token header)

**Headers:**
- `X-Device-Token` (string, required): Anonymous device identifier

**Response Payload:**
```json
{
  "anon_device_token": "device-uuid",
  "nickname": "FootyFan123",
  "consent_given_at": "2025-10-19T10:00:00Z",
  "created_at": "2025-10-15T08:30:00Z",
  "updated_at": "2025-10-19T10:00:00Z"
}
```

**Success Response:**
- **Code:** 200 OK
- **Content:** Device nickname details

**Error Responses:**
- **Code:** 404 Not Found
- **Content:** `{ "error": "Nickname not set for this device" }`

---

#### PUT `/api/devices/nickname`
**Description:** Create or update nickname for an anonymous device.

**Authentication:** Required (anon_device_token header)

**Headers:**
- `X-Device-Token` (string, required): Anonymous device identifier

**Request Payload:**
```json
{
  "nickname": "NewFootyFan",
  "consent_given": true
}
```

**Validation Rules:**
- Nickname: 3-20 chars, must match regex `^[a-zA-Z0-9 _-]+$`
- Profanity filter applied
- consent_given must be true for first-time setup

**Response Payload:**
```json
{
  "anon_device_token": "device-uuid",
  "nickname": "NewFootyFan",
  "consent_given_at": "2025-10-19T12:00:00Z",
  "updated_at": "2025-10-19T12:00:00Z"
}
```

**Success Response:**
- **Code:** 200 OK (update)
- **Code:** 201 Created (new nickname)
- **Content:** Updated nickname details

**Error Responses:**
- **Code:** 400 Bad Request
- **Content:** `{ "error": "Invalid nickname", "details": ["nickname contains profanity"] }`

---

#### GET `/api/users/me/profile`
**Description:** Retrieve profile for authenticated user.

**Authentication:** Required (Supabase Auth token)

**Headers:**
- `Authorization` (string, required): Bearer {token}

**Response Payload:**
```json
{
  "user_id": "auth-uuid",
  "nickname": "RegisteredUser",
  "consent_given_at": "2025-10-01T10:00:00Z",
  "created_at": "2025-10-01T10:00:00Z",
  "updated_at": "2025-10-19T11:00:00Z"
}
```

**Success Response:**
- **Code:** 200 OK
- **Content:** User profile details

**Error Responses:**
- **Code:** 401 Unauthorized
- **Content:** `{ "error": "Invalid or expired token" }`

---

#### PATCH `/api/users/me/profile`
**Description:** Update profile for authenticated user (primarily nickname).

**Authentication:** Required (Supabase Auth token)

**Headers:**
- `Authorization` (string, required): Bearer {token}

**Request Payload:**
```json
{
  "nickname": "UpdatedName",
  "consent_given": true
}
```

**Validation Rules:**
- Nickname: 3-20 chars, must match regex `^[a-zA-Z0-9 _-]+$`
- Profanity filter applied

**Response Payload:**
```json
{
  "user_id": "auth-uuid",
  "nickname": "UpdatedName",
  "consent_given_at": "2025-10-19T11:00:00Z",
  "updated_at": "2025-10-19T11:00:00Z"
}
```

**Success Response:**
- **Code:** 200 OK
- **Content:** Updated profile details

**Error Responses:**
- **Code:** 400 Bad Request
- **Content:** `{ "error": "Invalid nickname", "details": ["nickname too short"] }`
- **Code:** 401 Unauthorized
- **Content:** `{ "error": "Invalid or expired token" }`

---

### 2.5 Analytics

#### POST `/api/analytics/events`
**Description:** Track analytics events (start_round, guess_submitted, round_complete, daily_submission).

**Authentication:** None required

**Headers:**
- `X-Device-Token` (string, optional): Anonymous device identifier for correlation

**Request Payload:**
```json
{
  "event_type": "guess_submitted",
  "event_data": {
    "photo_id": "uuid",
    "mode": "daily",
    "km_error": 250.5,
    "year_error": 3,
    "score": 17420,
    "time_ms": 45000
  },
  "anon_device_token": "device-uuid"
}
```

**Validation Rules:**
- event_type must be one of: start_round, guess_submitted, round_complete, daily_submission
- event_data is flexible JSONB but should follow documented schemas
- Maximum 100 events per device per hour

**Response Payload:**
```json
{
  "event_id": 12345,
  "created_at": "2025-10-19T12:30:45Z"
}
```

**Success Response:**
- **Code:** 202 Accepted
- **Content:** Event ID confirmation

**Error Responses:**
- **Code:** 400 Bad Request
- **Content:** `{ "error": "Invalid event type" }`
- **Code:** 429 Too Many Requests
- **Content:** `{ "error": "Event rate limit exceeded" }`

---

### 2.6 Credits

#### GET `/api/credits`
**Description:** Retrieve all photo credits and licensing information for the credits page.

**Authentication:** None required

**Query Parameters:**
- `page` (integer, optional): Page number for pagination (default: 1)
- `limit` (integer, optional): Items per page (default: 50, max: 100)

**Response Payload:**
```json
{
  "credits": [
    {
      "photo_id": "uuid",
      "event_name": "1966 FIFA World Cup Final",
      "source_url": "https://example.com/source",
      "license": "CC-BY-SA 4.0",
      "credit": "Photographer Name",
      "year_utc": 1966
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total_items": 100,
    "total_pages": 2
  }
}
```

**Success Response:**
- **Code:** 200 OK
- **Content:** Paginated photo credits

---

### 2.7 Admin - Photos Management

#### POST `/api/admin/photos`
**Description:** Upload a new photo with metadata for content ingestion.

**Authentication:** Required (Admin role)

**Headers:**
- `Authorization` (string, required): Bearer {admin-token}
- `Content-Type`: multipart/form-data

**Request Payload (multipart):**
```
photo_file: [binary]
event_name: "1966 FIFA World Cup Final"
competition: "FIFA World Cup"
year_utc: 1966
place: "London, England"
lat: 51.5074
lon: -0.1278
description: "England wins their first World Cup..."
source_url: "https://example.com/source"
license: "CC-BY-SA 4.0"
credit: "Photographer Name"
tags: ["world-cup", "final", "england"]
notes: "High quality, well-known event"
```

**Validation Rules:**
- photo_file required, max size 10MB, formats: jpg, jpeg, png, webp
- event_name, license, credit: required (NOT NULL)
- year_utc: required, must be in [1880, 2025]
- lat: required, must be in [-90, 90]
- lon: required, must be in [-180, 180]
- tags: optional array of strings
- Automatic thumbnail generation
- Upload to Supabase Storage
- is_daily_eligible defaults to true

**Response Payload:**
```json
{
  "photo_id": "uuid",
  "photo_url": "https://storage.example.com/photos/uuid.jpg",
  "thumbnail_url": "https://storage.example.com/photos/uuid_thumb.jpg",
  "event_name": "1966 FIFA World Cup Final",
  "year_utc": 1966,
  "created_at": "2025-10-19T14:00:00Z"
}
```

**Success Response:**
- **Code:** 201 Created
- **Content:** Created photo details

**Error Responses:**
- **Code:** 400 Bad Request
- **Content:** `{ "error": "Validation failed", "details": ["year_utc must be between 1880 and 2025"] }`
- **Code:** 401 Unauthorized
- **Content:** `{ "error": "Admin authentication required" }`
- **Code:** 413 Payload Too Large
- **Content:** `{ "error": "Photo file exceeds 10MB limit" }`

---

#### GET `/api/admin/photos`
**Description:** List all photos with filtering and pagination.

**Authentication:** Required (Admin role)

**Headers:**
- `Authorization` (string, required): Bearer {admin-token}

**Query Parameters:**
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Items per page (default: 50, max: 100)
- `is_daily_eligible` (boolean, optional): Filter by eligibility
- `year_utc` (integer, optional): Filter by year
- `search` (string, optional): Search in event_name and description

**Response Payload:**
```json
{
  "photos": [
    {
      "id": "uuid",
      "photo_url": "https://storage.example.com/photo.jpg",
      "thumbnail_url": "https://storage.example.com/thumb.jpg",
      "event_name": "1966 FIFA World Cup Final",
      "year_utc": 1966,
      "lat": 51.5074,
      "lon": -0.1278,
      "is_daily_eligible": true,
      "first_used_in_daily_date": null,
      "created_at": "2025-10-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total_items": 100,
    "total_pages": 2
  }
}
```

**Success Response:**
- **Code:** 200 OK
- **Content:** Paginated photo list

---

#### GET `/api/admin/photos/{id}`
**Description:** Get detailed information for a specific photo.

**Authentication:** Required (Admin role)

**Headers:**
- `Authorization` (string, required): Bearer {admin-token}

**URL Parameters:**
- `id` (uuid, required): Photo ID

**Response Payload:**
```json
{
  "id": "uuid",
  "photo_url": "https://storage.example.com/photo.jpg",
  "thumbnail_url": "https://storage.example.com/thumb.jpg",
  "original_url": "https://storage.example.com/original.jpg",
  "event_name": "1966 FIFA World Cup Final",
  "competition": "FIFA World Cup",
  "year_utc": 1966,
  "place": "London, England",
  "lat": 51.5074,
  "lon": -0.1278,
  "description": "England wins their first World Cup...",
  "source_url": "https://example.com/source",
  "license": "CC-BY-SA 4.0",
  "credit": "Photographer Name",
  "is_daily_eligible": true,
  "first_used_in_daily_date": null,
  "tags": ["world-cup", "final", "england"],
  "notes": "High quality, well-known event",
  "created_at": "2025-10-15T10:00:00Z",
  "updated_at": "2025-10-15T10:00:00Z"
}
```

**Success Response:**
- **Code:** 200 OK
- **Content:** Full photo details

**Error Responses:**
- **Code:** 404 Not Found
- **Content:** `{ "error": "Photo not found" }`

---

#### PATCH `/api/admin/photos/{id}`
**Description:** Update photo metadata.

**Authentication:** Required (Admin role)

**Headers:**
- `Authorization` (string, required): Bearer {admin-token}

**URL Parameters:**
- `id` (uuid, required): Photo ID

**Request Payload:**
```json
{
  "event_name": "Updated Event Name",
  "description": "Updated description",
  "is_daily_eligible": false,
  "tags": ["updated", "tags"],
  "notes": "Updated notes"
}
```

**Validation Rules:**
- year_utc: if provided, must be in [1880, 2025]
- lat: if provided, must be in [-90, 90]
- lon: if provided, must be in [-180, 180]
- Cannot modify photo_url, thumbnail_url, or first_used_in_daily_date directly

**Response Payload:**
```json
{
  "id": "uuid",
  "updated_fields": ["event_name", "description", "tags"],
  "updated_at": "2025-10-19T15:00:00Z"
}
```

**Success Response:**
- **Code:** 200 OK
- **Content:** Update confirmation

**Error Responses:**
- **Code:** 400 Bad Request
- **Content:** `{ "error": "Validation failed", "details": ["year_utc out of range"] }`
- **Code:** 404 Not Found
- **Content:** `{ "error": "Photo not found" }`

---

#### DELETE `/api/admin/photos/{id}`
**Description:** Delete a photo (only if not used in published daily sets).

**Authentication:** Required (Admin role)

**Headers:**
- `Authorization` (string, required): Bearer {admin-token}

**URL Parameters:**
- `id` (uuid, required): Photo ID

**Response Payload:**
```json
{
  "message": "Photo deleted successfully",
  "photo_id": "uuid"
}
```

**Success Response:**
- **Code:** 200 OK
- **Content:** Deletion confirmation

**Error Responses:**
- **Code:** 409 Conflict
- **Content:** `{ "error": "Cannot delete photo used in published daily sets" }`
- **Code:** 404 Not Found
- **Content:** `{ "error": "Photo not found" }`

---

### 2.8 Admin - Daily Sets Management

#### POST `/api/admin/daily-sets`
**Description:** Create a new daily set for a specific date.

**Authentication:** Required (Admin role)

**Headers:**
- `Authorization` (string, required): Bearer {admin-token}

**Request Payload:**
```json
{
  "date_utc": "2025-10-25",
  "photo_ids": [
    "uuid1",
    "uuid2",
    "uuid3",
    "uuid4",
    "uuid5"
  ]
}
```

**Validation Rules:**
- date_utc must be a future date (or today)
- Must provide exactly 5 unique photo_ids
- All photos must exist and be daily-eligible (is_daily_eligible = true)
- Date must not already have a daily set
- Photos should not have been used in recent daily sets (recommended buffer: 60 days)

**Response Payload:**
```json
{
  "daily_set_id": "uuid",
  "date_utc": "2025-10-25",
  "is_published": false,
  "photos": [
    {
      "photo_id": "uuid1",
      "position": 1,
      "event_name": "Event 1"
    },
    {
      "photo_id": "uuid2",
      "position": 2,
      "event_name": "Event 2"
    }
  ],
  "created_at": "2025-10-19T16:00:00Z"
}
```

**Success Response:**
- **Code:** 201 Created
- **Content:** Created daily set details

**Error Responses:**
- **Code:** 400 Bad Request
- **Content:** `{ "error": "Validation failed", "details": ["Must provide exactly 5 photos"] }`
- **Code:** 409 Conflict
- **Content:** `{ "error": "Daily set already exists for this date" }`

---

#### GET `/api/admin/daily-sets`
**Description:** List all daily sets with scheduling overview.

**Authentication:** Required (Admin role)

**Headers:**
- `Authorization` (string, required): Bearer {admin-token}

**Query Parameters:**
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Items per page (default: 20, max: 100)
- `from_date` (string, optional): Start date filter (YYYY-MM-DD)
- `to_date` (string, optional): End date filter (YYYY-MM-DD)
- `is_published` (boolean, optional): Filter by publication status

**Response Payload:**
```json
{
  "daily_sets": [
    {
      "daily_set_id": "uuid",
      "date_utc": "2025-10-25",
      "is_published": false,
      "photo_count": 5,
      "created_at": "2025-10-19T16:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_items": 45,
    "total_pages": 3
  },
  "schedule_status": {
    "days_scheduled_ahead": 15,
    "next_unpublished_date": "2025-10-20",
    "warning": null
  }
}
```

**Success Response:**
- **Code:** 200 OK
- **Content:** Daily sets list with schedule status

---

#### GET `/api/admin/daily-sets/{id}`
**Description:** Get detailed information for a specific daily set.

**Authentication:** Required (Admin role)

**Headers:**
- `Authorization` (string, required): Bearer {admin-token}

**URL Parameters:**
- `id` (uuid, required): Daily set ID

**Response Payload:**
```json
{
  "daily_set_id": "uuid",
  "date_utc": "2025-10-25",
  "is_published": false,
  "photos": [
    {
      "photo_id": "uuid",
      "position": 1,
      "photo_url": "https://storage.example.com/photo.jpg",
      "event_name": "Event Name",
      "year_utc": 1998
    }
  ],
  "created_at": "2025-10-19T16:00:00Z",
  "updated_at": "2025-10-19T16:00:00Z"
}
```

**Success Response:**
- **Code:** 200 OK
- **Content:** Full daily set details

**Error Responses:**
- **Code:** 404 Not Found
- **Content:** `{ "error": "Daily set not found" }`

---

#### POST `/api/admin/daily-sets/{id}/publish`
**Description:** Publish a daily set, making it active for the specified date.

**Authentication:** Required (Admin role)

**Headers:**
- `Authorization` (string, required): Bearer {admin-token}

**URL Parameters:**
- `id` (uuid, required): Daily set ID

**Validation Rules:**
- Daily set must have exactly 5 photos
- All photos must be valid and available
- Date should be today or future (warning if publishing past date)

**Response Payload:**
```json
{
  "daily_set_id": "uuid",
  "date_utc": "2025-10-25",
  "is_published": true,
  "published_at": "2025-10-19T16:30:00Z"
}
```

**Success Response:**
- **Code:** 200 OK
- **Content:** Published set confirmation

**Error Responses:**
- **Code:** 400 Bad Request
- **Content:** `{ "error": "Cannot publish incomplete set" }`
- **Code:** 409 Conflict
- **Content:** `{ "error": "Daily set already published" }`

---

#### DELETE `/api/admin/daily-sets/{id}`
**Description:** Delete a daily set (only if not published or has no submissions).

**Authentication:** Required (Admin role)

**Headers:**
- `Authorization` (string, required): Bearer {admin-token}

**URL Parameters:**
- `id` (uuid, required): Daily set ID

**Response Payload:**
```json
{
  "message": "Daily set deleted successfully",
  "daily_set_id": "uuid"
}
```

**Success Response:**
- **Code:** 200 OK
- **Content:** Deletion confirmation

**Error Responses:**
- **Code:** 409 Conflict
- **Content:** `{ "error": "Cannot delete published set with submissions" }`
- **Code:** 404 Not Found
- **Content:** `{ "error": "Daily set not found" }`

---

### 2.9 Admin - Analytics

#### GET `/api/admin/analytics/overview`
**Description:** Get high-level analytics overview and KPIs.

**Authentication:** Required (Admin role)

**Headers:**
- `Authorization` (string, required): Bearer {admin-token}

**Query Parameters:**
- `from_date` (string, optional): Start date (YYYY-MM-DD)
- `to_date` (string, optional): End date (YYYY-MM-DD)

**Response Payload:**
```json
{
  "period": {
    "from_date": "2025-10-01",
    "to_date": "2025-10-19"
  },
  "adoption": {
    "unique_players": 1250,
    "new_players": 180
  },
  "engagement": {
    "total_rounds": 5420,
    "round_completion_rate": 0.67,
    "median_session_time_seconds": 240,
    "daily_participation_rate": 0.45
  },
  "retention": {
    "day_1_retention": 0.28,
    "day_7_returning_users": 340
  },
  "performance": {
    "median_load_time_ms": 1650,
    "median_map_latency_ms": 180
  },
  "content_health": {
    "days_scheduled_ahead": 15,
    "photo_pool_size": 100,
    "photos_available_for_daily": 85
  }
}
```

**Success Response:**
- **Code:** 200 OK
- **Content:** Analytics overview

---

#### GET `/api/admin/analytics/events`
**Description:** Query analytics events with filtering.

**Authentication:** Required (Admin role)

**Headers:**
- `Authorization` (string, required): Bearer {admin-token}

**Query Parameters:**
- `event_type` (string, optional): Filter by event type
- `from_date` (string, optional): Start timestamp
- `to_date` (string, optional): End timestamp
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Items per page (default: 50, max: 100)

**Response Payload:**
```json
{
  "events": [
    {
      "id": 12345,
      "event_type": "guess_submitted",
      "event_data": {
        "photo_id": "uuid",
        "km_error": 250.5,
        "score": 17420
      },
      "anon_device_token": "device-uuid",
      "created_at": "2025-10-19T12:30:45Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total_items": 15000,
    "total_pages": 300
  }
}
```

**Success Response:**
- **Code:** 200 OK
- **Content:** Filtered analytics events

---

## 3. Authentication and Authorization

### 3.1 Authentication Mechanisms

**Anonymous Users (MVP Primary Mode):**
- Use client-generated device token (UUID v4) stored in localStorage/cookie
- Token sent via `X-Device-Token` header with each request
- No authentication required for read operations (photos, leaderboard)
- Device token required for write operations (submissions, nickname management)
- Server validates token format but does not verify authenticity (MVP scope)

**Registered Users (Optional for MVP):**
- Supabase Auth provides JWT tokens
- Token sent via `Authorization: Bearer {token}` header
- Server validates token with Supabase Auth API
- User profile linked to auth.users table via foreign key
- If both device token and auth token present, auth token takes precedence

### 3.2 Authorization Levels

**Public (No Auth):**
- GET `/api/normal/photos`
- GET `/api/daily/sets/today`
- GET `/api/daily/leaderboard/*`
- GET `/api/credits`

**Anonymous Device (Device Token Required):**
- POST `/api/normal/calculate-score`
- GET `/api/daily/submissions/check`
- POST `/api/daily/submissions`
- GET `/api/devices/nickname`
- PUT `/api/devices/nickname`
- POST `/api/analytics/events`

**Registered User (Auth Token Required):**
- GET `/api/users/me/profile`
- PATCH `/api/users/me/profile`
- All anonymous device endpoints (when authenticated)

**Admin (Admin Role Required):**
- All `/api/admin/*` endpoints
- Admin role checked via Supabase Auth custom claims or separate admin tokens
- Admin tokens should be rotated regularly
- IP allowlist recommended for admin endpoints (deployment configuration)

### 3.3 Implementation Details

**Token Validation Flow:**
1. Extract token from `X-Device-Token` or `Authorization` header
2. For device tokens: validate UUID format only (no server-side session)
3. For auth tokens: verify with Supabase Auth, extract user_id
4. For admin tokens: verify with Supabase Auth and check admin role claim
5. Attach validated identity to request context
6. Proceed with authorization checks per endpoint

**Rate Limiting:**
- Device token based: 3 submissions per day for `/api/daily/submissions`
- IP based: 100 requests per minute for public endpoints
- Device token based: 100 analytics events per hour
- Admin endpoints: 1000 requests per hour

**CORS Configuration:**
- Allow origins: Production domain + localhost for development
- Allow methods: GET, POST, PATCH, PUT, DELETE, OPTIONS
- Allow headers: Content-Type, Authorization, X-Device-Token
- Max age: 86400 seconds

---

## 4. Validation and Business Logic

### 4.1 Validation Rules by Resource

#### Photos
**Field Validations:**
- `year_utc`: Required, integer, range [1880, 2025]
- `lat`: Required, decimal, range [-90, 90], precision (9,6)
- `lon`: Required, decimal, range [-180, 180], precision (9,6)
- `event_name`: Required, string, max 255 chars
- `license`: Required, string, max 100 chars
- `credit`: Required, string, max 255 chars
- `photo_url`: Required, valid URL, HTTPS only
- `thumbnail_url`: Optional, valid URL, HTTPS only
- `competition`: Optional, string, max 255 chars
- `place`: Optional, string, max 255 chars
- `description`: Optional, text
- `tags`: Optional, array of strings
- `is_daily_eligible`: Boolean, defaults to true

#### Daily Submissions
**Field Validations:**
- `date_utc`: Required, must match current UTC date (YYYY-MM-DD)
- `daily_set_id`: Required, valid UUID, must reference published daily set
- `nickname`: Required, string, length [3, 20], regex `^[a-zA-Z0-9 _-]+$`, profanity filtered
- `consent_given`: Required boolean (true for first submission)
- `guesses`: Required array of 5 guess objects
- `guesses[].photo_id`: Required, valid UUID from daily set
- `guesses[].guessed_lat`: Required, decimal, range [-90, 90]
- `guesses[].guessed_lon`: Required, decimal, range [-180, 180]
- `guesses[].guessed_year`: Required, integer, range [1880, 2025]
- `total_time_ms`: Required, integer, range (0, 86400000]
- `total_score`: Calculated server-side, range [0, 100000]

**Business Rules:**
- User/device can only submit once per UTC date (enforced by DB unique constraint)
- Server recalculates all scores; reject if mismatch > 1% (tolerance for floating point)
- date_utc must align with published daily set
- All 5 photos in daily set must have guesses
- Nickname stored at submission time (snapshot, not reference)

#### Nicknames
**Field Validations:**
- `nickname`: Required, string, length [3, 20], regex `^[a-zA-Z0-9 _-]+$`
- Profanity filter: Block common profanity in multiple languages
- Emoji normalization: Strip or reject emojis
- Whitespace: Trim leading/trailing, collapse multiple spaces to single

#### Daily Sets
**Field Validations:**
- `date_utc`: Required, unique, valid date
- `photo_ids`: Required array of exactly 5 unique valid photo IDs
- All photos must have `is_daily_eligible = true`
- Recommended: Photos not used in daily sets within last 60 days

### 4.2 Business Logic Implementation

#### Score Calculation
**Formula (from PRD):**
```
location_score = max(0, 10000 - km_error × K_km)
time_score = max(0, 10000 - |year_guess - year_true| × K_y)
photo_total = location_score + time_score
round_total = sum(photo_total for all 5 photos)

Initial constants:
K_km = 5 (points deducted per km)
K_y = 400 (points deducted per year)
```

**Implementation:**
- Use Haversine formula for km_error calculation
- Server-side calculation is authoritative
- Client can calculate for immediate feedback but must defer to server
- Round to nearest integer for display
- Cap at 0 (no negative scores) and 20000 per photo

#### Leaderboard Tie-Breaking
**Tie-breaking order (from PRD):**
1. Higher total_score (DESC)
2. Lower total_time_ms (ASC)
3. Earlier submission_timestamp (ASC)

**SQL Implementation:**
```sql
SELECT * FROM daily_submissions
WHERE date_utc = '2025-10-19'
ORDER BY total_score DESC, total_time_ms ASC, submission_timestamp ASC
LIMIT 10;
```

#### First-Attempt Enforcement
**Database Constraints:**
- Partial unique index: `(date_utc, user_id)` WHERE `user_id IS NOT NULL`
- Partial unique index: `(date_utc, anon_device_token)` WHERE `anon_device_token IS NOT NULL`
- CHECK constraint: Exactly one of user_id OR anon_device_token must be non-null

**API Logic:**
- Before inserting, check for existing submission (optional, for better UX)
- Attempt INSERT and catch unique constraint violation
- Return 409 Conflict if duplicate submission detected
- Allow unlimited non-submitted plays (client-side only)

#### Daily Set Publishing
**Validation:**
- Verify set has exactly 5 photos
- Verify all photos exist and are valid
- Mark photos with `first_used_in_daily_date` if null
- Set `is_published = true`
- Log publication event to analytics

**Automated Scheduling:**
- Cron job runs at 00:00 UTC daily
- Queries for daily_set where date_utc = today AND is_published = false
- Automatically publishes if found
- Sends alert if no set found (fallback to backup set or admin notification)

#### Profanity Filtering
**Implementation Options:**
- Use external library (e.g., `bad-words` for Node.js)
- Maintain custom blocklist for football-specific terms
- Apply to nickname validation before accepting
- Case-insensitive matching
- Consider leet-speak variants (optional for MVP)

#### Analytics Event Processing
**Event Types:**
- `start_round`: mode (normal/daily), timestamp
- `guess_submitted`: photo_id, mode, km_error, year_error, score, time_ms
- `round_complete`: mode, total_score, total_time_ms, round_id
- `daily_submission`: submission_id, total_score, leaderboard_rank

**Processing:**
- Accept events asynchronously (202 Accepted)
- Batch insert to database for performance
- No impact on gameplay if analytics fails
- Events used for KPI calculation and admin dashboards

#### Date/Time Validation
**UTC Alignment:**
- All dates stored and compared in UTC
- Server validates submission date_utc matches current UTC date
- Reject submissions for past or future dates
- Daily set resets at 00:00 UTC (not local time)

**Time Measurement:**
- Client measures total_time_ms from first photo display to final submission
- Server validates time is reasonable (> 0 ms, < 24 hours)
- No pause detection in MVP (all time counts)

### 4.3 Error Handling Standards

**HTTP Status Codes:**
- 200 OK: Successful GET/PATCH/PUT
- 201 Created: Successful POST creating new resource
- 202 Accepted: Async operation accepted (analytics)
- 400 Bad Request: Invalid input data, validation failure
- 401 Unauthorized: Missing or invalid authentication
- 403 Forbidden: Valid auth but insufficient permissions
- 404 Not Found: Resource doesn't exist
- 409 Conflict: Duplicate submission, constraint violation
- 413 Payload Too Large: File upload exceeds limit
- 422 Unprocessable Entity: Valid format but business logic violation (e.g., score mismatch)
- 429 Too Many Requests: Rate limit exceeded
- 500 Internal Server Error: Unexpected server error
- 503 Service Unavailable: Service temporarily unavailable

**Error Response Format:**
```json
{
  "error": "Human-readable error message",
  "details": ["Specific validation error 1", "Specific validation error 2"],
  "code": "ERROR_CODE_CONSTANT",
  "timestamp": "2025-10-19T12:30:45Z"
}
```

**Logging:**
- Log all 4xx and 5xx errors with request context
- Log suspicious activity (invalid scores, rate limit violations)
- Do not log sensitive data (device tokens, user IDs in plain text)
- Use structured logging (JSON format)

### 4.4 Performance Optimizations

**Database:**
- Use indexes from db-plan.md (photos eligibility, submissions leaderboard, analytics time-based)
- Connection pooling for database connections
- Prepared statements to prevent SQL injection and improve performance
- Query result caching for leaderboard (5-minute TTL)

**API:**
- Compression (gzip) for responses > 1KB
- Pagination for all list endpoints (default limit: 50, max: 100)
- ETag headers for cacheable resources (credits, leaderboard)
- CDN for photo URLs (Supabase Storage with CDN)
- Lazy loading for analytics events (batch inserts)

**Rate Limiting:**
- In-memory rate limiter (Redis or similar for production)
- Sliding window algorithm
- Return `Retry-After` header with 429 responses
- Different limits per endpoint category (public, user, admin)

---

## 5. Additional API Considerations

### 5.1 Versioning
- API version included in base path: `/api/v1/...`
- Current version: v1 (MVP)
- Breaking changes require new version
- Maintain backward compatibility within version

### 5.2 Health and Monitoring
**Endpoint:** GET `/api/health`
```json
{
  "status": "healthy",
  "timestamp": "2025-10-19T12:30:45Z",
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "storage": "healthy"
  }
}
```

### 5.3 Development Support
**Endpoint:** GET `/api/docs`
- Redirect to API documentation (Swagger/OpenAPI)
- Interactive API explorer for development

### 5.4 Data Retention
- Daily submissions: Configurable retention (30-90 days)
- Analytics events: Configurable retention (90 days)
- Photos and daily sets: Retained indefinitely
- Implement scheduled job for cleanup

---

## 6. Summary

This REST API plan provides comprehensive coverage of the FootyGuess Daily application requirements:

- **8 main resource categories** with full CRUD operations
- **30+ endpoints** covering gameplay, leaderboard, user management, analytics, and admin operations
- **Server-side validation** matching database schema constraints
- **Security measures** including rate limiting, profanity filtering, and score verification
- **Performance optimizations** via caching, pagination, and indexes
- **Flexible authentication** supporting both anonymous and registered users
- **Admin capabilities** for content management and analytics

The API design prioritizes:
1. **Simplicity** for MVP delivery within 2-week timeline
2. **Security** through validation and rate limiting
3. **Fair gameplay** via first-attempt enforcement and server-side scoring
4. **Privacy** through minimal data collection
5. **Scalability** through pagination and performance optimizations
6. **Maintainability** through clear resource naming and RESTful conventions
