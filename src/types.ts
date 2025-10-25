/**
 * DTOs and Command Models for FootyGuess Daily API
 *
 * All types are derived from database entities defined in src/db/database.types.ts
 * This ensures type safety and consistency between API layer and data layer.
 */

import type { Database } from "@/db/database.types";

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Generic pagination metadata
 * Used across multiple list endpoints
 */
export type PaginationDTO = {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
};

/**
 * Type helper to extract table row types
 */
export type DbTable<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];

export type DbInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];

export type DbUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];

// =============================================================================
// NORMAL MODE GAMEPLAY
// =============================================================================

/**
 * Photo metadata for Normal mode (no answers revealed)
 * Derived from photos_metadata view
 */
export type NormalRoundPhotoDTO = {
  photo_id: string; // Renamed from 'id' for consistency
  photo_url: string;
  thumbnail_url: string | null;
  competition: string | null;
  place: string | null;
  tags: string[] | null;
};

/**
 * Response for GET /api/normal/photos
 * Contains a round ID and 5 random photos
 */
export type NormalRoundResponseDTO = {
  round_id: string;
  photos: NormalRoundPhotoDTO[];
};

/**
 * Single guess for a photo (location + year)
 * Used in both Normal and Daily mode submissions
 */
export type GuessDTO = {
  photo_id: string;
  guessed_lat: number;
  guessed_lon: number;
  guessed_year: number;
};

/**
 * Command to calculate scores for Normal mode
 * Request body for POST /api/normal/calculate-score
 */
export type CalculateScoreCommand = {
  round_id: string;
  guesses: GuessDTO[];
  total_time_ms: number;
};

/**
 * Score result for a single photo with revealed answer
 * Combines calculated scores with photo details
 */
export type PhotoScoreResultDTO = {
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
  place: string | null;
  source_url: string | null;
  license: string;
  credit: string;
};

/**
 * Response for POST /api/normal/calculate-score
 * Contains total scores and per-photo breakdowns
 */
export type ScoreResponseDTO = {
  total_score: number;
  total_time_ms: number;
  photos: PhotoScoreResultDTO[];
};

// =============================================================================
// DAILY MODE GAMEPLAY
// =============================================================================

/**
 * Photo in a daily set with position
 * Combines daily_set_photos.position with photo metadata
 */
export type DailySetPhotoDTO = {
  photo_id: string;
  position: number;
  photo_url: string;
  thumbnail_url: string | null;
  competition: string | null;
  place: string | null;
  tags: string[] | null;
};

/**
 * Response for GET /api/daily/sets/today
 * Contains today's daily set
 */
export type DailySetResponseDTO = Pick<DbTable<"daily_sets">, "date_utc"> & {
  daily_set_id: string; // Derived from daily_sets.id
  photos: DailySetPhotoDTO[];
};

/**
 * Submission details for check endpoint
 * Subset of daily_submissions with calculated rank
 */
export type SubmissionDetailsDTO = {
  id: string;
  total_score: number;
  total_time_ms: number;
  submission_timestamp: string;
  leaderboard_rank: number;
};

/**
 * Response for GET /api/daily/submissions/check
 * Indicates if user has already submitted today
 */
export type SubmissionCheckResponseDTO = {
  has_submitted: boolean;
  submission: SubmissionDetailsDTO | null;
};

/**
 * Command to submit daily challenge results
 * Request body for POST /api/daily/submissions
 */
export type DailySubmissionCommand = {
  daily_set_id: string;
  date_utc: string;
  nickname: string;
  consent_given: boolean;
  guesses: GuessDTO[];
  total_time_ms: number;
};

/**
 * Response for POST /api/daily/submissions
 * Contains submission confirmation and revealed answers
 */
export type DailySubmissionResponseDTO = {
  submission_id: string;
  total_score: number;
  total_time_ms: number;
  leaderboard_rank: number;
  photos: PhotoScoreResultDTO[];
};

// =============================================================================
// LEADERBOARD
// =============================================================================

/**
 * Single entry in the daily leaderboard
 * Derived from daily_submissions with calculated rank
 */
export type LeaderboardEntryDTO = Pick<
  DbTable<"daily_submissions">,
  "nickname" | "total_score" | "total_time_ms" | "submission_timestamp"
> & {
  rank: number;
};

/**
 * Response for GET /api/daily/leaderboard/{date}
 * Top 10 (or more) rankings for a specific date
 */
export type LeaderboardResponseDTO = {
  date_utc: string;
  leaderboard: LeaderboardEntryDTO[];
  total_submissions: number;
};

// =============================================================================
// NICKNAME MANAGEMENT
// =============================================================================

