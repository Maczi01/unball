import type { APIRoute } from "astro";
import { z } from "zod";

import type { ApproveSubmissionCommand, ApproveSubmissionResponseDTO } from "@/types";

export const prerender = false;

const approveSchema = z.object({
  review_notes: z.string().max(500).optional(),
  is_daily_eligible: z.boolean().default(true),
  metadata_overrides: z
    .object({
      event_name: z.string().max(255).optional(),
      competition: z.string().max(255).optional(),
      year_utc: z.number().int().min(1880).max(2025).optional(),
      place: z.string().max(255).optional(),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
    })
    .optional(),
});

/**
 * POST /api/admin/photo-submissions/{id}/approve
 * Approve a photo submission
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
      .select("role, email")
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
    const body: ApproveSubmissionCommand = await request.json();
    const validationResult = approveSchema.safeParse(body);

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

    const { review_notes, is_daily_eligible, metadata_overrides } = validationResult.data;

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

    // Call the database function to approve
    const { data: photoId, error: approveError } = await locals.supabase.rpc("approve_photo_submission", {
      submission_id: id,
      admin_id: user.id,
      set_daily_eligible: is_daily_eligible ?? true,
      metadata_overrides: metadata_overrides ?? null,
    });

    if (approveError) {
      console.error("Approve submission error:", approveError);
      return new Response(
        JSON.stringify({
          error: approveError.message || "Failed to approve submission",
          timestamp: new Date().toISOString(),
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Update review notes if provided
    if (review_notes) {
      await locals.supabase.from("photo_submissions").update({ review_notes }).eq("id", id);
    }

    // Get the approved photo details
    const { data: photo } = await locals.supabase.from("photos").select("photo_url").eq("id", photoId).single();

    const response: ApproveSubmissionResponseDTO = {
      submission_id: id,
      photo_id: photoId as string,
      status: "approved",
      photo_url: photo?.photo_url || "",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Approve submission error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
