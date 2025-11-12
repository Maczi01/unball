-- =====================================================================
-- Migration: Add photo_sources and photo_more_info tables
-- Created: 2025-11-03
-- Description: Refactors photos.source_url into a separate photo_sources
--              table for multiple sources, and adds photo_more_info table
--              for additional content like YouTube videos.
--
-- Affected tables:
--   - photos: Remove source_url field (migrated to photo_sources)
--   - photo_sources: New table for multiple sources per photo
--   - photo_more_info: New table for additional info (videos, articles, etc.)
--
-- Special considerations:
--   - Migrates existing source_url data to photo_sources table
--   - Maintains referential integrity with CASCADE deletes
--   - Includes RLS policies for public read access
-- =====================================================================

-- =====================================================================
-- TABLE: photo_sources
-- Purpose: Stores multiple source URLs for each photo
-- =====================================================================

create table photo_sources (
  id uuid primary key default gen_random_uuid(),

  -- Reference to parent photo
  photo_id uuid not null references photos(id) on delete cascade,

  -- Source information
  url text not null,
  title text null,
  source_type text null,

  -- Ordering within photo's sources
  position integer not null default 1 check (position > 0),

  -- Timestamps
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Enable RLS on photo_sources table
alter table photo_sources enable row level security;

-- Index: Efficient queries for sources by photo
create index idx_photo_sources_photo_id
on photo_sources (photo_id);

-- Index: Ordering sources by position
create index idx_photo_sources_position
on photo_sources (photo_id, position);

-- =====================================================================
-- TABLE: photo_more_info
-- Purpose: Stores additional information items for photos (e.g., YouTube
--          videos, articles, interviews)
-- =====================================================================

create table photo_more_info (
  id uuid primary key default gen_random_uuid(),

  -- Reference to parent photo
  photo_id uuid not null references photos(id) on delete cascade,

  -- Information details
  info_type text not null check (info_type in ('youtube', 'video', 'article', 'interview', 'documentary', 'other')),
  url text not null,
  title text null,
  description text null,

  -- Ordering within photo's info items
  position integer not null default 1 check (position > 0),

  -- Timestamps
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Enable RLS on photo_more_info table
alter table photo_more_info enable row level security;

-- Index: Efficient queries for info by photo
create index idx_photo_more_info_photo_id
on photo_more_info (photo_id);

-- Index: Ordering info items by position
create index idx_photo_more_info_position
on photo_more_info (photo_id, position);

-- Index: Filter by info type
create index idx_photo_more_info_type
on photo_more_info (info_type);

-- =====================================================================
-- DATA MIGRATION
-- Migrate existing source_url values to photo_sources table
-- =====================================================================

-- Insert existing source URLs as first source for each photo
insert into photo_sources (photo_id, url, position)
select id, source_url, 1
from photos
where source_url is not null;

-- =====================================================================
-- UPDATE VIEWS
-- Drop views that depend on source_url before dropping the column
-- =====================================================================

-- Drop the existing view (will be recreated later without source_url)
drop view if exists photos_with_answers;

-- =====================================================================
-- SCHEMA CHANGES
-- Remove source_url column from photos table
-- =====================================================================

-- Drop the old source_url column (data already migrated)
alter table photos drop column source_url;

-- =====================================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================================

-- ---------------------------------------------------------------------
-- PHOTO_SOURCES TABLE POLICIES
-- ---------------------------------------------------------------------

-- Policy: Anonymous users can view all photo sources
create policy "public_read_access_to_photo_sources"
on photo_sources for select
to anon, authenticated
using (true);

-- ---------------------------------------------------------------------
-- PHOTO_MORE_INFO TABLE POLICIES
-- ---------------------------------------------------------------------

-- Policy: Anonymous users can view all photo additional info
-- Note: More info is public educational content
create policy "public_read_access_to_photo_more_info"
on photo_more_info for select
to anon, authenticated
using (true);

-- =====================================================================
-- TRIGGERS
-- =====================================================================

-- Apply updated_at trigger to photo_sources table
create trigger update_photo_sources_updated_at
before update on photo_sources
for each row
execute function update_updated_at_column();

-- Apply updated_at trigger to photo_more_info table
create trigger update_photo_more_info_updated_at
before update on photo_more_info
for each row
execute function update_updated_at_column();

-- =====================================================================
-- RECREATE VIEWS
-- Recreate photos_with_answers view without source_url
-- =====================================================================

-- Recreate the view without source_url (now in photo_sources table)
create view photos_with_answers as
select
  id,
  photo_url,
  thumbnail_url,
--   event_name,
--   competition,
--   year_utc,
  place,
  lat,
  lon,
  description,
  credit,
  license,
  tags
from photos;

-- Ensure permissions are maintained
grant select on photos_with_answers to authenticated;

-- =====================================================================
-- END OF MIGRATION
-- =====================================================================
