# FootyGuess Daily - PostgreSQL Database Schema

## 1. Tables with Columns, Data Types, and Constraints

### photos

Stores all game photos with complete metadata and daily eligibility tracking.

| Column                   | Data Type                | Constraints                                     | Description                             |
| ------------------------ | ------------------------ | ----------------------------------------------- | --------------------------------------- |
| id                       | UUID                     | PRIMARY KEY DEFAULT gen_random_uuid()           | Unique identifier                       |
| photo_url                | TEXT                     | NOT NULL                                        | URL to game photo in Supabase Storage   |
| thumbnail_url            | TEXT                     | NULL                                            | URL to thumbnail version                |
| original_url             | TEXT                     | NULL                                            | URL to original high-res version        |
| event_name               | VARCHAR(255)             | NOT NULL                                        | Name of the football event              |
| competition              | VARCHAR(255)             | NULL                                            | Competition/tournament name             |
| year_utc                 | INTEGER                  | NOT NULL CHECK (year_utc BETWEEN 1880 AND 2025) | Year the event occurred                 |
| place                    | VARCHAR(255)             | NULL                                            | City/region/country of event            |
| lat                      | DECIMAL(9,6)             | NOT NULL CHECK (lat BETWEEN -90 AND 90)         | Latitude coordinate                     |
| lon                      | DECIMAL(9,6)             | NOT NULL CHECK (lon BETWEEN -180 AND 180)       | Longitude coordinate                    |
| description              | TEXT                     | NULL                                            | Event description (revealed post-game)  |
| source_url               | TEXT                     | NULL                                            | Source URL for the photo                |
| license                  | VARCHAR(100)             | NOT NULL                                        | License type (e.g., CC-BY-SA)           |
| credit                   | VARCHAR(255)             | NOT NULL                                        | Photo credit/attribution                |
| is_daily_eligible        | BOOLEAN                  | NOT NULL DEFAULT true                           | Whether photo can be used in daily sets |
| first_used_in_daily_date | DATE                     | NULL                                            | First date photo was used in daily mode |
| tags                     | TEXT[]                   | NULL                                            | Array of tags for categorization        |
| notes                    | TEXT                     | NULL                                            | Internal notes for curators             |
| created_at               | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW()                          | Record creation timestamp               |
| updated_at               | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW()                          | Record update timestamp                 |

### daily_sets

Pre-generated daily photo collections with publication status.

| Column       | Data Type                | Constraints                           | Description                         |
| ------------ | ------------------------ | ------------------------------------- | ----------------------------------- |
| id           | UUID                     | PRIMARY KEY DEFAULT gen_random_uuid() | Unique identifier                   |
| date_utc     | DATE                     | NOT NULL UNIQUE                       | UTC date for this daily set         |
| is_published | BOOLEAN                  | NOT NULL DEFAULT false                | Whether set is published and active |
| created_at   | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW()                | Set creation timestamp              |
| updated_at   | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW()                | Set update timestamp                |

### daily_set_photos

Junction table linking daily sets to photos with deterministic ordering.

| Column       | Data Type                | Constraints                                          | Description                 |
| ------------ | ------------------------ | ---------------------------------------------------- | --------------------------- |
| daily_set_id | UUID                     | NOT NULL REFERENCES daily_sets(id) ON DELETE CASCADE | Reference to daily set      |
| photo_id     | UUID                     | NOT NULL REFERENCES photos(id) ON DELETE RESTRICT    | Reference to photo          |
| position     | INTEGER                  | NOT NULL CHECK (position BETWEEN 1 AND 5)            | Photo position in set (1-5) |
| created_at   | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW()                               | Record creation timestamp   |

**Composite Constraints:**

- PRIMARY KEY (daily_set_id, photo_id)
- UNIQUE (daily_set_id, position)

### users

Managed by Supabase Auth. References auth.users table for registered users.

| Column           | Data Type                | Constraints                                                                       | Description                           |
| ---------------- | ------------------------ | --------------------------------------------------------------------------------- | ------------------------------------- |
| id               | UUID                     | PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE                           | User ID from Supabase Auth            |
| nickname         | VARCHAR(20)              | NULL CHECK (LENGTH(nickname) BETWEEN 3 AND 20 AND nickname ~ '^[a-zA-Z0-9 _-]+$') | User's display nickname               |
| consent_given_at | TIMESTAMP WITH TIME ZONE | NULL                                                                              | When user consented to public display |
| created_at       | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW()                                                            | Record creation timestamp             |
| updated_at       | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW()                                                            | Last update timestamp                 |

### device_nicknames

Manages nicknames and consent for anonymous devices (non-registered users).

