# UI Architecture for FootyGuess Daily

## 1. UI Structure Overview

FootyGuess Daily is a web-first, mobile-responsive game application with a clean, focused user interface optimized for both gameplay and competition. The UI architecture supports two distinct game modes (Normal and Daily), a competitive leaderboard system, and administrative content management.

The application follows a single-page application (SPA) pattern for the core gameplay experience while maintaining traditional navigation for supporting views. The architecture prioritizes:

- **Simplicity**: Minimal cognitive load with clear CTAs and intuitive navigation
- **Performance**: Fast initial load (<2s), responsive interactions (<200ms map latency)
- **Accessibility**: WCAG AA compliance with keyboard navigation, ARIA labels, and sufficient color contrast
- **Responsiveness**: Mobile-first design scaling seamlessly to desktop viewports
- **Privacy**: Anonymous gameplay with optional nickname setting for leaderboard participation

The UI consists of 9 primary views organized into three sections:

1. **Public Views** (5): Home, Game, Round Summary, Leaderboard, Credits
2. **User Settings** (1): Nickname Management
3. **Admin Views** (3): Dashboard, Daily Sets Management, Analytics

## 2. View List

### 2.1 Home View

**Path**: `/`

**Main Purpose**: Welcome users, explain the game concept, and provide clear mode selection for starting gameplay.

**Key Information to Display**:

- Game title and tagline ("Test your football knowledge across time and space")
- Brief explanation of gameplay mechanics (guess location + year from photos)
- Two game mode options with clear differentiation
- Quick stats (e.g., "1,250 players today")
- Links to supporting pages (How to Play, Leaderboard, Credits)

**Key View Components**:

- **Hero Section**
  - Large game title with football imagery
  - Concise value proposition (1-2 sentences)
  - Visual示例 of gameplay (optional animated preview)

- **Mode Selection Cards** (2 prominent CTAs)
  - **Normal Mode Card**
    - Title: "Practice Mode"
    - Description: "Unlimited plays, test your skills"
    - CTA: "Play Normal" button
    - Icon: Infinity symbol or practice icon
  - **Daily Challenge Card**
    - Title: "Daily Challenge"
    - Description: "Compete for today's Top-10 leaderboard"
    - Badge: "Resets at 00:00 UTC"
    - CTA: "Play Daily" button (primary emphasis)
    - Status indicator if already played today
    - Icon: Calendar or trophy

- **Quick Stats Bar**
  - Active players count
  - Today's average score
  - Link to leaderboard

- **Secondary Navigation**
  - "How to Play" expandable section or modal
  - "View Leaderboard" link
  - "Credits" link in footer

**UX Considerations**:

- Daily Challenge should be visually emphasized as the primary mode
- Show "Already played today" badge if user has submitted
- Provide clear visual distinction between modes
- Ensure CTAs are large enough for touch targets (min 44x44px)

**Accessibility Considerations**:

- Heading hierarchy (h1 for title, h2 for sections)
- Skip to main content link
- Clear focus indicators on interactive elements
- Alt text for all images
- ARIA labels for mode selection cards

**Security Considerations**:

- No sensitive data displayed
- Device token generated and stored on first visit (localStorage/cookie)
- Privacy policy link in footer

---

### 2.2 Game View

**Path**: `/play/normal` or `/play/daily`

**Main Purpose**: Core gameplay interface where users view photos, place map pins, select years, and receive feedback on their guesses.

**Key Information to Display**:

- Current photo (large, high quality)
- Mode indicator (Normal or Daily Challenge)
- Progress through round (e.g., "Photo 2 of 5")
- Interactive world map for pin placement
- Year selection interface (1880-2025)
- Timer (for Daily mode, used in tie-breaking)
- Per-photo feedback after submission
- Running total score

**Key View Components**:

- **Header Bar**
  - Mode badge ("Normal Mode" or "Daily Challenge")
  - Progress indicator (5 circles, current filled/highlighted)
  - Timer display (Daily mode only): "Time: 02:45"
  - Exit/Menu button

- **Photo Display Area**
  - Large photo container (responsive, maintains aspect ratio)
  - Photo counter: "Photo 3 of 5"
  - Loading skeleton while photo loads
  - Alt text for accessibility

- **Interactive Map Component** (Mapbox)
  - Full-screen or large viewport map
  - Zoom controls (+/- buttons)
  - Reset view button
  - Draggable pin marker
  - Pin placement instruction: "Click to place your guess"
  - Current pin location coordinates (optional, for accessibility)
  - Keyboard navigation support (arrow keys to pan, +/- to zoom)

- **Year Selection Component**
  - Label: "What year was this?"
  - Slider input (1880-2025) with year display
  - OR Dropdown/numeric input with validation
  - Large, touch-friendly controls
  - Keyboard accessible (arrow keys, type to jump)

- **Submit Button**
  - Prominent CTA: "Submit Guess"
  - Disabled state until both pin and year selected
  - Visual feedback on hover/focus
  - Loading state during submission

- **Feedback Section** (appears after submission)
  - Map overlay showing:
    - User's pin (blue)
    - Correct pin (green)
    - Line connecting them with km distance
  - Score breakdown card:
    - "Distance: 245 km"
    - "Location Score: 8,775 / 10,000"
    - "Year Difference: 3 years"
    - "Time Score: 8,800 / 10,000"
    - "Total for Photo: 17,575 / 20,000"
  - Running total: "Round Score: 52,325 / 60,000 (3 photos)"
  - "Next Photo" button (or "See Results" for photo 5)

- **Error State Messages**
  - Map loading failure: "Unable to load map. Please refresh."
  - Submission failure: "Couldn't submit. Retry?" with retry button
  - Network error: "You appear to be offline"

**UX Considerations**:

- Map must be easily navigable on mobile (touch zoom, pan)
- Clear visual feedback when pin is placed
- Year selection should be efficient (slider for quick selection, input for precision)
- Feedback should celebrate good guesses (animations, positive messaging)
- Smooth transitions between photos
- Prevent accidental navigation away (confirmation dialog)
- For Daily mode, show notice if already submitted: "You've already submitted today's challenge. This is a practice round."

**Accessibility Considerations**:

- Map keyboard controls with clear instructions
- ARIA live regions for score announcements
- Screen reader descriptions for map state ("Pin placed at latitude X, longitude Y")
- Focus management (move focus to feedback section after submit)
- High contrast mode support for map pins
- Alternative to map for users with motor impairments (coordinate input)

**Security Considerations**:

- Client-side score calculation for immediate feedback only
- Server recalculates all scores on submission
- Rate limiting on submission endpoint
- Input validation for coordinates and year
- Analytics events tracked (POST /api/analytics/events)

---

### 2.3 Round Summary View

**Path**: `/summary` (or modal overlay on Game View)

**Main Purpose**: Display comprehensive results after completing all 5 photos, including total score, time, per-photo breakdown, event details, and leaderboard submission status for Daily mode.

**Key Information to Display**:

- Total score (prominent)
- Total time taken
- Per-photo breakdown with event details
- Leaderboard rank (Daily mode, if submitted)
- CTAs for next actions

**Key View Components**:

- **Header Section**
  - Mode badge
  - Completion message: "Round Complete!"
  - Total score (large, celebrated): "87,550 / 100,000"
  - Total time: "Completed in 4:05"

- **Daily Submission Section** (Daily mode only)
  - **If first attempt and nickname set**:
    - Success message: "Submitted to leaderboard!"
    - Rank display: "You're ranked #7 today!"
    - "View Full Leaderboard" button
  - **If first attempt and no nickname**:
    - Prompt: "Set a nickname to join the leaderboard"
    - Inline nickname form (see Nickname Settings components)
    - Submit button
  - **If already submitted earlier**:
    - Info message: "You've already submitted today's challenge"
    - Your earlier rank: "#12"
    - Current practice score shown for comparison

- **Photo Breakdown Grid** (5 cards)
  - For each photo:
    - Thumbnail image
    - Event name (revealed): "1966 FIFA World Cup Final"
    - Location: "London, England"
    - Year: 1966
    - Your score: "17,420 / 20,000"
    - Distance error: "245 km off"
    - Year error: "3 years off"
    - Expandable description (optional)
    - Photo credit (small text)

