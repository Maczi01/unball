import type { SupabaseClient } from "@/db/supabase.client";
import type { UpdatePhotoCommand } from "@/types";

/**
 * Photos Service
 * Handles approved photos management for admins
 */
export class PhotosService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get all photos with pagination
   */
  async getPhotosWithPagination(options: {
    page: number;
    limit: number;
    is_daily_eligible?: boolean;
  }) {
    const { page, limit, is_daily_eligible } = options;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from("photos")
      .select(
        "id, photo_url, thumbnail_url, event_name, year_utc, lat, lon, is_daily_eligible, first_used_in_daily_date, created_at",
        { count: "exact" }
      );

    // Apply filter
    if (is_daily_eligible !== undefined) {
      query = query.eq("is_daily_eligible", is_daily_eligible);
    }

    // Apply pagination and ordering
    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return {
      photos: data || [],
      total_count: count || 0,
    };
  }

  /**
   * Get single photo by ID
   */
  async getPhotoById(photoId: string) {
    const { data, error } = await this.supabase
      .from("photos")
      .select("*")
      .eq("id", photoId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Update photo metadata
   */
  async updatePhoto(photoId: string, updates: UpdatePhotoCommand) {
    const { data, error } = await this.supabase
      .from("photos")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", photoId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Delete photo
   */
  async deletePhoto(photoId: string) {
    const { error } = await this.supabase.from("photos").delete().eq("id", photoId);

    if (error) {
      throw error;
    }

    return { success: true };
  }

  /**
   * Bulk update photos
   */
  async bulkUpdatePhotos(photoIds: string[], updates: Partial<UpdatePhotoCommand>) {
    const { data, error } = await this.supabase
      .from("photos")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .in("id", photoIds)
      .select();

    if (error) {
      throw error;
    }

    return {
      success: true,
      updated_count: data.length,
    };
  }

  /**
   * Bulk delete photos
   */
  async bulkDeletePhotos(photoIds: string[]) {
    const { error } = await this.supabase.from("photos").delete().in("id", photoIds);

    if (error) {
      throw error;
    }

    return {
      success: true,
      deleted_count: photoIds.length,
    };
  }
}
