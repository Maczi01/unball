import type { SupabaseClient } from "@/db/supabase.client";

export interface PhotoSubmissionData {
  event_name: string;
  competition?: string;
  year_utc: number;
  place?: string;
  lat: number;
  lon: number;
  photo_url: string;
  thumbnail_url?: string;
  original_url?: string;
  description?: string;
  source_url?: string;
  license: string;
  credit: string;
  tags?: string[];
  notes?: string;
}

export interface PhotoSubmissionResult {
  success: boolean;
  error?: string;
  submissionId?: string;
}

export interface ModerationResult {
  success: boolean;
  error?: string;
  photoId?: string; // ID of approved photo in photos table
}

/**
 * Photo Submissions Service
 * Handles user-submitted photos and moderation
 */
export class PhotoSubmissionsService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Submit a new photo for moderation
   * Requires user to have can_add_photos permission
   */
  async submitPhoto(userId: string, data: PhotoSubmissionData): Promise<PhotoSubmissionResult> {
    // Check if user has permission to add photos
    const { data: user, error: userError } = await this.supabase
      .from("users")
      .select("can_add_photos")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    if (!user.can_add_photos) {
      return {
        success: false,
        error: "You don't have permission to add photos",
      };
    }

    // Validate year range
    if (data.year_utc < 1880 || data.year_utc > 2025) {
      return {
        success: false,
        error: "Year must be between 1880 and 2025",
      };
    }

    // Validate coordinates
    if (data.lat < -90 || data.lat > 90) {
      return {
        success: false,
        error: "Latitude must be between -90 and 90",
      };
    }

    if (data.lon < -180 || data.lon > 180) {
      return {
        success: false,
        error: "Longitude must be between -180 and 180",
      };
    }

    // Insert photo submission
    const { data: submission, error: insertError } = await this.supabase
      .from("photo_submissions")
      .insert({
        user_id: userId,
        event_name: data.event_name,
        competition: data.competition,
        year_utc: data.year_utc,
        place: data.place,
        lat: data.lat,
        lon: data.lon,
        photo_url: data.photo_url,
        thumbnail_url: data.thumbnail_url,
        original_url: data.original_url,
        description: data.description,
        source_url: data.source_url,
        license: data.license,
        credit: data.credit,
        tags: data.tags,
        notes: data.notes,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError) {
      return {
        success: false,
        error: insertError.message,
      };
    }

    return {
      success: true,
      submissionId: submission.id,
    };
  }

  /**
   * Get all pending photo submissions (for admins)
   */
  async getPendingSubmissions() {
    const { data, error } = await this.supabase
      .from("photo_submissions")
      .select(
        `
        *,
        users!inner(nickname, email)
      `
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Get user's photo submissions
   */
  async getUserSubmissions(userId: string) {
    const { data, error } = await this.supabase
      .from("photo_submissions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Approve a photo submission and move it to photos table
   * Only admins can do this
   */
  async approveSubmission(submissionId: string, adminId: string): Promise<ModerationResult> {
    // Check if user is admin
    const { data: admin, error: adminError } = await this.supabase
      .from("users")
      .select("role")
      .eq("id", adminId)
      .single();

    if (adminError || !admin || admin.role !== "admin") {
      return {
        success: false,
        error: "Unauthorized: Admin access required",
      };
    }

    // Call the stored procedure to approve the submission
    const { data, error } = await this.supabase.rpc("approve_photo_submission", {
      submission_id: submissionId,
      admin_id: adminId,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      photoId: data,
    };
  }

  /**
   * Reject a photo submission
   * Only admins can do this
   */
  async rejectSubmission(
    submissionId: string,
    adminId: string,
    reason: string
  ): Promise<ModerationResult> {
    // Check if user is admin
    const { data: admin, error: adminError } = await this.supabase
      .from("users")
      .select("role")
      .eq("id", adminId)
      .single();

    if (adminError || !admin || admin.role !== "admin") {
      return {
        success: false,
        error: "Unauthorized: Admin access required",
      };
    }

    // Call the stored procedure to reject the submission
    const { error } = await this.supabase.rpc("reject_photo_submission", {
      submission_id: submissionId,
      admin_id: adminId,
      reason,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  }

  /**
   * Get submission statistics for a user
   */
  async getUserStats(userId: string) {
    const { data, error } = await this.supabase
      .from("photo_submissions")
      .select("status")
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    const stats = {
      total: data.length,
      pending: data.filter((s) => s.status === "pending").length,
      approved: data.filter((s) => s.status === "approved").length,
      rejected: data.filter((s) => s.status === "rejected").length,
    };

    return stats;
  }
}
