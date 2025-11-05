# Product Requirements Document (PRD) - FootyGuess Daily

## 1. Product Overview

**FootyGuess Daily** is a web-first, mobile-responsive game for football fans. Players are shown a football-related photo and must guess the event's location on a world map and the event's year.

- Each round consists of **5 photos**.
- The maximum score is **20,000 points per photo** (10,000 for location accuracy, 10,000 for time accuracy).

### Modes

1.  **Normal:** Unlimited plays; results are shown but not saved.
2.  **Daily:** A single daily set of 5 unique photos (never used before in Daily).
    - **Anonymous players:** Can play unlimited times, see their potential leaderboard rank, but results are **not saved** to the leaderboard.
    - **Authenticated players:** First attempt is saved to the leaderboard. Subsequent plays do not update the score.

### Authentication

**User accounts are optional** but provide additional features:
- **Email + password** authentication via Supabase Auth.
- Authenticated users can **save scores to the leaderboard** automatically.
- Users with **photo submission permission** (`can_add_photos`) can submit photos for moderation.
- **Admin users** can moderate photo submissions and manage user permissions.

### MVP Scope & Target

The product includes optional user accounts, leaderboard for authenticated users, and community photo submissions with moderation. MVP delivery focused on core gameplay with authentication and content moderation.

---

## 2. User Problem

Football fans want a quick, engaging way to test and showcase their broad knowledge of football history and geography. Existing trivia often emphasizes text questions; FootyGuess Daily focuses on **visual recognition and spatial-temporal reasoning**, rewarding precise knowledge of where and when football moments occurred.

---

## 3. Functional Requirements

### 3.1 Gameplay

- Show a football-related image per turn, for a total of 5 images per round.
- Players place a single pin on an interactive world map and select a year using a bounded picker (**1880–2025**).
- **On submit, compute score** using linear deductions from caps:
  - $\text{location\_points} = \max(0, 10000 - \text{km\_error} \times K_{km})$
  - $\text{time\_points} = \max(0, 10000 - |\text{year\_guess} - \text{year\_true}| \times K_y)$
  - _Initial $K_{km}$ and $K_y$: $K_{km} = 5$, $K_y = 400$ (to be finalized post-playtest).\_
- **Per-photo feedback** after submit includes:
  - Visualization of guessed vs. correct location pins connected by a line and km error value.
  - Time delta in years and points awarded per dimension.
- End-of-round summary for 5 photos with **total score** and **total completion time**.

### 3.2 Modes

- **Normal mode:** Unlimited plays, results shown but **not persisted** server-side.
- **Daily mode:**
  - Resets at **00:00 UTC**.
  - Pre-scheduled sets (5 unique photos per day). **Photos are used only once** in Daily mode and never repeated.
  - Multiple plays permitted; only the **first attempt per device** counts for leaderboard submission.

### 3.3 Leaderboard

- **Daily Top-10 global leaderboard** (authenticated users only).
- **Tie-breakers** (in order): total completion time (lower wins), best single-photo score (higher wins), earliest submission time.
- Authenticated users' nicknames are displayed automatically from their profile.
- **Anonymous users** see their **potential rank** ("You would be #5! Create an account to save your score") but are not saved to the leaderboard.

### 3.4 Content and Data

- MVP ships with **100 unique, licensed photos**.
- **Photo metadata schema** per item: `event_name`, `competition`, `yearUTC`, `place` (city/region/country), `lat`, `lon`, `tags[]`, `description`, `source_url`, `license`, `credit`, `notes`.
- **Reveal content** after the full game: event name, description, and optional info; **no hints during play**.
- **Ingestion validations:** `yearUTC` in [1880, 2025], `lat` and `lon` present and valid, `license`/`credit` present.

### 3.5 Privacy and Storage

- **Anonymous gameplay:** Device token stored in local storage. Anonymous users' results are not persisted to leaderboard.
- **Authenticated users:**
  - Email and password stored via Supabase Auth (hashed, secure).
  - User profiles store: `id`, `email`, `nickname`, `role`, `can_add_photos`, timestamps.
  - Daily submissions store: `user_id`, `dateUTC`, `total_score`, `total_time_ms`, `submission_timestamp`.
  - Photo submissions store: all metadata + `user_id`, `status`, moderation info.
- **Data retention:**
  - Leaderboard data: 30–90 days (configurable).
  - User accounts: Retained until user requests deletion.
  - Photo submissions: Retained indefinitely (approved photos become game content).