- **Action Buttons**
  - **Primary CTA** (varies by mode):
    - Daily: "View Leaderboard" or "Play Normal Mode"
    - Normal: "Play Again"
  - **Secondary actions**:
    - "Share Results" (future enhancement, greyed out for MVP)
    - "Back to Home"

- **Event Details Section**
  - Expandable cards showing full event descriptions
  - Links to source URLs (external, open in new tab)
  - Photo credits and licensing info

**UX Considerations**:

- Celebrate good performance (animations, positive messaging for high scores)
- Clear differentiation between submitted and practice rounds
- Easy navigation to leaderboard (primary CTA for Daily)
- Photo reveals should feel rewarding (progressive disclosure)
- Smooth scroll through photo breakdown on mobile
- Persistent display of total score while scrolling

**Accessibility Considerations**:

- Announce completion to screen readers
- Heading hierarchy for breakdown sections
- Expandable descriptions keyboard accessible
- Focus management when loaded
- Clear labeling of all score metrics

**Security Considerations**:

- Submission handled server-side (POST /api/daily/submissions)
- Server validates all scores before accepting
- Device token verified for duplicate submission prevention
- Consent verification for nickname display

---

### 2.4 Leaderboard View

**Path**: `/leaderboard`

**Main Purpose**: Display daily Top-10 rankings with scores, times, and nicknames, allowing users to compare performance and providing motivation for competitive play.

**Key Information to Display**:

- Selected date
- Top-10 ranked submissions
- Total submissions count
- Current user's rank if in Top-10
- CTA to play if not participated today

**Key View Components**:

- **Header Section**
  - Title: "Daily Leaderboard"
  - Date selector dropdown:
    - "Today" (default)
    - "Yesterday"
    - "Last 7 days" list
    - Custom date picker (optional)
  - Total submissions: "245 players today"

- **Leaderboard Table/List**
  - Responsive design (table on desktop, cards on mobile)
  - **For each entry (Top-10)**:
    - Rank number (with special icons for 1st, 2nd, 3rd: 🥇🥈🥉)
    - Nickname (profanity filtered)
    - Total score: "98,750"
    - Completion time: "2:15"
    - Submission time (tooltip or small text): "05:30 UTC"
    - Highlight current user's row (if present)
  - **Tie-breaker indicator** (tooltip):
    - "Ranked by: Score → Time → Submission order"

- **User Status Card**
  - **If user played today and in Top-10**:
    - "You're ranked #7!"
    - Their stats highlighted in list
  - **If user played today but not in Top-10**:
    - "Your rank: #25 of 245"
    - "You scored: 82,000"
  - **If user hasn't played today**:
    - "Play today's challenge to compete!"
    - "Play Daily Challenge" button

- **Empty State** (if no data)
  - "No submissions yet for this date"
  - "Be the first to play!" (if today)

- **Footer**
  - Link to Credits
  - Note: "Leaderboards reset daily at 00:00 UTC"

**UX Considerations**:

- Clear visual hierarchy (podium positions emphasized)
- Smooth date switching (no full page reload)
- User's position always visible (sticky or highlighted)
- Responsive table design (horizontal scroll on mobile if needed)
- Loading states for date switching
- Pagination or "Load More" if expanding beyond Top-10 (future)

**Accessibility Considerations**:

- Table semantics (thead, tbody, th, td with scope)
- Screen reader announcements for rank changes
- Keyboard navigation for date selector
- ARIA labels for rank icons
- Clear focus indicators

**Security Considerations**:

- Public endpoint, no authentication required
- Rate limiting to prevent abuse
- Nicknames sanitized server-side (profanity filter)
- No PII displayed (only nicknames and scores)

---

### 2.5 Nickname Settings View

**Path**: `/settings/nickname` or `/settings`

**Main Purpose**: Allow users to set or update their display nickname for leaderboard participation, with clear consent for public display.

**Key Information to Display**:

- Current nickname (if set)
- Input validation feedback
- Privacy notice about public display
- Consent requirement

**Key View Components**:

- **Header**
  - Title: "Nickname Settings"
  - Breadcrumb (optional): Home > Settings > Nickname

- **Current Status Section**
  - **If nickname set**:
    - "Current nickname: **FootyFan123**"
    - Last updated timestamp
  - **If no nickname**:
    - "No nickname set"
    - "Set a nickname to appear on the leaderboard"

- **Nickname Form**
  - Label: "Display Nickname"
  - Text input field
    - Placeholder: "Enter nickname (3-20 characters)"
    - Real-time validation feedback
    - Character counter: "12 / 20"
  - Validation rules display:
    - "✓ 3-20 characters"
    - "✓ Letters, numbers, spaces, hyphens, underscores only"
    - "✗ No profanity"
  - Error messages (inline):
    - "Nickname too short (minimum 3 characters)"
    - "Nickname contains profanity"
    - "Invalid characters (use only A-Z, 0-9, spaces, -, \_)"

- **Consent Section** (first-time only)
  - Checkbox: "I understand my nickname will be publicly displayed on leaderboards"
  - Required indicator
  - Privacy notice (expandable):
    - "Your nickname will appear on the Daily Top-10 leaderboard"
    - "No email or personal information is collected"
    - "We use an anonymous device token to track your submissions"
    - Link to full Privacy Policy

- **Action Buttons**
  - "Save Nickname" (primary, disabled until valid)
  - "Cancel" (returns to previous page)

- **Success/Error Messages**
  - Success: "Nickname saved! You're ready to compete."
  - Error: "Failed to save. Please try again."

**UX Considerations**:

- Real-time validation (not just on submit)
- Clear, friendly error messages
- Smooth transitions for validation states
- Auto-focus on input field on load
- Prevent form submission with Enter if invalid
- Success confirmation before redirecting

**Accessibility Considerations**:

- Form labels properly associated with inputs
- ARIA live region for validation messages
- Error messages linked to input (aria-describedby)
- Focus management (move to error if submission fails)
- Required field indicators

**Security Considerations**:

- Client-side validation (UX) + server-side validation (security)
- Profanity filter applied server-side (PUT /api/devices/nickname)
- Rate limiting on update endpoint
- Device token verified
- No script injection (input sanitized)

---

### 2.6 Credits View

**Path**: `/credits`

**Main Purpose**: Display comprehensive attribution and licensing information for all photos used in the game, ensuring compliance with photo licenses and providing transparency.

**Key Information to Display**:

- Complete list of all photos with attribution
- Photographer credits
- License types
- Source URLs
- Search/filter functionality

**Key View Components**:

- **Header**
  - Title: "Photo Credits & Licenses"
  - Subtitle: "All photos are used with proper attribution under their respective licenses"

- **Licensing Statement**
  - Brief explanation of licensing compliance
  - "We respect photographer rights and comply with all license requirements"

- **Search/Filter Bar**
  - Search input: "Search by event, photographer, or year"
  - Filter dropdown: "All Licenses" / "CC-BY" / "CC-BY-SA" / etc.
  - Sort options: "Year" / "Event Name" / "Recently Added"

- **Credits List** (paginated or infinite scroll)
  - **For each photo entry**:
    - Thumbnail image (small)
    - Event name: "1966 FIFA World Cup Final"
    - Year: 1966
    - Photographer/Credit: "John Smith Photography"
    - License type: "CC-BY-SA 4.0" (with info icon tooltip)
    - Source URL: Link with external icon (opens in new tab)
  - Layout: Grid on desktop, list on mobile

- **Pagination Controls** (if paginated)
  - "Showing 1-50 of 100"
  - Page numbers or "Load More" button
  - Items per page: 50 (default)

- **Footer**
  - Link to common license explanations
  - Contact info for licensing questions

**UX Considerations**:

- Lazy loading for images (performance)
- Smooth filtering (no page reload)
- Clear visual grouping
- Responsive grid layout
- Easy access to source URLs
- Skeleton loading for initial load

**Accessibility Considerations**:

- Alt text for all thumbnail images
- Keyboard accessible filters and pagination
- Screen reader friendly links (clear context)
- Heading hierarchy
- Focus indicators

**Security Considerations**:

- External links with rel="noopener noreferrer"
- No sensitive data (public information)
- Rate limiting on search endpoint (if dynamic)

---

### 2.7 Admin Dashboard View

