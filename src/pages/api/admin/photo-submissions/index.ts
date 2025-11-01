import type { APIRoute } from "astro";
import { z } from "zod";

import { PhotoSubmissionsService } from "@/lib/services/photo-submissions.service";
import type { AdminPhotoSubmissionsResponseDTO } from "@/types";

export const prerender = false;

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  from_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

/**
 * GET /api/admin/photo-submissions
 * Get paginated list of photo submissions with filtering
 * Requires admin role
 */
export const GET: APIRoute = async ({ locals, url }) => {
  try {
    const { user } = locals;

    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Not authenticated",
          timestamp: new Date().toISOString(),
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
    const { data: userData, error: userError } = await locals.supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || !userData || userData.role !== "admin") {
      return new Response(
        JSON.stringify({
          error: "Unauthorized: Admin access required",
          timestamp: new Date().toISOString(),
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse and validate query parameters
    const queryParams = Object.fromEntries(url.searchParams);
    const validationResult = querySchema.safeParse(queryParams);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid query parameters",
          details: validationResult.error.errors.map((e) => e.message),
          timestamp: new Date().toISOString(),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { page, limit, status, from_date, to_date } = validationResult.data;

    // Get submissions with pagination
    const service = new PhotoSubmissionsService(locals.supabase);
    const { submissions, total_count } = await service.getSubmissionsWithPagination({
      page,
      limit,
      status,
      from_date,
      to_date,
    });

    // Get status counts
    const status_counts = await service.getStatusCounts();

    const response: AdminPhotoSubmissionsResponseDTO = {
      submissions,
      pagination: {
        page,
        limit,
        total_items: total_count,
        total_pages: Math.ceil(total_count / limit),
      },
      status_counts,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Get photo submissions error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
