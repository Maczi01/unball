import type { APIRoute } from "astro";
import { z } from "zod";

import { listDailySets, createDailySet } from "@/lib/services/daily-sets.service";
import type { ErrorResponseDTO } from "@/types";

export const prerender = false;

/**
 * GET /api/admin/daily-sets
 * Lists all daily sets with pagination and filters
 *
 * @returns 200 - Paginated list of daily sets with schedule status
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
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
    const from_date = url.searchParams.get("from_date") || undefined;
    const to_date = url.searchParams.get("to_date") || undefined;
    const is_published = url.searchParams.get("is_published")
      ? url.searchParams.get("is_published") === "true"
      : undefined;

    const result = await listDailySets(locals.supabase, page, limit, from_date, to_date, is_published);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[GET /api/admin/daily-sets] Error:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to retrieve daily sets",
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
 * POST /api/admin/daily-sets
 * Creates a new daily set for a specific date
 *
 * @returns 201 - Created daily set
 * @returns 400 - Validation error
 * @returns 401 - Unauthorized
 * @returns 403 - Forbidden (not admin)
 * @returns 409 - Conflict (date already has a set)
 * @returns 500 - Server error
 */
export const POST: APIRoute = async ({ locals, request }) => {
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

    // Parse and validate request body
    const createDailySetSchema = z.object({
      date_utc: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Use YYYY-MM-DD"),
      photo_ids: z.array(z.string().uuid()).length(5, "Must provide exactly 5 photo IDs"),
    });

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Invalid JSON in request body",
          timestamp: new Date().toISOString(),
        } satisfies ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const validation = createDailySetSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validation.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
          timestamp: new Date().toISOString(),
        } satisfies ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { date_utc, photo_ids } = validation.data;

    // Create daily set
    const dailySet = await createDailySet(locals.supabase, date_utc, photo_ids);

    return new Response(JSON.stringify(dailySet), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[POST /api/admin/daily-sets] Error:", error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes("already exists")) {
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

      if (
        error.message.includes("Must provide exactly") ||
        error.message.includes("unique") ||
        error.message.includes("Invalid date") ||
        error.message.includes("past dates") ||
        error.message.includes("invalid") ||
        error.message.includes("not daily eligible")
      ) {
        return new Response(
          JSON.stringify({
            error: "Validation failed",
            details: [error.message],
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
        error: "Failed to create daily set",
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
