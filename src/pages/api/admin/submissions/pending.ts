import type { APIRoute } from "astro";

import { PhotoSubmissionsService } from "@/lib/services/photo-submissions.service";

export const prerender = false;

/**
 * GET /api/admin/submissions/pending
 * Get all pending photo submissions
 * Requires admin role
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    const { user } = locals;

    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Not authenticated",
        }),
        { status: 401 }
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
        }),
        { status: 403 }
      );
    }

    // Get pending submissions
    const service = new PhotoSubmissionsService(locals.supabase);
    const submissions = await service.getPendingSubmissions();

    return new Response(JSON.stringify(submissions), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Get pending submissions error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      { status: 500 }
    );
  }
};
