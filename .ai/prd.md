# Product Requirements Document (PRD) - FootyGuess Daily

## 1. Product Overview

**FootyGuess Daily** is a web-first, mobile-responsive game for football fans. Players are shown a football-related photo and must guess the event’s location on a world map and the event’s year.

- Each round consists of **5 photos**.
- The maximum score is **20,000 points per photo** (10,000 for location accuracy, 10,000 for time accuracy).

### Modes

1.  **Normal:** Unlimited plays; results are shown but not saved.
2.  **Daily:** A single daily set of 5 unique photos (never used before in Daily). Multiple plays are allowed, but only the **first attempt per device** counts toward the **Top-10 leaderboard**.

### MVP Scope & Target

Daily results are stored with minimal, privacy-preserving data. The product targets a **2-week MVP delivery** with a **frozen scope**: play, show results, Daily mode with Top-10 leaderboard.

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
  - Pre-scheduled sets (5 unique photos per day) with no repeats in Daily.
  - Multiple plays permitted; only the **first attempt per device** counts for leaderboard submission.

### 3.3 Leaderboard

- **Daily Top-10 global leaderboard**.
- **Tie-breakers** (in order): total completion time (lower wins), best single-photo score (higher wins), earliest submission time.
- Requires a **nickname** (3–20 characters; alphanumeric, spaces, hyphen, underscore). **Profanity filter** applied. Emoji normalized or disallowed.

### 3.4 Content and Data

- MVP ships with **100 unique, licensed photos**.
- **Photo metadata schema** per item: `event_name`, `competition`, `yearUTC`, `place` (city/region/country), `lat`, `lon`, `tags[]`, `description`, `source_url`, `license`, `credit`, `notes`.
- **Reveal content** after the full game: event name, description, and optional info; **no hints during play**.
- **Ingestion validations:** `yearUTC` in [1880, 2025], `lat` and `lon` present and valid, `license`/`credit` present.

### 3.5 Privacy and Storage

- For Daily submissions, store **minimal data only**: `dateUTC`, `anon_device_token`, `nickname`, `total_score`, `total_time_ms`, `per_photo_scores`.
- **No email, IP, or PII collected for MVP.**
- Retention window **30–90 days** for leaderboard and analytics.
- Use a **cookie or local storage token** for `anon_device_token`.

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

---

## 4. Product Boundaries

### In Scope for MVP

- **Normal** and **Daily** modes.
- Linear scoring with transparent formulas and caps.
- **Top-10 leaderboard** with tie-breakers and nickname entry.
- Minimal privacy storage and **anonymous device token**.
- Content ingestion for 100 unique photos and daily scheduling.
- Mobile-responsive web UI with **Mapbox** map and year picker.
- Basic accessibility and profanity filtering.

### Out of Scope for MVP

- Accounts, social graphs, and friend leaderboards.
- Multi-language UI beyond the initial language.
- Hints, power-ups, or advanced anti-cheat.
- Native mobile apps.
- Long-term data warehousing, complex analytics dashboards.

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
| **US-012** | Daily scheduler and uniqueness               | As an operator, I want Daily sets to be unique and scheduled so players get fresh content.                                    | **AC:** System publishes 5-photo set at 00:00 UTC daily. No photo reuse in Daily for at least 60 days. Supports a backup set for content removal.                                                                                                           |
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
- Zero repeats in Daily for at least 60 days.

### Performance

- Initial load $< 2$ seconds on 4G.
- Map interactions median latency $< 200$ ms.

### Data Quality

- $\ge 95\%$ of photos pass metadata validation on ingestion.
- Logging coverage for key events $\ge 95\%$ of sessions.

### Security and Integrity

- Submission rejection rate for invalid payloads $< 2\%$ after week 1.
- Rate limiting blocks $> 90\%$ of burst abuse without impacting legitimate users.

### Checklist

- Each user story has clear, testable acceptance criteria.
- Authentication/authorization needs covered via `anon_device_token` and nickname consent.
- User stories cover full MVP flow: play, submit, feedback, summary, leaderboard, content ops, privacy, and resilience.
- Sufficient scope to build a fully functional MVP within the 2-week timeline.
