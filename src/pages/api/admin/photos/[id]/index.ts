import type { APIRoute } from "astro";
import { z } from "zod";

import { PhotosService } from "@/lib/services/photos.service";
import type { AdminPhotoDTO, UpdatePhotoCommand } from "@/types";

export const prerender = false;

const updatePhotoSchema = z.object({
  event_name: z.string().max(255).optional(),
  competition: z.string().max(255).optional(),
  year_utc: z.number().int().min(1880).max(2025).optional(),
  place: z.string().max(255).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lon: z.number().min(-180).max(180).optional(),
  description: z.string().optional(),
  source_url: z.string().url().optional().or(z.literal("")),
  license: z.string().max(255).optional(),
  credit: z.string().max(255).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  is_daily_eligible: z.boolean().optional(),
});

/**
 * GET /api/admin/photos/{id}
 * Get single photo by ID
 * Requires admin role
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const { user } = locals;
    const { id } = params;

    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Not authenticated",
          timestamp: new Date().toISOString(),
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!id) {
      return new Response(
        JSON.stringify({
          error: "Photo ID is required",
          timestamp: new Date().toISOString(),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
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

    // Get photo
    const service = new PhotosService(locals.supabase);
    const photo = await service.getPhotoById(id);

    const response: AdminPhotoDTO = photo;

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error("Get photo error:", error);

    // Check if it's a not found error
    if (error && typeof error === "object" && "code" in error && error.code === "PGRST116") {
      return new Response(
        JSON.stringify({
          error: "Photo not found",
          timestamp: new Date().toISOString(),
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

/**
 * PATCH /api/admin/photos/{id}
 * Update photo metadata
 * Requires admin role
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    const { user } = locals;
    const { id } = params;

    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Not authenticated",
          timestamp: new Date().toISOString(),
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!id) {
      return new Response(
        JSON.stringify({
          error: "Photo ID is required",
          timestamp: new Date().toISOString(),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
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
    const body: UpdatePhotoCommand = await request.json();
    const validationResult = updatePhotoSchema.safeParse(body);

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

    // Update photo
    const service = new PhotosService(locals.supabase);
    const updatedPhoto = await service.updatePhoto(id, validationResult.data);

    return new Response(JSON.stringify(updatedPhoto), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Update photo error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
