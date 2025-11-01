import type { SupabaseClient } from "@/db/supabase.client";
import type {
  DailySetResponseDTO,
  DailySetPhotoDTO,
  AdminDailySetDTO,
  AdminDailySetPhotoDTO,
  AdminDailySetListItemDTO,
  AdminDailySetsResponseDTO,
  ScheduleStatusDTO,
  PaginationDTO,
  AdminPhotoListItemDTO,
} from "@/types";
import { ValidationConstants } from "@/types";

// =============================================================================
// PUBLIC-FACING FUNCTIONS
// =============================================================================

/**
 * Retrieves today's published daily set with photos
 * @param supabase - Supabase client from context.locals
 * @returns Daily set with 5 photos, or null if not found
 */
export async function getTodaysDailySet(supabase: SupabaseClient): Promise<DailySetResponseDTO | null> {
  const today = new Date().toISOString().split("T")[0];

  try {
    const { data, error } = await supabase
      .from("daily_sets")
      .select(
        `
        id,
        date_utc,
        daily_set_photos!inner (
          position,
          photo_id,
          photos!inner (
            id,
            photo_url,
            thumbnail_url,
            competition,
            place,
            tags
          )
        )
      `
      )
      .eq("date_utc", today)
      .eq("is_published", true)
      .order("position", {
        foreignTable: "daily_set_photos",
        ascending: true,
      })
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned - normal case when no set published
        console.warn(`[Daily Sets] No published set found for ${today}`);
        return null;
      }
      throw error;
    }

    if (!data) {
      return null;
    }

    // Transform database result to DTO
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const photos: DailySetPhotoDTO[] = data.daily_set_photos.map((dsp: any) => ({
      photo_id: dsp.photos.id,
      position: dsp.position,
      photo_url: dsp.photos.photo_url,
      thumbnail_url: dsp.photos.thumbnail_url,
      competition: dsp.photos.competition,
      place: dsp.photos.place,
      tags: dsp.photos.tags,
    }));

    // Validate photo count
    if (photos.length !== 5) {
      console.error(`[Daily Sets] Invalid photo count for set ${data.id}: ${photos.length} (expected 5)`);
      throw new Error("Daily set incomplete");
    }

    const response: DailySetResponseDTO = {
      daily_set_id: data.id,
      date_utc: data.date_utc,
      photos,
    };

    console.info(`[Daily Sets] Retrieved set for ${today}, id: ${data.id}`);
    return response;
  } catch (error) {
    console.error("[Daily Sets] Error fetching today's set:", error);
    throw error;
  }
}

// =============================================================================
// ADMIN FUNCTIONS
// =============================================================================

/**
 * Creates a new daily set for a specific date
 * @param supabase - Supabase client from context.locals
 * @param date_utc - Date in YYYY-MM-DD format
 * @param photo_ids - Array of exactly 5 unique photo IDs
 * @returns Created daily set with photos
 * @throws Error if validation fails or database operation fails
 */