/**
 * Device nickname information
 * Direct mapping to device_nicknames table
 */
export type DeviceNicknameDTO = DbTable<"device_nicknames">;

/**
 * Command to create or update device nickname
 * Request body for PUT /api/devices/nickname
 */
export type UpdateDeviceNicknameCommand = {
  nickname: string;
  consent_given: boolean;
};

/**
 * User profile information
 * Derived from users table with renamed id field
 */
export type UserProfileDTO = Omit<DbTable<"users">, "id"> & {
  user_id: string;
};

/**
 * Command to update user profile
 * Request body for PATCH /api/users/me/profile
 */
export type UpdateUserProfileCommand = {
  nickname: string;
  consent_given: boolean;
};

// =============================================================================
// ANALYTICS
// =============================================================================

/**
 * Command to track an analytics event
 * Request body for POST /api/analytics/events
 */
export type AnalyticsEventCommand = Pick<
  DbInsert<"analytics_events">,
  "event_type" | "event_data" | "anon_device_token"
>;

/**
 * Response for POST /api/analytics/events
 * Confirmation with event ID
 */
export type AnalyticsEventResponseDTO = Pick<DbTable<"analytics_events">, "created_at"> & {
  event_id: number; // Derived from analytics_events.id
};

// =============================================================================
// CREDITS
// =============================================================================

/**
 * Photo credit information for credits page
 * Subset of photos table with attribution fields
 */
export type PhotoCreditDTO = Pick<
  DbTable<"photos">,
  "event_name" | "source_url" | "license" | "credit" | "year_utc"
> & {
  photo_id: string; // Derived from photos.id
};

/**
 * Response for GET /api/credits
 * Paginated list of photo credits
 */
export type CreditsResponseDTO = {
  credits: PhotoCreditDTO[];
  pagination: PaginationDTO;
};

// =============================================================================
// ADMIN - PHOTOS MANAGEMENT
// =============================================================================

/**
 * Command to create a new photo
 * Request data for POST /api/admin/photos (multipart form)
 * Note: photo_file is handled separately as multipart upload
 */
export type CreatePhotoCommand = Omit<
  DbInsert<"photos">,
  "id" | "created_at" | "updated_at" | "photo_url" | "thumbnail_url"
> & {
  photo_file?: File | Blob; // Added for multipart upload handling
};

/**
 * Complete photo details for admin
 * Direct mapping to photos table Row
 */
export type AdminPhotoDTO = DbTable<"photos">;

/**
 * Summary photo information for admin list view
 * Subset of photos with key fields
 */
export type AdminPhotoListItemDTO = Pick<
  DbTable<"photos">,
  | "id"
  | "photo_url"
  | "thumbnail_url"
  | "event_name"
  | "year_utc"
  | "lat"
  | "lon"
  | "is_daily_eligible"
  | "first_used_in_daily_date"
  | "created_at"
>;

/**
 * Response for GET /api/admin/photos
 * Paginated list of photos
 */
export type AdminPhotosResponseDTO = {
  photos: AdminPhotoListItemDTO[];
  pagination: PaginationDTO;
};

/**
 * Command to update photo metadata
 * Request body for PATCH /api/admin/photos/{id}
 * All fields are optional (partial update)
 */
export type UpdatePhotoCommand = Partial<
  Omit<
    DbUpdate<"photos">,
    "id" | "created_at" | "updated_at" | "photo_url" | "thumbnail_url" | "first_used_in_daily_date"
  >
>;

// =============================================================================
// ADMIN - DAILY SETS MANAGEMENT
// =============================================================================

/**
 * Command to create a new daily set
 * Request body for POST /api/admin/daily-sets
 */
export type CreateDailySetCommand = {
  date_utc: string;
  photo_ids: string[]; // Must be exactly 5 unique photo IDs
};

/**
 * Photo information in admin daily set view
 * Combines daily_set_photos with photo details
 */
export type AdminDailySetPhotoDTO = {
  photo_id: string;
  position: number;
  event_name: string;
  photo_url: string;
  year_utc: number;
};

/**
 * Complete daily set details for admin
 * Combines daily_sets with photo array
 */
export type AdminDailySetDTO = Pick<
  DbTable<"daily_sets">,
  "date_utc" | "is_published" | "created_at" | "updated_at"
> & {
  daily_set_id: string; // Derived from daily_sets.id
  photos: AdminDailySetPhotoDTO[];
};

/**
 * Summary daily set information for admin list view
 * Includes photo count
 */
