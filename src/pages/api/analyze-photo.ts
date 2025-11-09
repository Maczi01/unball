import type { APIRoute } from "astro";
import { analyzePhotoWithGemini } from "@/lib/services/photo-analysis.service";

export const prerender = false;

/**
 * API endpoint to analyze photos with Gemini AI
 * POST /api/analyze-photo
 * Body: multipart/form-data with 'photo' file
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse form data
    const formData = await request.formData();
    const photoFile = formData.get("photo") as File | null;

    if (!photoFile) {
      return new Response(
        JSON.stringify({
          error: "No photo provided",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate file type
    if (!photoFile.type.startsWith("image/")) {
      return new Response(
        JSON.stringify({
          error: "File must be an image",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Convert file to base64
    const arrayBuffer = await photoFile.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    // Analyze with Gemini
    const result = await analyzePhotoWithGemini(base64Data, photoFile.type);

    // Return result
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Photo analysis API error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to analyze photo",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
