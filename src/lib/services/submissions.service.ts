import type { SupabaseClient } from "@/db/supabase.client";
import type {
  DailySubmissionCommand,
  GuessDTO,
  PhotoScoreResultDTO,
  SubmissionCheckResponseDTO,
  SubmissionDetailsDTO,
} from "@/types";
import { calculateDistance, calculateLocationScore, calculateTimeScore } from "@/lib/utils/scoreCalculation";

/**
 * Checks if a device has already submitted for a specific date
 * @param supabase - Supabase client from context.locals
 * @param deviceToken - Anonymous device token
 * @param dateUtc - Date in YYYY-MM-DD format
 * @returns Submission check response with details if exists
 */
export async function checkDailySubmission(
  supabase: SupabaseClient,
  deviceToken: string,
  dateUtc: string
): Promise<SubmissionCheckResponseDTO> {
  try {
    const { data, error } = await supabase
      .from("daily_submissions")
      .select("id, total_score, total_time_ms, submission_timestamp")
      .eq("date_utc", dateUtc)
      .eq("anon_device_token", deviceToken)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return {
        has_submitted: false,
        submission: null,
      };
    }

    // Calculate rank for this submission
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
    console.error("[Submissions Service] Error checking submission:", error);
    throw error;
  }
}

/**
 * Submits a daily challenge to the leaderboard
 * @param supabase - Supabase client from context.locals
 * @param deviceToken - Anonymous device token
 * @param command - Submission data with guesses
 * @returns Submission ID, total score, rank, and photo results
 */
export async function submitDailyChallenge(
  supabase: SupabaseClient,
  deviceToken: string,
  command: DailySubmissionCommand
): Promise<{
  submission_id: string;
  total_score: number;
  leaderboard_rank: number;
  photos: PhotoScoreResultDTO[];
}> {
  try {
    const { daily_set_id, date_utc, nickname, consent_given, guesses, total_time_ms } = command;

    // 1. Check for duplicate submission
    const existingSubmission = await checkDailySubmission(supabase, deviceToken, date_utc);
    if (existingSubmission.has_submitted) {
      throw new Error("DUPLICATE_SUBMISSION");
    }

    // 2. Fetch correct answers for all photos
    const photoIds = guesses.map((g) => g.photo_id);
    const { data: photos, error: photosError } = await supabase
      .from("photos")
      .select("id, lat, lon, year_utc, event_name, description, place, source_url, license, credit")
      .in("id", photoIds);

    if (photosError) {
      throw photosError;
    }

    if (!photos || photos.length !== guesses.length) {
      throw new Error("INVALID_PHOTO_IDS");
    }

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
      const yearError = Math.abs(guess.guessed_year - correctPhoto.year_utc);

      const locationScore = calculateLocationScore(kmError);
      const timeScore = calculateTimeScore(yearError);

      return {
        photo_id: guess.photo_id,
        location_score: locationScore,
        time_score: timeScore,
        total_score: locationScore + timeScore,
        km_error: Math.round(kmError * 10) / 10,
        year_error: yearError,
        correct_lat: correctPhoto.lat,
        correct_lon: correctPhoto.lon,
        correct_year: correctPhoto.year_utc,
        event_name: correctPhoto.event_name,
        description: correctPhoto.description,
        place: correctPhoto.place,
        source_url: correctPhoto.source_url,
        license: correctPhoto.license,
        credit: correctPhoto.credit,
      };
    });

    const totalScore = photoResults.reduce((sum, result) => sum + result.total_score, 0);

    // 5. Store submission in database
    const { data: submission, error: submissionError } = await supabase
      .from("daily_submissions")
      .insert({
        daily_set_id,
        date_utc,
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

    // 6. Store/update nickname in device_nicknames table
    if (consent_given) {
      const { error: nicknameError } = await supabase.from("device_nicknames").upsert(
        {
          anon_device_token: deviceToken,
          nickname,
          consent_given_at: new Date().toISOString(),
        },
        {
          onConflict: "anon_device_token",
        }
      );

      if (nicknameError) {
        console.error("[Submissions Service] Error storing nickname:", nicknameError);
        // Don't fail the submission if nickname storage fails
      }
    }

    // 7. Calculate leaderboard rank
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
      photos: photoResults,
    };
  } catch (error) {
    console.error("[Submissions Service] Error submitting daily challenge:", error);
    throw error;
  }
}

/**
 * Calculates leaderboard rank for a submission using tie-breaking logic
 * Tie-breaking order: score DESC, time ASC, timestamp ASC
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
    // Count submissions that rank higher (better) than this one
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
    console.error("[Submissions Service] Error calculating rank:", error);
    throw error;
  }
}
