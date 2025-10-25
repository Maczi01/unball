# View Implementation Plan: Game View

## 1. Overview

The Game View is the core gameplay interface for FootyGuess Daily, where users view football-related photos and guess both the location (via map pin placement) and year of the event. The view supports two modes: **Normal** (unlimited practice rounds with no persistence) and **Daily** (once-per-day challenge with leaderboard eligibility).

Each round consists of 5 photos. For each photo, users place a pin on an interactive world map, select a year between 1880-2025, and receive immediate feedback showing their accuracy and points earned (max 20,000 per photo: 10,000 for location + 10,000 for time). The view handles state management across multiple photos, timer tracking for Daily mode, score calculation, and displays a comprehensive summary at the end of the round.

## 2. View Routing

**Paths:**

- `/play/normal` - Normal mode (unlimited plays, results not saved)
- `/play/daily` - Daily challenge mode (first attempt counts for leaderboard)

**Implementation:**

- Astro page: `src/pages/play/[mode].astro`
- Mode param validation: `mode === 'normal' || mode === 'daily'`
- For invalid mode, redirect to `/play/normal`

**Page Responsibilities:**

- Validate mode parameter
- Fetch daily set for Daily mode (GET `/api/daily/sets/today`)
- Generate random photo set for Normal mode (GET `/api/normal/photos`)
- Check submission status for Daily mode (GET `/api/daily/submissions/check`)
- Render React GameView component with initial data
- Handle SSR errors (404 if no daily set, suggest Normal mode)

## 3. Component Structure

```
GamePage (Astro, src/pages/play/[mode].astro)
└── GameView (React, src/components/game/GameView.tsx)
    ├── AlreadySubmittedNotice (src/components/game/AlreadySubmittedNotice.tsx)
    ├── GameHeader (src/components/game/GameHeader.tsx)
    │   ├── ModeBadge (src/components/game/ModeBadge.tsx)
    │   ├── ProgressIndicator (src/components/game/ProgressIndicator.tsx)
    │   ├── Timer (src/components/game/Timer.tsx)
    │   └── Button (shadcn/ui, exit)
    ├── PhotoDisplay (src/components/game/PhotoDisplay.tsx)
    │   └── PhotoCounter (inline)
    ├── MapComponent (src/components/game/MapComponent.tsx)
    │   ├── MapboxGL (mapbox-gl-js)
    │   ├── ZoomControls (inline)
    │   ├── ResetButton (inline)
    │   └── PinMarker (markers via Mapbox API)
    ├── YearPicker (src/components/game/YearPicker.tsx)
    │   ├── Slider (shadcn/ui)
    │   └── Input (shadcn/ui, numeric)
    ├── SubmitButton (src/components/game/SubmitButton.tsx)
    ├── FeedbackSection (src/components/game/FeedbackSection.tsx)
    │   ├── ScoreCard (src/components/game/ScoreCard.tsx)
    │   ├── RunningTotal (inline)
    │   └── Button (shadcn/ui, next)
    ├── RoundSummary (src/components/game/RoundSummary.tsx)
    │   ├── PhotoBreakdown (src/components/game/PhotoBreakdown.tsx)
    │   ├── NicknameInput (src/components/game/NicknameInput.tsx, Daily first attempt)
    │   └── Buttons (shadcn/ui, leaderboard/play again)
    └── ErrorMessage (src/components/ui/ErrorMessage.tsx)
```

## 4. Component Details

### GamePage (Astro)

**Description:**
Server-side page component that handles routing, data fetching, and initial render of the game. Validates the mode parameter, fetches appropriate data (daily set or random photos), checks submission status for Daily mode, and passes initial props to the React GameView component.

**Main elements:**

- `<GameView>` React component
- Error boundary for fetch failures
- Loading state during SSR data fetch

**Handled interactions:**

- None (server-side only)

**Handled validation:**

- Mode parameter validation (`normal` or `daily`)
- Daily set availability (handle 404)
- Submission check for Daily mode

**Types:**

- `DailySetResponseDTO` (from API)
- `SubmissionCheckResponseDTO` (from API)
- `GameMode` type: `'normal' | 'daily'`

**Props:**

- None (page component, uses Astro params)

---

### GameView (React)

**Description:**
Main container component managing the entire game flow. Orchestrates state for 5 photos, current guess, timer, scores, and progression through the round. Handles transitions between photos, calculates client-side scores for immediate feedback, and coordinates final submission.

**Main elements:**

- `<div>` container with responsive layout (Tailwind)
- Conditional rendering based on game phase (guessing, feedback, summary)
- Child components for header, photo, map, year picker, submit, feedback, summary

**Handled interactions:**

- `onPinPlace(lat, lon)` - User places pin on map
- `onYearSelect(year)` - User selects year
- `onSubmitGuess()` - User submits current guess
- `onNextPhoto()` - User advances to next photo after feedback
- `onCompleteRound()` - User completes all 5 photos
- `onExit()` - User attempts to exit game

**Handled validation:**

- Both pin and year must be selected before submit enabled
- Year within range 1880-2025
- Coordinates within valid range (lat -90 to 90, lon -180 to 180)
- All 5 photos completed before final submission
- Timer validation (0 < total_time_ms < 86400000)

**Types:**

- `GameViewModel` (state shape)
- `PhotoState[]` (5 photos)
- `GuessDTO` (current guess)
- `DailySubmissionCommand` (final submission)
- `PhotoScoreResultDTO` (feedback data)

**Props:**

```typescript
interface GameViewProps {
  mode: GameMode;
  initialData: DailySetResponseDTO | NormalRoundResponseDTO;
  isAlreadySubmitted: boolean; // Daily mode only
}
```

---

### AlreadySubmittedNotice (React)

**Description:**
Banner notification displayed at the top of the game view when a user has already submitted today's Daily challenge. Informs the user that this is a practice round and won't affect their leaderboard position.

**Main elements:**

- `<div>` banner with info styling (blue background, icon)
- Text message
- Optional dismiss button

**Handled interactions:**

- `onDismiss()` - User dismisses notice

**Handled validation:**

- None (informational only)

**Types:**

- None

**Props:**

```typescript
interface AlreadySubmittedNoticeProps {
  onDismiss?: () => void;
}
```

---

### GameHeader (React)

**Description:**
Top bar showing game mode, progress through 5 photos, timer (Daily mode), and exit button. Provides constant context and navigation option.

**Main elements:**

- `<header>` with flex layout
- Mode badge, progress indicator, timer, exit button

**Handled interactions:**

- `onExit()` - User clicks exit button

**Handled validation:**

- None

**Types:**

- `GameMode`
- `number` for currentPhoto, totalPhotos, elapsedMs

**Props:**

```typescript
interface GameHeaderProps {
  mode: GameMode;
  currentPhoto: number; // 1-5
  totalPhotos: number; // Always 5
  elapsedMs: number; // Timer value in milliseconds (Daily mode)
  onExit: () => void;
}
```

---

### ModeBadge (React)

**Description:**
Displays current game mode with appropriate styling and icon.

**Main elements:**

- `<span>` or `<Badge>` (shadcn/ui)
- Mode text: "Normal Mode" or "Daily Challenge"
- Optional icon

**Handled interactions:**

- None

**Handled validation:**

- None

**Types:**

- `GameMode`

**Props:**

```typescript
interface ModeBadgeProps {
  mode: GameMode;
}
```

---

### ProgressIndicator (React)

**Description:**
Visual representation of progress through 5 photos, typically 5 circles with current photo highlighted.

**Main elements:**

- `<div>` flex container
- 5 circle elements (filled/outlined based on state)
- ARIA label for screen readers

**Handled interactions:**

- None

**Handled validation:**

- None

**Types:**

- `number` for current and total

**Props:**

```typescript
interface ProgressIndicatorProps {
  current: number; // 1-5
  total: number; // Always 5
}
```

---

### Timer (React)

**Description:**
Displays elapsed time in MM:SS format. Only shown in Daily mode. Updates every second.

**Main elements:**

- `<div>` or `<span>` with formatted time
- Label: "Time: "
- ARIA live region for screen reader updates

**Handled interactions:**

- None (display only)

**Handled validation:**

- None

**Types:**

- `number` for elapsedMs

**Props:**

```typescript
interface TimerProps {
  elapsedMs: number;
}
```

---

### PhotoDisplay (React)

**Description:**
Displays the current photo with loading skeleton, counter, and responsive sizing. Maintains aspect ratio and handles loading states.

**Main elements:**

- `<div>` container
- `<img>` for photo (with srcset for responsive)
- Loading skeleton while image loads
- Photo counter: "Photo X of 5"
- Alt text for accessibility

**Handled interactions:**

- `onLoad()` - Image finishes loading

**Handled validation:**

- None

**Types:**

- `DailySetPhotoDTO` or `NormalRoundPhotoDTO`

**Props:**

