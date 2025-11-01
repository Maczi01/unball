import type { APIRoute } from "astro";
import { z } from "zod";

import { AuthService } from "@/lib/services/auth.service";

export const prerender = false;

/**
 * GET /api/auth/me
 * Get current user profile
 */
export const GET: APIRoute = async ({ locals }) => {
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

    const authService = new AuthService(locals.supabase);
    const profile = await authService.getUserProfile(user.id);

    if (!profile) {
      return new Response(
        JSON.stringify({
          error: "User profile not found",
        }),
        { status: 404 }
      );
    }

    return new Response(JSON.stringify(profile), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Get profile error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      { status: 500 }
    );
  }
};

const UpdateProfileSchema = z.object({
  nickname: z.string().min(3).max(20),
});

/**
 * PATCH /api/auth/me
 * Update current user profile (nickname)
 */
export const PATCH: APIRoute = async ({ request, locals }) => {
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
    const validationResult = UpdateProfileSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: validationResult.error.errors[0].message,
        }),
        { status: 400 }
      );
    }

    const { nickname } = validationResult.data;

    // Update nickname
    const authService = new AuthService(locals.supabase);
    const result = await authService.updateNickname(user.id, nickname);

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
    // eslint-disable-next-line no-console
    console.error("Update profile error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      { status: 500 }
    );
  }
};
