import type { APIRoute } from "astro";
import { getMatchResults, MatchNotFoundError, NotAMatchParticipantError } from "@/lib/services/matches.service";

export const prerender = false;

/**
 * GET /api/matches/[code]/results
 * Returns the comparison view: photos with answers + every player's
 * submission and per-photo guesses. Caller MUST have submitted to this
 * match — non-participants get 403 to prevent answer harvesting.
 *
 * @returns 200 - Comparison view payload
 * @returns 403 - Caller has not submitted to this match
 * @returns 404 - Match not found
 * @returns 500 - Server error
 */
export const GET: APIRoute = async ({ params, request, locals }) => {
  try {
    const code = params.code;
    if (typeof code !== "string" || code.length === 0) {
      return new Response(JSON.stringify({ error: "Missing code", timestamp: new Date().toISOString() }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = locals.user?.id ?? null;
    const deviceToken = request.headers.get("X-Device-Token") ?? null;

    const result = await getMatchResults(locals.supabase, code, { userId, deviceToken });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof MatchNotFoundError) {
      return new Response(
        JSON.stringify({ error: "Match not found", code: "match_not_found", timestamp: new Date().toISOString() }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    if (error instanceof NotAMatchParticipantError) {
      return new Response(
        JSON.stringify({
          error: "You must submit to this match before viewing results",
          code: "not_a_participant",
          timestamp: new Date().toISOString(),
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // eslint-disable-next-line no-console
    console.error("[GET /api/matches/[code]/results] Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to load match results", timestamp: new Date().toISOString() }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
