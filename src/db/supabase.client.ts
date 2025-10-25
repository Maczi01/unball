import { createClient, type SupabaseClient as BaseSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

/**
 * Type-safe Supabase client for this project
 * Use this type instead of importing from @supabase/supabase-js
 */
export type SupabaseClient = BaseSupabaseClient<Database>;
