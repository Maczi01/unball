import type { APIRoute } from "astro";

import { PhotoSubmissionsService } from "@/lib/services/photo-submissions.service";
import type { AdminPhotoSubmissionDetailDTO } from "@/types";

export const prerender = false;

/**
 * GET /api/admin/photo-submissions/{id}
 * Get complete submission details by ID
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
          error: "Submission ID is required",
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

    // Get submission details
    const service = new PhotoSubmissionsService(locals.supabase);
    const submission = await service.getSubmissionById(id);

    const response: AdminPhotoSubmissionDetailDTO = submission;

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Get submission detail error:", error);

    // Check if it's a not found error
    if (error && typeof error === "object" && "code" in error && error.code === "PGRST116") {
      return new Response(
        JSON.stringify({
          error: "Submission not found",
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
