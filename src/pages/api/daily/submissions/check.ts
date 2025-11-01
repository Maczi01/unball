import type { APIRoute } from "astro";
import type { SubmissionCheckResponseDTO } from "@/types";
import { checkDailySubmission } from "@/lib/services/submissions.service";

export const prerender = false;

/**
 * GET /api/daily/submissions/check
 * Checks if the user has already submitted today's Daily challenge
 *
 * @returns 200 - Submission status
 * @returns 400 - Missing device token
 * @returns 500 - Server error
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Get device token from header
    const deviceToken = request.headers.get("X-Device-Token");

    if (!deviceToken) {
      return new Response(
        JSON.stringify({
          error: "Device token is required",
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

    // Get today's date in UTC
    const today = new Date().toISOString().split("T")[0];

    // Check database for existing submission
    const response: SubmissionCheckResponseDTO = await checkDailySubmission(locals.supabase, deviceToken, today);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[GET /api/daily/submissions/check] Error:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to check submission status",
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
