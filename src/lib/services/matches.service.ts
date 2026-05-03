import type { SupabaseClient } from "@/db/supabase.client";
import type {
  CreateMatchResponseDTO,
  GuessDTO,
  MatchJoinResponseDTO,
  MatchPhotoDTO,
  MatchPhotoWithAnswerDTO,
  MatchPlayerGuessDTO,
  MatchPlayerSummaryDTO,
  MatchResultsResponseDTO,
  MatchStatus,
  MatchSubmissionCommand,
  MatchSubmissionResponseDTO,
  PhotoScoreResultDTO,
} from "@/types";
import { calculateDistance, calculateLocationScore } from "@/lib/utils/scoreCalculation";

const MATCH_PHOTO_COUNT = 5;
const CODE_LENGTH = 6;
// Excludes I, O, 0, 1 to avoid ambiguous chars on small fonts and SMS.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_GENERATION_RETRIES = 5;

/**
 * The match tables are added by 20260503000000_add_matches.sql but won't
 * appear in the generated Supabase types until `npm run generate-types`
 * is run against a database with the migration applied. Until then, cast
 * the client to a relaxed type for queries against the new tables.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RelaxedClient = any;
function relax(supabase: SupabaseClient): RelaxedClient {
  return supabase as unknown as RelaxedClient;
}

export class MatchNotFoundError extends Error {
  constructor() {
    super("MATCH_NOT_FOUND");
    this.name = "MatchNotFoundError";
  }
}

export class MatchExpiredError extends Error {
  constructor() {
    super("MATCH_EXPIRED");
    this.name = "MatchExpiredError";
  }
}

export class DuplicateMatchSubmissionError extends Error {
  constructor() {
    super("DUPLICATE_MATCH_SUBMISSION");
    this.name = "DuplicateMatchSubmissionError";
  }
}

export class NotAMatchParticipantError extends Error {
  constructor() {
    super("NOT_A_MATCH_PARTICIPANT");
    this.name = "NotAMatchParticipantError";
  }
}

export class CodeGenerationError extends Error {
  constructor() {
    super("CODE_GENERATION_FAILED");
    this.name = "CodeGenerationError";
  }
}

function generateMatchCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() <= Date.now();
}

function deriveStatus(expiresAt: string, stored: string): MatchStatus {
  if (stored === "expired") return "expired";
  return isExpired(expiresAt) ? "expired" : "open";
}

interface RequesterIdentity {
  userId: string | null;
  deviceToken: string | null;
}

/**
 * Picks N distinct photos at random from the photos pool.
 * Pulls a larger candidate set (200) and shuffles client-side so the same
 * pool can be queried cheaply.
 */
async function pickRandomPhotoIds(supabase: SupabaseClient, count: number): Promise<string[]> {
  const { data, error } = await supabase.from("photos_metadata").select("id").limit(200);
  if (error) throw error;
  if (!data || data.length < count) {
    throw new Error("INSUFFICIENT_PHOTOS");
  }
  const shuffled = [...data].sort(() => Math.random() - 0.5);
  return shuffled
    .slice(0, count)
    .map((p) => p.id)
    .filter((id): id is string => typeof id === "string");
}

/**
 * Creates a friends match with 5 random photos and a unique code.
 */
