import type { APIRoute } from "astro";
import { getMatchByCode, MatchExpiredError, MatchNotFoundError } from "@/lib/services/matches.service";

export const prerender = false;

/**
 * GET /api/matches/[code]
 * Looks up a friends match by code. Open to anonymous users.
 * Returns photos without answers, plus an `already_submitted` flag
 * for the current requester (by user_id or X-Device-Token header).
 *
 * @returns 200 - Match join payload
 * @returns 404 - Match not found
 * @returns 410 - Match expired
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

    const result = await getMatchByCode(locals.supabase, code, { userId, deviceToken });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof MatchNotFoundError) {
      return new Response(
        JSON.stringify({
          error: "Match not found",
          code: "match_not_found",
          timestamp: new Date().toISOString(),
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    if (error instanceof MatchExpiredError) {
      return new Response(
        JSON.stringify({
          error: "This match has expired",
          code: "match_expired",
          timestamp: new Date().toISOString(),
        }),
        { status: 410, headers: { "Content-Type": "application/json" } }
      );
    }

    // eslint-disable-next-line no-console
    console.error("[GET /api/matches/[code]] Error:", error);
    return new Response(JSON.stringify({ error: "Failed to load match", timestamp: new Date().toISOString() }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
