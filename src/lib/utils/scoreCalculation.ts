import type { GuessDTO, PhotoScoreResultDTO } from "@/types";

/**
 * Scoring constants
 * These match the server-side scoring logic
 */
const SCORING_CONSTANTS = {
  MAX_LOCATION_SCORE: 10000,
  KM_PENALTY_FACTOR: 5, // Points deducted per km of error
};

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate location score based on distance error
 * Max 10,000 points, reduced by 5 points per km
 */
export function calculateLocationScore(kmError: number): number {
  const score = SCORING_CONSTANTS.MAX_LOCATION_SCORE - kmError * SCORING_CONSTANTS.KM_PENALTY_FACTOR;
  return Math.max(0, Math.round(score));
}

/**
 * Calculate complete score for a photo guess
 * This is client-side calculation for immediate feedback
 * Server will recalculate for authoritative scoring
 */
export function calculateScore(
  guess: GuessDTO,
  correct: { lat: number; lon: number }
): Partial<PhotoScoreResultDTO> {
  try {
    // Calculate distance error
    const kmError = calculateDistance(guess.guessed_lat, guess.guessed_lon, correct.lat, correct.lon);

    // Calculate scores
    const locationScore = calculateLocationScore(kmError);
    const totalScore = locationScore;

    return {
      photo_id: guess.photo_id,
      location_score: locationScore,
      total_score: totalScore,
      km_error: Math.round(kmError * 10) / 10, // Round to 1 decimal place
      correct_lat: correct.lat,
      correct_lon: correct.lon,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Score calculation error:", error);
    // Return default values on error
    return {
      photo_id: guess.photo_id,
      location_score: 0,
      total_score: 0,
      km_error: 0,
      correct_lat: correct.lat,
      correct_lon: correct.lon,
    };
  }
}
