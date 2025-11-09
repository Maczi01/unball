/// <reference types="astro/client" />

import type { Session, User } from "@supabase/supabase-js";
import type { SupabaseClient } from "./db/supabase.client.ts";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient;
      session: Session | null;
      user: User | null;
      runtime: {
        env: {
          SUPABASE_URL: string;
          SUPABASE_KEY: string;
          OPENROUTER_API_KEY?: string;
          PUBLIC_MAPBOX_ACCESS_TOKEN?: string;
          CRON_SECRET?: string;
        };
      };
    }
  }
}

interface ImportMetaEnv {
  // Server-side only (not bundled into client)
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  readonly GOOGLE_GEMINI_API_KEY: string;
  readonly CRON_SECRET: string;

  // Client-side (PUBLIC_ vars are bundled and safe to expose)
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly PUBLIC_MAPBOX_ACCESS_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
