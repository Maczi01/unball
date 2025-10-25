import type { APIRoute } from "astro";

import { AuthService } from "@/lib/services/auth.service";

export const prerender = false;

export const POST: APIRoute = async ({ locals }) => {
  try {
    const authService = new AuthService(locals.supabase);
    const result = await authService.signOut();

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
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Sign out error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      { status: 500 }
    );
  }
};