```typescript
interface PhotoDisplayProps {
  photo: DailySetPhotoDTO;
  currentIndex: number; // 0-4
  totalPhotos: number; // Always 5
  onLoad?: () => void;
}
```

---

### MapComponent (React)

**Description:**
Interactive Mapbox map for pin placement. Supports zoom, pan, pin drag, keyboard navigation. Shows user pin during guessing, both user and correct pins during feedback with connecting line and distance.

**Main elements:**

- Mapbox GL JS map instance
- User pin marker (blue)
- Correct pin marker (green, feedback only)
- Distance line (feedback only)
- Zoom controls (+/- buttons)
- Reset view button
- Keyboard navigation overlay (instructions)

**Handled interactions:**

- `onPinPlace(lat, lon)` - User clicks map to place pin
- `onPinMove(lat, lon)` - User drags pin to new location
- `onZoom(level)` - User zooms in/out
- `onPan()` - User pans map
- `onResetView()` - User resets to default view
- Keyboard: Arrow keys to pan, +/- to zoom, Enter to place pin

**Handled validation:**

- Coordinates within valid range:
  - Latitude: -90 to 90
  - Longitude: -180 to 180
- Pin placement validation before enabling submit

**Types:**

- `PinLocation` for user and correct pins
- `MapBounds` for viewport

**Props:**

```typescript
interface MapComponentProps {
  userPin: PinLocation | null;
  correctPin: PinLocation | null; // Only during feedback
  showFeedback: boolean;
  kmError: number | null; // Distance for feedback
  onPinPlace: (lat: number, lon: number) => void;
  onPinMove: (lat: number, lon: number) => void;
  className?: string;
}
```

---

### YearPicker (React)

**Description:**
Year selection interface with slider and numeric input. Bounded to 1880-2025. Touch-friendly with keyboard support.

**Main elements:**

- `<Slider>` component (shadcn/ui) for quick selection
- `<Input>` numeric field for precise entry
- Label: "What year was this?"
- Range display: "1880 - 2025"
- Current selected year (large display)

**Handled interactions:**

- `onYearChange(year)` - User selects or types year

**Handled validation:**

- Year must be integer
- Year >= 1880 and <= 2025
- Invalid input shows error message
- Submit disabled if invalid

**Types:**

- `number` for year

**Props:**

```typescript
interface YearPickerProps {
  selectedYear: number | null;
  onYearChange: (year: number) => void;
  disabled?: boolean;
}
```

---

### SubmitButton (React)

**Description:**
Primary CTA button for submitting current guess. Disabled until both pin and year are selected. Shows loading state during submission.

**Main elements:**

- `<Button>` (shadcn/ui)
- Text: "Submit Guess"
- Loading spinner during submission
- Disabled state styling

**Handled interactions:**

- `onClick()` - User submits guess

**Handled validation:**

- Disabled if pin is null
- Disabled if year is null
- Disabled during submission (loading)

**Types:**

- `boolean` for isDisabled, isLoading

**Props:**

```typescript
interface SubmitButtonProps {
  isDisabled: boolean;
  isLoading: boolean;
  onClick: () => void;
}
```

---

### FeedbackSection (React)

**Description:**
Displays results after guess submission. Shows score breakdown, distance and year errors, running total, and next button. Overlays on map to show both pins and connecting line.

**Main elements:**

- `<div>` overlay/card container
- ScoreCard component
- Running total display
- Next Photo button (or "See Results" for photo 5)
- Celebration animations for high scores

**Handled interactions:**

- `onNext()` - User advances to next photo

**Handled validation:**

- None (display only)

**Types:**

- `PhotoScoreResultDTO` for current photo result
- `number` for running total

**Props:**

```typescript
interface FeedbackSectionProps {
  result: PhotoScoreResultDTO;
  runningTotal: number;
  currentPhoto: number; // 1-5
  totalPhotos: number; // 5
  onNext: () => void;
}
```

---

### ScoreCard (React)

**Description:**
Detailed score breakdown showing distance error, year error, and points earned for location and time.

**Main elements:**

- `<div>` card container
- Location score row: "Distance: X km → Y points"
- Time score row: "Year difference: X years → Y points"
- Total for photo: "Total: Z / 20,000"
- Progress bars or visual indicators
- Event details: event_name, description

**Handled interactions:**

- None

**Handled validation:**

- None

**Types:**

- `PhotoScoreResultDTO`

**Props:**

```typescript
interface ScoreCardProps {
  result: PhotoScoreResultDTO;
  animate?: boolean;
}
```

---

### RoundSummary (React)

**Description:**
Final summary screen after completing 5 photos. Shows total score, total time, breakdown of each photo, and options to view leaderboard (Daily, first attempt) or play again. Includes nickname input for Daily mode first submission.

**Main elements:**

- `<div>` full-screen modal/overlay
- Header: "Round Complete!"
- Total score (large, prominent)
- Total time (MM:SS)
- Photo breakdown list (5 items with scores)
- Nickname input (Daily, first attempt, before submission)
- Consent checkbox (Daily, first attempt)
- View Leaderboard button (Daily, after submission)
- Play Again button
- Share button (optional)

**Handled interactions:**

- `onViewLeaderboard()` - Navigate to leaderboard
- `onPlayAgain()` - Start new round
- `onNicknameSubmit(nickname)` - Submit nickname for Daily
- `onConsentChange(checked)` - Consent checkbox

**Handled validation:**

- Nickname validation (Daily mode):
  - Length: 3-20 characters
  - Pattern: alphanumeric + space, hyphen, underscore
  - Regex: `/^[a-zA-Z0-9 _-]{3,20}$/`
  - Profanity filter on server (handle rejection)
- Consent must be checked before submission (Daily mode)

**Types:**

- `PhotoScoreResultDTO[]` for all photo results
- `number` for totalScore, totalTimeMs
- `DailySubmissionResponseDTO` after submission (includes rank)

**Props:**

```typescript
interface RoundSummaryProps {
  mode: GameMode;
  results: PhotoScoreResultDTO[];
  totalScore: number;
  totalTimeMs: number;
  isFirstSubmission: boolean; // Daily mode only
  leaderboardRank?: number; // After submission
  onViewLeaderboard: () => void;
  onPlayAgain: () => void;
  onSubmitWithNickname: (nickname: string, consent: boolean) => Promise<void>;
}
```

---

### NicknameInput (React)

**Description:**
Input field for entering nickname before Daily submission. Includes validation, error messages, and guidelines.

**Main elements:**

- `<Input>` (shadcn/ui)
- Label: "Choose your nickname"
- Character counter: "X / 20"
- Validation error message
- Guidelines text: "3-20 characters, letters, numbers, spaces, - and \_ allowed"

**Handled interactions:**

- `onChange(value)` - User types nickname
- `onSubmit()` - User confirms nickname

**Handled validation:**

- Length: 3-20 characters
- Pattern: `/^[a-zA-Z0-9 _-]+$/`
- Real-time validation feedback
- Show error if invalid

**Types:**

- `string` for nickname

**Props:**

```typescript
interface NicknameInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}
```

---

### PhotoBreakdown (React)

**Description:**
Single row in round summary showing thumbnail, event name, and score for one photo.

**Main elements:**

- `<div>` row container
- Thumbnail image
- Position: "Photo X"
- Event name
- Score: "X / 20,000"
- Expandable details (optional)

**Handled interactions:**

- `onClick()` - Expand details (optional)

**Handled validation:**

- None

**Types:**

- `PhotoScoreResultDTO`

**Props:**

```typescript
interface PhotoBreakdownProps {
  result: PhotoScoreResultDTO;
  index: number; // 0-4
}
```

---

### ErrorMessage (React)

**Description:**
Reusable error message component displaying error state with retry/dismiss options.

**Main elements:**

- `<div>` alert container (shadcn/ui Alert)
- Error icon
- Error message text
- Retry button (if retryable)
- Dismiss button
- Fallback action button (e.g., "Try Normal mode")

**Handled interactions:**

- `onRetry()` - User retries failed operation
- `onDismiss()` - User dismisses error
- `onFallback()` - User chooses fallback action

**Handled validation:**

- None

**Types:**

- `GameError` type

**Props:**

```typescript
interface ErrorMessageProps {
  error: GameError;
  onRetry?: () => void;
  onDismiss?: () => void;
  onFallback?: () => void;
}
```

## 5. Types

### Existing DTOs (from `src/types.ts`)

