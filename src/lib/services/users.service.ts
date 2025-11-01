import type { SupabaseClient } from "@/db/supabase.client";
import type { UpdateUserPermissionsCommand } from "@/types";

/**
 * Users Service
 * Handles user management operations for admins
 */
export class UsersService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get all users with pagination
   */
  async getUsersWithPagination(options: { page: number; limit: number }) {
    const { page, limit } = options;
    const offset = (page - 1) * limit;

    const query = this.supabase
      .from("users")
      .select("id, email, nickname, role, can_add_photos, created_at, consent_given_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return {
      users: data || [],
      total_count: count || 0,
    };
  }

  /**
   * Get user statistics
   */
  async getUserStats() {
    const { data: allUsers, error } = await this.supabase
      .from("users")
      .select("role, can_add_photos, consent_given_at");

    if (error) {
      throw error;
    }

    const total_users = allUsers?.length || 0;
    const total_admins = allUsers?.filter((u) => u.role === "admin").length || 0;
    const users_with_photo_permission = allUsers?.filter((u) => u.can_add_photos).length || 0;
    const users_with_consent = allUsers?.filter((u) => u.consent_given_at !== null).length || 0;

    return {
      total_users,
      total_admins,
      users_with_photo_permission,
      users_with_consent,
    };
  }

  /**
   * Get single user by ID
   */
  async getUserById(userId: string) {
    const { data, error } = await this.supabase
      .from("users")
      .select("id, email, nickname, role, can_add_photos, created_at, updated_at, consent_given_at")
      .eq("id", userId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Update user permissions and role
   */
  async updateUserPermissions(userId: string, updates: UpdateUserPermissionsCommand) {
    const { data, error } = await this.supabase
      .from("users")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select("id, email, role, can_add_photos, updated_at")
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Check if a user is an admin
   */
  async isUserAdmin(userId: string): Promise<boolean> {
    const { data, error } = await this.supabase.from("users").select("role").eq("id", userId).single();

    if (error) {
      return false;
    }

    return data?.role === "admin";
  }
}
