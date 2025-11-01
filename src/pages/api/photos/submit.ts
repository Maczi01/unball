import type { APIRoute } from "astro";
import { z } from "zod";

import { PhotoSubmissionsService } from "@/lib/services/photo-submissions.service";

export const prerender = false;

const PhotoSubmissionSchema = z.object({
  event_name: z.string().min(1).max(200),
  competition: z.string().max(100).optional(),
  year_utc: z.number().int().min(1880).max(2025),
  place: z.string().max(200).optional(),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  photo_url: z.string().url(),
  thumbnail_url: z.string().url().optional(),
  original_url: z.string().url().optional(),
  description: z.string().optional(),
  source_url: z.string().url().optional(),
  license: z.string().min(1),
  credit: z.string().min(1),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

/**
 * POST /api/photos/submit
 * Submit a new photo for moderation
 * Requires authentication and can_add_photos permission
 */
export const POST: APIRoute = async ({ request, locals }) => {
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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = PhotoSubmissionSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: validationResult.error.errors[0].message,
        }),
        { status: 400 }
      );
    }

    const photoData = validationResult.data;

    // Submit photo
    const service = new PhotoSubmissionsService(locals.supabase);
    const result = await service.submitPhoto(user.id, photoData);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: result.error,
        }),
        { status: 400 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        submission_id: result.submissionId,
      }),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Photo submission error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      { status: 500 }
    );
  }
};