export async function createDailySet(
  supabase: SupabaseClient,
  date_utc: string,
  photo_ids: string[]
): Promise<AdminDailySetDTO> {
  // Validation: Exactly 5 unique photo IDs
  if (photo_ids.length !== ValidationConstants.DAILY_SET.PHOTO_COUNT) {
    throw new Error(`Must provide exactly ${ValidationConstants.DAILY_SET.PHOTO_COUNT} photos`);
  }

  const uniquePhotoIds = new Set(photo_ids);
  if (uniquePhotoIds.size !== photo_ids.length) {
    throw new Error("All photo IDs must be unique");
  }

  // Validation: Date format and not in the past
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date_utc)) {
    throw new Error("Invalid date format. Use YYYY-MM-DD");
  }

  const providedDate = new Date(date_utc);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (providedDate < today) {
    throw new Error("Cannot create daily set for past dates");
  }

  try {
    // Check if date already has a daily set
    const { data: existingSet } = await supabase.from("daily_sets").select("id").eq("date_utc", date_utc).single();

    if (existingSet) {
      throw new Error(`Daily set already exists for ${date_utc}`);
    }

    // Verify all photos exist and are daily eligible
    const { data: photos, error: photosError } = await supabase
      .from("photos")
      .select("id, is_daily_eligible, event_name")
      .in("id", photo_ids);

    if (photosError) throw photosError;

    if (!photos || photos.length !== ValidationConstants.DAILY_SET.PHOTO_COUNT) {
      throw new Error("One or more photo IDs are invalid");
    }

    const ineligiblePhotos = photos.filter((p) => !p.is_daily_eligible);
    if (ineligiblePhotos.length > 0) {
      throw new Error(`Photos are not daily eligible: ${ineligiblePhotos.map((p) => p.event_name).join(", ")}`);
    }

    // Create daily set
    const { data: dailySet, error: setError } = await supabase
      .from("daily_sets")
      .insert({
        date_utc,
        is_published: false,
      })
      .select()
      .single();

    if (setError || !dailySet) {
      throw setError || new Error("Failed to create daily set");
    }

    // Create daily_set_photos junction records
    const junctionRecords = photo_ids.map((photo_id, index) => ({
      daily_set_id: dailySet.id,
      photo_id,
      position: index + 1, // Positions 1-5
    }));

    const { error: junctionError } = await supabase.from("daily_set_photos").insert(junctionRecords);

    if (junctionError) {
      // Rollback: delete the daily set
      await supabase.from("daily_sets").delete().eq("id", dailySet.id);
      throw junctionError;
    }

    console.info(`[Daily Sets] Created set for ${date_utc}, id: ${dailySet.id}`);

    // Fetch and return complete daily set
    return getDailySetById(supabase, dailySet.id);
  } catch (error) {
    console.error("[Daily Sets] Error creating daily set:", error);
    throw error;
  }
}

/**
 * Retrieves a daily set by ID with full details
 * @param supabase - Supabase client from context.locals
 * @param daily_set_id - UUID of the daily set
 * @returns Complete daily set with photos
 */
export async function getDailySetById(supabase: SupabaseClient, daily_set_id: string): Promise<AdminDailySetDTO> {
  try {
    const { data, error } = await supabase
      .from("daily_sets")
      .select(
        `
        id,
        date_utc,
        is_published,
        created_at,
        updated_at,
        daily_set_photos!inner (
          position,
          photo_id,
          photos!inner (
            id,
            event_name,
            photo_url,
            year_utc
          )
        )
      `
      )
      .eq("id", daily_set_id)
      .order("position", {
        foreignTable: "daily_set_photos",
        ascending: true,
      })
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new Error("Daily set not found");
      }
      throw error;
    }

    if (!data) {
      throw new Error("Daily set not found");
    }

    // Transform to DTO
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const photos: AdminDailySetPhotoDTO[] = data.daily_set_photos.map((dsp: any) => ({
      photo_id: dsp.photos.id,
      position: dsp.position,
      event_name: dsp.photos.event_name,
      photo_url: dsp.photos.photo_url,
      year_utc: dsp.photos.year_utc,
    }));

    return {
      daily_set_id: data.id,
      date_utc: data.date_utc,
      is_published: data.is_published,
      created_at: data.created_at,
      updated_at: data.updated_at,
      photos,
    };
  } catch (error) {
    console.error("[Daily Sets] Error fetching daily set by ID:", error);
    throw error;
  }
}

/**
 * Lists all daily sets with pagination
 * @param supabase - Supabase client from context.locals
 * @param page - Page number (1-indexed)
 * @param limit - Items per page
 * @param from_date - Optional start date filter (YYYY-MM-DD)
 * @param to_date - Optional end date filter (YYYY-MM-DD)
 * @param is_published - Optional publication status filter
 * @returns Paginated list of daily sets with schedule status
 */
