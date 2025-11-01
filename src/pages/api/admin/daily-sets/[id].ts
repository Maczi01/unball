import type { APIRoute } from "astro";

import { getDailySetById, deleteDailySet } from "@/lib/services/daily-sets.service";
import type { ErrorResponseDTO } from "@/types";

export const prerender = false;

/**
 * GET /api/admin/daily-sets/:id
 * Retrieves a specific daily set with full details
 *
 * @returns 200 - Daily set details
 * @returns 401 - Unauthorized
 * @returns 403 - Forbidden (not admin)
 * @returns 404 - Daily set not found
 * @returns 500 - Server error
 */
export const GET: APIRoute = async ({ locals, params }) => {
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

    const dailySet = await getDailySetById(locals.supabase, id);

    return new Response(JSON.stringify(dailySet), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/daily-sets/:id] Error:", error);

    if (error instanceof Error && error.message === "Daily set not found") {
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

    return new Response(
      JSON.stringify({
        error: "Failed to retrieve daily set",
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
 * DELETE /api/admin/daily-sets/:id
 * Deletes a daily set (only if no submissions exist)
 *
 * @returns 200 - Deletion successful
 * @returns 401 - Unauthorized
 * @returns 403 - Forbidden (not admin)
 * @returns 404 - Daily set not found
 * @returns 409 - Conflict (has submissions)
 * @returns 500 - Server error
 */
export const DELETE: APIRoute = async ({ locals, params }) => {
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

    await deleteDailySet(locals.supabase, id);

    return new Response(
      JSON.stringify({
        message: "Daily set deleted successfully",
        daily_set_id: id,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("[DELETE /api/admin/daily-sets/:id] Error:", error);

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

      if (error.message.includes("Cannot delete daily set with existing submissions")) {
        return new Response(
          JSON.stringify({
            error: error.message,
            timestamp: new Date().toISOString(),
          } satisfies ErrorResponseDTO),
          {
            status: 409,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({
        error: "Failed to delete daily set",
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
