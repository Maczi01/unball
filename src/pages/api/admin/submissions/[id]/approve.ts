import type { APIRoute } from "astro";

import { PhotoSubmissionsService } from "@/lib/services/photo-submissions.service";

export const prerender = false;

/**
 * POST /api/admin/submissions/[id]/approve
 * Approve a photo submission
 * Requires admin role
 */
export const POST: APIRoute = async ({ params, locals }) => {
  try {
    const { user } = locals;
    const { id } = params;

    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Not authenticated",
        }),
        { status: 401 }
      );
    }

    if (!id) {
      return new Response(
        JSON.stringify({
          error: "Submission ID is required",
        }),
        { status: 400 }
      );
    }

    // Approve submission
    const service = new PhotoSubmissionsService(locals.supabase);
    const result = await service.approveSubmission(id, user.id);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: result.error,
        }),
        { status: result.error?.includes("Unauthorized") ? 403 : 400 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        photo_id: result.photoId,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Approve submission error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      { status: 500 }
    );
  }
};