```typescript
// API Response Types
type DailySetResponseDTO = {
  daily_set_id: string;
  date_utc: string;
  photos: DailySetPhotoDTO[];
};

type DailySetPhotoDTO = {
  photo_id: string;
  position: number;
  photo_url: string;
  thumbnail_url: string | null;
  competition: string | null;
  place: string | null;
  tags: string[] | null;
};

type GuessDTO = {
  photo_id: string;
  guessed_lat: number;
  guessed_lon: number;
  guessed_year: number;
};

type DailySubmissionCommand = {
  daily_set_id: string;
  date_utc: string;
  nickname: string;
  consent_given: boolean;
  guesses: GuessDTO[];
  total_time_ms: number;
};

type PhotoScoreResultDTO = {
  photo_id: string;
  location_score: number;
  time_score: number;
  total_score: number;
  km_error: number;
  year_error: number;
  correct_lat: number;
  correct_lon: number;
  correct_year: number;
  event_name: string;
  description: string | null;
  source_url: string | null;
  license: string;
  credit: string;
};

type SubmissionCheckResponseDTO = {
  has_submitted: boolean;
  submission: SubmissionDetailsDTO | null;
};

type DailySubmissionResponseDTO = {
  submission_id: string;
  total_score: number;
  total_time_ms: number;
  leaderboard_rank: number;
  photos: PhotoScoreResultDTO[];
};
```

### New ViewModel Types (to be added to `src/types.ts` or local component file)

```typescript
/**
 * Game mode enum
 */
type GameMode = "normal" | "daily";

/**
 * Pin location on map
 */
type PinLocation = {
  lat: number; // -90 to 90
  lon: number; // -180 to 180
};

/**
 * State for a single photo in the round
 */
type PhotoState = {
  photoData: DailySetPhotoDTO;
  guess: GuessDTO | null; // Set after submission
  result: PhotoScoreResultDTO | null; // Set after scoring
  status: "pending" | "guessing" | "submitted" | "complete";
};

/**
 * Main game state ViewModel
 * Manages entire game flow across 5 photos
 */
type GameViewModel = {
  mode: GameMode;
  dailySetId: string | null; // null for Normal mode
  dateUtc: string | null; // null for Normal mode
  photos: PhotoState[]; // Always 5 items
  currentPhotoIndex: number; // 0-4
  startTime: number; // Unix timestamp (ms)
  elapsedTime: number; // Milliseconds
  totalScore: number; // Running total across photos
  isAlreadySubmitted: boolean; // Daily mode: already submitted today
  isLoading: boolean; // Loading state for submissions
  error: GameError | null; // Current error state
};

/**
 * Error state type
 */
type GameError = {
  type: "map_load" | "submission" | "network" | "no_daily_set" | "invalid_guess";
  message: string;
  retryable: boolean;
};

/**
 * Current guess state (before submission)
 */
type CurrentGuess = {
  pin: PinLocation | null;
  year: number | null;
};

/**
 * Timer state
 */
type TimerState = {
  startTime: number; // Unix timestamp
  elapsedMs: number;
  isRunning: boolean;
};

/**
 * Map viewport bounds
 */
type MapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

/**
 * Nickname validation result
 */
type NicknameValidation = {
  isValid: boolean;
  error?: string;
};
```

### Type Relationships

```typescript
// GameViewModel contains:
// - photos: PhotoState[] (5 items)
//   - Each PhotoState contains:
//     - photoData: DailySetPhotoDTO (from API)
//     - guess: GuessDTO | null (user's guess)
//     - result: PhotoScoreResultDTO | null (calculated score)
//     - status: enum

// CurrentGuess is ephemeral state, becomes GuessDTO on submit:
// CurrentGuess { pin: { lat, lon }, year } → GuessDTO { photo_id, guessed_lat, guessed_lon, guessed_year }

// Final submission combines all guesses:
// DailySubmissionCommand {
//   daily_set_id,
//   date_utc,
//   nickname,
//   consent_given,
//   guesses: GuessDTO[], // 5 items
//   total_time_ms
// }
```

## 6. State Management

### Primary State Location

State is managed in the **GameView** component using React hooks. Due to complexity across 5 photos, guesses, timer, and submission flow, we'll use `useReducer` for the main game state and custom hooks for sub-states.

### State Structure

```typescript
// Main state (useReducer)
const [gameState, dispatch] = useReducer(gameReducer, initialGameState);

// Ephemeral guess state (useState)
const [currentGuess, setCurrentGuess] = useState<CurrentGuess>({ pin: null, year: null });

// Feedback visibility (useState)
const [showFeedback, setShowFeedback] = useState(false);

// Summary visibility (useState)
const [showSummary, setShowSummary] = useState(false);
```

### Reducer Actions

```typescript
type GameAction =
  | { type: "SET_PHOTOS"; payload: DailySetPhotoDTO[] }
  | { type: "NEXT_PHOTO" }
  | { type: "SUBMIT_GUESS"; payload: { guess: GuessDTO; result: PhotoScoreResultDTO } }
  | { type: "SET_ERROR"; payload: GameError }
  | { type: "CLEAR_ERROR" }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "UPDATE_TIMER"; payload: number }
  | { type: "COMPLETE_ROUND" };
```

### Custom Hooks

#### `useGameTimer`

**Purpose:** Manages elapsed time tracking for Daily mode. Starts on game mount, updates every second, pauses on submission.

**Location:** `src/components/hooks/useGameTimer.ts`

**Interface:**

```typescript
function useGameTimer(isRunning: boolean): {
  elapsedMs: number;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
};
```

**Implementation:**

- Uses `useRef` to store start timestamp
- Uses `useEffect` with `setInterval` to update elapsed time every 100ms
- Calculates elapsed as `Date.now() - startTime`
- Cleans up interval on unmount

---

#### `usePhotoGuess`

**Purpose:** Manages current photo guess state (pin + year), validates completeness.

**Location:** `src/components/hooks/usePhotoGuess.ts`

**Interface:**

```typescript
function usePhotoGuess(): {
  pin: PinLocation | null;
  year: number | null;
  setPin: (lat: number, lon: number) => void;
  setYear: (year: number) => void;
  clearGuess: () => void;
  isComplete: boolean;
};
```

**Implementation:**

- Uses `useState` for pin and year
- `isComplete` computed: `pin !== null && year !== null`
- `clearGuess` resets both to null
- Validates coordinates and year range on set

---

#### `useScoreCalculation`

**Purpose:** Client-side score calculation for immediate feedback (server will recalculate).

**Location:** `src/lib/utils/scoreCalculation.ts`

**Interface:**

```typescript
function calculateScore(guess: GuessDTO, correct: { lat: number; lon: number; year: number }): PhotoScoreResultDTO;
```

**Implementation:**

- Haversine formula for distance calculation:
  ```typescript
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  ```
- Location score: `Math.max(0, 10000 - distance * 5)`
- Time score: `Math.max(0, 10000 - Math.abs(guessYear - correctYear) * 400)`
- Total score: `locationScore + timeScore`

---

#### `useDeviceToken`

**Purpose:** Manages anonymous device token in localStorage for Daily submissions.

**Location:** `src/components/hooks/useDeviceToken.ts`

**Interface:**

```typescript
function useDeviceToken(): {
  deviceToken: string | null;
  generateToken: () => string;
  isStorageAvailable: boolean;
};
```

**Implementation:**

- Checks localStorage availability on mount
- Reads existing token from `localStorage.getItem('anon_device_token')`
- Generates new UUID if not exists: `crypto.randomUUID()`
- Stores token: `localStorage.setItem('anon_device_token', token)`
- Returns null if localStorage unavailable

---

#### `useSubmissionCheck`

**Purpose:** Checks if user has already submitted today's Daily challenge.

**Location:** `src/components/hooks/useSubmissionCheck.ts`

**Interface:**

```typescript
function useSubmissionCheck(
  mode: GameMode,
  deviceToken: string | null
): {
  hasSubmitted: boolean;
  checkSubmission: () => Promise<void>;
  isLoading: boolean;
  error: Error | null;
};
```

**Implementation:**

- Only runs in Daily mode
- Fetches GET `/api/daily/submissions/check` with device token in headers
- Parses `SubmissionCheckResponseDTO`
- Sets `hasSubmitted` based on response
- Handles errors gracefully (assume not submitted if error)

---

### State Flow

1. **Initialization:**
   - GamePage fetches initial data (daily set or random photos)
   - Passes to GameView as props
   - GameView initializes reducer state with photos

2. **Photo Guessing:**
   - User interacts with MapComponent → calls `setPin(lat, lon)`
   - User interacts with YearPicker → calls `setYear(year)`
   - SubmitButton enabled when `isComplete === true`

3. **Submission:**
   - User clicks SubmitButton
   - GameView creates `GuessDTO` from `currentGuess`
   - Calls `calculateScore` for client-side feedback
   - Dispatches `SUBMIT_GUESS` action with guess and result
   - Sets `showFeedback = true`
   - Clears `currentGuess`

4. **Next Photo:**
   - User clicks Next button in FeedbackSection
   - Dispatches `NEXT_PHOTO` action
   - Increments `currentPhotoIndex`
   - Sets `showFeedback = false`
   - Resets `currentGuess`

5. **Round Completion:**
   - After photo 5 submission, instead of Next, shows Summary
   - Dispatches `COMPLETE_ROUND` action
   - Sets `showSummary = true`
   - Calls final submission API (Normal or Daily)

