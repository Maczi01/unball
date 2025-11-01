import type { APIRoute } from "astro";

import { getAvailablePhotosForDaily } from "@/lib/services/daily-sets.service";
import type { ErrorResponseDTO } from "@/types";

export const prerender = false;

/**
 * GET /api/admin/daily-sets/available-photos
 * Retrieves photos eligible for daily sets
 *
 * @returns 200 - Paginated list of available photos
 * @returns 401 - Unauthorized
 * @returns 403 - Forbidden (not admin)
 * @returns 500 - Server error
 */
export const GET: APIRoute = async ({ locals, url }) => {
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

    // Parse query parameters
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);

    const result = await getAvailablePhotosForDaily(locals.supabase, page, limit);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[GET /api/admin/daily-sets/available-photos] Error:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to retrieve available photos",
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
