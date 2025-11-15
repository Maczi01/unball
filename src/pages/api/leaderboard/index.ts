import type { APIRoute } from "astro";
import { z } from "zod";

import { getTodaysLeaderboard } from "@/lib/services/leaderboard.service";

export const prerender = false;

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(1000).default(100),
});

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