**Path**: `/admin` or `/admin/photos`

**Main Purpose**: Enable administrators to manage photo content, including uploading new photos with metadata, viewing existing photos, and managing photo eligibility for daily sets.

**Key Information to Display**:

- Total photos count and eligibility stats
- Searchable, filterable photo list
- Upload interface
- Photo details and actions

**Key View Components**:

- **Admin Header**
  - Admin branding
  - Navigation: Dashboard | Daily Sets | Analytics | Logout
  - Current admin user indicator

- **Stats Overview Cards**
  - Total photos: 100
  - Daily eligible: 85
  - Used in daily: 15
  - Pending review: 5 (if applicable)

- **Action Bar**
  - "Upload New Photo" button (primary CTA)
  - Search input
  - Filter dropdowns:
    - "Eligibility: All / Eligible / Used / Ineligible"
    - "Year: All / Custom range"
    - "Competition: All / World Cup / Champions League / etc."

- **Photo Grid/Table**
  - Responsive layout (grid on large screens, list on mobile)
  - **For each photo**:
    - Thumbnail
    - Event name
    - Year
    - Location (city, country)
    - Eligibility badge (green = eligible, yellow = used, red = ineligible)
    - First used date (if used in daily)
    - Action buttons:
      - "View Details" (eye icon)
      - "Edit" (pencil icon)
      - "Delete" (trash icon, with confirmation)
  - Sortable columns (event name, year, created date)
  - Bulk actions (future: select multiple, batch edit)

- **Pagination**
  - Items per page: 50 (adjustable)
  - Page numbers
  - Total count

- **Upload Photo Modal/Page**
  - **File Upload**
    - Drag-and-drop zone
    - "Choose File" button
    - File requirements: "Max 10MB, JPG/PNG/WebP"
    - Image preview after selection
  - **Metadata Form** (all fields from API schema):
    - Event name (required, text, max 255)
    - Competition (optional, text, max 255)
    - Year (required, number, 1880-2025)
    - Place (optional, text: "City, Region, Country")
    - Latitude (required, decimal, -90 to 90)
    - Longitude (required, decimal, -180 to 180)
    - Description (optional, textarea)
    - Tags (optional, multi-select or comma-separated)
    - Source URL (required, URL)
    - License (required, dropdown: CC-BY, CC-BY-SA, etc.)
    - Credit (required, text: photographer name)
    - Notes (optional, textarea, internal use)
  - **Map Preview** (optional but helpful)
    - Shows pin at entered coordinates
    - Allows clicking map to set coordinates
  - **Validation Messages**
    - Real-time validation for required fields
    - Inline errors
  - **Action Buttons**
    - "Upload Photo" (disabled until valid)
    - "Cancel"

- **Photo Detail Modal**
  - Full-size image preview
  - All metadata displayed
  - Edit/Delete actions
  - "Used in daily sets" list (if applicable)

- **Confirmation Dialogs**
  - Delete confirmation: "Are you sure? This photo will be permanently deleted."
  - Cannot delete if used in published daily sets

**UX Considerations**:

- Fast search and filtering (debounced)
- Clear visual feedback for upload progress
- Drag-and-drop for file upload (with fallback)
- Inline editing where possible
- Confirmation for destructive actions
- Success/error toast notifications

**Accessibility Considerations**:

- Keyboard navigation for all controls
- ARIA labels for icon buttons
- Focus management in modals
- Form validation announcements
- Alternative text for images

**Security Considerations**:

- Admin authentication required (Supabase Auth with admin role)
- File upload validation (type, size)
- Metadata sanitization (prevent XSS)
- Rate limiting on upload endpoint
- IP allowlist recommended (server config)
- CSRF protection on forms

---

### 2.8 Admin Daily Sets Management View

**Path**: `/admin/daily-sets`

**Main Purpose**: Enable administrators to create, schedule, and manage daily sets, ensuring a consistent pipeline of upcoming daily challenges with proper validation and uniqueness checks.

**Key Information to Display**:

- Schedule status (days ahead)
- Upcoming daily sets
- Calendar view of scheduled dates
- Create/edit daily set interface

**Key View Components**:

- **Admin Header** (same as Dashboard)

- **Schedule Status Card**
  - Days scheduled ahead: "15 days"
  - Status indicator:
    - Green: ≥7 days ahead
    - Yellow: 3-6 days ahead
    - Red: <3 days ahead (warning)
  - Next unpublished date: "October 25, 2025"
  - Warning message (if applicable): "Schedule buffer running low!"

- **Calendar View** (optional for MVP, helpful)
  - Monthly calendar showing:
    - Published dates (green)
    - Scheduled but unpublished (yellow)
    - Empty dates (red for near future)
    - Today highlighted
  - Click date to view/edit daily set

- **Daily Sets List**
  - Default view: Next 20 upcoming sets
  - **For each daily set**:
    - Date: "October 25, 2025"
    - Status badge: "Published" / "Draft"
    - Photo count: "5 photos"
    - Thumbnail strip (5 small thumbnails)
    - Actions:
      - "View Details"
      - "Edit" (if not published)
      - "Publish" (if draft)
      - "Delete" (if draft and no submissions)

- **Filter/Sort Bar**
  - Date range filter
  - Status filter: All / Published / Draft
  - Sort: Chronological / Recently Created

- **Create Daily Set Button** (primary CTA)
  - Opens creation modal/page

- **Create/Edit Daily Set Form**
  - **Date Selection**
    - Date picker (future dates only, or today)
    - Validation: No duplicate dates
    - Warning if date <7 days from today
  - **Photo Selection** (must be exactly 5)
    - Search/filter interface:
      - "Show only eligible photos"
      - "Exclude recently used (60 days)"
      - Search by event name, year, tags
    - Photo grid (selectable)
    - Selected photos area (shows 5 slots):
      - Drag to reorder position
      - Remove button for each
      - Position numbers (1-5)
    - Photo details on hover/click:
      - Event name, year
      - Last used date (if any)
      - Warning if used <60 days ago
  - **Validation Messages**
    - "Must select exactly 5 photos"
    - "Photo X was used on [date] (less than 60 days ago)"
    - "All photos must be daily-eligible"
  - **Action Buttons**
    - "Save as Draft"
    - "Save and Publish"
    - "Cancel"

- **Daily Set Detail View**
  - Date and status
  - 5 photos with full details:
    - Thumbnail
    - Event name, year, location
    - Last used date
    - Position in set
  - Submission count (if published)
  - Actions: Edit / Publish / Delete

- **Publish Confirmation Modal**
  - "Publish daily set for [date]?"
  - Validation checks:
    - Exactly 5 photos
    - All photos valid and available
    - Date in valid range
  - Warning if publishing past date
  - "Confirm Publish" button

**UX Considerations**:

- Visual schedule status (clear warnings)
- Easy photo selection with preview
- Drag-and-drop for photo ordering
- Clear differentiation between draft and published
- Prevent accidental deletion of published sets
- Bulk scheduling (future enhancement)

**Accessibility Considerations**:

- Calendar keyboard navigation
- Form labels and validation announcements
- Focus management in modals
- Clear button labels
- Alternative to drag-and-drop (up/down buttons)

**Security Considerations**:

- Admin authentication required
- Validate photo eligibility server-side
- Prevent duplicate dates (database constraint)
- Rate limiting on creation endpoint
- Log all publishing actions

---

### 2.9 Admin Analytics View

**Path**: `/admin/analytics`

**Main Purpose**: Provide administrators with comprehensive KPIs and metrics to measure product success, engagement, retention, and content health.

**Key Information to Display**:

- Adoption metrics
- Engagement metrics
- Retention metrics
- Performance metrics
- Content health metrics

**Key View Components**:

- **Admin Header** (same as Dashboard)

- **Date Range Selector**
  - Preset ranges: Last 7 days / Last 30 days / Last 90 days / Custom
  - Date picker for custom range
  - "Apply" button

- **KPI Cards Grid** (top section)
  - **Adoption**
    - Unique players (total in period)
    - New players (new in period)
    - Growth rate (% change from previous period)
  - **Engagement**
    - Total rounds played
    - Round completion rate (%)
    - Median session time (minutes:seconds)
    - Daily participation rate (%)
  - **Retention**
    - Day-1 retention (%)
    - Day-7 returning users (count)
  - **Performance**
    - Median load time (ms)
    - Median map latency (ms)
    - Target indicators (green/red based on thresholds)
  - **Content Health**
    - Days scheduled ahead
    - Photo pool size
    - Photos available for daily
    - Photos used in daily (60-day window)

