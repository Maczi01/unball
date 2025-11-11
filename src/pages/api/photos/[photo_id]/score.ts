import type { APIRoute } from "astro";
import type { PhotoScoreResultDTO } from "@/types";
import { calculateDistance, calculateLocationScore } from "@/lib/utils/scoreCalculation";

export const prerender = false;

/**
 * POST /api/photos/{photo_id}/score
 * Calculates score for a single photo guess
 *
 * @returns 200 - Score result with revealed answer
 * @returns 400 - Invalid guess data
 * @returns 404 - Photo not found
 * @returns 500 - Server error
 */
export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    const { photo_id } = params;

    if (!photo_id) {
      return new Response(
        JSON.stringify({
          error: "Photo ID is required",
          timestamp: new Date().toISOString(),
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Parse request body
    const body = await request.json();
    const { guessed_lat, guessed_lon } = body;

    // Validate input
    if (typeof guessed_lat !== "number" || typeof guessed_lon !== "number") {
      return new Response(
        JSON.stringify({
          error: "Invalid guess data",
          details: ["guessed_lat and guessed_lon must be numbers"],
          timestamp: new Date().toISOString(),
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Fetch photo data from database
    const { data: photo, error: dbError } = await locals.supabase
      .from("photos")
      .select("lat, lon, description, place, license, credit")
      .eq("id", photo_id)
      .single();

    if (dbError || !photo) {
      // eslint-disable-next-line no-console
      console.error("[POST /api/photos/:photo_id/score] Photo not found:", photo_id, dbError);
      return new Response(
        JSON.stringify({
          error: "Photo not found",
          timestamp: new Date().toISOString(),
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Fetch photo sources
    const { data: sources, error: sourcesError } = await locals.supabase
      .from("photo_sources")
      .select("id, url, title, source_type, position")
      .eq("photo_id", photo_id)
      .order("position", { ascending: true });

    if (sourcesError) {
      // eslint-disable-next-line no-console
      console.error("[POST /api/photos/:photo_id/score] Error fetching sources:", sourcesError);
    }

    // Fetch photo more info
    const { data: moreInfo, error: moreInfoError } = await locals.supabase
      .from("photo_more_info")
      .select("id, info_type, url, title, description, position")
      .eq("photo_id", photo_id)
      .order("position", { ascending: true });

    if (moreInfoError) {
      // eslint-disable-next-line no-console
      console.error("[POST /api/photos/:photo_id/score] Error fetching more info:", moreInfoError);
    }

    // Calculate score
    const kmError = calculateDistance(guessed_lat, guessed_lon, photo.lat, photo.lon);
    const locationScore = calculateLocationScore(kmError);
    const totalScore = locationScore;

    const result: PhotoScoreResultDTO = {
      photo_id,
      location_score: locationScore,
      time_score: 0, // No longer scoring time/year
      total_score: totalScore,
      km_error: Math.round(kmError * 10) / 10,
      year_error: 0, // No longer calculating year error
      correct_lat: photo.lat,
      correct_lon: photo.lon,
      correct_year: 0, // No longer using year
      event_name: "", // Removed from schema
      description: photo.description,
      place: photo.place,
      sources: sources || [],
      more_info: moreInfo || [],
      license: photo.license,
      credit: photo.credit,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[POST /api/photos/:photo_id/score] Error:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to calculate score",
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
