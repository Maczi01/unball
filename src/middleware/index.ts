import { defineMiddleware } from "astro:middleware";

import { createSupabaseBearerClient, createSupabaseServerInstance } from "../db/supabase.client.ts";

/**
 * Authentication middleware
 *
 * IMPORTANT: This middleware follows Supabase Auth best practices:
 * - Uses getUser() instead of getSession() for reliable auth state
 * - Uses createSupabaseServerInstance with getAll/setAll cookie pattern
 * - Makes supabase client and user available to all routes via context.locals
 *
 * Note: Route protection (redirects) should be handled per-page, not here.
 * This middleware only establishes the auth context.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  try {
    // Debug: Log runtime availability
    // eslint-disable-next-line no-console
    console.log("Runtime available:", !!context.locals.runtime);
    // eslint-disable-next-line no-console
    console.log("Runtime env keys:", context.locals.runtime?.env ? Object.keys(context.locals.runtime.env) : "no env");

    // Get runtime environment variables (Cloudflare Workers) or use import.meta.env (dev)
    const supabaseUrl = context.locals.runtime?.env?.SUPABASE_URL;
    const supabaseKey = context.locals.runtime?.env?.SUPABASE_KEY;

    // Debug: Log credentials (first chars only for security)
    // eslint-disable-next-line no-console
    console.log("Supabase URL:", supabaseUrl ? supabaseUrl.substring(0, 30) + "..." : "MISSING");
    // eslint-disable-next-line no-console
    console.log("Supabase Key:", supabaseKey ? supabaseKey.substring(0, 10) + "..." : "MISSING");

    // Create server-side Supabase client with proper cookie handling
    const supabase = createSupabaseServerInstance({
      cookies: context.cookies,
      headers: context.request.headers,
      supabaseUrl,
      supabaseKey,
    });

    // IMPORTANT: Use getUser() instead of getSession()
    // getUser() validates the JWT and is more reliable for auth checks
    // See: https://supabase.com/docs/guides/auth/server-side/creating-a-client
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Mobile clients can't carry cookies — fall back to Authorization: Bearer <jwt>
    // when the cookie session is absent.
    if (!user) {
      const authHeader = context.request.headers.get("Authorization");
      const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

      if (bearerToken) {
        const bearerClient = createSupabaseBearerClient({
          accessToken: bearerToken,
          supabaseUrl,
          supabaseKey,
        });
        const {
          data: { user: bearerUser },
        } = await bearerClient.auth.getUser(bearerToken);

        if (bearerUser) {
          context.locals.supabase = bearerClient;
          context.locals.user = bearerUser;
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          context.locals.session = { user: bearerUser };
          return next();
        }
      }
    }

    // Attach to context for use in pages and API routes
    context.locals.supabase = supabase;
    context.locals.user = user;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    context.locals.session = user ? { user } : null;
  } catch (error) {
    // Log error but don't block the request
    // eslint-disable-next-line no-console
    console.error("Middleware error:", error);
    // Set defaults if Supabase fails
    context.locals.user = null;
    context.locals.session = null;
  }

  return next();
});