- **Charts Section**
  - **Daily Active Users Trend**
    - Line chart showing DAU over time
    - Hover tooltips with exact values
  - **Score Distribution**
    - Histogram or box plot
    - Shows distribution of daily submission scores
  - **Round Completion Funnel**
    - Visualization: Photo 1 → Photo 2 → ... → Photo 5
    - Drop-off rates between photos
  - **Popular Photos** (optional)
    - Table showing photos with most plays
    - Average score per photo
    - Difficulty rating (based on average errors)

- **Events Table** (optional, collapsible)
  - Searchable, filterable event log
  - Event type, count, timestamp
  - Drill-down for details

- **Export Options**
  - "Export CSV" button for data download
  - "Print Report" (print-friendly format)

**UX Considerations**:

- Clear, scannable KPI cards
- Interactive charts (hover for details)
- Responsive chart sizing
- Loading states for data fetching
- Real-time updates (optional: refresh button)
- Comparative metrics (vs. previous period)

**Accessibility Considerations**:

- Text alternatives for charts (data tables)
- Keyboard accessible date picker
- ARIA labels for KPI values
- High contrast mode support
- Screen reader announcements for data updates

**Security Considerations**:

- Admin authentication required
- Aggregate data only (no PII)
- Rate limiting on analytics queries
- Audit log for data exports

---

## 3. User Journey Map

### 3.1 Primary User Journey: First-Time Daily Challenge Player

**Objective**: Complete first daily challenge and appear on leaderboard.

**Steps**:

1. **Discovery & Landing** (Home View)
   - User visits site for first time
   - Device token automatically generated and stored
   - User sees game explanation and mode options
   - Reads "How to Play" section
   - Clicks "Play Daily Challenge" button

2. **Nickname Setup** (Nickname Settings View or Inline Prompt)
   - User is prompted: "Set a nickname to join the leaderboard"
   - Enters nickname (e.g., "FootyFan")
   - Checks consent box
   - Clicks "Save Nickname"
   - System validates and saves (PUT /api/devices/nickname)
   - Redirected to Game View

3. **Game Initialization** (Game View)
   - System fetches today's daily set (GET /api/daily/sets/today)
   - Photo 1 loads with map and year picker
   - Timer starts
   - User sees "Daily Challenge - Photo 1 of 5"

4. **Playing Photo 1** (Game View)
   - User examines photo (analyzing visual cues)
   - Zooms and pans map to find location
   - Clicks map to place pin
   - Adjusts year slider to selected year
   - Clicks "Submit Guess"
   - System calculates and displays feedback:
     - Shows both pins connected by line
     - Displays km error and year error
     - Shows scores (location + time = photo total)
   - User clicks "Next Photo"

5. **Playing Photos 2-5** (Game View)
   - Repeat step 4 for each photo
   - Running total score displayed
   - Timer continues running
   - After Photo 5, user clicks "See Results"

6. **Round Summary & Submission** (Round Summary View)
   - System stops timer (total time: 4:05)
   - Displays total score (e.g., 87,550 / 100,000)
   - Shows breakdown for all 5 photos with event details revealed
   - System automatically submits to leaderboard (POST /api/daily/submissions)
   - Server validates scores and saves submission
   - Displays leaderboard rank: "You're ranked #7 today!"
   - Analytics event logged

7. **Leaderboard Viewing** (Leaderboard View)
   - User clicks "View Full Leaderboard"
   - Sees Top-10 list with their position highlighted
   - Compares scores and times
   - Sees total submissions count
   - Option to share results (future) or play normal mode

8. **Return Visit** (Home View)
   - User returns same day
   - Sees "Already played today" badge on Daily Challenge
   - Can play Normal Mode or view leaderboard
   - Can play Daily again for practice (not submitted)

### 3.2 Alternative Journey: Normal Mode Player

**Objective**: Practice skills without leaderboard pressure.

**Steps**:

1. **Landing** (Home View)
   - User clicks "Play Normal" button
   - No nickname required

2. **Game Play** (Game View)
   - System fetches 5 random photos (GET /api/normal/photos)
   - User plays through 5 photos (same mechanics as Daily)
   - No timer displayed (or timer for self-tracking only)

3. **Round Summary** (Round Summary View)
   - Scores calculated (POST /api/normal/calculate-score)
   - Results displayed (not saved server-side)
   - Event details revealed
   - CTA: "Play Again" or "Try Daily Challenge"

4. **Repeat or Convert**
   - User can play unlimited Normal rounds
   - May choose to try Daily Challenge
   - If trying Daily, follows Daily journey (nickname setup, etc.)

### 3.3 Admin Journey: Scheduling Daily Sets

**Objective**: Ensure continuous daily content pipeline.

**Steps**:

1. **Admin Login**
   - Admin authenticates (Supabase Auth with admin role)
   - Redirected to Admin Dashboard

2. **Check Schedule Status** (Admin Daily Sets View)
   - Admin sees "12 days scheduled ahead" (yellow warning)
   - Decides to create more daily sets

3. **Create Daily Set** (Admin Daily Sets View)
   - Clicks "Create Daily Set"
   - Selects date: October 30, 2025
   - Filters photos: "Show only eligible, exclude recent"
   - Browses photo grid
   - Selects 5 photos (checking variety, difficulty)
   - Arranges order (drag or reorder)
   - Clicks "Save and Publish"
   - System validates (all checks pass)
   - Daily set published for October 30

4. **Repeat for Multiple Dates**
   - Admin creates sets for Oct 31, Nov 1, Nov 2, etc.
   - Schedule status updates to "15 days ahead" (green)

5. **Monitor Content** (Admin Dashboard)
   - Reviews photo pool
   - Uploads new photos as needed
   - Checks analytics for popular photos

### 3.4 Edge Case Journey: Already Submitted Daily

**Scenario**: User tries to play Daily Challenge after already submitting.

**Steps**:

1. **Landing** (Home View)
   - User sees "Already played today" badge on Daily Challenge card
   - Can still click to play (for practice)

2. **Game Play with Notice** (Game View)
   - Banner displays: "You've already submitted today's challenge. This is a practice round and won't affect your leaderboard position."
   - User plays through as normal
   - Timer still runs (for self-tracking)

3. **Practice Summary** (Round Summary View)
   - Scores displayed
   - Comparison shown: "Your submitted score: 87,550 | Practice score: 92,000"
   - Message: "Great improvement! Try again tomorrow."
   - No submission to leaderboard
   - CTA: "View Leaderboard" to see current rank

### 3.5 Error Recovery Journey: Submission Failure

**Scenario**: Network error during daily submission.

**Steps**:

1. **Submission Attempt** (Round Summary View)
   - User completes 5 photos
   - System attempts to submit (POST /api/daily/submissions)
   - Network error occurs (e.g., offline, timeout)

2. **Error Handling**
   - Error message displayed: "Couldn't submit your score. Please check your connection and try again."
   - "Retry Submission" button appears
   - Scores and data cached locally (localStorage)

3. **Retry**
   - User clicks "Retry Submission"
   - System re-attempts submission
   - Success: Shows leaderboard rank
   - Failure: Offers to save results locally and submit later

4. **Manual Recovery** (if needed)
   - User navigates to Home
   - Sees "Resume submission" prompt (if cached data exists)
   - Clicks prompt
   - System attempts submission with cached data

---

## 4. Layout and Navigation Structure

### 4.1 Global Navigation Layout

**Primary Navigation Bar** (present on all public views):

- **Position**: Top of viewport, fixed/sticky on scroll
- **Contents** (left to right):
  - **Logo/Wordmark** (left): "FootyGuess Daily" - links to Home
  - **Nav Links** (center or right):
    - "Play" (dropdown or direct to mode selection on Home)
    - "Leaderboard"
    - "How to Play" (modal or anchor to Home section)
  - **User Menu** (right):
    - Nickname display (if set): "FootyFan" with icon
    - Settings icon → dropdown menu:
      - "Nickname Settings"
      - "About"
      - "Credits"
      - "Privacy Policy"
