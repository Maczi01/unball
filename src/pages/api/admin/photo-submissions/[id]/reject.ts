import type { APIRoute } from "astro";
import { z } from "zod";

import type { RejectSubmissionCommand, RejectSubmissionResponseDTO } from "@/types";

export const prerender = false;

const rejectSchema = z.object({
  review_notes: z.string().min(1, "Rejection reason is required").max(500),
  delete_file: z.boolean().default(true),
});

/**
 * POST /api/admin/photo-submissions/{id}/reject
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

    // Parse and validate request body
    const body: RejectSubmissionCommand = await request.json();
    const validationResult = rejectSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validationResult.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
          timestamp: new Date().toISOString(),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { review_notes } = validationResult.data;

    // Check if submission exists and is pending
    const { data: submission, error: fetchError } = await locals.supabase
      .from("photo_submissions")
      .select("status")
      .eq("id", id)
      .single();

    if (fetchError) {
      return new Response(
        JSON.stringify({
          error: "Submission not found",
          timestamp: new Date().toISOString(),
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    if (submission.status !== "pending") {
      return new Response(
        JSON.stringify({
          error: "Submission has already been reviewed",
          timestamp: new Date().toISOString(),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Call the database function to reject
    const { error: rejectError } = await locals.supabase.rpc("reject_photo_submission", {
      submission_id: id,
      admin_id: user.id,
      notes: review_notes,
    });

    if (rejectError) {
      // eslint-disable-next-line no-console
      console.error("Reject submission error:", rejectError);
      return new Response(
        JSON.stringify({
          error: rejectError.message || "Failed to reject submission",
          timestamp: new Date().toISOString(),
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const response: RejectSubmissionResponseDTO = {
      submission_id: id,
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Reject submission error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
