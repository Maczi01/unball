import type { APIRoute } from "astro";

import { publishDailySet } from "@/lib/services/daily-sets.service";
import type { ErrorResponseDTO } from "@/types";

export const prerender = false;

/**
 * POST /api/admin/daily-sets/:id/publish
 * Publishes a daily set, making it active for the specified date
 *
 * @returns 200 - Published daily set
 * @returns 400 - Validation error (incomplete set, already published)
 * @returns 401 - Unauthorized
 * @returns 403 - Forbidden (not admin)
 * @returns 404 - Daily set not found
 * @returns 500 - Server error
 */
export const POST: APIRoute = async ({ locals, params }) => {
  try {
    // Check authentication
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          error: "Authentication required",
          timestamp: new Date().toISOString(),
        } satisfies ErrorResponseDTO),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check admin role
    const { data: userData, error: userError } = await locals.supabase
      .from("users")
      .select("role")
      .eq("id", locals.user.id)
      .single();

    if (userError || !userData || userData.role !== "admin") {
      return new Response(
        JSON.stringify({
          error: "Admin access required",
          timestamp: new Date().toISOString(),
        } satisfies ErrorResponseDTO),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({
          error: "Daily set ID required",
          timestamp: new Date().toISOString(),
        } satisfies ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const dailySet = await publishDailySet(locals.supabase, id);

    return new Response(JSON.stringify(dailySet), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("[POST /api/admin/daily-sets/:id/publish] Error:", error);

    if (error instanceof Error) {
      if (error.message === "Daily set not found") {
        return new Response(
          JSON.stringify({
            error: "Daily set not found",
            timestamp: new Date().toISOString(),
          } satisfies ErrorResponseDTO),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (error.message.includes("already published") || error.message.includes("Cannot publish incomplete set")) {
        return new Response(
          JSON.stringify({
            error: error.message,
            timestamp: new Date().toISOString(),
          } satisfies ErrorResponseDTO),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

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