export async function listDailySets(
  supabase: SupabaseClient,
  page = 1,
  limit = 20,
  from_date?: string,
  to_date?: string,
  is_published?: boolean
): Promise<AdminDailySetsResponseDTO> {
  const offset = (page - 1) * limit;

  try {
    // Build query
    let query = supabase.from("daily_sets").select(
      `
      id,
      date_utc,
      is_published,
      created_at,
      daily_set_photos!left (photo_id)
    `,
      { count: "exact" }
    );

    // Apply filters
    if (from_date) {
      query = query.gte("date_utc", from_date);
    }
    if (to_date) {
      query = query.lte("date_utc", to_date);
    }
    if (is_published !== undefined) {
      query = query.eq("is_published", is_published);
    }

    // Apply pagination and ordering
    const { data, error, count } = await query.order("date_utc", { ascending: false }).range(offset, offset + limit - 1);

    if (error) throw error;

    // Transform to list items
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const daily_sets: AdminDailySetListItemDTO[] = (data || []).map((set: any) => ({
      daily_set_id: set.id,
      date_utc: set.date_utc,
      is_published: set.is_published,
      created_at: set.created_at,
      photo_count: set.daily_set_photos?.length || 0,
    }));

    // Calculate pagination
    const total_items = count || 0;
    const total_pages = Math.ceil(total_items / limit);

    const pagination: PaginationDTO = {
      page,
      limit,
      total_items,
      total_pages,
    };

    // Calculate schedule status
    const schedule_status = await calculateScheduleStatus(supabase);

    return {
      daily_sets,
      pagination,
      schedule_status,
    };
  } catch (error) {
    console.error("[Daily Sets] Error listing daily sets:", error);
    throw error;
  }
}

/**
 * Calculates schedule health metrics
 * @param supabase - Supabase client from context.locals
 * @returns Schedule status with warnings
 */
async function calculateScheduleStatus(supabase: SupabaseClient): Promise<ScheduleStatusDTO> {
  const today = new Date().toISOString().split("T")[0];

  try {
    // Count days scheduled ahead (published or unpublished, future dates only)
    const { count: futureCount } = await supabase
      .from("daily_sets")
      .select("*", { count: "exact", head: true })
      .gte("date_utc", today);

    const days_scheduled_ahead = futureCount || 0;

    // Find next unpublished date
    const { data: nextUnpublished } = await supabase
      .from("daily_sets")
      .select("date_utc")
      .eq("is_published", false)
      .gte("date_utc", today)
      .order("date_utc", { ascending: true })
      .limit(1)
      .single();

    const next_unpublished_date = nextUnpublished?.date_utc || null;

    // Generate warning if schedule is running low
    let warning: string | null = null;
    if (days_scheduled_ahead < 3) {
      warning = "⚠️ Less than 3 days scheduled ahead. Please create more daily sets.";
    } else if (days_scheduled_ahead < 7) {
      warning = "Warning: Less than 7 days scheduled ahead (recommended minimum).";
    }

    return {
      days_scheduled_ahead,
      next_unpublished_date,
      warning,
    };
  } catch (error) {
    console.error("[Daily Sets] Error calculating schedule status:", error);
    return {
      days_scheduled_ahead: 0,
      next_unpublished_date: null,
      warning: "Error calculating schedule status",
    };
  }
}

/**
 * Publishes a daily set, making it active for the specified date
 * @param supabase - Supabase client from context.locals
 * @param daily_set_id - UUID of the daily set
 * @returns Updated daily set
 */
export async function publishDailySet(supabase: SupabaseClient, daily_set_id: string): Promise<AdminDailySetDTO> {
  try {
    // Fetch the set first to validate
    const dailySet = await getDailySetById(supabase, daily_set_id);

    if (dailySet.is_published) {
      throw new Error("Daily set is already published");
    }

    // Validate photo count
    if (dailySet.photos.length !== ValidationConstants.DAILY_SET.PHOTO_COUNT) {
      throw new Error(`Cannot publish incomplete set. Expected ${ValidationConstants.DAILY_SET.PHOTO_COUNT} photos, found ${dailySet.photos.length}`);
    }

    // Update set to published
    const { error: updateError } = await supabase.from("daily_sets").update({ is_published: true }).eq("id", daily_set_id);

    if (updateError) throw updateError;

    // Update first_used_in_daily_date for photos (if null)
    for (const photo of dailySet.photos) {
      await supabase
        .from("photos")
        .update({ first_used_in_daily_date: dailySet.date_utc })
        .eq("id", photo.photo_id)
        .is("first_used_in_daily_date", null);
    }

    console.info(`[Daily Sets] Published set for ${dailySet.date_utc}, id: ${daily_set_id}`);

    // Fetch and return updated set
    return getDailySetById(supabase, daily_set_id);
  } catch (error) {
    console.error("[Daily Sets] Error publishing daily set:", error);
    throw error;
  }
}

/**
 * Deletes a daily set (only if not published or has no submissions)
 * @param supabase - Supabase client from context.locals
 * @param daily_set_id - UUID of the daily set
 */
