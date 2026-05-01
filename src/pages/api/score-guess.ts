import type { APIRoute } from "astro";
import type { GuessDTO } from "@/types";
import { ValidationConstants } from "@/types";
import { scoreGuesses } from "@/lib/services/normal-rounds.service";

export const prerender = false;

/**
 * POST /api/score-guess
 * Scores a single guess and reveals the correct location.
 * Used for per-photo reveal during a round (Daily and Normal mode).
 *
 * @returns 200 - PhotoScoreResultDTO with score and correct location
 * @returns 400 - Invalid guess data or unknown photo_id
 * @returns 500 - Server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = (await request.json()) as Partial<GuessDTO>;
    const { photo_id, guessed_lat, guessed_lon } = body;
    const { COORDINATES } = ValidationConstants;

    if (typeof photo_id !== "string" || photo_id.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid photo_id", timestamp: new Date().toISOString() }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (
      typeof guessed_lat !== "number" ||
      typeof guessed_lon !== "number" ||
      guessed_lat < COORDINATES.LAT_MIN ||
      guessed_lat > COORDINATES.LAT_MAX ||
      guessed_lon < COORDINATES.LON_MIN ||
      guessed_lon > COORDINATES.LON_MAX
    ) {
      return new Response(
        JSON.stringify({ error: "Invalid guess coordinates", timestamp: new Date().toISOString() }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const [result] = await scoreGuesses(locals.supabase, [{ photo_id, guessed_lat, guessed_lon }]);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[POST /api/score-guess] Error:", error);

    if (error instanceof Error && error.message === "INVALID_PHOTO_IDS") {
      return new Response(
        JSON.stringify({
          error: "Invalid photo_id",
          code: "invalid_photo_ids",
          details: ["The photo_id does not exist"],
          timestamp: new Date().toISOString(),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Failed to score guess", timestamp: new Date().toISOString() }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
