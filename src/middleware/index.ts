import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerClient } from "../db/supabase.client.ts";

export const onRequest = defineMiddleware(async (context, next) => {
  // Create server-side Supabase client with cookie support
  const supabase = createSupabaseServerClient(context.cookies);

  // Get current session (if exists)
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Attach to context
  context.locals.supabase = supabase;
  context.locals.session = session;
  context.locals.user = session?.user ?? null;

  return next();
});
