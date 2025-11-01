import type { APIRoute } from "astro";

import { autoPublishTodaysDailySet } from "@/lib/services/daily-sets.service";
import type { ErrorResponseDTO } from "@/types";

export const prerender = false;

/**
 * POST /api/cron/publish-daily-set
 * Auto-publishes today's daily set (if unpublished)
 *
 * Security: Requires CRON_SECRET environment variable in Authorization header
 *
 * This endpoint should be called by a scheduled task at 00:00 UTC daily.
 *
 * Platform-specific setup:
 *
 * Vercel Cron:
 * - Add to vercel.json:
 *   {
 *     "crons": [{
 *       "path": "/api/cron/publish-daily-set",
 *       "schedule": "0 0 * * *"
 *     }]
 *   }
 * - Set CRON_SECRET in Vercel environment variables
 *
 * GitHub Actions:
 * - Create .github/workflows/daily-publish.yml:
 *   name: Publish Daily Set
 *   on:
 *     schedule:
 *       - cron: '0 0 * * *'
 *   jobs:
 *     publish:
 *       runs-on: ubuntu-latest
 *       steps:
 *         - name: Call publish endpoint
 *           run: |
 *             curl -X POST https://your-domain.com/api/cron/publish-daily-set \
 *               -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
 *
 * Alternative platforms:
 * - AWS EventBridge: Schedule rule to trigger this endpoint
 * - Google Cloud Scheduler: HTTP target to this endpoint
 * - Render Cron Jobs: Add cron job configuration
 * - Railway Cron: Use their cron job feature
 *
 * @returns 200 - Success (published or already published)
 * @returns 401 - Unauthorized (missing or invalid CRON_SECRET)
 * @returns 404 - No daily set found for today
 * @returns 500 - Server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Security check: Verify CRON_SECRET
    const cronSecret = import.meta.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("[Cron] CRON_SECRET not configured in environment variables");
      return new Response(
        JSON.stringify({
          error: "Cron endpoint not configured",
          timestamp: new Date().toISOString(),
        } satisfies ErrorResponseDTO),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const authHeader = request.headers.get("Authorization");
    const providedSecret = authHeader?.replace("Bearer ", "");

    if (!providedSecret || providedSecret !== cronSecret) {
      console.warn("[Cron] Unauthorized cron request attempt");
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          timestamp: new Date().toISOString(),
        } satisfies ErrorResponseDTO),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Auto-publish today's daily set
    const result = await autoPublishTodaysDailySet(locals.supabase);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("[Cron] Error publishing daily set:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to publish daily set",
        details: error instanceof Error ? [error.message] : undefined,
        timestamp: new Date().toISOString(),
      } satisfies ErrorResponseDTO),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * GET /api/cron/publish-daily-set
 * Health check endpoint (does not publish, just checks status)
 *
 * Useful for monitoring/debugging
 *
 * @returns 200 - Status information
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    // Check if today has a set
    const { data: dailySet } = await locals.supabase
      .from("daily_sets")
      .select("id, date_utc, is_published")
      .eq("date_utc", today)
      .single();

    return new Response(
      JSON.stringify({
        today,
        set_exists: !!dailySet,
        is_published: dailySet?.is_published || false,
        daily_set_id: dailySet?.id || null,
        message: dailySet
          ? dailySet.is_published
            ? "Today's set is already published"
            : "Today's set exists but is not yet published"
          : "No set scheduled for today",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("[Cron Health Check] Error:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to check status",
        details: error instanceof Error ? [error.message] : undefined,
        timestamp: new Date().toISOString(),
      } satisfies ErrorResponseDTO),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
