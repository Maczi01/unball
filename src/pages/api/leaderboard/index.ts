import type { APIRoute } from "astro";
import { z } from "zod";
import type { DailySubmissionCommand, DailySubmissionResponseDTO } from "@/types";
import { ValidationConstants } from "@/types";
import { getTodaysLeaderboard } from "@/lib/services/leaderboard.service";
import { submitDailyChallenge } from "@/lib/services/submissions.service";

export const prerender = false;

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(1000).default(100),
});

/**
 * POST /api/leaderboard
 * Submits a score to the leaderboard
 *
 * @returns 200 - Submission confirmed with rank
 * @returns 400 - Invalid submission data
 * @returns 409 - Already submitted today
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
    // eslint-disable-next-line no-console
    console.error("[POST /api/leaderboard] Error:", error);

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

/**
 * GET /api/leaderboard
 * Retrieves today's leaderboard with top submissions
 *
 * Query parameters:
 * - limit: Maximum number of entries (default: 100, max: 1000)
 *
 * @returns 200 - Leaderboard data with rankings
 * @returns 422 - Invalid query parameters
 * @returns 500 - Server error
 */
export const GET: APIRoute = async ({ locals, url }) => {
  try {
    // Parse and validate query parameters
    const params = Object.fromEntries(url.searchParams.entries());
    const validationResult = querySchema.safeParse(params);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid query parameters",
          details: validationResult.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
          timestamp: new Date().toISOString(),
        }),
        {
          status: 422,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { limit } = validationResult.data;

    const leaderboard = await getTodaysLeaderboard(locals.supabase, limit);

    return new Response(JSON.stringify(leaderboard), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60, s-maxage=60",
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[GET /api/leaderboard] Error:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to retrieve leaderboard",
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
