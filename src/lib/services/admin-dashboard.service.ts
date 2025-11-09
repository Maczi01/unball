import type { SupabaseClient } from "@/db/supabase.client";

/**
 * Admin Dashboard Service
 * Aggregates statistics and overview data for admin dashboard
 */
export class AdminDashboardService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get comprehensive dashboard statistics
   */
  async getDashboardStats() {
    // Fetch all data in parallel
    const [
      usersResult,
      photosResult,
      submissionsResult,
      dailySetsResult,
      pendingSubmissionsResult,
      recentPhotosResult,
    ] = await Promise.all([
      this.getUserStats(),
      this.getPhotoStats(),
      this.getPhotoSubmissionStats(),
      this.getDailySetStats(),
      this.getPendingSubmissionsCount(),
      this.getRecentPhotos(),
    ]);

    return {
      users: usersResult,
      photos: photosResult,
      submissions: submissionsResult,
      daily_sets: dailySetsResult,
      pending_count: pendingSubmissionsResult,
      recent_photos: recentPhotosResult,
    };
  }

  private async getUserStats() {
    const { data, error } = await this.supabase.from("users").select("role, can_add_photos, consent_given_at");

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching user stats:", error);
      return { total: 0, admins: 0, with_photo_permission: 0, with_consent: 0 };
    }

    return {
      total: data?.length || 0,
      admins: data?.filter((u) => u.role === "admin").length || 0,
      with_photo_permission: data?.filter((u) => u.can_add_photos).length || 0,
      with_consent: data?.filter((u) => u.consent_given_at !== null).length || 0,
    };
  }

  private async getPhotoStats() {
    const { data, error } = await this.supabase.from("photos").select("is_daily_eligible");

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching photo stats:", error);
      return { total: 0, daily_eligible: 0 };
    }

    return {
      total: data?.length || 0,
      daily_eligible: data?.filter((p) => p.is_daily_eligible).length || 0,
    };
  }

  private async getPhotoSubmissionStats() {
    const { data, error } = await this.supabase.from("photo_submissions").select("status");

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching submission stats:", error);
      return { total: 0, pending: 0, approved: 0, rejected: 0 };
    }

    return {
      total: data?.length || 0,
      pending: data?.filter((s) => s.status === "pending").length || 0,
      approved: data?.filter((s) => s.status === "approved").length || 0,
      rejected: data?.filter((s) => s.status === "rejected").length || 0,
    };
  }

  private async getDailySetStats() {
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await this.supabase
      .from("daily_sets")
      .select("date_utc, is_published")
      .gte("date_utc", today)
      .order("date_utc", { ascending: true })
      .limit(30);

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching daily set stats:", error);
      return { scheduled_ahead: 0, next_unpublished: null };
    }

    const futurePublished = data?.filter((s) => s.is_published && s.date_utc >= today) || [];
    const nextUnpublished = data?.find((s) => !s.is_published);

    return {
      scheduled_ahead: futurePublished.length,
      next_unpublished: nextUnpublished?.date_utc || null,
    };
  }

  private async getPendingSubmissionsCount() {
    const { count, error } = await this.supabase
      .from("photo_submissions")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching pending submissions count:", error);
      return 0;
    }

    return count || 0;
  }

  private async getRecentPhotos() {
    const { data, error } = await this.supabase
      .from("photos")
      .select("id, event_name, photo_url, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching recent photos:", error);
      return [];
    }

    return data || [];
  }

  /**
   * Get recent activity (last 10 approved/rejected submissions)
   */
  async getRecentActivity() {
    const { data, error } = await this.supabase
      .from("photo_submissions")
      .select("id, event_name, status, reviewed_at, reviewed_by")
      .in("status", ["approved", "rejected"])
      .not("reviewed_at", "is", null)
      .order("reviewed_at", { ascending: false })
      .limit(10);

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching recent activity:", error);
      return [];
    }

    return data || [];
  }
}