- **Mobile**: Hamburger menu (all items in drawer)

**Footer** (present on Home, Leaderboard, Credits):

- Copyright notice
- Links: Privacy Policy | Credits | About | Contact
- Daily reset notice: "Leaderboard resets daily at 00:00 UTC"

### 4.2 Game View Layout (Full-Screen Focus)

**Layout** (minimal navigation during gameplay):

- **Header** (minimal, can hide on scroll):
  - Mode badge (left)
  - Progress indicator (center)
  - Timer (right, if Daily)
  - Exit/Menu button (far right)
- **Main Content** (responsive 2-column on desktop, stacked on mobile):
  - **Photo Column** (left or top):
    - Photo (large)
    - Photo counter
  - **Interaction Column** (right or bottom):
    - Map (large, scrollable)
    - Year picker
    - Submit button
    - Feedback section (appears after submit)
- **No Footer** (distraction-free)

**Exit Behavior**:

- Exit button shows confirmation: "Leave game? Progress will be lost."
- Exception: Daily mode saves progress in session storage (optional)

### 4.3 Admin Navigation Layout

**Admin Navigation Sidebar** (persistent on all admin views):

- **Position**: Left side, collapsible on mobile
- **Contents**:
  - **Logo/Admin Branding** (top)
  - **Nav Items**:
    - Dashboard (photos management)
    - Daily Sets
    - Analytics
  - **User Section** (bottom):
    - Admin username
    - Logout button

**Admin Content Area**:

- **Header Bar** (top):
  - Page title
  - Breadcrumb navigation (optional)
  - Action buttons (e.g., "Upload Photo")
- **Main Content**:
  - Tables, forms, cards as per view
- **No public footer**

### 4.4 Responsive Breakpoints

**Mobile** (<768px):

- Single column layouts
- Hamburger menu for navigation
- Stacked photo + map in Game View
- Card-based lists instead of tables
- Larger touch targets (min 44x44px)
- Collapsible sections to save space

**Tablet** (768px - 1024px):

- Two-column layouts where applicable
- Expanded navigation (optional)
- Side-by-side photo + map in Game View (landscape)
- Tables with horizontal scroll if needed

**Desktop** (>1024px):

- Multi-column layouts
- Full navigation bar
- Optimized use of horizontal space
- Larger map viewport in Game View
- Tables with full columns visible

### 4.5 Navigation Flow Diagram

```
HOME
├─→ Play Normal ──→ GAME VIEW (Normal) ──→ ROUND SUMMARY ──→ Home or Play Again
├─→ Play Daily ──→ [Nickname Setup] ──→ GAME VIEW (Daily) ──→ ROUND SUMMARY ──→ LEADERBOARD
├─→ Leaderboard ──→ LEADERBOARD VIEW ──→ Play Daily (if not played)
├─→ How to Play (modal/section on Home)
└─→ Settings ──→ NICKNAME SETTINGS ──→ Back to previous view

LEADERBOARD
├─→ Date selection ──→ Refresh leaderboard data
├─→ Play Daily Challenge ──→ GAME VIEW (Daily)
└─→ Home

CREDITS
└─→ Search/Filter ──→ Filtered results

ADMIN (separate auth)
├─→ Dashboard ──→ Upload/Edit Photos
├─→ Daily Sets ──→ Create/Edit/Publish Sets
└─→ Analytics ──→ View KPIs
```

---

## 5. Key Components

### 5.1 Interactive Map Component

**Used In**: Game View

**Purpose**: Allow users to explore world geography and place a pin to guess event location.

**Key Features**:

- Mapbox GL JS integration
- Single pin placement (click or tap)
- Zoom controls (+/- buttons)
- Pan (drag or arrow keys)
- Reset view button (return to default zoom/center)
- Pin can be moved before submission
- After submission: Shows two pins (guess + correct) with connecting line

**Props/Configuration**:

- `mode`: 'input' | 'feedback'
- `userPin`: {lat, lon} | null
- `correctPin`: {lat, lon} | null (for feedback mode)
- `onPinPlaced`: callback function
- `disabled`: boolean (during loading)

**Accessibility**:

- Keyboard controls (arrows to pan, +/- to zoom, Enter to place pin)
- Screen reader announcements ("Pin placed at latitude X, longitude Y")
- Alternative coordinate input for users unable to use map
- Focus indicators on controls

---

### 5.2 Year Picker Component

**Used In**: Game View

**Purpose**: Allow users to select a year between 1880 and 2025.

**Key Features**:

- Slider input with year display (primary UI)
- Numeric input option (for precision)
- Visual range indicator (1880 ←────●────→ 2025)
- Large, touch-friendly controls
- Keyboard accessible (arrow keys, type to jump)

**Props/Configuration**:

- `value`: number (1880-2025)
- `onChange`: callback function
- `min`: 1880
- `max`: 2025
- `disabled`: boolean

**Accessibility**:

- Label: "What year was this?"
- ARIA slider role
- Value announcements on change
- Keyboard support (arrows, Page Up/Down, Home/End)

---

### 5.3 Photo Feedback Component

**Used In**: Game View (after submission)

**Purpose**: Display visual and numerical feedback on guess accuracy.

**Key Features**:

- Dual map view (user pin + correct pin + connecting line)
- Distance in km (calculated via Haversine formula)
- Year difference
- Score breakdown (location score, time score, photo total)
- Running total score
- Animated reveal (optional)

**Layout**:

- Map section (top)
- Metrics cards (bottom, 2-column grid):
  - Location: "245 km off → 8,775 pts"
  - Time: "3 years off → 8,800 pts"
  - Total: "17,575 / 20,000"

**Accessibility**:

- ARIA live region for score announcements
- Text alternatives for visual map
- Clear semantic structure (headings, lists)

---

### 5.4 Progress Indicator Component

**Used In**: Game View (header)

**Purpose**: Show player's position in the 5-photo round.

**Key Features**:

- 5 circles representing photos
- Current photo highlighted/filled
- Completed photos marked (checkmark or filled)
- Upcoming photos outlined

**Visual Design**:

```
○ ○ ● ○ ○  (on Photo 3)
✓ ✓ ● ○ ○  (alternative with completed markers)
```

**Accessibility**:

- Text alternative: "Photo 3 of 5"
- ARIA current marker
- Screen reader announcement on photo change

---

### 5.5 Leaderboard Table Component

**Used In**: Leaderboard View

**Purpose**: Display ranked list of daily submissions with scores and times.

**Key Features**:

- Responsive table (desktop) / card list (mobile)
- Top-3 visual distinction (medals: 🥇🥈🥉)
- Current user highlight (background color)
- Sortable by rank (default), score, time (optional)
- Hover states for rows
- Tie-breaker tooltip

**Columns**:

- Rank | Nickname | Score | Time | Submitted At (optional on mobile)

**Accessibility**:

- Table semantics (thead, tbody, th with scope)
- Row headers for screen readers
- Clear focus indicators
- Sort announcements

---

### 5.6 Nickname Form Component

**Used In**: Nickname Settings View, Round Summary (inline)

**Purpose**: Allow users to set or update their display nickname.

**Key Features**:

- Text input with validation
- Real-time character counter (12 / 20)
- Validation feedback (inline, immediate)
- Consent checkbox (first-time only)
- Privacy notice (expandable)
- Save button (disabled until valid)

**Validation Rules**:

- Length: 3-20 characters
- Pattern: `^[a-zA-Z0-9 _-]+$`
- Profanity filter (server-side, client feedback)

**Accessibility**:

- Label associated with input
- Error messages linked (aria-describedby)
- ARIA live region for validation updates
- Required field indicator

---

### 5.7 Photo Card Component

**Used In**: Round Summary View, Admin Dashboard, Credits View

**Purpose**: Display photo with metadata and optional actions.

**Key Features**:

- Responsive image (thumbnail or full-size)
- Event name, year, location
- Score (if applicable)
- Expandable description
- Photo credit (small text)
- Action buttons (context-dependent)

**Variants**:

- **Summary Card**: Shows scores, errors, event details
- **Admin Card**: Shows eligibility, actions (edit, delete)
- **Credits Card**: Shows license, source link

**Accessibility**:

