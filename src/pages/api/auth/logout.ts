import type { APIRoute } from "astro";

export const prerender = false;

/**
 * Simple GET-based logout endpoint for link-based logout
 * Redirects to home page after clearing session
 */
export const GET: APIRoute = async ({ locals, redirect, cookies }) => {
  try {
    // 1. Sign out using Supabase client
    await locals.supabase.auth.signOut();

    // 2. Clear the specific Supabase auth cookies used for the session.
    // Explicitly deleting the known cookies is more reliable than iterating.
    const cookieOptions = { path: "/" };

    cookies.delete("sb-access-token", cookieOptions);
    cookies.delete("sb-refresh-token", cookieOptions);

    // 3. Redirect to home page
    return redirect("/");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Logout error:", error);
    // Still redirect even on error to prevent stuck state
    return redirect("/?error=logout-failed");
  }
};