export async function createMatch(
  supabase: SupabaseClient,
  userId: string,
  creatorNickname: string | null
): Promise<CreateMatchResponseDTO> {
  const sb = relax(supabase);
  const photoIds = await pickRandomPhotoIds(supabase, MATCH_PHOTO_COUNT);

  let lastError: unknown = null;
  for (let attempt = 0; attempt < CODE_GENERATION_RETRIES; attempt++) {
    const code = generateMatchCode();

    const { data: matchRow, error: insertError } = await sb
      .from("matches")
      .insert({
        code,
        created_by_user_id: userId,
        creator_nickname: creatorNickname,
      })
      .select("id, code, created_at, expires_at")
      .single();

    if (insertError) {
      // 23505 = unique violation; retry with a fresh code
      if (insertError.code === "23505") {
        lastError = insertError;
        continue;
      }
      throw insertError;
    }

    const matchId = matchRow.id as string;

    const { error: junctionError } = await sb.from("match_photos").insert(
      photoIds.map((photo_id, idx) => ({
        match_id: matchId,
        photo_id,
        position: idx + 1,
      }))
    );

    if (junctionError) {
      // Roll back the match row so the code is freed for reuse.
      await sb.from("matches").delete().eq("id", matchId);
      throw junctionError;
    }

    const { data: photos, error: photosError } = await supabase
      .from("photos_metadata")
      .select("id, photo_url, place, tags")
      .in("id", photoIds);

    if (photosError) throw photosError;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const photoById = new Map((photos ?? []).map((p: any) => [p.id, p]));
    const matchPhotos: MatchPhotoDTO[] = photoIds.map((photo_id, idx) => {
      const p = photoById.get(photo_id);
      if (!p) throw new Error(`Photo not found: ${photo_id}`);
      return {
        photo_id,
        position: idx + 1,
        photo_url: p.photo_url ?? "",
        place: p.place ?? null,
        tags: p.tags ?? null,
      };
    });

    return {
      match_id: matchId,
      code: matchRow.code,
      created_at: matchRow.created_at,
      expires_at: matchRow.expires_at,
      photos: matchPhotos,
    };
  }

  // eslint-disable-next-line no-console
  console.error("[Matches Service] Code collision retry exhausted:", lastError);
  throw new CodeGenerationError();
}

/**
 * Looks up a match by its code, returning photos without answers.
 * Throws MatchNotFoundError on missing, MatchExpiredError on past expires_at.
 */
export async function getMatchByCode(
  supabase: SupabaseClient,
  code: string,
  requester: RequesterIdentity
): Promise<MatchJoinResponseDTO> {
  const sb = relax(supabase);
  const upperCode = code.toUpperCase();

  const { data: match, error: matchError } = await sb
    .from("matches")
    .select("id, code, created_at, expires_at, status, creator_nickname, created_by_user_id")
    .eq("code", upperCode)
    .maybeSingle();

  if (matchError) throw matchError;
  if (!match) throw new MatchNotFoundError();

  const status = deriveStatus(match.expires_at, match.status);
  if (status === "expired") throw new MatchExpiredError();

  // Resolve creator nickname: prefer snapshot on match, fall back to users table.
  let creatorNickname = match.creator_nickname ?? "";
  if (!creatorNickname) {
    const { data: creator } = await supabase
      .from("users")
      .select("nickname")
      .eq("id", match.created_by_user_id)
      .maybeSingle();
    creatorNickname = creator?.nickname ?? "Player";
  }

  const { data: photos, error: photosError } = await sb
    .from("match_photos")
    .select("position, photo_id, photos!inner(id, photo_url, place, tags)")
    .eq("match_id", match.id)
    .order("position", { ascending: true });

  if (photosError) throw photosError;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matchPhotos: MatchPhotoDTO[] = (photos ?? []).map((row: any) => ({
    photo_id: row.photos.id,
    position: row.position,
    photo_url: row.photos.photo_url,
    place: row.photos.place,
    tags: row.photos.tags,
  }));

  const alreadySubmitted = await hasSubmittedToMatch(supabase, match.id, requester);

  return {
    match_id: match.id,
    code: match.code,
    created_at: match.created_at,
    expires_at: match.expires_at,
    status,
    creator_nickname: creatorNickname,
    photos: matchPhotos,
    already_submitted: alreadySubmitted,
  };
}

async function hasSubmittedToMatch(
  supabase: SupabaseClient,
  matchId: string,
  requester: RequesterIdentity
): Promise<boolean> {
  if (!requester.userId && !requester.deviceToken) return false;

  const sb = relax(supabase);
  let query = sb.from("match_submissions").select("id", { count: "exact", head: true }).eq("match_id", matchId);

  if (requester.userId) {
    query = query.eq("user_id", requester.userId);
  } else if (requester.deviceToken) {
    query = query.eq("anon_device_token", requester.deviceToken).is("user_id", null);
  }

  const { count, error } = await query;
  if (error) throw error;
  return (count ?? 0) > 0;
}