- Alt text for images
- Heading hierarchy (h3 for event name)
- Expandable description accessible
- Clear link/button labels

---

### 5.8 Modal/Dialog Component

**Used In**: Multiple views (upload, confirm delete, nickname setup, etc.)

**Purpose**: Display focused content overlaying main view.

**Key Features**:

- Overlay backdrop (semi-transparent)
- Centered content area
- Close button (X) or Cancel action
- Responsive sizing
- Scroll within modal if content exceeds viewport

**Accessibility**:

- Focus trap (tab cycles within modal)
- Focus moves to modal on open
- Focus returns to trigger on close
- ESC key closes modal
- ARIA role="dialog"
- aria-modal="true"
- aria-labelledby for title

---

### 5.9 Toast/Notification Component

**Used In**: All views (success, error, info messages)

**Purpose**: Provide non-intrusive feedback for user actions.

**Key Features**:

- Auto-dismiss after 3-5 seconds (configurable)
- Manual dismiss (X button)
- Stacked notifications (bottom-right or top-right)
- Color-coded by type (success=green, error=red, info=blue)
- Icon for type

**Accessibility**:

- ARIA live region (polite or assertive based on type)
- Screen reader announcements
- Focus management (optional: focus on dismiss if critical)

---

### 5.10 Loading State Components

**Used In**: All views during async operations

**Purpose**: Indicate loading state and maintain layout stability.

**Variants**:

- **Skeleton Loader**: For content placeholders (photo cards, tables)
- **Spinner**: For button loading states
- **Progress Bar**: For file uploads (admin)
- **Full-Page Loader**: For initial app load

**Accessibility**:

- ARIA live region: "Loading content..."
- Focus management (prevent interaction during load)
- Timeout fallback (show error if load fails)

---

### 5.11 Error State Components

**Used In**: All views for error handling

**Purpose**: Communicate errors clearly and offer recovery actions.

**Key Features**:

- Error message (clear, friendly language)
- Error icon
- Suggested action (retry, go back, contact support)
- Contextual help (e.g., "Check your internet connection")

**Variants**:

- **Inline Error**: Form validation, API failures
- **Page-Level Error**: 404, 500, network offline
- **Empty State**: No data available (e.g., "No submissions yet")

**Accessibility**:

- ARIA live region for dynamic errors
- Error messages linked to form fields
- Focus on error or first invalid field
- Color + icon (not color alone)

---

### 5.12 Date/Time Display Components

**Used In**: Leaderboard, Admin Daily Sets, Round Summary

**Purpose**: Display dates and times in consistent, accessible format.

**Key Features**:

- Formatted display: "October 21, 2025"
- Time display: "2:15" or "02:15:30"
- Relative time (optional): "2 hours ago"
- UTC indicator for daily reset times
- Tooltip for full timestamp (hover)

**Accessibility**:

- time element with datetime attribute
- Screen reader friendly format
- Timezone clarity (UTC vs local)

---

## 6. User Stories Mapping to UI Architecture

### Mapping of PRD User Stories to UI Elements

| User Story ID | User Story Title                       | Primary View(s)                           | Key UI Components                                                                        | Notes                                                |
| ------------- | -------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| US-001        | Play a Normal round                    | Home → Game → Round Summary               | Mode selection button, Interactive Map, Year Picker, Photo Feedback, Round Summary cards | Full flow from mode selection to results             |
| US-002        | Play the Daily round                   | Home → Game → Round Summary → Leaderboard | Daily Challenge button, Nickname prompt, Game View with timer, Submission confirmation   | Includes first-attempt tracking notice               |
| US-003        | Place a pin on map                     | Game View                                 | Interactive Map Component (Mapbox)                                                       | Includes zoom, pan, pin placement, keyboard controls |
| US-004        | Select a year                          | Game View                                 | Year Picker Component (slider + input)                                                   | Bounded 1880-2025, validation                        |
| US-005        | See per-photo feedback                 | Game View                                 | Photo Feedback Component                                                                 | Dual pins, connecting line, score breakdown          |
| US-006        | Round summary                          | Round Summary View                        | Summary header, Photo breakdown cards, Total score display                               | Event details revealed                               |
| US-007        | Leaderboard submission (first attempt) | Round Summary View                        | Submission logic, Rank display, "Already submitted" notice                               | Device token enforcement                             |
| US-008        | View Top-10 leaderboard                | Leaderboard View                          | Leaderboard Table Component, Date selector                                               | Tie-breakers applied server-side                     |
| US-009        | Set or edit nickname                   | Nickname Settings View                    | Nickname Form Component                                                                  | Validation, profanity filter, consent                |
| US-010        | Anonymous device token                 | All views (background)                    | Middleware, localStorage/cookie                                                          | Transparent to user, drives first-attempt rule       |
| US-011        | Reveal event details                   | Round Summary View                        | Photo Card Components with descriptions                                                  | Shows after round completion                         |
| US-012        | Daily scheduler                        | Admin Daily Sets View                     | Schedule status card, Daily sets list, Create form                                       | Admin-only, ensures content pipeline                 |
| US-013        | Content ingestion                      | Admin Dashboard                           | Upload Photo modal, Metadata form, Validation messages                                   | Admin-only, validation on client and server          |
| US-014        | Performance                            | All views                                 | Optimized components, lazy loading, CDN images                                           | <2s load, <200ms map latency targets                 |
| US-015        | Analytics events                       | All views (background)                    | Event tracking calls to API                                                              | Minimal performance impact                           |
| US-016        | Privacy and retention                  | Nickname Settings, Footer                 | Privacy notice, Consent checkbox, Policy link                                            | Minimal data collection messaging                    |
| US-017        | Error handling                         | All views                                 | Error State Components, Retry buttons, Offline detection                                 | Clear messaging, recovery actions                    |
| US-018        | Secure submissions                     | Round Summary (background)                | Server-side validation, Rate limiting                                                    | Transparent to UI, security backend                  |
| US-019        | Credits and licensing                  | Credits View                              | Credits List, Photo Card Components                                                      | Searchable, filterable, with source links            |
| US-020        | Accessibility                          | All views                                 | ARIA labels, keyboard navigation, focus management                                       | WCAG AA compliance                                   |
| US-021        | Multiple Daily plays                   | Game View, Round Summary                  | "Already submitted" banner, Practice mode notice                                         | Allows replay without re-submission                  |
| US-022        | Session timing                         | Game View                                 | Timer Component (Daily mode)                                                             | Starts on photo 1, stops on final submit             |
| US-023        | Image optimization                     | All views                                 | Responsive images, lazy loading, CDN                                                     | Sharp images, fast load                              |
| US-024        | Admin schedule view                    | Admin Daily Sets View                     | Schedule status card, Calendar view (optional)                                           | Shows next 7-20 days, flags issues                   |
| US-025        | Consent for nickname                   | Nickname Settings View                    | Consent checkbox, Privacy notice                                                         | Required before first leaderboard submission         |

---

## 7. Requirements to UI Elements Explicit Mapping

### Core Gameplay Requirements

| Requirement                                       | UI Solution                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------------ |
| 5 photos per round                                | Progress Indicator Component (5 circles), Photo counter ("Photo 3 of 5") |
| Map pin placement                                 | Interactive Map Component with single pin, zoom/pan controls             |
| Year selection (1880-2025)                        | Year Picker Component with slider and bounded validation                 |
| Linear scoring (caps at 10k per dimension)        | Score display in Photo Feedback Component, Server calculates             |
| Per-photo feedback (km error, year delta, scores) | Photo Feedback Component with dual pins, metrics cards                   |
| End-of-round summary                              | Round Summary View with total score, time, and photo breakdown           |

### Mode Requirements

| Requirement                        | UI Solution                                                                                   |
| ---------------------------------- | --------------------------------------------------------------------------------------------- |
| Normal mode (unlimited, not saved) | "Play Normal" button on Home, no nickname required, results not persisted                     |
| Daily mode (first attempt counts)  | "Play Daily" button, nickname prompt, submission to leaderboard, "Already submitted" handling |
| Daily reset at 00:00 UTC           | Date selector on Leaderboard, notice in footer, Admin scheduling interface                    |

### Leaderboard Requirements