6. **Final Submission:**
   - Normal mode: POST `/api/normal/calculate-score` with `CalculateScoreCommand`
   - Daily mode (first attempt): POST `/api/daily/submissions` with `DailySubmissionCommand` (includes nickname)
   - Daily mode (subsequent): No submission, just show results
   - Updates summary with server-calculated scores (replace client scores)

## 7. API Integration

### Endpoint 1: Fetch Daily Set

**Endpoint:** `GET /api/daily/sets/today`

**When:** On page load (Daily mode only)

**Request:**

- Method: GET
- Headers: None
- Body: None

**Response Type:** `DailySetResponseDTO`

**Response Example:**

```json
{
  "daily_set_id": "abc123",
  "date_utc": "2025-10-22",
  "photos": [
    {
      "photo_id": "photo1",
      "position": 1,
      "photo_url": "https://...",
      "thumbnail_url": "https://...",
      "competition": "Champions League",
      "place": "Spain",
      "tags": ["club", "european"]
    }
    // ... 4 more
  ]
}
```

**Error Handling:**

- 404: No daily set published → Show error, suggest Normal mode
- 500: Server error → Show error with retry
- Network error: Show offline message

**Implementation:**

```typescript
// In GamePage (Astro)
const response = await fetch("/api/daily/sets/today");
if (!response.ok) {
  if (response.status === 404) {
    // Redirect to Normal mode or show error
  }
  throw new Error("Failed to fetch daily set");
}
const dailySet: DailySetResponseDTO = await response.json();
```

---

### Endpoint 2: Check Submission Status

**Endpoint:** `GET /api/daily/submissions/check`

**When:** On page load (Daily mode only)

**Request:**

- Method: GET
- Headers:
  - `X-Device-Token: <anon_device_token>`
- Body: None

**Response Type:** `SubmissionCheckResponseDTO`

**Response Example:**

```json
{
  "has_submitted": true,
  "submission": {
    "id": "sub123",
    "total_score": 85000,
    "total_time_ms": 180000,
    "submission_timestamp": "2025-10-22T10:30:00Z",
    "leaderboard_rank": 5
  }
}
```

**Error Handling:**

- Any error: Log and assume not submitted (allow play)

**Implementation:**

```typescript
const response = await fetch("/api/daily/submissions/check", {
  headers: {
    "X-Device-Token": deviceToken,
  },
});
const data: SubmissionCheckResponseDTO = await response.json();
```

---

### Endpoint 3: Submit Daily Challenge

**Endpoint:** `POST /api/daily/submissions`

**When:** After completing 5 photos (Daily mode, first attempt only)

**Request:**

- Method: POST
- Headers:
  - `Content-Type: application/json`
  - `X-Device-Token: <anon_device_token>`
- Body: `DailySubmissionCommand`

**Request Example:**

```json
{
  "daily_set_id": "abc123",
  "date_utc": "2025-10-22",
  "nickname": "FootyFan",
  "consent_given": true,
  "guesses": [
    {
      "photo_id": "photo1",
      "guessed_lat": 41.38,
      "guessed_lon": 2.17,
      "guessed_year": 2015
    }
    // ... 4 more
  ],
  "total_time_ms": 180000
}
```

**Response Type:** `DailySubmissionResponseDTO`

**Response Example:**

```json
{
  "submission_id": "sub123",
  "total_score": 85000,
  "total_time_ms": 180000,
  "leaderboard_rank": 5,
  "photos": [
    {
      "photo_id": "photo1",
      "location_score": 8500,
      "time_score": 8800,
      "total_score": 17300,
      "km_error": 300,
      "year_error": 3,
      "correct_lat": 41.4,
      "correct_lon": 2.2,
      "correct_year": 2012,
      "event_name": "Champions League Final",
      "description": "...",
      "source_url": "...",
      "license": "CC BY",
      "credit": "..."
    }
    // ... 4 more
  ]
}
```

**Error Handling:**

- 400: Invalid data → Show error with details
- 409: Already submitted → Show error (shouldn't happen if check works)
- 500: Server error → Show error with retry, warn data may not be saved
- Network error: Show retry option

**Implementation:**

```typescript
const response = await fetch("/api/daily/submissions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Device-Token": deviceToken,
  },
  body: JSON.stringify(submissionData),
});

if (!response.ok) {
  throw new Error("Submission failed");
}

const result: DailySubmissionResponseDTO = await response.json();
```

---

### Endpoint 4: Calculate Normal Score

**Endpoint:** `POST /api/normal/calculate-score`

**When:** After completing 5 photos (Normal mode)

**Request:**

- Method: POST
- Headers:
  - `Content-Type: application/json`
- Body: `CalculateScoreCommand`

**Request Example:**

```json
{
  "round_id": "round123",
  "guesses": [
    /* 5 GuessDTO items */
  ],
  "total_time_ms": 180000
}
```

**Response Type:** `ScoreResponseDTO`

**Response Example:**

```json
{
  "total_score": 85000,
  "total_time_ms": 180000,
  "photos": [
    /* 5 PhotoScoreResultDTO items */
  ]
}
```

**Error Handling:**

- Same as Daily submission

**Implementation:**

```typescript
const response = await fetch("/api/normal/calculate-score", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(scoreData),
});

const result: ScoreResponseDTO = await response.json();
```

---

### Endpoint 5: Track Analytics

**Endpoint:** `POST /api/analytics/events`

**When:** Various events during gameplay

**Request:**

- Method: POST
- Headers:
  - `Content-Type: application/json`
- Body: `AnalyticsEventCommand`

**Events to Track:**

- `start_round`: When game loads
- `guess_submitted`: After each photo submission
- `round_complete`: After 5 photos
- `daily_submission`: When Daily submitted to leaderboard

**Request Example:**

```json
{
  "event_type": "guess_submitted",
  "anon_device_token": "device123",
  "event_data": {
    "photo_id": "photo1",
    "km_error": 300,
    "year_error": 3,
    "score": 17300
  }
}
```

**Error Handling:**

- Fire and forget, don't block UI
- Log errors silently

**Implementation:**

```typescript
// Fire and forget
fetch("/api/analytics/events", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(eventData),
}).catch((err) => console.warn("Analytics error:", err));
```

## 8. User Interactions

### 1. Page Load

**User Action:** Navigates to `/play/daily` or `/play/normal`

**System Response:**

- Astro page fetches data (daily set or random photos)
- Daily mode: Checks submission status
- Shows loading state
- Renders GameView with first photo
- Starts timer (Daily mode)
- Tracks `start_round` analytics event

**UI Updates:**

- Loading spinner while fetching
- First photo displays
- Map initializes at default view (world)
- Year picker shows 1880-2025 range
- Submit button disabled (no guess yet)
- Progress indicator shows 1/5

---

### 2. View Photo

**User Action:** Photo loads and displays

**System Response:**

- Image loads from CDN
- Shows loading skeleton until loaded
- Photo counter updates: "Photo 1 of 5"

**UI Updates:**

- Photo displays in PhotoDisplay component
- Alt text for screen readers
- Thumbnail in background while loading

---

### 3. Place Pin on Map

**User Action:** Clicks/taps location on map

**System Response:**

- Calls `onPinPlace(lat, lon)`
- Updates `currentGuess.pin`
- Enables pin dragging
- Updates submit button state

**UI Updates:**

- Blue pin marker appears at clicked location
- Pin can be dragged to new location
- Coordinates update (optional display)
- Submit button enabled if year also selected
- ARIA live region announces: "Pin placed at [location description]"

---

### 4. Move Pin

**User Action:** Drags pin to new location

**System Response:**

- Calls `onPinMove(lat, lon)` continuously
- Updates `currentGuess.pin`

**UI Updates:**

- Pin follows cursor/touch
- Smooth animation
- Coordinates update in real-time

---

### 5. Zoom/Pan Map

**User Action:** Zooms with controls/gestures, pans by dragging

**System Response:**

- Mapbox handles zoom/pan
- Pin stays at same geographic location

**UI Updates:**

- Map viewport changes
- Zoom level indicator updates
- Pin appears to move on screen but stays at same lat/lon

---

### 6. Select Year

**User Action:** Moves slider or types year in input

**System Response:**

- Calls `onYearChange(year)`
- Updates `currentGuess.year`
- Validates range (1880-2025)
- Updates submit button state

**UI Updates:**

- Selected year displays prominently
- Slider thumb moves
- Input value updates
- Submit button enabled if pin also placed
- Error message if out of range

---

### 7. Submit Guess

**User Action:** Clicks "Submit Guess" button

**System Response:**

1. Creates `GuessDTO` from `currentGuess` and current `photo_id`
2. Calls `calculateScore` with guess and correct answer (needs API call for Normal mode or stored answer)
   - **Note:** Correct answer not available until submission. Need to call scoring endpoint first.
3. Actually: Client calculates distance and year error, but needs correct answer.
   - **Revision:** Client cannot calculate without correct answer. Must call API for scoring.
4. **Correct flow:**
   - For Normal mode: Call `/api/normal/calculate-score` with current guess only (or accumulate and call at end?)
   - For Daily mode: Accumulate guesses, calculate client-side if we have answers (we don't), or call API per photo (not ideal)
   - **Best approach:** Client-side calculation requires correct answer, which we don't have. So either:
     - A) Call scoring API per photo (creates 5 API calls)
     - B) Calculate client-side with mocked/cached answers (security risk)
     - C) Wait until end, show summary only (bad UX)
   - **Recommended:** Per-photo scoring endpoint: `POST /api/photos/{photo_id}/score` with guess, returns `PhotoScoreResultDTO`
     - This reveals answer for current photo only, prevents cheating on remaining photos
     - Client stores result, shows feedback
