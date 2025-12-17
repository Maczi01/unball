import type { APIRoute } from "astro";
import { z } from "zod";
import { ContactService } from "@/lib/services/contact.service";

export const prerender = false;

const ContactFormSchema = z.object({
  email: z.string().email("Invalid email address").max(100),
  topic: z
    .string()
    .min(1, "Topic is required")
    .max(50)
    .refine((val) => val.trim().length > 0, {
      message: "Topic cannot be empty or contain only spaces",
    }),
  message: z
    .string()
    .min(1, "Message is required")
    .max(500)
    .refine((val) => val.trim().length > 0, {
      message: "Message cannot be empty or contain only spaces",
    }),
});

/**
 * Get client IP address from request headers
 */
function getClientIP(request: Request): string {
  // Check common headers for real IP
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const cfConnectingIP = request.headers.get("cf-connecting-ip");

  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(",")[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback
  return "127.0.0.1";
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = ContactFormSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: validationResult.error.errors[0].message,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { email, topic, message } = validationResult.data;

    // Get client information for rate limiting
    const ipAddress = getClientIP(request);
    const userAgent = request.headers.get("user-agent") || undefined;

    // Submit via service
    const contactService = new ContactService(locals.supabase);
    const result = await contactService.submitContactForm({
      email,
      topic,
      message,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    if (!result.success) {
      const status = result.retryAfter ? 429 : 400;
      const headers: Record<string, string> = { "Content-Type": "application/json" };

      if (result.retryAfter) {
        headers["Retry-After"] = result.retryAfter.toString();
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: result.error,
          retryAfter: result.retryAfter,
        }),
        { status, headers }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Your message has been sent successfully!",
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Contact form submission error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error. Please try again later.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
