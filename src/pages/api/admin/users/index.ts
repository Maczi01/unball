import type { APIRoute } from "astro";
import { z } from "zod";

import { UsersService } from "@/lib/services/users.service";
import type { AdminUsersResponseDTO } from "@/types";

export const prerender = false;

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

/**
 * GET /api/admin/users
 * List all users with pagination
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

    // Parse query parameters
    const params = Object.fromEntries(url.searchParams.entries());
    const validationResult = querySchema.safeParse(params);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid query parameters",
          details: validationResult.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
          timestamp: new Date().toISOString(),
        }),
        { status: 422, headers: { "Content-Type": "application/json" } }
      );
    }

    const { page, limit } = validationResult.data;
    const service = new UsersService(locals.supabase);

    // Fetch users and stats in parallel
    const [usersResult, stats] = await Promise.all([
      service.getUsersWithPagination({ page, limit }),
      service.getUserStats(),
    ]);

    const response: AdminUsersResponseDTO = {
      users: usersResult.users,
      pagination: {
        page,
        limit,
        total_items: usersResult.total_count,
        total_pages: Math.ceil(usersResult.total_count / limit),
      },
      stats,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to fetch users:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
