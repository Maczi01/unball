import type { APIRoute } from "astro";
import { ValidationConstants } from "@/types";

export const prerender = false;

/**
 * POST /api/photo-submissions
 * Submit photo metadata for admin review
 *
 * Note: Photo file is uploaded directly to Supabase Storage from client-side
 * to bypass Cloudflare Workers' multipart form data limitations.
 * This endpoint only receives JSON metadata with the photo_url.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Check authentication
    const { user, supabase } = locals;
    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Authentication required",
          timestamp: new Date().toISOString(),
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check user permission
    const { data: userProfile } = await supabase.from("users").select("can_add_photos").eq("id", user.id).single();

    if (!userProfile?.can_add_photos) {
      return new Response(
        JSON.stringify({
          error: "You don't have permission to submit photos",
          timestamp: new Date().toISOString(),
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse JSON body
    const body = await request.json();

    // Debug logging
    // eslint-disable-next-line no-console
    console.log("Received body:", JSON.stringify(body, null, 2));

    // Validation errors array
    const errors: string[] = [];

    // Validate photo_url (required - uploaded by client directly to Supabase Storage)
    const { photo_url } = body;
    if (!photo_url || typeof photo_url !== "string" || photo_url.trim().length === 0) {
      errors.push("photo_url is required");
    }

    // Extract and validate required fields
    const { event_name, year_utc, lat, lon, license, credit } = body;

    if (!event_name || typeof event_name !== "string" || event_name.trim().length === 0) {
      errors.push("event_name is required");
    } else if (event_name.length > 255) {
      errors.push("event_name must be 255 characters or less");
    }

    const yearNum = parseInt(year_utc, 10);
    if (!year_utc || isNaN(yearNum)) {
      errors.push("year_utc is required and must be a number");
    } else if (yearNum < ValidationConstants.YEAR.MIN || yearNum > ValidationConstants.YEAR.MAX) {
      errors.push(`year_utc must be between ${ValidationConstants.YEAR.MIN} and ${ValidationConstants.YEAR.MAX}`);
    }

    const latNum = parseFloat(lat);
    if (lat === undefined || lat === null || lat === "" || isNaN(latNum)) {
      errors.push("lat is required and must be a number");
    } else if (latNum < ValidationConstants.COORDINATES.LAT_MIN || latNum > ValidationConstants.COORDINATES.LAT_MAX) {
      errors.push(
        `lat must be between ${ValidationConstants.COORDINATES.LAT_MIN} and ${ValidationConstants.COORDINATES.LAT_MAX}`
      );
    }

    const lonNum = parseFloat(lon);
    if (lon === undefined || lon === null || lon === "" || isNaN(lonNum)) {
      errors.push("lon is required and must be a number");
    } else if (lonNum < ValidationConstants.COORDINATES.LON_MIN || lonNum > ValidationConstants.COORDINATES.LON_MAX) {
      errors.push(
        `lon must be between ${ValidationConstants.COORDINATES.LON_MIN} and ${ValidationConstants.COORDINATES.LON_MAX}`
      );
    }

    if (!license || typeof license !== "string" || license.trim().length === 0) {
      errors.push("license is required");
    } else if (license.length > 100) {
      errors.push("license must be 100 characters or less");
    }

    if (!credit || typeof credit !== "string" || credit.trim().length === 0) {
      errors.push("credit is required");
    } else if (credit.length > 255) {
      errors.push("credit must be 255 characters or less");
    }

    if (errors.length > 0) {
      // eslint-disable-next-line no-console
      console.log("Validation errors:", errors);
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: errors,
          timestamp: new Date().toISOString(),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Extract optional fields
    const competition = body.competition || null;
    const place = body.place || null;
    const description = body.description || null;
    const source_url = body.source_url || null;
    const notes = body.notes || null;
    const submitter_email = body.submitter_email || null;
    const tags = Array.isArray(body.tags) ? body.tags : null;

    // Insert into photo_submissions table
    const { data: submission, error: insertError } = await supabase
      .from("photo_submissions")
      .insert({
        user_id: user.id,
        event_name: event_name.trim(),
        year_utc: yearNum,
        lat: latNum,
        lon: lonNum,
        license: license.trim(),
        credit: credit.trim(),
        competition,
        place,
        description,
        source_url,
        notes,
        submitter_email,
        tags,
        photo_url,
        status: "pending",
      })
      .select("id, status, created_at")
      .single();

    if (insertError) {
      // eslint-disable-next-line no-console
      console.error("Database insert error:", insertError);

      return new Response(
        JSON.stringify({
          error: "Failed to create submission",
          timestamp: new Date().toISOString(),
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({
        submission_id: submission.id,
        status: submission.status,
        message: "Photo submitted successfully and is pending admin review",
        created_at: submission.created_at,
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