- **No IP address collection.** Sessions managed via HTTP-only cookies for security.

### 3.6 Platform, Performance, and UX

- **Web-first, mobile-responsive design.**
- **Mapbox** for map UI; single “drop pin” interaction with zoom controls.
- Year picker bounded to **1880–2025**.
- **Performance targets:**
  - Initial load under **2 seconds** on 4G.
  - Map interactions median latency under **200 ms**.
- **Accessibility basics:** keyboard navigation for map controls and inputs, sufficient color contrast, screen-reader labels for controls.

### 3.7 Analytics and Observability

- **Client events:** `start_round`, `guess_submitted` (with error and score metrics), `round_complete`, `daily_submission`.
- KPIs computed for adoption, engagement, retention, performance, and content health.

### 3.8 Operations

- Daily scheduler to publish the daily set at **00:00 UTC** with a minimum 7-day pre-scheduled buffer.
- **Fallback logic** if a scheduled photo is pulled: switch to pre-approved backup set.
- Simple **rate limits** to protect the leaderboard submission endpoint.

### 3.9 Authentication & User Management

- **Email + password authentication** via Supabase Auth.
- User profiles stored in `users` table with fields:
  - `id` (UUID, links to Supabase auth.users)
  - `email` (unique, from auth)
  - `nickname` (optional, 3-20 characters, alphanumeric/spaces/hyphens/underscores)
  - `role` (`user` or `admin`, default: `user`)
  - `can_add_photos` (boolean, default: `false`, can be toggled by admins)
- **Password requirements:** Minimum 8 characters.
- **Nickname validation:** 3-20 characters, no profanity, must be unique.
- User sessions managed via HTTP-only cookies for security.
- **No backward compatibility:** Previous anonymous submissions remain anonymous; no linking of old scores to new accounts.

### 3.10 Photo Submissions & Moderation

- **Community photo submissions:** Users with `can_add_photos = true` can submit photos via a form.
- Submissions stored in `photo_submissions` table with status: `pending`, `approved`, or `rejected`.
- **Submission metadata schema:** Same as photos table (event_name, year_utc, lat, lon, license, credit, etc.).
- **Validation on submit:**
  - Year in [1880, 2025]
  - Lat/lon within valid ranges
  - Required fields: event_name, photo_url, license, credit
- **Admin moderation panel:**
  - View all pending submissions
  - Approve: moves submission to `photos` table, sets `is_daily_eligible = true`
  - Reject: marks submission as rejected with a reason (visible to submitter)
- **User submission tracking:** Users can view their submission history and stats (total, pending, approved, rejected).

---

## 4. Product Boundaries

### In Scope for MVP

- **Normal** and **Daily** modes.
- Linear scoring with transparent formulas and caps.
- **Top-10 leaderboard** for authenticated users with tie-breakers.
- **Potential rank display** for anonymous users (encourages sign-up).
- **Optional user accounts** with email + password authentication.
- **User roles and permissions** (user/admin, can_add_photos flag).
- **Community photo submissions** with moderation workflow.
- **Admin moderation panel** for photo approval/rejection.
- Minimal privacy storage and **anonymous device token** (legacy/anonymous gameplay).
- Content ingestion for 100 unique photos and daily scheduling.
- Mobile-responsive web UI with **Mapbox** map and year picker.
- Basic accessibility and profanity filtering.

### Out of Scope for MVP

- Social graphs and friend leaderboards.
- Backward compatibility for anonymous submissions (no linking old scores to accounts).
- Multi-language UI beyond the initial language.
- Hints, power-ups, or advanced anti-cheat.
- Native mobile apps.
- Long-term data warehousing, complex analytics dashboards.
- OAuth/social login (Google, Facebook, etc.).

### Assumptions and Constraints

- Photo licensing is secured; attribution requirements honored.
- Minimal anti-cheat stance accepted for MVP.
- Global release with **UTC-based reset**.

---

## 5. User Stories

