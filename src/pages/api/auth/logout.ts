import type { APIRoute } from "astro";

export const prerender = false;

/**
 * Simple GET-based logout endpoint for link-based logout
 * Redirects to home page after clearing session
 */
export const GET: APIRoute = async ({ locals, redirect, cookies }) => {
  try {
    // Sign out using Supabase client
    await locals.supabase.auth.signOut();

    // Clear all Supabase auth cookies
    const allCookies = cookies.getAll();
    allCookies.forEach((cookie) => {
      if (cookie.name.startsWith("sb-")) {
        cookies.delete(cookie.name, { path: "/" });
      }
    });

    // Redirect to home page
    return redirect("/");
  } catch (error) {
    console.error("Logout error:", error);
    // Still redirect even on error to prevent stuck state
    return redirect("/?error=logout-failed");
  }
};