/**
 * Submits a player's 5 guesses to a match. Scores server-side, persists
 * submission + guesses. Throws DuplicateMatchSubmissionError if the player
 * has already submitted (enforced by partial unique index).
 */
export async function submitMatch(
  supabase: SupabaseClient,
  code: string,
  command: MatchSubmissionCommand,
  requester: RequesterIdentity
): Promise<MatchSubmissionResponseDTO> {
  const sb = relax(supabase);
  const upperCode = code.toUpperCase();

  const { data: match, error: matchError } = await sb
    .from("matches")
    .select("id, expires_at, status")
    .eq("code", upperCode)
    .maybeSingle();

  if (matchError) throw matchError;
  if (!match) throw new MatchNotFoundError();
  if (deriveStatus(match.expires_at, match.status) === "expired") {
    throw new MatchExpiredError();
  }

  // Validate guess count matches the locked photo set
  const { data: matchPhotos, error: matchPhotosError } = await sb
    .from("match_photos")
    .select("photo_id, position")
    .eq("match_id", match.id);

  if (matchPhotosError) throw matchPhotosError;
  if (!matchPhotos || matchPhotos.length !== MATCH_PHOTO_COUNT) {
    throw new Error("MATCH_PHOTOS_MISSING");
  }

  if (!Array.isArray(command.guesses) || command.guesses.length !== MATCH_PHOTO_COUNT) {
    throw new Error("INVALID_GUESS_COUNT");
  }

  const photoPositionById = new Map<string, number>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    matchPhotos.map((p: any) => [p.photo_id as string, p.position as number])
  );
  const guessPhotoIds = command.guesses.map((g) => g.photo_id);
  const allMatch = guessPhotoIds.every((id) => photoPositionById.has(id));
  if (!allMatch) {
    throw new Error("PHOTO_ID_MISMATCH");
  }

  // Score server-side using the same logic as daily/normal
  const photoResults = await scoreMatchGuesses(supabase, command.guesses);
  const totalScore = photoResults.reduce((sum, r) => sum + r.total_score, 0);

  // Insert submission
  const { data: submission, error: submitError } = await sb
    .from("match_submissions")
    .insert({
      match_id: match.id,
      user_id: requester.userId,
      anon_device_token: requester.userId ? null : requester.deviceToken,
      nickname: command.nickname,
      total_score: totalScore,
      total_time_ms: command.total_time_ms,
    })
    .select("id, submitted_at")
    .single();

  if (submitError) {
    if (submitError.code === "23505") {
      throw new DuplicateMatchSubmissionError();
    }
    throw submitError;
  }

  // Persist per-photo guesses for the comparison view
  const guessRows = command.guesses.map((guess) => {
    const result = photoResults.find((r) => r.photo_id === guess.photo_id);
    if (!result) throw new Error(`Score not found for ${guess.photo_id}`);
    return {
      submission_id: submission.id,
      photo_id: guess.photo_id,
      position: photoPositionById.get(guess.photo_id) ?? 0,
      guessed_lat: guess.guessed_lat,
      guessed_lon: guess.guessed_lon,
      km_error: result.km_error,
      location_score: result.location_score,
      total_score: result.total_score,
    };
  });

  const { error: guessesError } = await sb.from("match_guesses").insert(guessRows);
  if (guessesError) {
    // Roll back the submission row so the player can retry without 409.
    await sb.from("match_submissions").delete().eq("id", submission.id);
    throw guessesError;
  }

  return {
    submission_id: submission.id,
    total_score: totalScore,
    total_time_ms: command.total_time_ms,
    photos: photoResults,
  };
}

/**
 * Score N guesses using the photos table. Same logic as daily/normal but
 * inlined here to avoid a circular import on submissions.service.
 */
async function scoreMatchGuesses(supabase: SupabaseClient, guesses: GuessDTO[]): Promise<PhotoScoreResultDTO[]> {
  const photoIds = guesses.map((g) => g.photo_id);

  const { data: photos, error } = await supabase
    .from("photos")
    .select("id, lat, lon, description, place, license, credit, photo_url")
    .in("id", photoIds);

  if (error) throw error;
  if (!photos || photos.length !== new Set(photoIds).size) {
    throw new Error("INVALID_PHOTO_IDS");
  }

  return guesses.map((guess) => {
    const correctPhoto = photos.find((p) => p.id === guess.photo_id);
    if (!correctPhoto) throw new Error(`Photo not found: ${guess.photo_id}`);

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
      more_info: [],
      license: correctPhoto.license,
      credit: correctPhoto.credit,
    };
  });
}