5. Dispatches `SUBMIT_GUESS` action with result
6. Shows FeedbackSection
7. Tracks `guess_submitted` analytics event

**UI Updates:**

- Submit button shows loading spinner
- Map overlay appears with:
  - User pin (blue) at guessed location
  - Correct pin (green) at actual location
  - Line connecting them with distance label
- FeedbackSection displays with score breakdown
- Celebration animation for high scores
- "Next Photo" button appears

**API Call:**

```typescript
// Per-photo scoring (recommended approach)
POST / api / photos / { photo_id } / score;
Body: {
  (guessed_lat, guessed_lon, guessed_year);
}
Response: PhotoScoreResultDTO;
```

---

### 8. View Feedback

**User Action:** Feedback section displays after submission

**System Response:**

- Shows score breakdown
- Updates running total
- Reveals event details (name, description)

**UI Updates:**

- ScoreCard shows:
  - Distance: "245 km"
  - Location Score: "8,775 / 10,000"
  - Year Difference: "3 years"
  - Time Score: "8,800 / 10,000"
  - Total for Photo: "17,575 / 20,000"
- Running total: "Round Score: 52,325 / 60,000 (3 photos)"
- Event name and description
- Photo credit information
- Next button (or "See Results" for photo 5)

---

### 9. Next Photo

**User Action:** Clicks "Next Photo" button

**System Response:**

1. Dispatches `NEXT_PHOTO` action
2. Increments `currentPhotoIndex`
3. Clears `currentGuess`
4. Hides feedback
5. Loads next photo

**UI Updates:**

- Feedback section fades out
- Next photo fades in
- Map resets to default view, pin cleared
- Year picker resets
- Submit button disabled
- Progress indicator updates: "Photo 2 of 5"
- Timer continues (Daily mode)

---

### 10. Complete Round (Photo 5)

**User Action:** Submits guess for photo 5

**System Response:**

1. Same as submit guess, but:
2. Instead of "Next Photo", shows "See Results" button
3. Clicking "See Results" triggers final submission

**UI Updates:**

- Final feedback shows
- "See Results" button instead of "Next Photo"
- Clicking button shows RoundSummary

---

### 11. View Round Summary

**User Action:** Round summary displays after photo 5

**System Response:**

- Calls final submission API:
  - Normal mode: `/api/normal/calculate-score` (if not already called per-photo)
  - Daily mode (first attempt): Shows nickname input first
  - Daily mode (subsequent): Shows results immediately
- Server returns authoritative scores (may differ from client calculations)
- Updates summary with server scores

**UI Updates:**

- Full-screen RoundSummary overlay
- Header: "Round Complete!"
- Total score (large): "85,000 / 100,000"
- Total time: "03:00"
- Photo breakdown list (5 rows with thumbnails and scores)
- Daily mode (first attempt):
  - Nickname input field
  - Consent checkbox
  - "Submit to Leaderboard" button
- Daily mode (after submission):
  - Leaderboard rank: "You placed #5 on today's leaderboard!"
  - "View Leaderboard" button
- "Play Again" button
- "Share Results" button (optional)

---

### 12. Submit with Nickname (Daily, First Attempt)

**User Action:** Enters nickname, checks consent, clicks "Submit to Leaderboard"

**System Response:**

1. Validates nickname (3-20 chars, alphanumeric + \_ - space)
2. Creates `DailySubmissionCommand` with all data
3. Calls `POST /api/daily/submissions`
4. Receives `DailySubmissionResponseDTO` with rank
5. Updates summary with leaderboard rank

**UI Updates:**

- Nickname validation feedback (real-time)
- Submit button disabled until valid
- Loading state during submission
- Success: Shows leaderboard rank
- Error: Shows retry option with error message (e.g., profanity rejection)

---

### 13. View Leaderboard

**User Action:** Clicks "View Leaderboard" button

**System Response:**

- Navigates to `/leaderboard` or `/leaderboard/current`

**UI Updates:**

- Page transition to leaderboard view

---

### 14. Play Again

**User Action:** Clicks "Play Again" button

**System Response:**

- Normal mode: Fetches new random photos, resets state
- Daily mode: Same daily set, resets state, shows AlreadySubmittedNotice

**UI Updates:**

- Summary closes
- Game resets to photo 1
- Timer resets (Daily)
- All state cleared

---

### 15. Exit Game

**User Action:** Clicks exit button in header

**System Response:**

1. Shows confirmation dialog: "Your progress will be lost. Are you sure?"
2. User confirms or cancels
3. If confirmed, navigates to home or previous page

**UI Updates:**

- Dialog appears
- If confirmed: Navigation transition
- If cancelled: Dialog closes, game continues

---

### 16. Handle Error with Retry

**User Action:** Error message displays, clicks "Retry"

**System Response:**

- Retries failed operation (e.g., fetch daily set, submit guess)

**UI Updates:**

- Loading state
- Error clears if successful
- Error persists with new message if fails again

## 9. Conditions and Validation

### Component: YearPicker

**Condition:** Year must be between 1880 and 2025 (inclusive)

**Validation:**

- Type: Integer only
- Range: `year >= 1880 && year <= 2025`
- Pattern: `/^\d{4}$/` (4-digit number)

**Implementation:**

```typescript
function validateYear(year: number): boolean {
  return Number.isInteger(year) && year >= 1880 && year <= 2025;
}

// In YearPicker component
const handleYearChange = (value: number) => {
  if (validateYear(value)) {
    onYearChange(value);
    setError(null);
  } else {
    setError("Year must be between 1880 and 2025");
  }
};
```

**UI Effect:**

- Valid: No error, submit enabled (if pin also placed)
- Invalid: Red border, error message below input, submit disabled

---

### Component: MapComponent

**Condition:** Pin must be placed, coordinates must be valid

**Validation:**

- Latitude: `-90 <= lat <= 90`
- Longitude: `-180 <= lon <= 180`
- Pin placement: `pin !== null`

**Implementation:**

```typescript
function validateCoordinates(lat: number, lon: number): boolean {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

// Mapbox enforces valid ranges, but double-check
const handlePinPlace = (lat: number, lon: number) => {
  if (validateCoordinates(lat, lon)) {
    onPinPlace(lat, lon);
  } else {
    console.error("Invalid coordinates");
  }
};
```

**UI Effect:**

- Valid: Pin displays, submit enabled (if year also selected)
- Invalid: Should not be possible via Mapbox UI, but log error if occurs

---

### Component: SubmitButton

**Condition:** Both pin and year must be set

**Validation:**

- `currentGuess.pin !== null`
- `currentGuess.year !== null`
- `validateYear(currentGuess.year) === true`
- `validateCoordinates(currentGuess.pin.lat, currentGuess.pin.lon) === true`

**Implementation:**

```typescript
const isDisabled =
  currentGuess.pin === null ||
  currentGuess.year === null ||
  !validateYear(currentGuess.year) ||
  isLoading;

<SubmitButton
  isDisabled={isDisabled}
  isLoading={isLoading}
  onClick={handleSubmit}
/>
```

**UI Effect:**

- Disabled: Gray, no hover effect, cursor not-allowed
- Enabled: Blue, hover effect, cursor pointer

---

### Component: GameView

**Condition:** All 5 photos must be completed before final submission

**Validation:**

- `currentPhotoIndex === 4` (last photo, 0-indexed)
- `photos.filter(p => p.status === 'complete').length === 5`
- `guesses.length === 5`

**Implementation:**

```typescript
const isRoundComplete = photos.every((p) => p.status === "complete");

if (isRoundComplete) {
  // Show RoundSummary instead of next photo
  setShowSummary(true);
}
```

**UI Effect:**

- After photo 5 feedback: "See Results" button instead of "Next Photo"
- Clicking triggers final submission flow

---

### Component: NicknameInput (Daily mode)

**Condition:** Nickname must be valid for leaderboard submission

**Validation:**

- Length: `nickname.length >= 3 && nickname.length <= 20`
- Pattern: `/^[a-zA-Z0-9 _-]+$/`
- No leading/trailing spaces: `nickname.trim() === nickname`
- Server validates profanity (handle rejection)

**Implementation:**

