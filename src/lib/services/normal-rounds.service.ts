import type { SupabaseClient } from "@/db/supabase.client";
import type { CalculateScoreCommand, GuessDTO, PhotoMoreInfoDTO, PhotoScoreResultDTO, ScoreResponseDTO } from "@/types";
import { calculateDistance, calculateLocationScore } from "@/lib/utils/scoreCalculation";

/**
 * Scores N guesses against the photos table.
 * Resolves photo IDs, fetches more_info, computes per-photo location scores.
 * No persistence, no leaderboard, no daily-set validation.
 */
export async function scoreGuesses(supabase: SupabaseClient, guesses: GuessDTO[]): Promise<PhotoScoreResultDTO[]> {
  const photoIds = guesses.map((g) => g.photo_id);

  const { data: photos, error: photosError } = await supabase
    .from("photos")
    .select("id, lat, lon, description, place, license, credit, photo_url")
    .in("id", photoIds);

  if (photosError) {
    throw photosError;
  }

  if (!photos || photos.length !== new Set(photoIds).size) {
    throw new Error("INVALID_PHOTO_IDS");
  }

  const { data: allMoreInfo, error: moreInfoError } = await supabase
    .from("photo_more_info")
    .select("id, photo_id, info_type, url, title, description, position")
    .in("photo_id", photoIds)
    .order("position", { ascending: true });

  if (moreInfoError) {
    // eslint-disable-next-line no-console
    console.error("[Normal Rounds Service] Error fetching more info:", moreInfoError);
  }

  const moreInfoByPhotoId = new Map<string, PhotoMoreInfoDTO[]>();
  allMoreInfo?.forEach((info) => {
    const list = moreInfoByPhotoId.get(info.photo_id) ?? [];
    list.push(info);
    moreInfoByPhotoId.set(info.photo_id, list);
  });

  return guesses.map((guess) => {
    const correctPhoto = photos.find((p) => p.id === guess.photo_id);
    if (!correctPhoto) {
      throw new Error(`Photo not found: ${guess.photo_id}`);
    }

    const kmError = calculateDistance(guess.guessed_lat, guess.guessed_lon, correctPhoto.lat, correctPhoto.lon);
    const locationScore = calculateLocationScore(kmError);

    return {
      photo_id: guess.photo_id,
      photo_url: correctPhoto.photo_url,
      location_score: locationScore,
      total_score: locationScore,
      km_error: Math.round(kmError * 10) / 10,
      correct_lat: correctPhoto.lat,
      correct_lon: correctPhoto.lon,
      event_name: "",
      description: correctPhoto.description,
      place: correctPhoto.place,
      more_info: moreInfoByPhotoId.get(guess.photo_id) ?? [],
      license: correctPhoto.license,
      credit: correctPhoto.credit,
    };
  });
}

/**
 * Scores a Normal-mode round (5 guesses, no persistence).
 */
export async function scoreNormalRound(
  supabase: SupabaseClient,
  command: CalculateScoreCommand
): Promise<ScoreResponseDTO> {
  const photos = await scoreGuesses(supabase, command.guesses);
  const totalScore = photos.reduce((sum, r) => sum + r.total_score, 0);

  return {
    total_score: totalScore,
    total_time_ms: command.total_time_ms,
    photos,
  };
}
