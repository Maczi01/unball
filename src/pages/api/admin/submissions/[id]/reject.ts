import type { APIRoute } from "astro";
import { z } from "zod";

import { PhotoSubmissionsService } from "@/lib/services/photo-submissions.service";

export const prerender = false;

const RejectSchema = z.object({
  reason: z.string().min(1).max(500),
});

/**
 * POST /api/admin/submissions/[id]/reject
 * Reject a photo submission
 * Requires admin role
 */
export const POST: APIRoute = async ({ params, request, locals }) => {
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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = RejectSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: validationResult.error.errors[0].message,
        }),
        { status: 400 }
      );
    }

    const { reason } = validationResult.data;

    // Reject submission
    const service = new PhotoSubmissionsService(locals.supabase);
    const result = await service.rejectSubmission(id, user.id, reason);

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
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Reject submission error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      { status: 500 }
    );
  }
};
