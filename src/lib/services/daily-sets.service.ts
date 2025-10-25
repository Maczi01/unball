import type { SupabaseClient } from "@/db/supabase.client";
import type { DailySetResponseDTO, DailySetPhotoDTO } from "@/types";

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
