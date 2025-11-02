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
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