| ID         | Title                                        | Description                                                                                                                   | Acceptance Criteria (AC)                                                                                                                                                                                                                                    |
| :--------- | :------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | --- |
| **US-001** | Play a Normal round                          | As a football fan, I want to play a 5-photo round without logging in so I can quickly test my knowledge.                      | **AC:** Start Normal mode $\rightarrow$ see photo 1, map, and year picker. Submit guess $\rightarrow$ see feedback, proceed to next photo (5 total). After photo 5 $\rightarrow$ see summary (total score/time). Results are **not** persisted server-side. |
| **US-002** | Play the Daily round                         | As a daily player, I want to attempt the Daily round so I can compare myself on the Top-10 leaderboard.                       | **AC:** Daily round available at 00:00 UTC. Can play multiple Daily rounds, but **only the first attempt per device** is eligible for leaderboard submission. Subsequent plays show a notice that results will not be submitted.                            |
| **US-003** | Place a pin on the world map                 | As a player, I want to place a single pin on a world map to guess the event’s location.                                       | **AC:** Can pan and zoom the map. Can place/move a single pin before submission. On submission, compute `km_error` using Haversine distance.                                                                                                                |
| **US-004** | Select a year for the event                  | As a player, I want to select a year so my temporal guess is recorded accurately.                                             | **AC:** Year picker bounds are **1880 and 2025** inclusive. Non-numeric/out-of-range input is rejected. On submission, compute $                                                                                                                            | year_guess - year_true | $.  |
| **US-005** | See per-photo feedback                       | As a player, I want to see how close I was so I can learn and improve.                                                        | **AC:** After submission, see both pins (guess and correct) connected by a line, and the km error value. See time delta in years and points awarded for location/time. Can proceed to the next photo.                                                       |
| **US-006** | Round summary                                | As a player, I want a final summary so I can understand my performance.                                                       | **AC:** After 5 photos, see total score, total time, and per-photo breakdown. For Daily, prompt for/confirm nickname before submission.                                                                                                                     |
| **US-007** | Leaderboard submission (first attempt only)  | As a Daily player, I want only my first Daily attempt per device to be eligible so the competition is fair.                   | **AC:** On first Daily completion, submit score with `anon_device_token` and nickname. Subsequent completions from the same device on the same date do not overwrite the entry and show an informational message.                                           |
| **US-008** | View Top-10 leaderboard                      | As a player, I want to view the Daily Top-10 so I can compare my performance.                                                 | **AC:** Leaderboard lists top 10 for the current UTC day. Tie-breakers applied: time $\rightarrow$ best single-photo score $\rightarrow$ earliest submission. Nicknames displayed (profanity filtered).                                                     |
| **US-009** | Set or edit nickname                         | As a player, I want to set a nickname to appear on the leaderboard.                                                           | **AC:** Nickname 3–20 characters; alphanumeric, spaces, hyphen, underscore. Profanity is blocked. Changes update only for **future eligible submissions**.                                                                                                  |
| **US-010** | Anonymous device identification              | As a system, I want to assign an anonymous device token so I can enforce the first-attempt Daily rule without collecting PII. | **AC:** Stable `anon_device_token` stored in a cookie/local storage on first open. Token included in Daily submission. Graceful degradation if storage unavailable (disallow submission).                                                                   |
| **US-011** | Reveal event details after the game          | As a player, I want to see the event details after completing the round to learn more.                                        | **AC:** After the 5th photo, reveal section displays `event_name` and `description` for each photo. Optional info (e.g., competition, credit) may be shown per license.                                                                                     |
| **US-012** | Daily scheduler and uniqueness               | As an operator, I want Daily sets to be unique and scheduled so players get fresh content.                                    | **AC:** System publishes 5-photo set at 00:00 UTC daily. Each photo is used only once in Daily mode (never repeated). System sets `is_daily_eligible = false` when photo is published. Supports a backup set for content removal.                            |
| **US-013** | Content ingestion with validation            | As a curator, I want to upload photo items with metadata so they can be used in the game.                                     | **AC:** Item must include all required metadata fields (3.4). Validate `year` in [1880, 2025], and presence of `lat`/`lon`/`license`. Rejection with clear errors if validation fails.                                                                      |
| **US-014** | Performance and responsiveness               | As a player, I want fast load times and responsive interactions so the game feels smooth.                                     | **AC:** Initial load $< 2$ seconds (4G). Median map interaction latency $< 200$ ms. Responsive for mobile and desktop.                                                                                                                                      |
| **US-015** | Analytics events                             | As a product team member, I want key events tracked so I can measure success.                                                 | **AC:** Log `start_round`, `guess_submitted` (with metrics), `round_complete`, `daily_submission` (with timestamps and token). Minimal performance impact ($<50$ ms budget per event).                                                                      |
| **US-016** | Privacy and data retention                   | As a player, I want my data handled minimally and transparently.                                                              | **AC:** Daily submissions store only the minimal set of data (3.5). Data retention configurable to 30–90 days. Display privacy consent banners if required.                                                                                                 |
| **US-017** | Error handling and offline states            | As a player, I want clear messages if something goes wrong so I know what to do next.                                         | **AC:** If Mapbox fails $\rightarrow$ show retry/disable play. Submission failure $\rightarrow$ offer retry, inform user submission may not be recorded. Daily set unavailable $\rightarrow$ fallback message offers Normal mode.                           |
| **US-018** | Secure access and integrity for submissions  | As a system, I want basic integrity checks to reduce abuse of leaderboard submissions.                                        | **AC:** Server verifies `dateUTC` alignment with 00:00 UTC reset. Reject submissions with impossible scores/times. Enforce a simple rate limit per `anon_device_token` for Daily submissions.                                                               |
| **US-019** | Content credits and licensing display        | As an operator, I want to ensure proper attribution per license requirements.                                                 | **AC:** Each reveal includes credit info per license. A credits page lists sources and licenses.                                                                                                                                                            |
| **US-020** | Accessibility basics                         | As an accessibility-conscious player, I want to navigate and read content without barriers.                                   | **AC:** All interactive elements operable via keyboard. Controls have ARIA labels. Color contrast meets WCAG AA.                                                                                                                                            |
| **US-021** | Multiple Daily plays with first-attempt rule | As a competitive user, I may replay the Daily for practice without changing my leaderboard position.                          | **AC:** After first eligible submission, subsequent plays show a banner that scores will not be resubmitted. Leaderboard entry remains unchanged for that UTC date.                                                                                         |
| **US-022** | Session timing measurement                   | As a system, I want to measure total completion time accurately for tie-breakers.                                             | **AC:** Timer starts on photo 1 display and stops on final submission of photo 5. Pauses longer than a defined threshold (e.g., 5 minutes) are still included in total time.                                                                                |
| **US-023** | Image rendering and optimization             | As a player, I want sharp images that load quickly.                                                                           | **AC:** Images served via CDN with responsive sizes. Lazy loading for upcoming photos. No EXIF metadata exposed.                                                                                                                                            |
| **US-024** | Basic admin view for Daily schedule status   | As an operator, I need to verify that future days are scheduled.                                                              | **AC:** Internal view shows next 7–20 daily sets, flags validity, and missing metadata/licensing issues.                                                                                                                                                    |
| **US-025** | Consent for nickname display                 | As a privacy-conscious user, I want to know that my nickname will be public if I make the leaderboard.                        | **AC:** Before first leaderboard submission, a brief notice explains public display. User must confirm once; preference is stored with `anon_device_token`.                                                                                                 |
| **US-026** | User sign up                                 | As a new player, I want to create an account so I can save my scores to the leaderboard.                                       | **AC:** Sign up form requires email and password (min 8 chars). Optional nickname field (3-20 chars, validated for profanity/uniqueness). On success, user is logged in and profile is created. Email must be unique.                                       |
| **US-027** | User sign in                                 | As a returning player, I want to log in so I can access my account.                                                            | **AC:** Sign in form requires email and password. On success, session is established via HTTP-only cookie. Invalid credentials show clear error message. Session persists across page reloads.                                                               |
| **US-028** | User sign out                                | As an authenticated player, I want to log out to end my session.                                                               | **AC:** Sign out action clears session cookie and redirects to home page. User can no longer access authenticated features without re-authenticating.                                                                                                        |
| **US-029** | Update user nickname                         | As an authenticated player, I want to change my nickname.                                                                       | **AC:** User can update nickname via profile page. Validation: 3-20 chars, profanity check, uniqueness check. Changes reflect on future leaderboard submissions. Past submissions keep old nickname.                                                         |
| **US-030** | View user profile                            | As an authenticated player, I want to view my profile information.                                                              | **AC:** Profile page shows email, nickname, account creation date, role, and photo submission permission status. User can see their submission stats if they have `can_add_photos` permission.                                                               |
| **US-031** | Anonymous potential rank display             | As an anonymous player, I want to see where I would rank if I created an account.                                               | **AC:** After completing Daily challenge, anonymous users see "You would be #X on the leaderboard! Create an account to save your score." Result is not saved. Rank is calculated based on authenticated users only.                                          |
| **US-032** | Authenticated leaderboard submission         | As an authenticated player, I want my Daily score to be automatically saved to the leaderboard.                                 | **AC:** First Daily completion for the day is automatically saved to leaderboard with user's nickname. No additional submission step required. Subsequent plays on same day do not update the score.                                                         |
| **US-033** | Submit photo for review                      | As an authorized user, I want to submit a photo so it can be used in the game.                                                  | **AC:** Submission form requires all photo metadata (event_name, year_utc, lat, lon, photo_url, license, credit). Validation errors shown inline. On success, submission enters `pending` status. User requires `can_add_photos = true` permission.          |
| **US-034** | View my photo submissions                    | As a user who submits photos, I want to see the status of my submissions.                                                       | **AC:** User can view list of their photo submissions with status (pending/approved/rejected), submission date, and rejection reason (if rejected). Stats shown: total, pending, approved, rejected counts.                                                  |
| **US-035** | Admin view pending submissions               | As an admin, I want to see all pending photo submissions so I can moderate them.                                                | **AC:** Admin panel lists all pending submissions with photo preview, metadata, and submitter info (nickname/email). Sorted by submission date (newest first). Admin can filter by status.                                                                   |
| **US-036** | Admin approve photo submission               | As an admin, I want to approve a photo submission so it becomes available for Daily challenges.                                 | **AC:** Approve action moves submission from `photo_submissions` to `photos` table, sets `status = approved`, `is_daily_eligible = true`. Submitter is notified (if notification system exists). Photo becomes available for Daily set scheduling.           |
| **US-037** | Admin reject photo submission                | As an admin, I want to reject a photo submission with a reason.                                                                 | **AC:** Reject action requires a reason (1-500 chars). Updates submission `status = rejected`, stores reason. Submitter can see rejection reason in their submission history. Rejected photos cannot be resubmitted (user must create new submission).        |
| **US-038** | Admin manage user permissions                | As an admin, I want to grant or revoke photo submission permission for users.                                                   | **AC:** Admin panel shows all users with their current `can_add_photos` status. Admin can toggle permission on/off. Changes take effect immediately. Users without permission cannot access photo submission form.                                           |
| **US-039** | Role-based access control                    | As a system, I want to enforce role-based permissions for admin features.                                                       | **AC:** Only users with `role = admin` can access admin endpoints (`/api/admin/*`). Non-admin users receive 403 Forbidden. Client-side UI hides admin features for non-admins. Server-side validation always enforced.                                       |

