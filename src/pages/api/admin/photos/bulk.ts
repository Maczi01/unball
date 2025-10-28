import type { APIRoute } from "astro";
import { z } from "zod";

import { PhotosService } from "@/lib/services/photos.service";

export const prerender = false;

const bulkUpdateSchema = z.object({
  photo_ids: z.array(z.string().uuid()).min(1, "At least one photo ID is required"),
  action: z.enum(["update", "delete"]),
  updates: z
    .object({
      is_daily_eligible: z.boolean().optional(),
      tags: z.array(z.string()).optional(),
      notes: z.string().optional(),
    })
    .optional(),
});

/**
 * POST /api/admin/photos/bulk
 * Perform bulk operations on photos
 * Requires admin role
 */
export const POST: APIRoute = async ({ request, locals }) => {
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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = bulkUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validationResult.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
          timestamp: new Date().toISOString(),
        }),
        { status: 422, headers: { "Content-Type": "application/json" } }
      );
    }

    const { photo_ids, action, updates } = validationResult.data;
    const service = new PhotosService(locals.supabase);

    if (action === "delete") {
      const result = await service.bulkDeletePhotos(photo_ids);
      return new Response(
        JSON.stringify({
          success: true,
          message: `Successfully deleted ${result.deleted_count} photos`,
          deleted_count: result.deleted_count,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (action === "update") {
      if (!updates) {
        return new Response(
          JSON.stringify({
            error: "Updates are required for update action",
            timestamp: new Date().toISOString(),
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const result = await service.bulkUpdatePhotos(photo_ids, updates);
      return new Response(
        JSON.stringify({
          success: true,
          message: `Successfully updated ${result.updated_count} photos`,
          updated_count: result.updated_count,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Invalid action",
        timestamp: new Date().toISOString(),
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Bulk operation error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
