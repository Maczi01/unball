import type { APIRoute } from "astro";
import type { MatchSubmissionCommand } from "@/types";
import { ValidationConstants } from "@/types";
import {
  DuplicateMatchSubmissionError,
  MatchExpiredError,
  MatchNotFoundError,
  submitMatch,
} from "@/lib/services/matches.service";

export const prerender = false;

/**
 * POST /api/matches/[code]/submissions
 * Submits a player's 5 guesses to a friends match. Signed-in or anonymous
 * (anonymous players must send X-Device-Token header).
 *
 * @returns 200 - Submission saved with per-photo results
 * @returns 400 - Invalid input
 * @returns 404 - Match not found
 * @returns 409 - Player already submitted to this match
 * @returns 410 - Match expired
 * @returns 500 - Server error
 */
export const POST: APIRoute = async ({ params, request, locals }) => {
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

    if (!userId && !deviceToken) {
      return new Response(
        JSON.stringify({
          error: "Anonymous submission requires X-Device-Token header",
          code: "missing_device_token",
          timestamp: new Date().toISOString(),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = (await request.json()) as MatchSubmissionCommand;
    const { nickname, guesses, total_time_ms } = body;

    if (!nickname || !ValidationConstants.NICKNAME.REGEX.test(nickname)) {
      return new Response(
        JSON.stringify({
          error: "Invalid nickname",
          code: "invalid_format",
          timestamp: new Date().toISOString(),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (
      nickname.length < ValidationConstants.NICKNAME.MIN_LENGTH ||
      nickname.length > ValidationConstants.NICKNAME.MAX_LENGTH
    ) {
      return new Response(
        JSON.stringify({
          error: "Invalid nickname length",
          code: "invalid_length",
          timestamp: new Date().toISOString(),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!Array.isArray(guesses) || guesses.length !== ValidationConstants.DAILY_SET.PHOTO_COUNT) {
      return new Response(
        JSON.stringify({
          error: `Must provide exactly ${ValidationConstants.DAILY_SET.PHOTO_COUNT} guesses`,
          code: "invalid_guess_count",
          timestamp: new Date().toISOString(),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (
      typeof total_time_ms !== "number" ||
      total_time_ms < ValidationConstants.TIME.MIN_MS ||
      total_time_ms > ValidationConstants.TIME.MAX_MS
    ) {
      return new Response(JSON.stringify({ error: "Invalid total_time_ms", timestamp: new Date().toISOString() }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await submitMatch(locals.supabase, code, body, { userId, deviceToken });

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
    if (error instanceof MatchExpiredError) {
      return new Response(
        JSON.stringify({ error: "This match has expired", code: "match_expired", timestamp: new Date().toISOString() }),
        { status: 410, headers: { "Content-Type": "application/json" } }
      );
    }
    if (error instanceof DuplicateMatchSubmissionError) {
      return new Response(
        JSON.stringify({
          error: "You have already submitted to this match",
          code: "duplicate_submission",
          timestamp: new Date().toISOString(),
        }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    if (error instanceof Error && (error.message === "PHOTO_ID_MISMATCH" || error.message === "INVALID_GUESS_COUNT")) {
      return new Response(
        JSON.stringify({
          error: "Submitted guesses do not match this match's photos",
          code: "photo_id_mismatch",
          timestamp: new Date().toISOString(),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // eslint-disable-next-line no-console
    console.error("[POST /api/matches/[code]/submissions] Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to submit match round", timestamp: new Date().toISOString() }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