| Column            | Data Type                | Constraints                                                                           | Description                           |
| ----------------- | ------------------------ | ------------------------------------------------------------------------------------- | ------------------------------------- |
| anon_device_token | VARCHAR(255)             | PRIMARY KEY                                                                           | Anonymous device identifier           |
| nickname          | VARCHAR(20)              | NOT NULL CHECK (LENGTH(nickname) BETWEEN 3 AND 20 AND nickname ~ '^[a-zA-Z0-9 _-]+$') | User's display nickname               |
| consent_given_at  | TIMESTAMP WITH TIME ZONE | NULL                                                                                  | When user consented to public display |
| updated_at        | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW()                                                                | Last nickname update                  |
| created_at        | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW()                                                                | Record creation timestamp             |

### daily_submissions

Stores first-attempt daily submissions. Can be linked to either registered users OR anonymous devices.

| Column               | Data Type                | Constraints                                           | Description                            |
| -------------------- | ------------------------ | ----------------------------------------------------- | -------------------------------------- |
| id                   | UUID                     | PRIMARY KEY DEFAULT gen_random_uuid()                 | Unique identifier                      |
| date_utc             | DATE                     | NOT NULL                                              | UTC date of submission                 |
| user_id              | UUID                     | NULL REFERENCES users(id) ON DELETE CASCADE           | Registered user ID (if authenticated)  |
| anon_device_token    | VARCHAR(255)             | NULL                                                  | Device identifier for anonymous users  |
| nickname             | VARCHAR(20)              | NOT NULL                                              | Nickname at time of submission         |
| total_score          | INTEGER                  | NOT NULL CHECK (total_score BETWEEN 0 AND 100000)     | Total score (max 20k per photo × 5)    |
| total_time_ms        | BIGINT                   | NOT NULL CHECK (total_time_ms > 0)                    | Total completion time in milliseconds  |
| daily_set_id         | UUID                     | NOT NULL REFERENCES daily_sets(id) ON DELETE RESTRICT | Reference to daily set played          |
| submission_timestamp | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW()                                | Exact submission time for tie-breaking |
| created_at           | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW()                                | Record creation timestamp              |

**Composite Constraints:**

- UNIQUE (date_utc, user_id) WHERE user_id IS NOT NULL -- Enforces first-attempt rule for registered users
- UNIQUE (date_utc, anon_device_token) WHERE anon_device_token IS NOT NULL -- Enforces first-attempt rule for anonymous users
- CHECK ((user_id IS NOT NULL AND anon_device_token IS NULL) OR (user_id IS NULL AND anon_device_token IS NOT NULL)) -- Ensures exactly one identifier type

### analytics_events

Flexible event tracking for product analytics.

| Column            | Data Type                | Constraints            | Description                                      |
| ----------------- | ------------------------ | ---------------------- | ------------------------------------------------ |
| id                | BIGSERIAL                | PRIMARY KEY            | Auto-incrementing identifier                     |
| event_type        | VARCHAR(50)              | NOT NULL               | Event type (start_round, guess_submitted, etc.)  |
| event_data        | JSONB                    | NULL                   | Flexible JSON data for event-specific attributes |
| anon_device_token | VARCHAR(255)             | NULL                   | Device identifier for correlation                |
| created_at        | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Event timestamp                                  |

---

## 2. Relationships Between Tables

### One-to-Many Relationships

1. **daily_sets → daily_set_photos**
   - One daily set contains multiple photos (exactly 5)
   - Cascade delete: removing a daily set removes its photo associations

2. **photos → daily_set_photos**
   - One photo can appear in multiple daily sets
   - Restrict delete: cannot delete a photo that's in a published daily set

3. **daily_sets → daily_submissions**
   - One daily set can have multiple submissions from different devices/users
   - Restrict delete: cannot delete a daily set with existing submissions

4. **users → daily_submissions**
   - One user can have multiple daily submissions (one per day)
   - Cascade delete: removing a user removes their submissions

### Many-to-Many Relationships

1. **photos ←→ daily_sets** (via daily_set_photos)
   - Photos can appear in multiple daily sets over time
   - Each daily set contains exactly 5 photos in specific positions
   - Junction table enforces ordering via `position` field

### Conditional Foreign Key References

1. **daily_submissions.user_id**
   - Foreign key to users(id) when user is authenticated
   - NULL for anonymous submissions
   - Mutually exclusive with anon_device_token via CHECK constraint

2. **daily_submissions.anon_device_token**
   - Stored as VARCHAR, not a foreign key to device_nicknames
   - NULL for authenticated user submissions
   - Allows submissions to exist even if nickname changes
   - Mutually exclusive with user_id via CHECK constraint

