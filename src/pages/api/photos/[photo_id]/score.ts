import type { APIRoute } from "astro";
import type { PhotoScoreResultDTO } from "@/types";
import { calculateDistance, calculateLocationScore, calculateTimeScore } from "@/lib/utils/scoreCalculation";

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
    const { guessed_lat, guessed_lon, guessed_year } = body;

    // Validate input
    if (typeof guessed_lat !== "number" || typeof guessed_lon !== "number" || typeof guessed_year !== "number") {
      return new Response(
        JSON.stringify({
          error: "Invalid guess data",
          details: ["guessed_lat, guessed_lon, and guessed_year must be numbers"],
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
      .select("lat, lon, year_utc, event_name, description, place, source_url, license, credit")
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

    // Calculate score
    const kmError = calculateDistance(guessed_lat, guessed_lon, photo.lat, photo.lon);

    const yearError = Math.abs(guessed_year - photo.year_utc);
    const locationScore = calculateLocationScore(kmError);
    const timeScore = calculateTimeScore(yearError);
    const totalScore = locationScore + timeScore;

    const result: PhotoScoreResultDTO = {
      photo_id,
      location_score: locationScore,
      time_score: timeScore,
      total_score: totalScore,
      km_error: Math.round(kmError * 10) / 10,
      year_error: yearError,
      correct_lat: photo.lat,
      correct_lon: photo.lon,
      correct_year: photo.year_utc,
      event_name: photo.event_name,
      description: photo.description,
      place: photo.place,
      source_url: photo.source_url,
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
