import type { APIRoute } from "astro";
import { z } from "zod";

import { AuthService } from "@/lib/services/auth.service";

export const prerender = false;

const SignInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = SignInSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: validationResult.error.errors[0].message,
        }),
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    // Use auth service
    const authService = new AuthService(locals.supabase);
    const result = await authService.signIn({ email, password });

    if (!result.success) {
      // eslint-disable-next-line no-console
      console.error("Sign in failed:", result.error);
      return new Response(
        JSON.stringify({
          error: result.error,
        }),
        { status: 401 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        userId: result.userId,
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
    console.error("Sign in error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      { status: 500 }
    );
  }
};