```typescript
const NICKNAME_REGEX = /^[a-zA-Z0-9 _-]+$/;

function validateNickname(nickname: string): NicknameValidation {
  const trimmed = nickname.trim();

  if (trimmed !== nickname) {
    return { isValid: false, error: "No leading or trailing spaces" };
  }

  if (trimmed.length < 3) {
    return { isValid: false, error: "Nickname must be at least 3 characters" };
  }

  if (trimmed.length > 20) {
    return { isValid: false, error: "Nickname must be at most 20 characters" };
  }

  if (!NICKNAME_REGEX.test(trimmed)) {
    return { isValid: false, error: "Only letters, numbers, spaces, hyphens, and underscores allowed" };
  }

  return { isValid: true };
}
```

**UI Effect:**

- Real-time validation on input change
- Character counter: "15 / 20"
- Error message below input if invalid
- Submit button disabled if invalid
- Server rejection: Shows error, allows re-entry

---

### Component: RoundSummary (Daily mode)

**Condition:** Consent must be given before submission

**Validation:**

- `consentGiven === true`

**Implementation:**

```typescript
const [consentGiven, setConsentGiven] = useState(false);

const canSubmit = validateNickname(nickname).isValid && consentGiven;

<Checkbox
  checked={consentGiven}
  onCheckedChange={setConsentGiven}
  id="consent"
/>
<label htmlFor="consent">
  I agree to have my nickname displayed on the public leaderboard
</label>

<Button disabled={!canSubmit} onClick={handleSubmit}>
  Submit to Leaderboard
</Button>
```

**UI Effect:**

- Submit button disabled until consent checked
- Checkbox with label explaining consent

---

### Component: GameView (Timer)

**Condition:** Total time must be reasonable (0 < time < 24 hours)

**Validation:**

- `total_time_ms > 0`
- `total_time_ms < 86400000` (24 hours)
- Cap at reasonable max like 1 hour for safety

**Implementation:**

```typescript
const MAX_TIME_MS = 3600000; // 1 hour

const getTotalTime = () => {
  const elapsed = elapsedMs;
  return Math.min(elapsed, MAX_TIME_MS);
};
```

**UI Effect:**

- Timer displays MM:SS
- Caps at max to prevent overflow
- Validation happens before submission

## 10. Error Handling

### Error Type: Map Loading Failure

**Scenario:** Mapbox fails to load due to network, API key issue, or browser incompatibility

**Detection:**

- Mapbox error event listener
- Timeout after 10 seconds

**User Message:**
"Unable to load map. Please check your internet connection and refresh the page."

**Actions:**

- Show ErrorMessage component
- Provide "Retry" button → reloads page
- Provide "Report Issue" button → opens feedback form
- Disable gameplay (cannot play without map)

**Logging:**

```typescript
console.error("[Map] Load failed:", error);
// Track analytics event
trackEvent("error", { type: "map_load", message: error.message });
```

---

### Error Type: Daily Set Not Available

**Scenario:** GET `/api/daily/sets/today` returns 404 (no set published for today)

**Detection:**

- Response status === 404
- Response body: `{ error: "No daily set published for today", fallback: "Try Normal mode instead" }`

**User Message:**
"Today's Daily Challenge isn't ready yet. Try Normal mode instead!"

**Actions:**

- Show ErrorMessage component
- Provide "Play Normal Mode" button → navigates to `/play/normal`
- Provide "Go Home" button → navigates to home

**Logging:**

```typescript
console.warn("[DailySet] No set available for today");
```

---

### Error Type: Submission Failure

**Scenario:** POST to submission endpoint fails (network, server error, timeout)

**Detection:**

- Response status >= 400
- Network error (fetch throws)
- Timeout after 30 seconds

**User Message:**

- Network error: "You appear to be offline. Check your connection and retry."
- Server error: "Couldn't submit your results. Want to retry?"
- Timeout: "Submission is taking too long. Want to retry?"

**Actions:**

- Show ErrorMessage component
- Provide "Retry" button → attempts submission again
- Provide "Continue Anyway" button → shows results without submitting (Daily mode)
- Keep guess data for retry

**Logging:**

```typescript
console.error("[Submission] Failed:", error);
trackEvent("error", { type: "submission", message: error.message });
```

**Additional:**

- Inform user: "Your results may not be recorded on the leaderboard"
- Allow viewing results locally even if submission fails

---

### Error Type: Network Offline

**Scenario:** User loses network connection during gameplay

**Detection:**

- `window.navigator.onLine === false`
- Fetch errors with network failure messages
- Periodic connectivity check

**User Message:**
"You're offline. Connect to the internet to submit your results."

**Actions:**

- Show warning banner (not blocking)
- Disable submissions
- Allow local gameplay (client-side scoring)
- When online again, allow submission

**Logging:**

```typescript
console.warn("[Network] Offline detected");
```

---

### Error Type: Invalid Guess Data

**Scenario:** Guess validation fails before submission (edge case, should be prevented by UI)

**Detection:**

- Validation functions return false
- Server rejects with 400 Bad Request

**User Message:**
"Oops! Your guess data is invalid. Please try again."

**Actions:**

- Show ErrorMessage component
- Reset current guess
- Allow re-guessing
- Provide "Report Issue" if persists

**Logging:**

```typescript
console.error("[Validation] Invalid guess:", guess);
trackEvent("error", { type: "invalid_guess", data: guess });
```

---

### Error Type: Already Submitted (Daily)

