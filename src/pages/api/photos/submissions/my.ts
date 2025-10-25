import type { APIRoute } from "astro";

import { PhotoSubmissionsService } from "@/lib/services/photo-submissions.service";

export const prerender = false;

/**
 * GET /api/photos/submissions/my
 * Get current user's photo submissions
 * Requires authentication
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

    // Get user's submissions
    const service = new PhotoSubmissionsService(locals.supabase);
    const submissions = await service.getUserSubmissions(user.id);
    const stats = await service.getUserStats(user.id);

    return new Response(
      JSON.stringify({
        submissions,
        stats,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Get user submissions error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      { status: 500 }
    );
  }
};
