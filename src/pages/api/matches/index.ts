import type { APIRoute } from "astro";
import { createMatch, CodeGenerationError } from "@/lib/services/matches.service";

export const prerender = false;

/**
 * POST /api/matches
 * Creates a new friends match. Signed-in users only.
 *
 * @returns 201 - Match created with code, expires_at, photos (no answers)
 * @returns 401 - Not signed in
 * @returns 500 - Server error
 */
export const POST: APIRoute = async ({ locals }) => {
  try {
    const userId = locals.user?.id ?? null;
    if (!userId) {
      return new Response(
        JSON.stringify({
          error: "Sign in required to create a match",
          code: "unauthorized",
          timestamp: new Date().toISOString(),
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Snapshot the creator's nickname so the join screen can show it
    // even if the user later changes their profile nickname.
    const { data: profile } = await locals.supabase.from("users").select("nickname").eq("id", userId).maybeSingle();
    const creatorNickname = profile?.nickname ?? null;

    const result = await createMatch(locals.supabase, userId, creatorNickname);

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[POST /api/matches] Error:", error);

    if (error instanceof CodeGenerationError) {
      return new Response(
        JSON.stringify({
          error: "Failed to generate a unique match code, please try again",
          code: "code_generation_failed",
          timestamp: new Date().toISOString(),
        }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Failed to create match",
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