3. **analytics_events.anon_device_token**
   - Optional field for event correlation
   - Not enforced as foreign key for flexibility

---

## 3. Indexes

### Primary Indexes (Automatic)

- All PRIMARY KEY constraints automatically create unique B-tree indexes
- All UNIQUE constraints automatically create unique B-tree indexes

### Performance Indexes

```sql
-- Efficient queries for available daily photos
CREATE INDEX idx_photos_daily_eligible
ON photos (is_daily_eligible)
WHERE is_daily_eligible = true;

-- Leaderboard queries (date, score desc, timestamp asc for tie-breaking)
CREATE INDEX idx_daily_submissions_leaderboard
ON daily_submissions (date_utc, total_score DESC, submission_timestamp ASC);

-- Analytics queries by event type and time range
CREATE INDEX idx_analytics_events_type_time
ON analytics_events (event_type, created_at DESC);

-- Lookup submissions by device token
CREATE INDEX idx_daily_submissions_device
ON daily_submissions (anon_device_token);

-- Lookup submissions by user ID
CREATE INDEX idx_daily_submissions_user
ON daily_submissions (user_id);

-- Lookup daily sets by date
CREATE INDEX idx_daily_sets_date
ON daily_sets (date_utc);

-- Optional: GIN index for tag searches (if tag filtering becomes common)
-- CREATE INDEX idx_photos_tags ON photos USING GIN (tags);
```

---

## 4. PostgreSQL Row-Level Security Policies

### Enable RLS on Sensitive Tables

```sql
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_nicknames ENABLE ROW LEVEL SECURITY;
```

### Photos Table Policies

**Goal:** Protect answer fields (lat, lon, year_utc, event_name, description) during gameplay; reveal after completion.

```sql
-- Policy: Anonymous users can view photo metadata (URLs only) for gameplay
CREATE POLICY "Public read access to photo metadata"
ON photos FOR SELECT
USING (true);

-- Note: Application layer will use photos_metadata view (below) to restrict columns
-- RLS allows SELECT, but views control which columns are exposed
```

### Photos Views for Column-Level Security

```sql
-- View: photos_metadata (for active gameplay - no answers)
CREATE VIEW photos_metadata AS
SELECT
  id,
  photo_url,
  thumbnail_url,
  competition,
  place,
  tags
FROM photos;

GRANT SELECT ON photos_metadata TO anon, authenticated;

-- View: photos_with_answers (for post-submission reveal)
-- Only shows answers if user has a submission for the daily set containing this photo
CREATE VIEW photos_with_answers AS
SELECT
  p.id,
  p.photo_url,
  p.thumbnail_url,
  p.event_name,
  p.competition,
  p.year_utc,
  p.place,
  p.lat,
  p.lon,
  p.description,
  p.source_url,
  p.credit,
  p.license,
  p.tags
FROM photos p;

-- Access control: Application enforces that this view is only called after submission
GRANT SELECT ON photos_with_answers TO authenticated;
```

### Daily Submissions Policies

```sql
-- Policy: Users can view all submissions for leaderboard
CREATE POLICY "Public read access to leaderboard"
ON daily_submissions FOR SELECT
USING (true);

-- Policy: Users can insert their own submission (first attempt only)
CREATE POLICY "Users can insert own submission"
ON daily_submissions FOR INSERT
WITH CHECK (true);
-- Note: UNIQUE constraint enforces one submission per device per day
-- Application logic validates anon_device_token matches requester
```

### Users Table Policies

```sql
-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile"
ON users FOR SELECT
USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id);

-- Policy: New users can be created (handled by Supabase Auth trigger)
CREATE POLICY "Enable insert for authenticated users"
ON users FOR INSERT
WITH CHECK (auth.uid() = id);
```

### Device Nicknames Policies

```sql
-- Policy: Users can read their own nickname
CREATE POLICY "Users can read own nickname"
ON device_nicknames FOR SELECT
USING (true);
-- Note: Application validates anon_device_token matches requester

-- Policy: Users can insert their own nickname
CREATE POLICY "Users can insert own nickname"
ON device_nicknames FOR INSERT
WITH CHECK (true);

-- Policy: Users can update their own nickname
CREATE POLICY "Users can update own nickname"
ON device_nicknames FOR UPDATE
USING (true);
```

### Analytics Events Policies

```sql
-- No RLS needed for MVP; access controlled at application layer
-- Future: May add policies to restrict access to admin roles only
```

---

## 5. Design Notes and Explanations

### Photo Storage Strategy