export async function deleteDailySet(supabase: SupabaseClient, daily_set_id: string): Promise<void> {
  try {
    // Check if set has submissions
    const { count } = await supabase
      .from("daily_submissions")
      .select("*", { count: "exact", head: true })
      .eq("daily_set_id", daily_set_id);

    if (count && count > 0) {
      throw new Error("Cannot delete daily set with existing submissions");
    }

    // Delete the set (CASCADE will delete daily_set_photos)
    const { error } = await supabase.from("daily_sets").delete().eq("id", daily_set_id);

    if (error) throw error;

    console.info(`[Daily Sets] Deleted set id: ${daily_set_id}`);
  } catch (error) {
    console.error("[Daily Sets] Error deleting daily set:", error);
    throw error;
  }
}

/**
 * Gets available photos for daily set selection
 * @param supabase - Supabase client from context.locals
 * @param page - Page number (1-indexed)
 * @param limit - Items per page
 * @returns Paginated list of photos eligible for daily sets
 */
export async function getAvailablePhotosForDaily(
  supabase: SupabaseClient,
  page = 1,
  limit = 50
): Promise<{ photos: AdminPhotoListItemDTO[]; pagination: PaginationDTO }> {
  const offset = (page - 1) * limit;

  try {
    const { data, error, count } = await supabase
      .from("photos")
      .select(
        `
        id,
        photo_url,
        thumbnail_url,
        event_name,
        year_utc,
        lat,
        lon,
        is_daily_eligible,
        first_used_in_daily_date,
        created_at
      `,
        { count: "exact" }
      )
      .eq("is_daily_eligible", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const photos = (data || []) as AdminPhotoListItemDTO[];

    const total_items = count || 0;
    const total_pages = Math.ceil(total_items / limit);

    const pagination: PaginationDTO = {
      page,
      limit,
      total_items,
      total_pages,
    };

    return { photos, pagination };
  } catch (error) {
    console.error("[Daily Sets] Error fetching available photos:", error);
    throw error;
  }
}

// =============================================================================
// CRON/AUTOMATION FUNCTIONS
// =============================================================================

export interface AutoPublishResult {
  success: boolean;
  message: string;
  daily_set_id: string | null;
  date_utc: string;
  was_already_published: boolean;
  timestamp: string;
}

/**
 * Auto-publishes today's daily set if it exists and is unpublished
 * Called by cron job at 00:00 UTC
 *
 * @param supabase - Supabase client from context.locals
 * @returns Result object with status information
 * @throws Error if set is incomplete or database operation fails
 */
export async function autoPublishTodaysDailySet(supabase: SupabaseClient): Promise<AutoPublishResult> {
  const today = new Date().toISOString().split("T")[0];

  try {
    // Find today's daily set
    const { data: dailySet, error: fetchError } = await supabase
      .from("daily_sets")
      .select("id, date_utc, is_published")
      .eq("date_utc", today)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        // No set found for today
        const errorMessage = `No daily set scheduled for ${today}`;
        console.error(`[Auto-Publish] ${errorMessage}`);

        // TODO: Send alert to admin (email, Slack, etc.)
        // Example: await sendAdminAlert({ type: 'missing_daily_set', date: today });

        throw new Error(errorMessage);
      }
      throw fetchError;
    }

    if (!dailySet) {
      throw new Error(`No daily set found for ${today}`);
    }

    // Check if already published
    if (dailySet.is_published) {
      console.info(`[Auto-Publish] Daily set for ${today} is already published`);
      return {
        success: true,
        message: `Daily set for ${today} was already published`,
        daily_set_id: dailySet.id,
        date_utc: today,
        was_already_published: true,
        timestamp: new Date().toISOString(),
      };
    }

    // Publish the set
    console.info(`[Auto-Publish] Publishing daily set for ${today}, id: ${dailySet.id}`);
    await publishDailySet(supabase, dailySet.id);

    console.info(`[Auto-Publish] Successfully published daily set for ${today}`);

    return {
      success: true,
      message: `Successfully published daily set for ${today}`,
      daily_set_id: dailySet.id,
      date_utc: today,
      was_already_published: false,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[Auto-Publish] Error:", error);

    // Return error result (don't throw, so cron can record the failure)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to auto-publish daily set",
      daily_set_id: null,
      date_utc: today,
      was_already_published: false,
      timestamp: new Date().toISOString(),
    };
  }
}
