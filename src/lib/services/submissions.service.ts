import type { SupabaseClient } from "@/db/supabase.client";
import type {
  DailySubmissionCommand,
  PhotoScoreResultDTO,
  SubmissionCheckResponseDTO,
  SubmissionDetailsDTO,
} from "@/types";
import { calculateDistance, calculateLocationScore } from "@/lib/utils/scoreCalculation";

/**
 * Checks if a user/device has already submitted for a specific date
 * @param supabase - Supabase client from context.locals
 * @param dateUtc - Date in YYYY-MM-DD format
 * @param userId - Optional user ID (for authenticated users)
 * @param deviceToken - Optional anonymous device token (for anonymous users)
 * @returns Submission check response with details if exists
 */
export async function checkDailySubmission(
  supabase: SupabaseClient,
  dateUtc: string,
  userId?: string | null,
  deviceToken?: string | null
): Promise<SubmissionCheckResponseDTO> {
  try {
    let query = supabase
      .from("daily_submissions")
      .select("id, total_score, total_time_ms, submission_timestamp, user_id")
      .eq("date_utc", dateUtc);

    // If authenticated, check by user_id
    if (userId) {
      query = query.eq("user_id", userId);
    } else if (deviceToken) {
      // For anonymous users, check by device token
      query = query.eq("anon_device_token", deviceToken).is("user_id", null);
    } else {
      // No user_id or device token - cannot check
      return {
        has_submitted: false,
        submission: null,
      };
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return {
        has_submitted: false,
        submission: null,
      };
    }

    // Calculate rank for all submissions (authenticated and anonymous)
    const rank = await calculateLeaderboardRank(
      supabase,
      dateUtc,
      data.total_score,
      data.total_time_ms,
      data.submission_timestamp
    );

    const submission: SubmissionDetailsDTO = {
      id: data.id,
      total_score: data.total_score,
      total_time_ms: data.total_time_ms,
      submission_timestamp: data.submission_timestamp,
      leaderboard_rank: rank,
    };

    return {
      has_submitted: true,
      submission,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[Submissions Service] Error checking submission:", error);
    throw error;
  }
}

/**
 * Submits a daily challenge
 * - For authenticated users: saves to leaderboard
 * - For anonymous users: calculates potential rank without saving
 * @param supabase - Supabase client from context.locals
 * @param command - Submission data with guesses
 * @param userId - Optional user ID (for authenticated users)
 * @param deviceToken - Optional anonymous device token
 * @returns Submission ID (if saved), total score, rank/potential rank, and photo results
 */
export async function submitDailyChallenge(
  supabase: SupabaseClient,
  command: DailySubmissionCommand,
  userId?: string | null,
  deviceToken?: string | null
): Promise<{
  submission_id: string | null;
  total_score: number;
  leaderboard_rank: number | null;
  potential_rank: number | null;
  is_saved: boolean;
  photos: PhotoScoreResultDTO[];
}> {
  try {
    const { daily_set_id, date_utc, nickname, guesses, total_time_ms } = command;

    // 1. Check for duplicate submission (only for authenticated users)
    if (userId) {
      const existingSubmission = await checkDailySubmission(supabase, date_utc, userId, null);
      if (existingSubmission.has_submitted) {
        throw new Error("DUPLICATE_SUBMISSION");
      }
    }

    // 2. Fetch correct answers for all photos
    const photoIds = guesses.map((g) => g.photo_id);
    const { data: photos, error: photosError } = await supabase
      .from("photos")
      .select("id, lat, lon, description, place, license, credit, photo_url")
      .in("id", photoIds);

    if (photosError) {
      throw photosError;
    }

    if (!photos || photos.length !== guesses.length) {
      throw new Error("INVALID_PHOTO_IDS");
    }

    // Fetch photo more info for all photos
    const { data: allMoreInfo, error: moreInfoError } = await supabase
      .from("photo_more_info")
      .select("id, photo_id, info_type, url, title, description, position")
      .in("photo_id", photoIds)
      .order("position", { ascending: true });

    if (moreInfoError) {
      // eslint-disable-next-line no-console
      console.error("[Submissions Service] Error fetching more info:", moreInfoError);
    }

    // Group more info by photo_id
    const moreInfoByPhotoId = new Map<string, typeof allMoreInfo>();
    allMoreInfo?.forEach((info) => {
      if (!moreInfoByPhotoId.has(info.photo_id)) {
        moreInfoByPhotoId.set(info.photo_id, []);
      }
      moreInfoByPhotoId.get(info.photo_id)?.push(info);
    });

    // 3. Validate photo IDs match the daily set
    const { data: dailySetPhotos, error: dailySetError } = await supabase
      .from("daily_set_photos")
      .select("photo_id")
      .eq("daily_set_id", daily_set_id);

    if (dailySetError) {
      throw dailySetError;
    }

    const dailySetPhotoIds = new Set(dailySetPhotos?.map((p) => p.photo_id) || []);
    const allGuessesValid = photoIds.every((id) => dailySetPhotoIds.has(id));

    if (!allGuessesValid) {
      throw new Error("PHOTO_ID_MISMATCH");
    }

    // 4. Calculate scores server-side
    const photoResults: PhotoScoreResultDTO[] = guesses.map((guess) => {
      const correctPhoto = photos.find((p) => p.id === guess.photo_id);
      if (!correctPhoto) {
        throw new Error(`Photo not found: ${guess.photo_id}`);
      }

      const kmError = calculateDistance(guess.guessed_lat, guess.guessed_lon, correctPhoto.lat, correctPhoto.lon);

      const locationScore = calculateLocationScore(kmError);

      return {
        photo_id: guess.photo_id,
        photo_url: correctPhoto.photo_url,
        location_score: locationScore,
        total_score: locationScore,
        km_error: Math.round(kmError * 10) / 10,
        correct_lat: correctPhoto.lat,
        correct_lon: correctPhoto.lon,
        event_name: "", // TODO: Fetch from database when schema is updated
        description: correctPhoto.description,
        place: correctPhoto.place,
        more_info: moreInfoByPhotoId.get(guess.photo_id) || [],
        license: correctPhoto.license,
        credit: correctPhoto.credit,
      };
    });

    const totalScore = photoResults.reduce((sum, result) => sum + result.total_score, 0);

    // 5. Determine if we should save to leaderboard
    // Save if: authenticated user OR anonymous user with consent
    const shouldSaveToLeaderboard = userId || (command.consent_given && deviceToken);

    if (shouldSaveToLeaderboard) {
      // Check for duplicate submission for anonymous users with device token
      if (!userId && deviceToken) {
        const existingSubmission = await checkDailySubmission(supabase, date_utc, null, deviceToken);
        if (existingSubmission.has_submitted) {
          throw new Error("DUPLICATE_SUBMISSION");
        }
      }

      const { data: submission, error: submissionError } = await supabase
        .from("daily_submissions")
        .insert({
          daily_set_id,
          date_utc,
          user_id: userId,
          anon_device_token: deviceToken,
          nickname,
          total_score: totalScore,
          total_time_ms,
        })
        .select("id, submission_timestamp")
        .single();

      if (submissionError) {
        // Check for unique constraint violation
        if (submissionError.code === "23505") {
          throw new Error("DUPLICATE_SUBMISSION");
        }
        throw submissionError;
      }

      // 6. Calculate actual leaderboard rank
      const rank = await calculateLeaderboardRank(
        supabase,
        date_utc,
        totalScore,
        total_time_ms,
        submission.submission_timestamp
      );

      return {
        submission_id: submission.id,
        total_score: totalScore,
        leaderboard_rank: rank,
        potential_rank: null,
        is_saved: true,
        photos: photoResults,
      };
    } else {
      // Anonymous user without consent - calculate potential rank without saving
      const potentialRank = await calculatePotentialRank(supabase, date_utc, totalScore, total_time_ms);

      return {
        submission_id: null,
        total_score: totalScore,
        leaderboard_rank: null,
        potential_rank: potentialRank,
        is_saved: false,
        photos: photoResults,
      };
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[Submissions Service] Error submitting daily challenge:", error);
    throw error;
  }
}

/**
 * Calculates leaderboard rank for a submission using tie-breaking logic
 * Tie-breaking order: score DESC, time ASC, timestamp ASC
 * Counts all submissions (authenticated users and anonymous users with consent)
 * @param supabase - Supabase client
 * @param dateUtc - Date in YYYY-MM-DD format
 * @param score - Total score
 * @param timeMs - Total time in milliseconds
 * @param timestamp - Submission timestamp
 * @returns Rank (1-based)
 */
async function calculateLeaderboardRank(
  supabase: SupabaseClient,
  dateUtc: string,
  score: number,
  timeMs: number,
  timestamp: string
): Promise<number> {
  try {
    // Count all submissions that rank higher (better) than this one
    const { count, error } = await supabase
      .from("daily_submissions")
      .select("*", { count: "exact", head: true })
      .eq("date_utc", dateUtc)
      .or(
        `total_score.gt.${score},and(total_score.eq.${score},total_time_ms.lt.${timeMs}),and(total_score.eq.${score},total_time_ms.eq.${timeMs},submission_timestamp.lt.${timestamp})`
      );

    if (error) {
      throw error;
    }

    // Rank is count of better submissions + 1
    return (count ?? 0) + 1;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[Submissions Service] Error calculating rank:", error);
    throw error;
  }
}

/**
 * Calculates potential rank for an anonymous user without consent
 * Shows where they would place if they submitted to the leaderboard
 * Counts all submissions (authenticated users and anonymous users with consent)
 * @param supabase - Supabase client
 * @param dateUtc - Date in YYYY-MM-DD format
 * @param score - Total score
 * @param timeMs - Total time in milliseconds
 * @returns Potential rank (1-based)
 */
async function calculatePotentialRank(
  supabase: SupabaseClient,
  dateUtc: string,
  score: number,
  timeMs: number
): Promise<number> {
  try {
    // Count all submissions with better or equal score/time
    // Use current timestamp as tiebreaker assumption
    const currentTime = new Date().toISOString();

    const { count, error } = await supabase
      .from("daily_submissions")
      .select("*", { count: "exact", head: true })
      .eq("date_utc", dateUtc)
      .or(
        `total_score.gt.${score},and(total_score.eq.${score},total_time_ms.lt.${timeMs}),and(total_score.eq.${score},total_time_ms.eq.${timeMs},submission_timestamp.lt.${currentTime})`
      );

    if (error) {
      throw error;
    }

    // Potential rank is count of better submissions + 1
    return (count ?? 0) + 1;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[Submissions Service] Error calculating potential rank:", error);
    throw error;
  }
}
