import type { APIRoute } from "astro";
import { z } from "zod";
import { createSupabaseServerInstance } from "@/db/supabase.client";

export const prerender = false;

const ResendConfirmationSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const validationResult = ResendConfirmationSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: validationResult.error.errors[0].message,
        }),
        { status: 400 }
      );
    }

    const { email } = validationResult.data;

    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Resend confirmation email
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    if (error) {
      return new Response(
        JSON.stringify({
          error: error.message,
        }),
        { status: 400 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Confirmation email sent",
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
    console.error("Resend confirmation error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      { status: 500 }
    );
  }
};