export type AdminDailySetListItemDTO = Pick<DbTable<"daily_sets">, "date_utc" | "is_published" | "created_at"> & {
  daily_set_id: string; // Derived from daily_sets.id
  photo_count: number;
};

/**
 * Schedule status metadata for admin dashboard
 * Indicates content health and planning
 */
export type ScheduleStatusDTO = {
  days_scheduled_ahead: number;
  next_unpublished_date: string | null;
  warning: string | null;
};

/**
 * Response for GET /api/admin/daily-sets
 * Paginated list with schedule overview
 */
export type AdminDailySetsResponseDTO = {
  daily_sets: AdminDailySetListItemDTO[];
  pagination: PaginationDTO;
  schedule_status: ScheduleStatusDTO;
};

// =============================================================================
// ADMIN - ANALYTICS
// =============================================================================

/**
 * High-level analytics overview for admin dashboard
 * Response for GET /api/admin/analytics/overview
 */
export type AdminAnalyticsOverviewDTO = {
  period: {
    from_date: string;
    to_date: string;
  };
  adoption: {
    unique_players: number;
    new_players: number;
  };
  engagement: {
    total_rounds: number;
    round_completion_rate: number;
    median_session_time_seconds: number;
    daily_participation_rate: number;
  };
  retention: {
    day_1_retention: number;
    day_7_returning_users: number;
  };
  performance: {
    median_load_time_ms: number;
    median_map_latency_ms: number;
  };
  content_health: {
    days_scheduled_ahead: number;
    photo_pool_size: number;
    photos_available_for_daily: number;
  };
};

/**
 * Full analytics event details for admin
 * Direct mapping to analytics_events table
 */
export type AdminAnalyticsEventDTO = DbTable<"analytics_events">;

/**
 * Response for GET /api/admin/analytics/events
 * Paginated list of analytics events
 */
export type AdminAnalyticsEventsResponseDTO = {
  events: AdminAnalyticsEventDTO[];
  pagination: PaginationDTO;
};

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * Standard error response format
 * Used across all API endpoints
 */
export type ErrorResponseDTO = {
  error: string;
  details?: string[];
  code?: string;
  timestamp: string;
};

// =============================================================================
// VALIDATION CONSTANTS (for runtime validation)
// =============================================================================

/**
 * Constants for validation rules
 * These match the constraints defined in the API plan
 */
export const ValidationConstants = {
  NICKNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
    REGEX: /^[a-zA-Z0-9 _-]+$/,
  },
  YEAR: {
    MIN: 1880,
    MAX: 2025,
  },
  COORDINATES: {
    LAT_MIN: -90,
    LAT_MAX: 90,
    LON_MIN: -180,
    LON_MAX: 180,
  },
  TIME: {
    MIN_MS: 0,
    MAX_MS: 86400000, // 24 hours
  },
  DAILY_SET: {
    PHOTO_COUNT: 5,
  },
  FILE_UPLOAD: {
    MAX_SIZE_MB: 10,
    ALLOWED_FORMATS: ["jpg", "jpeg", "png", "webp"] as const,
  },
  PAGINATION: {
    DEFAULT_LIMIT: 50,
    MAX_LIMIT: 100,
  },
} as const;

// =============================================================================
// GAME VIEW - CLIENT-SIDE TYPES
// =============================================================================

/**
 * Game mode enum
 */
export type GameMode = "normal" | "daily";

/**
 * Pin location on map
 */
export type PinLocation = {
  lat: number; // -90 to 90
  lon: number; // -180 to 180
};

/**
 * State for a single photo in the round
 * Supports both Normal mode (NormalRoundPhotoDTO) and Daily mode (DailySetPhotoDTO)
 */
export type PhotoState = {
  photoData: NormalRoundPhotoDTO | DailySetPhotoDTO;
  guess: GuessDTO | null; // Set after submission
  result: PhotoScoreResultDTO | null; // Set after scoring
  status: "pending" | "guessing" | "submitted" | "complete";
};

/**
 * Main game state ViewModel
 * Manages entire game flow across 5 photos
 */
export type GameViewModel = {
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
export type GameError = {
  type: "map_load" | "submission" | "network" | "no_daily_set" | "invalid_guess";
  message: string;
  retryable: boolean;
};

/**
 * Current guess state (before submission)
 */
export type CurrentGuess = {
  pin: PinLocation | null;
  year: number | null;
};

/**
 * Timer state
 */
export type TimerState = {
  startTime: number; // Unix timestamp
  elapsedMs: number;
  isRunning: boolean;
};

/**
 * Map viewport bounds
 */
export type MapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

/**
 * Nickname validation result
 */
export type NicknameValidation = {
  isValid: boolean;
  error?: string;
};
