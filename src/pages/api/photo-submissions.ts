import type { APIRoute } from "astro";
import { ValidationConstants } from "@/types";

export const prerender = false;

/**
 * POST /api/photo-submissions
 * Submit a new photo for admin review
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
    const { data: userProfile } = await supabase
      .from("users")
      .select("can_add_photos")
      .eq("id", user.id)
      .single();

    if (!userProfile?.can_add_photos) {
      return new Response(
        JSON.stringify({
          error: "You don't have permission to submit photos",
          timestamp: new Date().toISOString(),
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();

    // Extract and validate photo file
    const photoFile = formData.get("photo_file") as File | null;
    if (!photoFile) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: ["Photo file is required"],
          timestamp: new Date().toISOString(),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate file size
    const maxSizeBytes = ValidationConstants.FILE_UPLOAD.MAX_SIZE_MB * 1024 * 1024;
    if (photoFile.size > maxSizeBytes) {
      return new Response(
        JSON.stringify({
          error: `Photo file exceeds ${ValidationConstants.FILE_UPLOAD.MAX_SIZE_MB}MB limit`,
          timestamp: new Date().toISOString(),
        }),
        { status: 413, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate file type
    const allowedTypes = ValidationConstants.FILE_UPLOAD.ALLOWED_FORMATS.map(
      (fmt) => `image/${fmt === "jpg" ? "jpeg" : fmt}`
    );
    if (!allowedTypes.includes(photoFile.type) && photoFile.type !== "image/jpg") {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: ["Photo must be JPG, PNG, or WebP"],
          timestamp: new Date().toISOString(),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Extract and validate required fields
    const event_name = formData.get("event_name") as string;
    const year_utc = formData.get("year_utc") as string;
    const lat = formData.get("lat") as string;
    const lon = formData.get("lon") as string;
    const license = formData.get("license") as string;
    const credit = formData.get("credit") as string;

    // Validation errors array
    const errors: string[] = [];

    if (!event_name || event_name.trim().length === 0) {
      errors.push("event_name is required");
    } else if (event_name.length > 255) {
      errors.push("event_name must be 255 characters or less");
    }

    const yearNum = parseInt(year_utc, 10);
    if (!year_utc || isNaN(yearNum)) {
      errors.push("year_utc is required and must be a number");
    } else if (
      yearNum < ValidationConstants.YEAR.MIN ||
      yearNum > ValidationConstants.YEAR.MAX
    ) {
      errors.push(
        `year_utc must be between ${ValidationConstants.YEAR.MIN} and ${ValidationConstants.YEAR.MAX}`
      );
    }

    const latNum = parseFloat(lat);
    if (!lat || isNaN(latNum)) {
      errors.push("lat is required and must be a number");
    } else if (
      latNum < ValidationConstants.COORDINATES.LAT_MIN ||
      latNum > ValidationConstants.COORDINATES.LAT_MAX
    ) {
      errors.push(
        `lat must be between ${ValidationConstants.COORDINATES.LAT_MIN} and ${ValidationConstants.COORDINATES.LAT_MAX}`
      );
    }

    const lonNum = parseFloat(lon);
    if (!lon || isNaN(lonNum)) {
      errors.push("lon is required and must be a number");
    } else if (
      lonNum < ValidationConstants.COORDINATES.LON_MIN ||
      lonNum > ValidationConstants.COORDINATES.LON_MAX
    ) {
      errors.push(
        `lon must be between ${ValidationConstants.COORDINATES.LON_MIN} and ${ValidationConstants.COORDINATES.LON_MAX}`
      );
    }

    if (!license || license.trim().length === 0) {
      errors.push("license is required");
    } else if (license.length > 100) {
      errors.push("license must be 100 characters or less");
    }

    if (!credit || credit.trim().length === 0) {
      errors.push("credit is required");
    } else if (credit.length > 255) {
      errors.push("credit must be 255 characters or less");
    }

    if (errors.length > 0) {
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
    const competition = (formData.get("competition") as string) || null;
    const place = (formData.get("place") as string) || null;
    const description = (formData.get("description") as string) || null;
    const source_url = (formData.get("source_url") as string) || null;
    const notes = (formData.get("notes") as string) || null;
    const submitter_email = (formData.get("submitter_email") as string) || null;

    // Parse tags if present
    let tags: string[] | null = null;
    const tagsJson = formData.get("tags") as string;
    if (tagsJson) {
      try {
        tags = JSON.parse(tagsJson);
      } catch {
        errors.push("tags must be valid JSON array");
      }
    }

    // Upload photo to Supabase Storage
    const fileExt = photoFile.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `submissions/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("photos")
      .upload(filePath, photoFile, {
        contentType: photoFile.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return new Response(
        JSON.stringify({
          error: "Failed to upload photo",
          timestamp: new Date().toISOString(),
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from("photos")
      .getPublicUrl(filePath);

    const photo_url = urlData.publicUrl;

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
      console.error("Database insert error:", insertError);

      // Clean up uploaded file
      await supabase.storage.from("photos").remove([filePath]);

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
