import type { APIRoute } from "astro";
import { z } from "zod";

import { UsersService } from "@/lib/services/users.service";
import type { UpdateUserPermissionsResponseDTO } from "@/types";

export const prerender = false;

const updateSchema = z.object({
  role: z.enum(["user", "admin"]).optional(),
  can_add_photos: z.boolean().optional(),
});

/**
 * PATCH /api/admin/users/{id}
 * Update user permissions and role
 * Requires admin role
 */
export const PATCH: APIRoute = async ({ request, locals, params }) => {
  try {
    const { user } = locals;
    const userId = params.id;

    if (!userId) {
      return new Response(
        JSON.stringify({
          error: "User ID is required",
          timestamp: new Date().toISOString(),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

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
    const validationResult = updateSchema.safeParse(body);

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

    // Prevent admins from removing their own admin role
    if (userId === user.id && validationResult.data.role === "user") {
      return new Response(
        JSON.stringify({
          error: "Cannot remove your own admin role",
          timestamp: new Date().toISOString(),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const service = new UsersService(locals.supabase);
    const updatedUser = await service.updateUserPermissions(userId, validationResult.data);

    const response: UpdateUserPermissionsResponseDTO = {
      user_id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      can_add_photos: updatedUser.can_add_photos,
      updated_at: updatedUser.updated_at,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to update user:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
