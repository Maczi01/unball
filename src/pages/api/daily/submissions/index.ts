import type { APIRoute } from "astro";
import type { DailySubmissionCommand, DailySubmissionResponseDTO } from "@/types";
import { ValidationConstants } from "@/types";
import { submitDailyChallenge } from "@/lib/services/submissions.service";

export const prerender = false;

/**
 * POST /api/daily/submissions
 * Submits Daily challenge results
 * - Authenticated users: saves to leaderboard
 * - Anonymous users: shows potential rank without saving
 *
 * @returns 200 - Submission confirmed with rank/potential rank
 * @returns 400 - Invalid submission data
 * @returns 401 - Not authenticated (for duplicate check on logged users)
 * @returns 409 - Already submitted today (authenticated users only)
 * @returns 500 - Server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Get user from session (if authenticated)
    const userId = locals.user?.id ?? null;

    // Get device token from header (optional for authenticated users)
    const deviceToken = request.headers.get("X-Device-Token") ?? null;

    // Parse request body
    const body = (await request.json()) as DailySubmissionCommand;

    // Validate submission
    const { nickname, guesses, total_time_ms } = body;

    // Validate nickname
    if (!ValidationConstants.NICKNAME.REGEX.test(nickname)) {
      return new Response(
        JSON.stringify({
          error: "Invalid nickname",
          code: "invalid_format",
          details: ["Nickname must contain only letters, numbers, spaces, hyphens, and underscores"],
          timestamp: new Date().toISOString(),
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (
      nickname.length < ValidationConstants.NICKNAME.MIN_LENGTH ||
      nickname.length > ValidationConstants.NICKNAME.MAX_LENGTH
    ) {
      return new Response(
        JSON.stringify({
          error: "Invalid nickname length",
          details: [
            `Nickname must be between ${ValidationConstants.NICKNAME.MIN_LENGTH} and ${ValidationConstants.NICKNAME.MAX_LENGTH} characters`,
          ],
          timestamp: new Date().toISOString(),
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Validate guesses
    if (!Array.isArray(guesses) || guesses.length !== ValidationConstants.DAILY_SET.PHOTO_COUNT) {
      return new Response(
        JSON.stringify({
          error: "Invalid guesses",
          details: [`Must provide exactly ${ValidationConstants.DAILY_SET.PHOTO_COUNT} guesses`],
          timestamp: new Date().toISOString(),
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Submit with server-side scoring
    const result = await submitDailyChallenge(locals.supabase, body, userId, deviceToken);

    const response: DailySubmissionResponseDTO = {
      submission_id: result.submission_id,
      total_score: result.total_score,
      total_time_ms,
      leaderboard_rank: result.leaderboard_rank,
      potential_rank: result.potential_rank,
      is_saved: result.is_saved,
      photos: result.photos,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("[POST /api/daily/submissions] Error:", error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message === "DUPLICATE_SUBMISSION") {
        return new Response(
          JSON.stringify({
            error: "Already submitted",
            code: "duplicate_submission",
            details: ["You have already submitted today's Daily Challenge"],
            timestamp: new Date().toISOString(),
          }),
          {
            status: 409,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      if (error.message === "INVALID_PHOTO_IDS" || error.message === "PHOTO_ID_MISMATCH") {
        return new Response(
          JSON.stringify({
            error: "Invalid submission",
            code: "invalid_photo_ids",
            details: ["The submitted photo IDs do not match today's daily set"],
            timestamp: new Date().toISOString(),
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({
        error: "Failed to submit to leaderboard",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
