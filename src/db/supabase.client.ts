import { createClient, type SupabaseClient as BaseSupabaseClient } from "@supabase/supabase-js";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import type { AstroCookies } from "astro";

import type { Database } from "../db/database.types.ts";

/**
 * Get Supabase credentials from environment
 * For Cloudflare Workers, these come from runtime.env
 * For development, these come from import.meta.env
 */
function getSupabaseCredentials() {
  return {
    url: import.meta.env.SUPABASE_URL,
    key: import.meta.env.SUPABASE_KEY,
  };
}

/**
 * Browser-side Supabase client (anonymous)
 * Used for public data access without authentication
 * Lazy-loaded to handle runtime environment
 */
let browserClient: BaseSupabaseClient<Database> | null = null;
export function getBrowserClient(): BaseSupabaseClient<Database> {
  if (!browserClient) {
    const { url, key } = getSupabaseCredentials();
    browserClient = createClient<Database>(url, key);
  }
  return browserClient;
}

/**
 * @deprecated Use getBrowserClient() instead
 */
export const supabaseClient = getBrowserClient();

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
 */
export function createSupabaseServerInstance(context: {
  headers: Headers;
  cookies: AstroCookies;
  supabaseUrl?: string;
  supabaseKey?: string;
}) {
  // Use runtime credentials if provided, otherwise fall back to import.meta.env
  const credentials = getSupabaseCredentials();
  const url = context.supabaseUrl || credentials.url;
  const key = context.supabaseKey || credentials.key;

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
  const credentials = getSupabaseCredentials();
  const url = options?.supabaseUrl || credentials.url;
  const key = options?.supabaseKey || credentials.key;

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
