import type { APIRoute } from "astro";
import type { NormalRoundResponseDTO } from "@/types";

export const prerender = false;

/**
 * GET /api/normal/photos
 * Retrieves 5 random photos for Normal mode practice
 *
 * @returns 200 - Random photo set with round ID
 * @returns 500 - Server error
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // Fetch 5 random photos from the photos_metadata view
    const { data: photos, error: dbError } = await locals.supabase
      .from("photos_metadata")
      .select("id, photo_url, thumbnail_url, competition, place, tags")
      .limit(100); // Get a larger pool to randomize from

    if (dbError) {
      // eslint-disable-next-line no-console
      console.error("[GET /api/normal/photos] Database error:", dbError);
      return new Response(
        JSON.stringify({
          error: "Failed to retrieve photos from database",
          timestamp: new Date().toISOString(),
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!photos || photos.length === 0) {
      // eslint-disable-next-line no-console
      console.error("[GET /api/normal/photos] No photos found in database");
      return new Response(
        JSON.stringify({
          error: "No photos available",
          timestamp: new Date().toISOString(),
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Randomly select 5 photos
    const shuffled = photos.sort(() => Math.random() - 0.5);
    const selectedPhotos = shuffled.slice(0, 5);

    const response: NormalRoundResponseDTO = {
      round_id: `round_${Date.now()}`,
      photos: selectedPhotos.map((photo) => ({
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        photo_id: photo.id!,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        photo_url: photo.photo_url!,
        thumbnail_url: photo.thumbnail_url,
        competition: photo.competition,
        place: photo.place,
        tags: photo.tags,
      })),
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[GET /api/normal/photos] Error:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to retrieve photos",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