| Requirement                         | UI Solution                                          |
| ----------------------------------- | ---------------------------------------------------- |
| Daily Top-10 global leaderboard     | Leaderboard View with ranked table, date selector    |
| Tie-breakers (time, then timestamp) | Server-side sorting, tooltip explaining tie-breaking |
| Nickname (3-20 chars, validated)    | Nickname Form Component with real-time validation    |
| Profanity filter                    | Server-side filtering, client-side error feedback    |

### Privacy Requirements

| Requirement                           | UI Solution                                             |
| ------------------------------------- | ------------------------------------------------------- |
| Minimal data collection (no email/IP) | No login forms, anonymous device token (transparent)    |
| Anonymous device token                | Generated on first visit, stored in localStorage/cookie |
| Consent for public display            | Checkbox in Nickname Settings, privacy notice           |
| 30-90 day retention                   | Privacy Policy text, no UI beyond documentation         |

### Platform & Performance Requirements

| Requirement                        | UI Solution                                                    |
| ---------------------------------- | -------------------------------------------------------------- |
| Web-first, mobile-responsive       | Responsive layouts, mobile-first CSS, touch-optimized controls |
| Mapbox integration                 | Interactive Map Component using Mapbox GL JS                   |
| Initial load <2s on 4G             | Code splitting, lazy loading, optimized assets                 |
| Map interactions <200ms            | Optimized Mapbox configuration, debouncing where applicable    |
| Accessibility (keyboard nav, ARIA) | All components accessible, WCAG AA compliance                  |

### Content & Operations Requirements

| Requirement                     | UI Solution                                               |
| ------------------------------- | --------------------------------------------------------- |
| 100 unique photos               | Admin Dashboard for management, upload interface          |
| Photo metadata schema           | Upload form with all required fields, validation          |
| Daily scheduling (7-day buffer) | Admin Daily Sets View with schedule status, warnings      |
| Fallback for removed photos     | Admin interface to manage eligibility, backup sets        |
| Rate limits                     | Error messages with retry-after info, toast notifications |

---

## 8. User Pain Points and UI Solutions

### Pain Point 1: "I don't know how to play"

**UI Solutions**:

- Clear, concise explanation on Home View (hero section)
- "How to Play" expandable section or modal
- Visual示例 of gameplay (optional screenshot or animation)
- First-time user tooltips in Game View (optional for MVP)
- Breadcrumb trail of progress (progress indicator)

---

### Pain Point 2: "I accidentally submitted the wrong guess"

**UI Solutions**:

- Submit button only enabled when both pin and year selected
- Clear visual state of pin placement (confirm pin is where intended)
- Feedback shown after submit (non-destructive, can see results)
- **Trade-off**: No undo functionality in MVP (accept that guesses are final)
- **Future**: Optional confirmation dialog "Submit this guess?"

---

### Pain Point 3: "I can't find where to set my nickname"

**UI Solutions**:

- Inline nickname prompt on first Daily attempt (within game flow)
- Visible nickname display in header/nav when set (with icon)
- Clear "Settings" or "Nickname" link in user menu
- Breadcrumb in Nickname Settings for easy navigation back
- Toast notification after saving: "Nickname saved!"

---

### Pain Point 4: "I already played Daily today but can't see my score"

**UI Solutions**:

- "Already played today" badge on Daily Challenge card (Home View)
- Display previous submission score on Home (optional)
- Leaderboard shows user's rank (if in Top-10) or position (future enhancement)
- Practice mode notice in Game View: "This is a practice round"
- Round Summary shows comparison: "Your submitted score vs. practice score"

---

### Pain Point 5: "The map is hard to use on mobile"

**UI Solutions**:

- Large touch targets for zoom buttons (min 44x44px)
- Responsive map sizing (optimized for viewport)
- Clear pin placement indicator (larger pin icon)
- Pinch-to-zoom support (native Mapbox feature)
- Drag to pan (smooth, responsive)
- Alternative: Coordinate input for precise placement
- Testing on various mobile devices (iOS, Android)

---

### Pain Point 6: "I don't know if my submission worked"

**UI Solutions**:

- Loading state during submission (spinner, "Submitting...")
- Success confirmation with rank: "Submitted! You're ranked #7 today!"
- Error message with retry option: "Submission failed. Retry?"
- Automatic redirect to Leaderboard after successful submission
- Toast notification for errors (persistent until dismissed)
- Local storage backup (resume submission if page reloads)

---

### Pain Point 7: "I can't see my ranking if I'm not in Top-10"

**UI Solutions** (MVP scope):

- Show Top-10 only (as per PRD requirements)
- Display total submissions count for context: "245 players today"
- **Future enhancement**: Show user's rank below Top-10 (e.g., "Your rank: #25")
- **Future enhancement**: Percentile display (e.g., "Top 15%")

**Current MVP approach**:

- Focus on Top-10 competitive aspect
- Total submissions provides context of participation level

---

### Pain Point 8: "I want to see past daily challenges"

**UI Solutions**:

- Date selector on Leaderboard View (today, yesterday, last 7 days)
- Ability to view historical leaderboards (data retained 30-90 days)
- **Future enhancement**: Archive of past daily sets (playable for practice)
- **MVP**: Focus on current and recent leaderboards

---

### Pain Point 9: "The game is too hard / too easy"

**UI Solutions** (primarily content curation, limited UI):

- Admin analytics show average scores and difficulty ratings per photo
- Admin can balance daily sets with mix of difficulty levels
- **Future**: Difficulty indicator on photos (easy/medium/hard)
- **Future**: Progressive difficulty (start easy, get harder)
- **MVP**: Balanced curation through admin photo selection

---

### Pain Point 10: "I want to compete with friends, not strangers"

**UI Solutions** (out of scope for MVP, but noted):

- **MVP**: Global leaderboard only
- **Future**: Friend codes, private leaderboards
- **Future**: Social sharing ("Challenge your friends!")
- **MVP approach**: Focus on global competition, simple sharing

---

## 9. Accessibility Checklist per View

### All Views (Global Standards)

- ✓ Semantic HTML (headings, landmarks, lists)
- ✓ Skip to main content link
- ✓ Keyboard navigation (tab order, focus indicators)
- ✓ Color contrast WCAG AA (4.5:1 text, 3:1 UI)
- ✓ No color-only information (use icons + text)
- ✓ Responsive text sizing (rem units, scalable)
- ✓ Alt text for all images
- ✓ ARIA labels for interactive elements
- ✓ Focus management (modals, dynamic content)
- ✓ Screen reader testing (NVDA, JAWS, VoiceOver)

### Game View Specific

- ✓ Map keyboard controls (arrow keys, zoom, pin placement)
- ✓ Screen reader descriptions for map state
- ✓ Alternative coordinate input for motor impairments
- ✓ ARIA live regions for score announcements
- ✓ Timer display screen reader accessible
- ✓ Focus moves to feedback section after submit
- ✓ Progress indicator has text alternative

### Forms (Nickname Settings, Admin Upload)

- ✓ Labels associated with inputs (for/id or aria-labelledby)
- ✓ Required field indicators (visual + aria-required)
- ✓ Error messages linked (aria-describedby)
- ✓ ARIA live regions for validation feedback
- ✓ Focus on first error field on submit
- ✓ Clear instructions and help text

### Tables (Leaderboard, Admin Lists)

- ✓ Table semantics (thead, tbody, th, td)
- ✓ Column headers with scope attribute
- ✓ Row headers where applicable
- ✓ Sortable columns announced to screen readers
- ✓ Responsive table (horizontal scroll or card layout on mobile)

---

## 10. Security & Privacy Considerations per View

### Home View

- **Security**: No sensitive data, public content
- **Privacy**: Device token generated on first visit (localStorage/cookie)
- **Best Practice**: Privacy Policy link in footer

### Game View

- **Security**: Client-side scoring for feedback only, server recalculates
- **Privacy**: No PII collected during play, anonymous device token used
- **Best Practice**: Rate limiting on submission endpoint (server-side)

### Round Summary View

- **Security**: Server validates all scores, rejects mismatches
- **Privacy**: Minimal data stored (nickname, score, time, device token)
- **Best Practice**: Consent required before first leaderboard submission

### Leaderboard View

- **Security**: Public endpoint, rate limited
- **Privacy**: Only nicknames and scores displayed (no PII)
- **Best Practice**: Profanity filter applied server-side to nicknames

