import {
  createClient,
  type SupabaseClient as BaseSupabaseClient,
} from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import type { AstroCookies } from "astro";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

/**
 * Browser-side Supabase client (anonymous)
 * Used for public data access without authentication
 */
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

/**
 * Create a server-side Supabase client with cookie support for SSR
 * This enables authentication flows with proper session management
 */
export function createSupabaseServerClient(cookies: AstroCookies) {
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
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
