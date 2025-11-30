import type { SupabaseClient } from "@/db/supabase.client";
import type { LeaderboardEntryDTO, LeaderboardResponseDTO } from "@/types";

/**
 * Fetches the leaderboard for a specific date
 * Returns top entries ranked by score (desc), time (asc), timestamp (asc)
 * Includes all submissions with nicknames (authenticated and anonymous with consent)
 *
 * @param supabase - Supabase client from context.locals
 * @param dateUtc - Date in YYYY-MM-DD format
 * @param limit - Maximum number of entries to return (default: 100)
 * @returns Leaderboard response with entries and metadata
 */
export async function getLeaderboard(
  supabase: SupabaseClient,
  dateUtc: string,
  limit = 100
): Promise<LeaderboardResponseDTO> {
  try {
    // Fetch all submissions for the date, ordered by ranking criteria
    // Include both authenticated users and anonymous users with consent
    const { data: submissions, error: submissionsError } = await supabase
      .from("leaderboard_with_users")
      .select("*")
      .eq("date_utc", dateUtc)
      .order("total_score", { ascending: false })
      .order("total_time_ms", { ascending: true })
      .order("submission_timestamp", { ascending: true })
      .limit(limit);

    if (submissionsError) {
      throw submissionsError;
    }

    // Get total count of submissions for this date
    const { count, error: countError } = await supabase
      .from("leaderboard_with_users")
      .select("*", { count: "exact", head: true })
      .eq("date_utc", dateUtc);

    if (countError) {
      throw countError;
    }

    // Map submissions to leaderboard entries with rank
    const leaderboard: LeaderboardEntryDTO[] =
      submissions?.map((submission, index) => ({
        rank: index + 1,
        nickname: submission.nickname ?? "Anonymous",
        total_score: submission.total_score ?? 0,
        total_time_ms: submission.total_time_ms ?? 0,
        submission_timestamp: submission.submission_timestamp ?? new Date().toISOString(),
      })) ?? [];

    return {
      date_utc: dateUtc,
      leaderboard,
      total_submissions: count ?? 0,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[Leaderboard Service] Error fetching leaderboard:", error);
    throw error;
  }
}

/**
 * Fetches today's leaderboard
 * Convenience wrapper around getLeaderboard
 *
 * @param supabase - Supabase client from context.locals
 * @param limit - Maximum number of entries to return (default: 100)
 * @returns Leaderboard response for today
 */
export async function getTodaysLeaderboard(supabase: SupabaseClient, limit = 100): Promise<LeaderboardResponseDTO> {
  const today = new Date().toISOString().split("T")[0];
  return getLeaderboard(supabase, today, limit);
}

/**
 * Gets available leaderboard dates
 * Returns list of dates that have leaderboard data
 * Includes dates with any submissions (authenticated or anonymous with consent)
 *
 * @param supabase - Supabase client from context.locals
 * @param limit - Maximum number of dates to return (default: 30)
 * @returns Array of dates with leaderboard data
 */
export async function getAvailableLeaderboardDates(supabase: SupabaseClient, limit = 30): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("leaderboard_with_users")
      .select("date_utc")
      .order("date_utc", { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    // Get unique dates
    const uniqueDates = [...new Set(data?.map((item) => item.date_utc).filter(Boolean) ?? [])];

    return uniqueDates as string[];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[Leaderboard Service] Error fetching available dates:", error);
    throw error;
  }
}