**Scenario:** User already submitted today, tries to submit again (shouldn't happen with proper checks)

**Detection:**

- `SubmissionCheckResponseDTO.has_submitted === true`
- Server returns 409 Conflict

**User Message:**
"You've already submitted today's challenge. This is a practice round."

**Actions:**

- Show AlreadySubmittedNotice banner
- Disable leaderboard submission
- Show results without rank
- Allow playing for practice

**Logging:**

```typescript
console.info("[Submission] Already submitted, practice mode");
```

---

### Error Type: Nickname Rejected (Profanity)

**Scenario:** Server rejects nickname due to profanity filter

**Detection:**

- Server returns 400 with specific error code/message
- Response: `{ error: "Nickname not allowed", code: "profanity" }`

**User Message:**
"This nickname isn't allowed. Please choose another."

**Actions:**

- Show error below nickname input
- Keep all scores and data
- Allow re-entering nickname
- Provide guidelines: "Use appropriate language, 3-20 characters"

**Logging:**

```typescript
console.warn("[Nickname] Rejected:", nickname);
```

---

### Error Type: Device Token Missing

**Scenario:** localStorage unavailable or blocked (private browsing, browser settings)

**Detection:**

- `useDeviceToken` hook returns `isStorageAvailable === false`
- localStorage throws on access

**User Message:**
"Daily mode requires browser storage. Enable cookies/storage or try Normal mode."

**Actions:**

- Show warning on page load
- Provide "Play Normal Mode" button
- Provide "Learn More" button → help article
- Disable Daily submissions

**Logging:**

```typescript
console.warn("[Storage] localStorage unavailable");
```

---

### Error Type: Photo Loading Failure

**Scenario:** Photo image fails to load (404, CDN issue, network)

**Detection:**

- `<img>` onError event
- Timeout after 10 seconds

**User Message:**
"Photo couldn't load. Want to retry or skip?"

**Actions:**

- Show placeholder with error icon
- Provide "Retry" button → attempts reload
- Provide "Skip Photo" button → marks as skipped, moves to next (edge case, logs for admin)

**Logging:**

```typescript
console.error("[Photo] Load failed:", photoUrl);
trackEvent("error", { type: "photo_load", photo_id });
```

---

### Error Type: Score Calculation Error

**Scenario:** Client-side score calculation fails (unexpected edge case)

**Detection:**

- Try-catch around `calculateScore` function
- Invalid result (NaN, negative, > max)

**User Message:**
(No user-facing message, handled silently)

**Actions:**

- Log error with details
- Show generic "Calculating..." message
- Rely on server calculation
- Don't block progression

**Logging:**

```typescript
console.error("[Score] Calculation failed:", error);
trackEvent("error", { type: "score_calc", details: error.message });
```

## 11. Implementation Steps

### Step 1: Set Up Project Structure

**Tasks:**

1. Create directory structure:

   ```
   src/
   ├── pages/
   │   └── play/
   │       └── [mode].astro
   ├── components/
   │   ├── game/
   │   │   ├── GameView.tsx
   │   │   ├── GameHeader.tsx
   │   │   ├── ModeBadge.tsx
   │   │   ├── ProgressIndicator.tsx
   │   │   ├── Timer.tsx
   │   │   ├── PhotoDisplay.tsx
   │   │   ├── MapComponent.tsx
   │   │   ├── YearPicker.tsx
   │   │   ├── SubmitButton.tsx
   │   │   ├── FeedbackSection.tsx
   │   │   ├── ScoreCard.tsx
   │   │   ├── PhotoBreakdown.tsx
   │   │   ├── RoundSummary.tsx
   │   │   ├── NicknameInput.tsx
   │   │   └── AlreadySubmittedNotice.tsx
   │   ├── ui/ (shadcn/ui components)
   │   └── hooks/
   │       ├── useGameTimer.ts
   │       ├── usePhotoGuess.ts
   │       ├── useDeviceToken.ts
   │       └── useSubmissionCheck.ts
   ├── lib/
   │   ├── utils/
   │   │   └── scoreCalculation.ts
   │   └── services/ (if needed for shared logic)
   └── types.ts (add new types)
   ```

2. Install dependencies:

   ```bash
   npm install mapbox-gl
   npm install @types/mapbox-gl -D
   npm install react-map-gl (optional, cleaner React integration)
   ```

3. Add Mapbox access token to `.env`:
   ```
   PUBLIC_MAPBOX_ACCESS_TOKEN=pk.ey...
   ```

**Validation:**

- Directories created
- Dependencies installed
- Environment variable set

---

### Step 2: Define Types and ViewModels

**Tasks:**

1. Open `src/types.ts`
2. Add new types defined in Section 5:
   - `GameMode`
   - `PinLocation`
   - `PhotoState`
   - `GameViewModel`
   - `GameError`
   - `CurrentGuess`
   - `TimerState`
   - `MapBounds`
   - `NicknameValidation`

3. Export types for use in components

**Example:**

```typescript
// In src/types.ts
export type GameMode = "normal" | "daily";

export type PinLocation = {
  lat: number;
  lon: number;
};

// ... rest of types
```

**Validation:**

- Types compile without errors
- Types available for import in components

---

### Step 3: Implement Custom Hooks

**Tasks:**

1. Create `src/components/hooks/useGameTimer.ts`
   - Implements timer logic with start/pause/reset
   - Returns `elapsedMs` updated every 100ms

2. Create `src/components/hooks/usePhotoGuess.ts`
   - Manages pin and year state
   - Provides setters and `isComplete` computed value

3. Create `src/components/hooks/useDeviceToken.ts`
   - Checks localStorage availability
   - Gets or generates device token
   - Handles storage errors gracefully

4. Create `src/components/hooks/useSubmissionCheck.ts`
   - Fetches submission status on mount
   - Returns `hasSubmitted` boolean

5. Create `src/lib/utils/scoreCalculation.ts`
   - Implements Haversine distance formula
   - Implements score calculation with constants Kkm=5, Ky=400
   - Returns `PhotoScoreResultDTO` (partial, without event details)

**Validation:**

- All hooks export correct interfaces
- Timer updates correctly
- Device token generates and persists
- Score calculation matches expected formulas

---

### Step 4: Build Map Component

**Tasks:**

1. Create `src/components/game/MapComponent.tsx`
2. Initialize Mapbox GL JS:

   ```typescript
   import mapboxgl from "mapbox-gl";
   import "mapbox-gl/dist/mapbox-gl.css";

   mapboxgl.accessToken = import.meta.env.PUBLIC_MAPBOX_ACCESS_TOKEN;
   ```

3. Implement map with:
   - Click handler for pin placement
   - Drag handler for pin movement
   - Zoom controls (+/- buttons)
   - Reset view button
   - Keyboard navigation (arrow keys, +/-)

4. Add feedback mode:
   - Display both user and correct pins
   - Draw line between pins
   - Show distance label

5. Handle loading states and errors

**Validation:**

- Map loads successfully
- Pin placement works on click
- Pin dragging works
- Zoom/pan work with touch and mouse
- Keyboard navigation works
- Feedback mode displays correctly

---

### Step 5: Build Year Picker Component

**Tasks:**

1. Create `src/components/game/YearPicker.tsx`
2. Use Shadcn/ui `Slider` component:

   ```tsx
   <Slider
     min={1880}
     max={2025}
     step={1}
     value={[selectedYear ?? 1880]}
     onValueChange={([year]) => handleYearChange(year)}
   />
   ```

3. Add numeric input for precise entry:

   ```tsx
   <Input
     type="number"
     min={1880}
     max={2025}
     value={selectedYear ?? ""}
     onChange={(e) => handleYearChange(parseInt(e.target.value))}
   />
   ```

4. Implement validation:
   - Range check: 1880-2025
   - Show error for invalid input
   - Disable submit if invalid

**Validation:**

- Slider moves smoothly from 1880 to 2025
- Input accepts numbers and validates range
- Error shows for out-of-range values
- Both input methods sync with each other

---

### Step 6: Build Game Header Components

**Tasks:**

1. Create `src/components/game/ModeBadge.tsx`
   - Display "Normal Mode" or "Daily Challenge" with appropriate styling

2. Create `src/components/game/ProgressIndicator.tsx`
   - Display 5 circles, highlight current photo
   - Use Tailwind for styling (filled vs outlined)

3. Create `src/components/game/Timer.tsx`
   - Format `elapsedMs` as MM:SS
   - Update every second (or receive from parent)
   - ARIA live region for accessibility

4. Create `src/components/game/GameHeader.tsx`
   - Compose ModeBadge, ProgressIndicator, Timer, Exit button
   - Responsive layout (stack on mobile)

**Validation:**

- Header displays all elements correctly
- Timer updates every second
- Progress indicator highlights current photo
- Exit button triggers confirmation dialog

---

### Step 7: Build Photo Display Component

**Tasks:**

1. Create `src/components/game/PhotoDisplay.tsx`
2. Display image with:
   - Responsive sizing (Tailwind aspect-ratio)
   - Loading skeleton while image loads
   - Alt text for accessibility
   - Photo counter: "Photo X of 5"

3. Handle image loading:

   ```tsx
   const [isLoading, setIsLoading] = useState(true);

   <img
     src={photo.photo_url}
     alt={`Football photo ${currentIndex + 1} of ${totalPhotos}`}
     onLoad={() => setIsLoading(false)}
     onError={() => handleImageError()}
   />;
   ```

**Validation:**

- Image displays correctly
- Loading skeleton shows while loading
- Counter displays correctly
- Image error handled gracefully

---

### Step 8: Build Feedback and Scoring Components

**Tasks:**

1. Create `src/components/game/ScoreCard.tsx`
   - Display location score, time score, total score
   - Show km error and year error
   - Animate score counting (optional, use framer-motion or CSS)

2. Create `src/components/game/FeedbackSection.tsx`
   - Compose ScoreCard with running total
   - Add "Next Photo" button (or "See Results" for photo 5)
   - Position over map as overlay/card

3. Style with Tailwind:
   - Card background, shadow, rounded corners
   - Score colors (green for high, yellow for medium, red for low)
   - Responsive layout

**Validation:**

- Feedback displays after submission
- Scores shown correctly
- Map shows both pins and line
- Next button advances to next photo

---

### Step 9: Build Round Summary Component

**Tasks:**

1. Create `src/components/game/PhotoBreakdown.tsx`
   - Display thumbnail, event name, score for one photo
   - Expandable for more details (optional)

2. Create `src/components/game/NicknameInput.tsx`
   - Input field with validation
   - Character counter
   - Real-time error messages

3. Create `src/components/game/RoundSummary.tsx`
   - Full-screen modal/overlay
   - Display total score, total time
   - Map PhotoBreakdown over all 5 photos
   - Conditional rendering:
     - Daily, first attempt: Show nickname input and consent, submit button
     - Daily, after submission: Show leaderboard rank, view leaderboard button
     - Normal: Just show play again button

4. Handle submission flow:
   - Validate nickname and consent
   - Call submission API
   - Update with server response
   - Handle errors (nickname rejection, network failure)

**Validation:**

- Summary displays after 5 photos
- Nickname validation works correctly
- Submission succeeds and shows rank
- Error handling works for rejections
- Play again button resets game

---

### Step 10: Build Main GameView Component

**Tasks:**

1. Create `src/components/game/GameView.tsx`
2. Set up state management:

   ```typescript
   const [gameState, dispatch] = useReducer(gameReducer, initialState);
   const { pin, year, setPin, setYear, clearGuess, isComplete } = usePhotoGuess();
   const { elapsedMs, startTimer, pauseTimer } = useGameTimer(gameState.mode === "daily");
   const { deviceToken } = useDeviceToken();
   const { hasSubmitted } = useSubmissionCheck(gameState.mode, deviceToken);
   ```

3. Implement game flow logic:
   - Initialize with props from Astro page
   - Handle pin placement → `setPin(lat, lon)`
   - Handle year selection → `setYear(year)`
   - Handle submit → create GuessDTO, call scoring API, dispatch action, show feedback
   - Handle next photo → increment index, clear guess, hide feedback
   - Handle round completion → show summary, call final submission API

4. Render child components:

   ```tsx
   return (
     <div className="game-container">
       {hasSubmitted && <AlreadySubmittedNotice />}
       <GameHeader {...headerProps} />
       <PhotoDisplay {...photoProps} />
       <MapComponent {...mapProps} />
       <YearPicker {...yearProps} />
       <SubmitButton {...submitProps} />
       {showFeedback && <FeedbackSection {...feedbackProps} />}
       {showSummary && <RoundSummary {...summaryProps} />}
       {gameState.error && <ErrorMessage {...errorProps} />}
     </div>
   );
   ```

5. Implement reducer for complex state updates:
   ```typescript
   function gameReducer(state: GameViewModel, action: GameAction): GameViewModel {
     switch (action.type) {
       case "SUBMIT_GUESS":
         // Update current photo with guess and result
         // Increment total score
         // Mark photo as complete
         return { ...state /* updates */ };
       // ... other actions
     }
   }
   ```

**Validation:**

- GameView orchestrates all components correctly
- State updates flow through all children
- Game progresses through 5 photos
- Submit, next, and completion work correctly

---

### Step 11: Build Astro Page and Data Fetching

**Tasks:**

1. Create `src/pages/play/[mode].astro`
2. Validate mode parameter:

   ```typescript
   const { mode } = Astro.params;
   if (mode !== "normal" && mode !== "daily") {
     return Astro.redirect("/play/normal");
   }
   ```

3. Fetch data based on mode:

   ```typescript
   let initialData;
   let isAlreadySubmitted = false;

   if (mode === "daily") {
     // Fetch daily set
     const dailyResponse = await fetch("/api/daily/sets/today");
     if (!dailyResponse.ok) {
       // Handle error: redirect to normal or show error page
     }
     initialData = await dailyResponse.json();

     // Check submission status
     const deviceToken = Astro.cookies.get("anon_device_token")?.value;
     if (deviceToken) {
       const checkResponse = await fetch("/api/daily/submissions/check", {
         headers: { "X-Device-Token": deviceToken },
       });
       const checkData = await checkResponse.json();
       isAlreadySubmitted = checkData.has_submitted;
     }
   } else {
     // Fetch random photos for Normal mode
     const normalResponse = await fetch("/api/normal/photos");
     initialData = await normalResponse.json();
   }
   ```

4. Render GameView:

   ```astro
   ---
   import GameView from "@/components/game/GameView";
   export const prerender = false;
   // ... fetch logic above
   ---

   <html>
     <head>
       <title>FootyGuess Daily - {mode === "daily" ? "Daily Challenge" : "Normal Mode"}</title>
       <!-- Mapbox CSS -->
       <link href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css" rel="stylesheet" />
     </head>
     <body>
       <GameView client:load mode={mode} initialData={initialData} isAlreadySubmitted={isAlreadySubmitted} />
     </body>
   </html>
   ```

**Validation:**

- Page loads for both /play/normal and /play/daily
- Invalid mode redirects to /play/normal
- Daily mode fetches daily set correctly
- Normal mode fetches random photos
- Submission check works for Daily mode
- Data passed to GameView correctly

---

### Step 12: Implement Error Handling

**Tasks:**

1. Create `src/components/ui/ErrorMessage.tsx` (if not exists)
2. Handle all error scenarios defined in Section 10:
   - Map loading failure
   - Daily set not available
   - Submission failure
   - Network offline
   - Invalid guess data
   - Already submitted
   - Nickname rejected
   - Device token missing
   - Photo loading failure

3. For each error type:
   - Create appropriate error state
   - Display ErrorMessage component
   - Provide retry or fallback actions
   - Log errors for monitoring

4. Add error boundaries:

   ```tsx
   // In GameView or parent
   import { ErrorBoundary } from "react-error-boundary";

   <ErrorBoundary fallback={<ErrorFallback />}>
     <GameView {...props} />
   </ErrorBoundary>;
   ```

**Validation:**

- All error scenarios handled gracefully
- Error messages clear and actionable
- Retry buttons work correctly
- Errors logged for debugging
- UI doesn't break on errors

---

### Step 13: Implement Analytics Tracking

**Tasks:**

1. Create analytics helper:

   ```typescript
   // src/lib/utils/analytics.ts
   export async function trackEvent(eventType: string, eventData: Record<string, any>, deviceToken: string | null) {
     try {
       await fetch("/api/analytics/events", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
           event_type: eventType,
           event_data: eventData,
           anon_device_token: deviceToken,
         }),
       });
     } catch (err) {
       console.warn("Analytics error:", err);
       // Don't block UI
     }
   }
   ```

2. Add tracking calls in GameView:
   - `start_round`: On mount
   - `guess_submitted`: After each photo submission
   - `round_complete`: After 5 photos
   - `daily_submission`: When submitting to leaderboard

**Validation:**

- Events tracked at appropriate times
- Events don't block UI
- Errors logged but don't affect gameplay

---

### Step 14: Add Accessibility Features

**Tasks:**

1. In MapComponent:
   - Add ARIA labels: `aria-label="Interactive world map"`
   - Add keyboard navigation instructions
   - Announce pin placement in ARIA live region

2. In Timer:
   - ARIA live region for time updates: `aria-live="polite"`

3. In all interactive elements:
   - Proper focus management
   - Tab order makes sense
   - Focus visible on keyboard navigation

4. In FeedbackSection:
   - Announce scores in ARIA live region
   - Move focus to feedback when it appears

5. Test with screen reader (NVDA or VoiceOver)

**Validation:**

- All interactive elements keyboard accessible
- Tab order logical
- Screen reader announces important updates
- Focus management works correctly

---

### Step 15: Style and Responsive Design

**Tasks:**

1. Apply Tailwind styles to all components
2. Ensure responsive layout:
   - Mobile: Stack components vertically, full-width map
   - Tablet: Side-by-side photo and map
   - Desktop: Optimal layout with large photo and map

3. Test on various screen sizes:
   - Mobile: 375px, 414px
   - Tablet: 768px, 1024px
   - Desktop: 1280px, 1920px

4. Ensure touch targets >= 44x44px on mobile
5. Test dark mode (if supported)

**Validation:**

- Layout works on all screen sizes
- No horizontal scroll on mobile
- Touch targets large enough
- Readable text at all sizes

---

### Step 16: Test End-to-End Flow

**Tasks:**

1. Test Normal mode:
   - Load page
   - Play through 5 photos
   - Submit all guesses
   - View round summary
   - Play again

2. Test Daily mode (first attempt):
   - Load page
   - Verify daily set loads
   - Play through 5 photos
   - Enter nickname and consent
   - Submit to leaderboard
   - View leaderboard rank
   - Try playing again → see "already submitted" notice

3. Test Daily mode (subsequent attempt):
   - Load page
   - See "already submitted" notice
   - Play through 5 photos
   - View summary without leaderboard submission

4. Test error scenarios:
   - Simulate network failure
   - Simulate invalid input
   - Simulate map loading failure

**Validation:**

- All flows complete successfully
- Data persists correctly
- Errors handled gracefully
- UI updates smoothly

---

### Step 17: Performance Optimization

**Tasks:**

1. Optimize images:
   - Use srcset for responsive images
   - Lazy load next photos
   - Compress thumbnails

2. Optimize map:
   - Lazy load Mapbox library
   - Memoize MapComponent with React.memo
   - Minimize re-renders

3. Optimize state updates:
   - Use useCallback for event handlers
   - Use useMemo for expensive calculations
   - Debounce pin drag updates

4. Measure performance:
   - Lighthouse audit
   - Web Vitals (LCP, FID, CLS)
   - Custom timing for map interactions

**Validation:**

- Initial load < 2 seconds on 4G
- Map interactions < 200ms median latency
- Lighthouse score > 90
- No layout shifts (CLS < 0.1)

---

### Step 18: Final Testing and Deployment

**Tasks:**

1. Cross-browser testing:
   - Chrome, Firefox, Safari, Edge
   - Mobile browsers: Safari iOS, Chrome Android

2. Accessibility audit:
   - Automated: axe DevTools
   - Manual: Screen reader testing

3. Security review:
   - Verify no answer leakage
   - Verify input validation
   - Verify rate limiting (if implemented)

4. Deploy to staging:
   - Test with real API
   - Test with real Mapbox
   - Test on real devices

5. User acceptance testing:
   - Get feedback from test users
   - Fix any issues found

6. Deploy to production

**Validation:**

- All browsers work correctly
- Accessibility passes audit
- Security vulnerabilities addressed
- Performance targets met
- User feedback positive

---

## Summary

This implementation plan provides a comprehensive guide to building the Game View for FootyGuess Daily. The view supports both Normal and Daily modes, handles complex state across 5 photos, integrates with Mapbox for interactive map-based guessing, validates user input, calculates scores, and submits to leaderboards.

Key considerations:

- **State management** using useReducer and custom hooks
- **API integration** with proper error handling
- **Accessibility** with keyboard navigation and screen reader support
- **Performance** with lazy loading and optimization
- **Responsive design** for mobile, tablet, and desktop
- **Error handling** for all failure scenarios
- **Security** with server-side validation and no answer leakage

Follow the implementation steps sequentially to build a robust, user-friendly game view that meets all PRD requirements.
