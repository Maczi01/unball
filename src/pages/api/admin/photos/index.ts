import type { APIRoute } from "astro";
import { z } from "zod";

import { PhotosService } from "@/lib/services/photos.service";
import type { AdminPhotosResponseDTO } from "@/types";

export const prerender = false;

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  is_daily_eligible: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => (val === "true" ? true : val === "false" ? false : undefined)),
});

/**
 * GET /api/admin/photos
 * Get paginated list of photos
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

    const { page, limit, is_daily_eligible } = validationResult.data;

    // Get photos with pagination
    const service = new PhotosService(locals.supabase);
    const { photos, total_count } = await service.getPhotosWithPagination({
      page,
      limit,
      is_daily_eligible,
    });

    const response: AdminPhotosResponseDTO = {
      photos,
      pagination: {
        page,
        limit,
        total_items: total_count,
        total_pages: Math.ceil(total_count / limit),
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Get photos error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
