import type { APIRoute } from "astro";
import { z } from "zod";

import { AuthService } from "@/lib/services/auth.service";

export const prerender = false;

const SignUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  nickname: z.string().min(3).max(20).optional(),
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = SignUpSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: validationResult.error.errors[0].message,
        }),
        { status: 400 }
      );
    }

    const { email, password, nickname } = validationResult.data;

    // Use auth service
    const authService = new AuthService(locals.supabase);
    const result = await authService.signUp({ email, password, nickname });

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
        userId: result.userId,
      }),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      { status: 500 }
    );
  }
};