---

## 6. Success Metrics

### Adoption

- At least **100 unique players** within 90 days of MVP launch.

### Engagement

- Round completion rate $\ge 60\%$.
- Median session time **3–5 minutes**.
- Daily participation $\ge 40\%$ of DAU.

### Retention

- Day-1 retention $\ge 25\%$ (directional for MVP).
- Track 7-day returning users.

### Content Health

- Daily schedule maintained $\ge 7$ days ahead.
- Zero repeats in Daily (photos used only once).

### Performance

- Initial load $< 2$ seconds on 4G.
- Map interactions median latency $< 200$ ms.

### Data Quality

- $\ge 95\%$ of photos pass metadata validation on ingestion.
- Logging coverage for key events $\ge 95\%$ of sessions.

### Security and Integrity

- Submission rejection rate for invalid payloads $< 2\%$ after week 1.
- Rate limiting blocks $> 90\%$ of burst abuse without impacting legitimate users.

### Authentication & User Adoption

- **Sign-up conversion rate:** $\ge 20\%$ of anonymous players create accounts within first 3 plays.
- **Authenticated user ratio:** $\ge 40\%$ of Daily submissions from authenticated users (vs. potential rank displays to anonymous).
- **Leaderboard impact:** Authenticated users show $\ge 2x$ retention vs. anonymous players.

### Photo Submissions & Moderation

- **Submission rate:** $\ge 5$ user-submitted photos per week (users with `can_add_photos` permission).
- **Moderation SLA:** $\ge 80\%$ of pending submissions reviewed within 48 hours.
- **Approval rate:** 40–70% of submissions approved (indicates healthy quality + moderation standards).
- **Content growth:** User-submitted approved photos comprise $\ge 20\%$ of total photo pool within 3 months.

### Checklist

- Each user story has clear, testable acceptance criteria.
- Authentication/authorization needs covered via Supabase Auth (email + password), role-based access control (user/admin), and permissions (`can_add_photos`).
- User stories cover full MVP flow: play, submit, feedback, summary, leaderboard, user auth, photo submissions, moderation, content ops, privacy, and resilience.
- Database schema supports user accounts, leaderboard filtering (authenticated only), and photo submission workflow.
- Backend API endpoints implemented for: auth (signup/signin/signout/profile), photo submissions, admin moderation.
