import type { APIRoute } from "astro";
import { z } from "zod";

import { getLeaderboard } from "@/lib/services/leaderboard.service";

export const prerender = false;

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(1000).default(100),
});

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

/**
 * GET /api/leaderboard/{date}
 * Retrieves leaderboard for a specific date
 *
 * Path parameters:
 * - date: Date in YYYY-MM-DD format
 *
 * Query parameters:
 * - limit: Maximum number of entries (default: 100, max: 1000)
 *
 * @returns 200 - Leaderboard data for the specified date
 * @returns 400 - Invalid date format
 * @returns 404 - No leaderboard data for this date
 * @returns 422 - Invalid query parameters
 * @returns 500 - Server error
 */
export const GET: APIRoute = async ({ params, locals, url }) => {
  try {
    const { date } = params;

    // Validate date format
    if (!date || !dateRegex.test(date)) {
      return new Response(
        JSON.stringify({
          error: "Invalid date format",
          details: ["Date must be in YYYY-MM-DD format"],
          timestamp: new Date().toISOString(),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate date is not in the future
    const requestedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (requestedDate > today) {
      return new Response(
        JSON.stringify({
          error: "Invalid date",
          details: ["Cannot retrieve leaderboard for future dates"],
          timestamp: new Date().toISOString(),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse and validate query parameters
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const validationResult = querySchema.safeParse(queryParams);

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

    const leaderboard = await getLeaderboard(locals.supabase, date, limit);

    // Check if leaderboard has any entries
    if (leaderboard.total_submissions === 0) {
      return new Response(
        JSON.stringify({
          error: "No leaderboard data available",
          details: [`No submissions found for date ${date}`],
          timestamp: new Date().toISOString(),
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify(leaderboard), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[GET /api/leaderboard/{date}] Error:", error);

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