### Nickname Settings View

- **Security**: Input sanitization (prevent XSS), server-side validation
- **Privacy**: Consent checkbox required, clear privacy notice
- **Best Practice**: Device token verified, rate limiting on update endpoint

### Credits View

- **Security**: External links with rel="noopener noreferrer"
- **Privacy**: No user data, public content
- **Best Practice**: Compliance with photo licenses

### Admin Views

- **Security**: Authentication required (Supabase Auth + admin role), CSRF protection
- **Privacy**: Access to aggregate data only, no PII in analytics
- **Best Practice**: IP allowlist recommended, audit logging for actions, rate limiting

---

## 11. Performance Optimization Strategy per View

### Home View

- **Optimizations**:
  - Static content (can be cached)
  - Lazy load images (hero image, mode cards)
  - Minimal JavaScript (mostly static)
  - Inline critical CSS
- **Target**: <1s initial load

### Game View

- **Optimizations**:
  - Code splitting (Mapbox loaded on demand)
  - Lazy load photos (preload next photo)
  - Debounce map interactions
  - Optimize Mapbox configuration (limit zoom levels, tile quality)
  - Image CDN for photos (responsive sizes)
- **Target**: <200ms map interaction latency

### Round Summary View

- **Optimizations**:
  - Lazy load photo thumbnails
  - Virtualized list for photo breakdown (if many photos, future)
  - Cached event details (if previously loaded)
- **Target**: Instant load (data already in memory from game)

### Leaderboard View

- **Optimizations**:
  - Server-side caching (5-minute TTL for leaderboard data)
  - Client-side caching (cache per date)
  - Pagination (if expanding beyond Top-10)
  - ETag headers for conditional requests
- **Target**: <500ms load

### Admin Views

- **Optimizations**:
  - Pagination (50 items per page)
  - Lazy load thumbnails
  - Debounced search/filter
  - Infinite scroll or "Load More" for large lists
  - Optimistic UI updates (e.g., nickname save, photo upload)
- **Target**: <1s load for lists, <3s for uploads

### Global Optimizations

- Compression (gzip/brotli) for all text assets
- CDN for static assets (CSS, JS, images)
- Service worker for offline support (future enhancement)
- Bundle size optimization (tree shaking, code splitting)
- Font loading optimization (font-display: swap)

---

## 12. Component Reusability Matrix

| Component              | Used In                                              | Variants                                            |
| ---------------------- | ---------------------------------------------------- | --------------------------------------------------- |
| **Button**             | All views                                            | Primary, Secondary, Destructive, Disabled, Loading  |
| **Card**               | Round Summary, Leaderboard, Admin Dashboard, Credits | Photo Card, Stats Card, KPI Card, Leaderboard Entry |
| **Modal**              | All views                                            | Upload, Confirm Delete, Nickname Setup, How to Play |
| **Form Input**         | Nickname Settings, Admin Upload                      | Text, Number, Textarea, Dropdown, Checkbox          |
| **Table**              | Leaderboard, Admin Lists                             | Sortable, Filterable, Responsive (cards on mobile)  |
| **Progress Indicator** | Game View                                            | 5-step circular, Linear progress bar (upload)       |
| **Toast Notification** | All views                                            | Success, Error, Info, Warning                       |
| **Loading Skeleton**   | All views                                            | Card skeleton, Table skeleton, Image skeleton       |
| **Error State**        | All views                                            | Inline error, Page error, Empty state               |
| **Date Picker**        | Admin Daily Sets, Analytics                          | Single date, Date range                             |

---

## 13. State Management Considerations

### Client-Side State (React State/Context)

- **User State**:
  - Device token (from localStorage/cookie)
  - Nickname (from API or localStorage)
  - Has submitted today (from API check)

- **Game State**:
  - Current mode (Normal or Daily)
  - Current photo index (1-5)
  - Round ID
  - Guesses array (5 guesses)
  - Timer (start time, elapsed time)
  - Running total score

- **UI State**:
  - Loading states (photo loading, submission in progress)
  - Error states (map failed, submission failed)
  - Modal open/closed
  - Toast notifications

### Server State (API + Caching)

- **Photos**: Fetched from API, cached for session
- **Daily Set**: Fetched once per day, cached
- **Leaderboard**: Fetched per date, cached with TTL
- **Nickname**: Fetched on load, updated via API
- **Analytics Events**: Posted to API, fire-and-forget

### Persistence Strategy

- **localStorage**: Device token, nickname (backup), cached daily set (optional)
- **Session Storage**: Game progress (optional, for accidental refresh)
- **Cookies**: Device token (alternative to localStorage)
- **Server Database**: Daily submissions, nicknames, photos, daily sets

---

## 14. Edge Cases Handling Summary

| Edge Case                                     | UI Handling                                                                                   |
| --------------------------------------------- | --------------------------------------------------------------------------------------------- |
| No daily set available today                  | Error message on Home, CTA to play Normal mode, Admin alert                                   |
| Already submitted daily challenge             | Badge on Home, notice in Game View, comparison in Round Summary                               |
| Network error during submission               | Error message, "Retry" button, cache data for later retry                                     |
| Invalid/profane nickname                      | Inline error, clear message, suggest alternative                                              |
| Map fails to load                             | Error message, "Retry" button, fallback to coordinate input (optional)                        |
| Insufficient photos for normal mode           | Error message, "Service unavailable", contact admin                                           |
| Device token not available (privacy settings) | Graceful degradation, disable Daily submission, show notice                                   |
| Admin deleting used photo                     | Server rejects (409 Conflict), error message "Cannot delete used photo"                       |
| Admin scheduling past date                    | Warning message, allow with confirmation (for testing)                                        |
| Duplicate daily set for same date             | Server rejects (409 Conflict), error message "Set already exists"                             |
| Slow network (photos not loading)             | Loading skeleton, timeout message, "Retry" option                                             |
| User navigates away mid-game                  | Confirmation dialog "Leave game? Progress will be lost" (Daily mode: save to session storage) |
| Leaderboard date with no submissions          | Empty state "No submissions yet for this date"                                                |

---

## 15. Future Enhancements (Out of Scope for MVP)

While not part of the MVP, the UI architecture should be designed with these potential enhancements in mind:

1. **Social Features**:
   - Friend leaderboards
   - Social sharing (results cards)
   - Challenge friends directly

2. **Advanced Gameplay**:
   - Difficulty levels
   - Hints/power-ups (e.g., "reveal continent")
   - Time-limited bonus rounds

3. **User Accounts**:
   - Registration/login (email, social)
   - User profiles with stats
   - Achievement badges

4. **Content Expansion**:
   - Multi-language support
   - Regional leaderboards
   - Themed daily sets (e.g., "World Cup Week")

5. **Mobile Apps**:
   - Native iOS/Android apps
   - Push notifications for daily challenges
   - Offline mode

6. **Analytics & Personalization**:
   - Recommended practice photos (based on weak areas)
   - Personal stats dashboard
   - Difficulty rating per photo

---

## 16. Conclusion

This UI architecture for **FootyGuess Daily** provides a comprehensive blueprint for a web-first, mobile-responsive game that balances simplicity with competitive depth. The design prioritizes:

- **User Experience**: Clear navigation, intuitive gameplay, immediate feedback
- **Accessibility**: WCAG AA compliance, keyboard navigation, screen reader support
- **Performance**: Fast load times, responsive interactions, optimized assets
- **Privacy**: Minimal data collection, anonymous gameplay, clear consent
- **Scalability**: Component reusability, state management, admin tools for growth

The architecture supports the 2-week MVP timeline while maintaining flexibility for future enhancements. All 25 user stories from the PRD are mapped to specific UI elements, ensuring complete coverage of requirements.

**Key Success Factors**:

1. Focus on core gameplay loop (5 photos, guess, feedback, results)
2. Frictionless Daily mode participation (inline nickname, auto-submission)
3. Compelling leaderboard competition (Top-10, clear rankings)
4. Robust admin tools (content management, scheduling)
5. Responsive, accessible design (mobile-first, WCAG AA)

This UI architecture is ready for implementation with the defined tech stack (Astro, React, TypeScript, Tailwind, Shadcn/ui) and API plan.
