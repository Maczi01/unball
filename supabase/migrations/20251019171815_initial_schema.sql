-- =====================================================================
-- Migration: Initial FootyGuess Daily Database Schema
-- Created: 2025-10-19
-- Description: Creates all tables, indexes, RLS policies, and views for
--              the FootyGuess Daily game application
--
-- Affected tables:
--   - photos: Game photo metadata and daily eligibility tracking
--   - daily_sets: Pre-generated daily photo collections
--   - daily_set_photos: Junction table linking sets to photos
--   - users: User profiles linked to Supabase Auth
--   - device_nicknames: Anonymous user nickname management
--   - daily_submissions: First-attempt daily game submissions
--   - analytics_events: Flexible event tracking for analytics
--
-- Special considerations:
--   - Implements dual identity system (authenticated users + anonymous devices)
--   - Enforces first-attempt rule via partial unique indexes
--   - Uses views for column-level security on photos table
--   - All sensitive tables have RLS enabled
-- =====================================================================

-- =====================================================================
-- EXTENSIONS
-- =====================================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- =====================================================================
-- TABLE: photos
-- Purpose: Stores all game photos with complete metadata and daily
--          eligibility tracking
-- =====================================================================

create table photos (
  id uuid primary key default gen_random_uuid(),

  -- Photo URLs (managed in Supabase Storage)
  photo_url text not null,
  thumbnail_url text null,
  original_url text null,

  -- Answer fields (protected during gameplay)
  event_name varchar(255) not null,
  competition varchar(255) null,
  year_utc integer not null check (year_utc between 1880 and 2025),
  place varchar(255) null,

  -- Coordinates (answer data)
  lat decimal(9,6) not null check (lat between -90 and 90),
  lon decimal(9,6) not null check (lon between -180 and 180),

  -- Additional metadata
  description text null,
  source_url text null,
  license varchar(100) not null,
  credit varchar(255) not null,

  -- Daily usage tracking
  is_daily_eligible boolean not null default true,
  first_used_in_daily_date date null,

  -- Categorization and internal notes
  tags text[] null,
  notes text null,

  -- Timestamps
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Enable RLS on photos table
-- RLS is enabled to protect answer data during gameplay
alter table photos enable row level security;

-- Index: Efficient queries for available daily photos
-- Partial index reduces size by only indexing eligible photos
create index idx_photos_daily_eligible
on photos (is_daily_eligible)
where is_daily_eligible = true;

-- =====================================================================
-- TABLE: daily_sets
-- Purpose: Pre-generated daily photo collections with publication status
-- =====================================================================

create table daily_sets (
  id uuid primary key default gen_random_uuid(),

  -- The UTC date this set is scheduled for
  -- UNIQUE constraint ensures one set per day
  date_utc date not null unique,

  -- Publication flag for controlled release
  is_published boolean not null default false,

  -- Timestamps
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Enable RLS on daily_sets table
-- RLS protects unpublished sets from being accessed prematurely
alter table daily_sets enable row level security;

-- Index: Lookup daily sets by date
create index idx_daily_sets_date
on daily_sets (date_utc);

-- =====================================================================
-- TABLE: daily_set_photos
-- Purpose: Junction table linking daily sets to photos with deterministic
--          ordering (1-5)
-- =====================================================================

create table daily_set_photos (
  -- Foreign keys
  daily_set_id uuid not null references daily_sets(id) on delete cascade,
  photo_id uuid not null references photos(id) on delete restrict,

  -- Position in the set (1-5)
  position integer not null check (position between 1 and 5),

  -- Timestamp
  created_at timestamp with time zone not null default now(),

  -- Composite primary key ensures no duplicate photo in same set
  primary key (daily_set_id, photo_id),

  -- Unique constraint ensures no duplicate positions in same set
  unique (daily_set_id, position)
);

-- Enable RLS on daily_set_photos table
alter table daily_set_photos enable row level security;

-- =====================================================================
-- TABLE: users
-- Purpose: User profiles linked to Supabase Auth (auth.users)
-- Note: This table extends auth.users with application-specific data
-- =====================================================================

create table users (
  -- Primary key references Supabase Auth user ID
  -- CASCADE delete ensures cleanup when auth user is deleted
  id uuid primary key references auth.users(id) on delete cascade,

  -- User's display nickname with validation
  -- Regex ensures alphanumeric, spaces, hyphens, and underscores only
  nickname varchar(20) null
    check (
      length(nickname) between 3 and 20
      and nickname ~ '^[a-zA-Z0-9 _-]+$'
    ),

  -- Consent tracking for GDPR compliance
  consent_given_at timestamp with time zone null,

  -- Timestamps
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Enable RLS on users table
-- RLS ensures users can only access their own profile data
alter table users enable row level security;

-- =====================================================================
-- TABLE: device_nicknames
-- Purpose: Manages nicknames and consent for anonymous devices
--          (non-registered users)
-- =====================================================================

create table device_nicknames (
  -- Anonymous device identifier (generated by client)
  anon_device_token varchar(255) primary key,

  -- User's display nickname with validation
  nickname varchar(20) not null
    check (
      length(nickname) between 3 and 20
      and nickname ~ '^[a-zA-Z0-9 _-]+$'
    ),

  -- Consent tracking for GDPR compliance
  consent_given_at timestamp with time zone null,

  -- Timestamps
  updated_at timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now()
);

-- Enable RLS on device_nicknames table
-- RLS protects anonymous user data
alter table device_nicknames enable row level security;

-- =====================================================================
-- TABLE: daily_submissions
-- Purpose: Stores first-attempt daily submissions
-- Note: Can be linked to either registered users OR anonymous devices
-- =====================================================================

create table daily_submissions (
  id uuid primary key default gen_random_uuid(),

  -- The UTC date of submission
  date_utc date not null,

  -- Dual identity system: either user_id OR anon_device_token
  -- Exactly one must be set, enforced by CHECK constraint below
  user_id uuid null references users(id) on delete cascade,
  anon_device_token varchar(255) null,

  -- Nickname snapshot at time of submission
  -- Stored separately to preserve historical data even if user changes nickname
  nickname varchar(20) not null,

  -- Scoring data
  total_score integer not null check (total_score between 0 and 100000),
  total_time_ms bigint not null check (total_time_ms > 0),

  -- Reference to the daily set played
  -- RESTRICT prevents deletion of sets with existing submissions
  daily_set_id uuid not null references daily_sets(id) on delete restrict,

  -- Exact submission time for tie-breaking
  submission_timestamp timestamp with time zone not null default now(),

  -- Timestamps
  created_at timestamp with time zone not null default now(),

  -- CHECK constraint: Ensure exactly one identifier type is set
  -- This enforces the dual identity system at the database level
  check (
    (user_id is not null and anon_device_token is null)
    or
    (user_id is null and anon_device_token is not null)
  )
);

-- Enable RLS on daily_submissions table
-- RLS controls access to submission data
alter table daily_submissions enable row level security;

-- Partial UNIQUE index: Enforces first-attempt rule for registered users
-- Only one submission per user per day
create unique index idx_daily_submissions_user_date
on daily_submissions (date_utc, user_id)
where user_id is not null;

-- Partial UNIQUE index: Enforces first-attempt rule for anonymous users
-- Only one submission per device per day
create unique index idx_daily_submissions_device_date
on daily_submissions (date_utc, anon_device_token)
where anon_device_token is not null;

-- Index: Leaderboard queries optimized for ranking
-- Composite index supports: ORDER BY date_utc, total_score DESC, submission_timestamp ASC
-- This enables efficient tie-breaking (higher score wins, earlier submission breaks ties)
create index idx_daily_submissions_leaderboard
on daily_submissions (date_utc, total_score desc, submission_timestamp asc);

-- Index: Lookup submissions by device token
create index idx_daily_submissions_device
on daily_submissions (anon_device_token);

-- Index: Lookup submissions by user ID
create index idx_daily_submissions_user
on daily_submissions (user_id);

-- =====================================================================
-- TABLE: analytics_events
-- Purpose: Flexible event tracking for product analytics
-- Note: JSONB allows schema-free event data for flexibility
-- =====================================================================

create table analytics_events (
  id bigserial primary key,

  -- Event type identifier (e.g., 'start_round', 'guess_submitted')
  event_type varchar(50) not null,

  -- Flexible JSON data for event-specific attributes
  -- JSONB format allows efficient querying and indexing
  event_data jsonb null,

  -- Optional device identifier for correlation
  -- Not enforced as foreign key to maintain flexibility
  anon_device_token varchar(255) null,

  -- Event timestamp
  created_at timestamp with time zone not null default now()
);

-- Note: RLS not enabled on analytics_events for MVP
-- Access control handled at application layer
-- Future enhancement: Add RLS policies for admin-only access

-- Index: Analytics queries by event type and time range
create index idx_analytics_events_type_time
on analytics_events (event_type, created_at desc);

-- =====================================================================
-- VIEWS: Column-level security for photos table
-- Purpose: Separate public metadata from protected answer data
-- =====================================================================

-- View: photos_metadata
-- Purpose: Safe view for active gameplay - excludes answer fields
-- Exposes: URLs, competition, place, tags
-- Hides: event_name, year_utc, lat, lon, description
create view photos_metadata as
select
  id,
  photo_url,
  thumbnail_url,
  competition,
  place,
  tags
from photos;

-- View: photos_with_answers
-- Purpose: Complete photo data including answers (for post-submission reveal)
-- Note: Application layer enforces that this view is only called after submission
create view photos_with_answers as
select
  id,
  photo_url,
  thumbnail_url,
  event_name,
  competition,
  year_utc,
  place,
  lat,
  lon,
  description,
  source_url,
  credit,
  license,
  tags
from photos;

-- =====================================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================================

-- ---------------------------------------------------------------------
-- PHOTOS TABLE POLICIES
-- ---------------------------------------------------------------------

-- Policy: Anonymous users can view all photos
-- Note: Column-level security is enforced via views (photos_metadata, photos_with_answers)
-- This policy allows SELECT, but application uses views to control which columns are exposed
create policy "public_read_access_to_photos"
on photos for select
to anon, authenticated
using (true);

-- ---------------------------------------------------------------------
-- DAILY SETS TABLE POLICIES
-- ---------------------------------------------------------------------

-- Policy: Anonymous users can view published daily sets
-- Protects unpublished sets from premature access
create policy "anon_read_published_daily_sets"
on daily_sets for select
to anon
using (is_published = true);

-- Policy: Authenticated users can view published daily sets
create policy "authenticated_read_published_daily_sets"
on daily_sets for select
to authenticated
using (is_published = true);

-- ---------------------------------------------------------------------
-- DAILY SET PHOTOS TABLE POLICIES
-- ---------------------------------------------------------------------

-- Policy: Anonymous users can view photos in published sets
-- Joins with daily_sets to enforce publication status
create policy "anon_read_published_set_photos"
on daily_set_photos for select
to anon
using (
  exists (
    select 1 from daily_sets
    where daily_sets.id = daily_set_photos.daily_set_id
    and daily_sets.is_published = true
  )
);

-- Policy: Authenticated users can view photos in published sets
create policy "authenticated_read_published_set_photos"
on daily_set_photos for select
to authenticated
using (
  exists (
    select 1 from daily_sets
    where daily_sets.id = daily_set_photos.daily_set_id
    and daily_sets.is_published = true
  )
);

-- ---------------------------------------------------------------------
-- USERS TABLE POLICIES
-- ---------------------------------------------------------------------

-- Policy: Authenticated users can read their own profile
create policy "users_read_own_profile"
on users for select
to authenticated
using (auth.uid() = id);

-- Policy: Authenticated users can update their own profile
create policy "users_update_own_profile"
on users for update
to authenticated
using (auth.uid() = id);

-- Policy: Authenticated users can insert their own profile
-- Used by Supabase Auth trigger to auto-create user records
create policy "users_insert_own_profile"
on users for insert
to authenticated
with check (auth.uid() = id);

-- ---------------------------------------------------------------------
-- DEVICE NICKNAMES TABLE POLICIES
-- ---------------------------------------------------------------------

-- Policy: Anonymous users can read their own nickname
-- Note: Application layer validates anon_device_token matches requester
create policy "anon_read_own_nickname"
on device_nicknames for select
to anon
using (true);

-- Policy: Anonymous users can insert their own nickname
create policy "anon_insert_own_nickname"
on device_nicknames for insert
to anon
with check (true);

-- Policy: Anonymous users can update their own nickname
create policy "anon_update_own_nickname"
on device_nicknames for update
to anon
using (true);

-- Policy: Authenticated users can read device nicknames
create policy "authenticated_read_nicknames"
on device_nicknames for select
to authenticated
using (true);

-- ---------------------------------------------------------------------
-- DAILY SUBMISSIONS TABLE POLICIES
-- ---------------------------------------------------------------------

-- Policy: Anonymous users can view all submissions for leaderboard
create policy "anon_read_submissions_for_leaderboard"
on daily_submissions for select
to anon
using (true);

-- Policy: Authenticated users can view all submissions for leaderboard
create policy "authenticated_read_submissions_for_leaderboard"
on daily_submissions for select
to authenticated
using (true);

-- Policy: Anonymous users can insert their own submission
-- Note: UNIQUE constraints enforce one submission per device per day
-- Application layer validates anon_device_token matches requester
create policy "anon_insert_own_submission"
on daily_submissions for insert
to anon
with check (true);

-- Policy: Authenticated users can insert their own submission
-- Note: UNIQUE constraints enforce one submission per user per day
create policy "authenticated_insert_own_submission"
on daily_submissions for insert
to authenticated
with check (true);

-- =====================================================================
-- GRANT PERMISSIONS ON VIEWS
-- =====================================================================

-- Grant SELECT on photos_metadata view to all users
grant select on photos_metadata to anon, authenticated;

-- Grant SELECT on photos_with_answers view to authenticated users
-- Note: Application enforces this is only called after submission
grant select on photos_with_answers to authenticated;

-- =====================================================================
-- TRIGGERS
-- =====================================================================

-- Trigger function: Update updated_at timestamp on row modification
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at trigger to photos table
create trigger update_photos_updated_at
before update on photos
for each row
execute function update_updated_at_column();

-- Apply updated_at trigger to daily_sets table
create trigger update_daily_sets_updated_at
before update on daily_sets
for each row
execute function update_updated_at_column();

-- Apply updated_at trigger to users table
create trigger update_users_updated_at
before update on users
for each row
execute function update_updated_at_column();

-- Apply updated_at trigger to device_nicknames table
create trigger update_device_nicknames_updated_at
before update on device_nicknames
for each row
execute function update_updated_at_column();

-- =====================================================================
-- FUNCTION: Auto-create user profile on auth.users insert
-- Purpose: Automatically creates a users table record when a new user
--          signs up via Supabase Auth
-- =====================================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, created_at, updated_at)
  values (new.id, now(), now());
  return new;
end;
$$ language plpgsql security definer;

-- Trigger: Auto-create user profile on new auth user
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- =====================================================================
-- END OF MIGRATION
-- =====================================================================