/**
 * Returns the comparison view payload. The caller MUST have submitted to
 * this match — otherwise NotAMatchParticipantError is thrown so we don't
 * leak photo answers to non-participants.
 */
export async function getMatchResults(
  supabase: SupabaseClient,
  code: string,
  requester: RequesterIdentity
): Promise<MatchResultsResponseDTO> {
  const sb = relax(supabase);
  const upperCode = code.toUpperCase();

  const { data: match, error: matchError } = await sb
    .from("matches")
    .select("id, code, created_at, expires_at, status")
    .eq("code", upperCode)
    .maybeSingle();

  if (matchError) throw matchError;
  if (!match) throw new MatchNotFoundError();

  const requesterHasSubmitted = await hasSubmittedToMatch(supabase, match.id, requester);
  if (!requesterHasSubmitted) {
    throw new NotAMatchParticipantError();
  }

  // Fetch photos with answers
  const { data: photoRows, error: photosError } = await sb
    .from("match_photos")
    .select("position, photo_id, photos!inner(id, photo_url, place, tags, lat, lon, description, license, credit)")
    .eq("match_id", match.id)
    .order("position", { ascending: true });

  if (photosError) throw photosError;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const photos: MatchPhotoWithAnswerDTO[] = (photoRows ?? []).map((row: any) => ({
    photo_id: row.photos.id,
    position: row.position,
    photo_url: row.photos.photo_url,
    place: row.photos.place,
    tags: row.photos.tags,
    correct_lat: row.photos.lat,
    correct_lon: row.photos.lon,
    description: row.photos.description,
    license: row.photos.license,
    credit: row.photos.credit,
  }));

  // Fetch all submissions for this match, ordered by leaderboard
  const { data: submissions, error: submissionsError } = await sb
    .from("match_submissions")
    .select("id, user_id, anon_device_token, nickname, total_score, total_time_ms, submitted_at")
    .eq("match_id", match.id)
    .order("total_score", { ascending: false })
    .order("total_time_ms", { ascending: true })
    .order("submitted_at", { ascending: true });

  if (submissionsError) throw submissionsError;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const submissionIds: string[] = (submissions ?? []).map((s: any) => s.id);

  // Fetch all guesses across submissions in one query
  const { data: guesses, error: guessesError } = submissionIds.length
    ? await sb
        .from("match_guesses")
        .select("submission_id, photo_id, position, guessed_lat, guessed_lon, km_error, total_score")
        .in("submission_id", submissionIds)
        .order("position", { ascending: true })
    : { data: [], error: null };

  if (guessesError) throw guessesError;

  const guessesBySubmission = new Map<string, MatchPlayerGuessDTO[]>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (guesses ?? []).forEach((g: any) => {
    const list = guessesBySubmission.get(g.submission_id) ?? [];
    list.push({
      photo_id: g.photo_id,
      position: g.position,
      guessed_lat: g.guessed_lat,
      guessed_lon: g.guessed_lon,
      km_error: g.km_error,
      total_score: g.total_score,
    });
    guessesBySubmission.set(g.submission_id, list);
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const players: MatchPlayerSummaryDTO[] = (submissions ?? []).map((s: any) => {
    const isSelf =
      (requester.userId !== null && s.user_id === requester.userId) ||
      (requester.userId === null && requester.deviceToken !== null && s.anon_device_token === requester.deviceToken);

    return {
      submission_id: s.id,
      nickname: s.nickname,
      is_self: isSelf,
      total_score: s.total_score,
      total_time_ms: s.total_time_ms,
      submitted_at: s.submitted_at,
      per_photo: guessesBySubmission.get(s.id) ?? [],
    };
  });

  return {
    match_id: match.id,
    code: match.code,
    status: deriveStatus(match.expires_at, match.status),
    created_at: match.created_at,
    expires_at: match.expires_at,
    photos,
    players,
  };
}
