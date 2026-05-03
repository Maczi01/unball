-- =====================================================================
-- MIGRATION: Friends Match mode
-- Adds tables for async share-a-code matches: signed-in user creates a
-- match with 5 random photos, anyone with the code can join, results are
-- compared once submitted. Mirrors the daily_submissions dual-identity
-- pattern (user_id OR anon_device_token).
-- =====================================================================

-- =====================================================================
-- TABLE: matches
-- Purpose: One row per friends-match. Created by a signed-in user.
-- =====================================================================

create table matches (
  id uuid primary key default gen_random_uuid(),

  -- Human-shareable code, 6 chars from a 32-char ambiguous-free alphabet.
  -- Stored uppercase; lookups should upper() the input.
  code varchar(6) not null unique,

  -- Creator. Must be signed in (no anonymous match creation).
  created_by_user_id uuid not null references users(id) on delete cascade,

  -- Optional snapshot of the creator's nickname at create time, used in
  -- the join screen ("Join <nickname>'s match"). Falls back to users.nickname.
  creator_nickname varchar(20) null,

  -- Status + expiry. Joins/submits return 410 after expires_at.
  status varchar(16) not null default 'open'
    check (status in ('open', 'expired')),
  expires_at timestamp with time zone not null
    default (now() + interval '7 days'),

  created_at timestamp with time zone not null default now()
);

alter table matches enable row level security;

create index idx_matches_creator on matches (created_by_user_id);

-- =====================================================================
-- TABLE: match_photos
-- Purpose: Locks the 5 photos of a match at create time.
-- =====================================================================

create table match_photos (
  match_id uuid not null references matches(id) on delete cascade,
  photo_id uuid not null references photos(id) on delete restrict,
  position smallint not null check (position between 1 and 5),

  primary key (match_id, position),
  unique (match_id, photo_id)
);

alter table match_photos enable row level security;

-- =====================================================================
-- TABLE: match_submissions
-- Purpose: One submission per player per match. Mirrors daily_submissions
-- dual-identity (user_id XOR anon_device_token).
-- =====================================================================

create table match_submissions (
  id uuid primary key default gen_random_uuid(),

  match_id uuid not null references matches(id) on delete cascade,

  user_id uuid null references users(id) on delete cascade,
  anon_device_token varchar(255) null,

  -- Snapshot of the player's nickname at submission time
  nickname varchar(20) not null,

  total_score integer not null check (total_score between 0 and 100000),
  total_time_ms bigint not null check (total_time_ms > 0),

  submitted_at timestamp with time zone not null default now(),

  -- Exactly one identity must be set
  check (
    (user_id is not null and anon_device_token is null)
    or
    (user_id is null and anon_device_token is not null)
  )
);

alter table match_submissions enable row level security;

-- One submission per signed-in user per match
create unique index idx_match_submissions_user
  on match_submissions (match_id, user_id)
  where user_id is not null;

-- One submission per anonymous device per match
create unique index idx_match_submissions_device
  on match_submissions (match_id, anon_device_token)
  where anon_device_token is not null;

-- Leaderboard query within a match: score DESC, time ASC, then submitted_at
create index idx_match_submissions_leaderboard
  on match_submissions (match_id, total_score desc, total_time_ms asc, submitted_at asc);

-- =====================================================================
-- TABLE: match_guesses
-- Purpose: Per-photo guesses for the comparison view.
-- =====================================================================

create table match_guesses (
  id uuid primary key default gen_random_uuid(),

  submission_id uuid not null references match_submissions(id) on delete cascade,
  photo_id uuid not null references photos(id) on delete restrict,
  position smallint not null check (position between 1 and 5),

  guessed_lat double precision not null
    check (guessed_lat between -90 and 90),
  guessed_lon double precision not null
    check (guessed_lon between -180 and 180),

  km_error double precision not null,
  location_score integer not null check (location_score between 0 and 100000),
  total_score integer not null check (total_score between 0 and 100000),

  unique (submission_id, position)
);

alter table match_guesses enable row level security;

create index idx_match_guesses_submission
  on match_guesses (submission_id, position);

-- =====================================================================
-- RLS POLICIES
-- All client access goes through Astro endpoints using the user's session
-- (or anon role for anonymous joiners). Policies are permissive enough to
-- support the API; business rules (expiry, non-participants on results)
-- are enforced in the application layer.
-- =====================================================================

-- matches: anyone can read (so any user can look up by code)
create policy "anon_read_matches"
  on matches for select
  to anon
  using (true);

create policy "authenticated_read_matches"
  on matches for select
  to authenticated
  using (true);

-- matches: only signed-in users can create, and only with their own user_id
create policy "authenticated_insert_own_match"
  on matches for insert
  to authenticated
  with check (auth.uid() = created_by_user_id);

-- match_photos: anyone can read (needed at join time)
create policy "anon_read_match_photos"
  on match_photos for select
  to anon
  using (true);

create policy "authenticated_read_match_photos"
  on match_photos for select
  to authenticated
  using (true);

-- match_photos: only the match creator can insert
create policy "authenticated_insert_match_photos"
  on match_photos for insert
  to authenticated
  with check (
    exists (
      select 1 from matches m
      where m.id = match_photos.match_id
        and m.created_by_user_id = auth.uid()
    )
  );

-- match_submissions: anyone can read (results view filters in API layer)
create policy "anon_read_match_submissions"
  on match_submissions for select
  to anon
  using (true);

create policy "authenticated_read_match_submissions"
  on match_submissions for select
  to authenticated
  using (true);

-- match_submissions: anonymous users can submit if they provide an anon token
create policy "anon_insert_match_submission"
  on match_submissions for insert
  to anon
  with check (user_id is null and anon_device_token is not null);

-- match_submissions: signed-in users can submit as themselves
create policy "authenticated_insert_match_submission"
  on match_submissions for insert
  to authenticated
  with check (
    (user_id = auth.uid() and anon_device_token is null)
    or (user_id is null and anon_device_token is not null)
  );

-- match_guesses: anyone can read
create policy "anon_read_match_guesses"
  on match_guesses for select
  to anon
  using (true);

create policy "authenticated_read_match_guesses"
  on match_guesses for select
  to authenticated
  using (true);

-- match_guesses: insert allowed if linked to a submission visible under RLS
-- (since SELECT on match_submissions is permissive, this is effectively open;
-- application layer constructs only valid guesses).
create policy "anon_insert_match_guesses"
  on match_guesses for insert
  to anon
  with check (
    exists (select 1 from match_submissions s where s.id = match_guesses.submission_id)
  );

create policy "authenticated_insert_match_guesses"
  on match_guesses for insert
  to authenticated
  with check (
    exists (select 1 from match_submissions s where s.id = match_guesses.submission_id)
  );
