import type { APIRoute } from "astro";
import type { CalculateScoreCommand } from "@/types";
import { ValidationConstants } from "@/types";
import { scoreNormalRound } from "@/lib/services/normal-rounds.service";

export const prerender = false;

/**
 * POST /api/normal/calculate-score
 * Scores a Normal-mode round (5 random photos, no leaderboard, no auth).
 *
 * @returns 200 - Per-photo scores and total
 * @returns 400 - Invalid submission data
 * @returns 500 - Server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = (await request.json()) as CalculateScoreCommand;
    const { guesses, total_time_ms } = body;

    if (!Array.isArray(guesses) || guesses.length !== ValidationConstants.DAILY_SET.PHOTO_COUNT) {
      return new Response(
        JSON.stringify({
          error: "Invalid guesses",
          details: [`Must provide exactly ${ValidationConstants.DAILY_SET.PHOTO_COUNT} guesses`],
          timestamp: new Date().toISOString(),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { COORDINATES, TIME } = ValidationConstants;
    const allCoordsValid = guesses.every(
      (g) =>
        typeof g.photo_id === "string" &&
        typeof g.guessed_lat === "number" &&
        typeof g.guessed_lon === "number" &&
        g.guessed_lat >= COORDINATES.LAT_MIN &&
        g.guessed_lat <= COORDINATES.LAT_MAX &&
        g.guessed_lon >= COORDINATES.LON_MIN &&
        g.guessed_lon <= COORDINATES.LON_MAX
    );

    if (!allCoordsValid) {
      return new Response(
        JSON.stringify({
          error: "Invalid guess coordinates",
          details: ["Each guess must include photo_id and valid lat/lon"],
          timestamp: new Date().toISOString(),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (typeof total_time_ms !== "number" || total_time_ms < TIME.MIN_MS || total_time_ms > TIME.MAX_MS) {
      return new Response(
        JSON.stringify({
          error: "Invalid total_time_ms",
          timestamp: new Date().toISOString(),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const response = await scoreNormalRound(locals.supabase, body);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[POST /api/normal/calculate-score] Error:", error);

    if (error instanceof Error && error.message === "INVALID_PHOTO_IDS") {
      return new Response(
        JSON.stringify({
          error: "Invalid photo IDs",
          code: "invalid_photo_ids",
          details: ["One or more photo_id values do not exist"],
          timestamp: new Date().toISOString(),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Failed to calculate score",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
