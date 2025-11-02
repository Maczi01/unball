import { createClient, type SupabaseClient as BaseSupabaseClient } from "@supabase/supabase-js";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import type { AstroCookies } from "astro";

import type { Database } from "../db/database.types.ts";

/**
 * Browser-side Supabase client (anonymous)
 * Used for public data access without authentication in the browser
 * Lazy-loaded to handle runtime environment
 *
 * IMPORTANT: This uses PUBLIC_ env vars which are safe to expose to the browser
 * and are bundled at build time by Astro/Vite
 */
let browserClient: BaseSupabaseClient<Database> | null = null;
export function getBrowserClient(): BaseSupabaseClient<Database> {
  if (!browserClient) {
    // Use PUBLIC_ prefixed vars for client-side (bundled at build time)
    const url = import.meta.env.PUBLIC_SUPABASE_URL;
    const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error("PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY must be set");
    }

    browserClient = createClient<Database>(url, key);
  }
  return browserClient;
}

/**
 * Cookie options for Supabase server client
 * Following @supabase/ssr best practices
 */
export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: true,
  httpOnly: true,
  sameSite: "lax",
};

/**
 * Parse cookie header string into array of name-value pairs
 * Required for getAll() implementation
 */
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  if (!cookieHeader) return [];

  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

/**
 * Create a server-side Supabase client with cookie support for SSR
 * Uses getAll/setAll pattern as recommended by @supabase/ssr
 *
 * IMPORTANT: This implementation follows Supabase Auth best practices:
 * - Uses getAll/setAll instead of individual get/set/remove methods
 * - Properly handles cookie serialization/deserialization
 * - Enables secure authentication flows with proper session management
 * - Credentials must be passed from runtime.env (Cloudflare) or import.meta.env (dev)
 */
export function createSupabaseServerInstance(context: {
  headers: Headers;
  cookies: AstroCookies;
  supabaseUrl?: string;
  supabaseKey?: string;
}) {
  // Credentials must be provided from runtime environment
  const url = context.supabaseUrl || import.meta.env.SUPABASE_URL;
  const key = context.supabaseKey || import.meta.env.SUPABASE_KEY;

  if (!url || !key) {
    throw new Error("Supabase credentials must be provided via context or environment variables");
  }

  return createServerClient<Database>(url, key, {
    cookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });
}

/**
 * @deprecated Use createSupabaseServerInstance instead
 * This function uses deprecated individual cookie methods
 */
export function createSupabaseServerClient(
  cookies: AstroCookies,
  options?: { supabaseUrl?: string; supabaseKey?: string },
) {
  // eslint-disable-next-line no-console
  console.warn("createSupabaseServerClient is deprecated. Use createSupabaseServerInstance instead.");
  const url = options?.supabaseUrl || import.meta.env.SUPABASE_URL;
  const key = options?.supabaseKey || import.meta.env.SUPABASE_KEY;

  if (!url || !key) {
    throw new Error("Supabase credentials must be provided");
  }

  return createServerClient<Database>(url, key, {
    cookies: {
      get(key: string) {
        return cookies.get(key)?.value;
      },
      set(key: string, value: string, options: Record<string, unknown>) {
        cookies.set(key, value, options as Parameters<AstroCookies["set"]>[2]);
      },
      remove(key: string, options: Record<string, unknown>) {
        cookies.delete(key, options as Parameters<AstroCookies["delete"]>[1]);
      },
    },
  });
}

/**
 * Type-safe Supabase client for this project
 * Use this type instead of importing from @supabase/supabase-js
 */
export type SupabaseClient = BaseSupabaseClient<Database>;