- **Binary separation:** Photo files stored in Supabase Storage buckets, metadata in database
- **Multi-resolution support:** Separate URLs for thumbnail, game, and original versions
- **CDN-ready:** URLs point to storage with potential CDN layer for performance

### Daily Set Management

- **Pre-scheduling:** Sets created ahead of time with `is_published` flag for controlled release
- **Photo uniqueness:** `is_daily_eligible` flag + `first_used_in_daily_date` track usage
- **Fallback support:** Unpublishing a set or removing a photo doesn't break referential integrity (RESTRICT prevents deletion of in-use photos)

### First-Attempt Enforcement

- **Database-level constraints:**
  - Partial UNIQUE index on (date_utc, user_id) WHERE user_id IS NOT NULL for registered users
  - Partial UNIQUE index on (date_utc, anon_device_token) WHERE anon_device_token IS NOT NULL for anonymous users
  - CHECK constraint ensures exactly one identifier type per submission
- **Transaction wrapping:** Application uses transactions with graceful error handling for violations
- **Nickname snapshot:** Stores nickname at submission time, immune to later nickname changes

### Tie-Breaking Logic

- **Composite index:** Optimized for `ORDER BY date_utc, total_score DESC, submission_timestamp ASC`
- **Timestamp precision:** TIMESTAMP WITH TIME ZONE ensures accurate tie-breaking across timezones
- **Application-level secondary tie-breaker:** Best single-photo score requires per-photo scores (future enhancement if needed)

### Privacy & Data Minimization

- **Anonymous tokens:** VARCHAR device identifiers for non-registered users, no PII collection
- **User authentication:** Supabase Auth handles registered users with optional result saving
- **Minimal storage:** Only total score and time stored, not per-photo details (MVP scope)
- **Consent tracking:** `consent_given_at` in both users and device_nicknames for GDPR-style transparency
- **View-based access control:** Separates public metadata from protected answers
- **User control:** Registered users can delete their account and all associated data via CASCADE

### Scalability Considerations

- **Partial indexes:** `is_daily_eligible` partial index reduces index size and improves query performance
- **JSONB flexibility:** Analytics events can evolve schema without migrations
- **Partitioning path:** analytics_events can be partitioned by created_at if volume grows (future)
- **No per-photo scores:** Reduces write volume and storage for MVP; can be added later if needed

### Data Integrity

- **CHECK constraints:** Validate year range, coordinate bounds, position values, nickname format
- **NOT NULL constraints:** Enforce required fields (license, credit, coordinates)
- **Referential integrity:** Foreign keys with appropriate ON DELETE actions (CASCADE for junction tables, RESTRICT for business data)
- **Application-layer validation:** Zod schemas validate before database operations

### Normalization Level

- **3NF compliance:** No transitive dependencies; nickname stored in separate tables (users, device_nicknames)
- **Denormalization decision:** Nickname copied to daily_submissions for historical accuracy (user can change nickname after submission)
- **Dual identity support:** Either user_id OR anon_device_token per submission, never both (enforced by CHECK constraint)

### Future Enhancements (Out of MVP Scope)

- Per-photo scores storage for advanced analytics and tie-breaking
- Social features (friend leaderboards, sharing)
- Photo content versioning (URL updates without breaking references)
- Advanced anti-cheat measures (rate limiting at database level)
- Partitioning for analytics_events as volume grows
- Materialized views for complex leaderboard queries
- Full-text search on event_name and description
- Photo recommendation engine based on tags and player performance
- Migration path for anonymous users to convert to registered accounts

### Migration Strategy

- Use Supabase migrations or a tool like `node-pg-migrate`
- Create tables in dependency order: photos → daily_sets → daily_set_photos → users → device_nicknames → daily_submissions → analytics_events
- Set up Supabase Auth trigger to auto-create user records in users table
- Enable RLS after table creation
- Create views after base tables
- Create performance indexes after initial data load (if seeding large datasets)
- Configure partial UNIQUE indexes for conditional first-attempt enforcement

### Backup and Retention

- Daily submissions retained for 30-90 days (configurable)
- Analytics events may have different retention policy (consider partitioning + automated archival)
- Photos and daily_sets retained indefinitely
- Device nicknames retained until user requests deletion (GDPR right to be forgotten)
- User accounts managed by Supabase Auth; deletion cascades to submissions and user profile data

### Supabase Auth Integration

- **auth.users table:** Managed by Supabase Auth, contains authentication data
- **users table:** Application-specific profile data linked to auth.users via foreign key
- **Auto-creation trigger:** Database function creates users record when new auth user is created
- **Email verification:** Handled by Supabase Auth
- **Password reset:** Handled by Supabase Auth
- **Session management:** Handled by Supabase client libraries
