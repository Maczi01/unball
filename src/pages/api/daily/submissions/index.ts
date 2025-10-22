import type { APIRoute } from "astro";
import type { DailySubmissionCommand, DailySubmissionResponseDTO, PhotoScoreResultDTO } from "@/types";
import { ValidationConstants } from "@/types";
import { calculateDistance, calculateLocationScore, calculateTimeScore } from "@/lib/utils/scoreCalculation";

export const prerender = false;

/**
 * POST /api/daily/submissions
 * Submits Daily challenge results to leaderboard
 *
 * @returns 200 - Submission confirmed with rank
 * @returns 400 - Invalid submission data
 * @returns 409 - Already submitted today
 * @returns 500 - Server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
	try {
		// Get device token from header
		const deviceToken = request.headers.get("X-Device-Token");

		if (!deviceToken) {
			return new Response(
				JSON.stringify({
					error: "Device token is required",
					timestamp: new Date().toISOString(),
				}),
				{
					status: 400,
					headers: {
						"Content-Type": "application/json",
					},
				},
			);
		}

		// Parse request body
		const body = (await request.json()) as DailySubmissionCommand;

		// Validate submission
		const { daily_set_id, date_utc, nickname, consent_given, guesses, total_time_ms } = body;

		// Validate nickname
		if (!ValidationConstants.NICKNAME.REGEX.test(nickname)) {
			return new Response(
				JSON.stringify({
					error: "Invalid nickname",
					code: "invalid_format",
					details: ["Nickname must contain only letters, numbers, spaces, hyphens, and underscores"],
					timestamp: new Date().toISOString(),
				}),
				{
					status: 400,
					headers: {
						"Content-Type": "application/json",
					},
				},
			);
		}

		if (nickname.length < ValidationConstants.NICKNAME.MIN_LENGTH || nickname.length > ValidationConstants.NICKNAME.MAX_LENGTH) {
			return new Response(
				JSON.stringify({
					error: "Invalid nickname length",
					details: [`Nickname must be between ${ValidationConstants.NICKNAME.MIN_LENGTH} and ${ValidationConstants.NICKNAME.MAX_LENGTH} characters`],
					timestamp: new Date().toISOString(),
				}),
				{
					status: 400,
					headers: {
						"Content-Type": "application/json",
					},
				},
			);
		}

		// Validate guesses
		if (!Array.isArray(guesses) || guesses.length !== ValidationConstants.DAILY_SET.PHOTO_COUNT) {
			return new Response(
				JSON.stringify({
					error: "Invalid guesses",
					details: [`Must provide exactly ${ValidationConstants.DAILY_SET.PHOTO_COUNT} guesses`],
					timestamp: new Date().toISOString(),
				}),
				{
					status: 400,
					headers: {
						"Content-Type": "application/json",
					},
				},
			);
		}

		// TODO: Check if already submitted
		// TODO: Fetch actual photo answers from database
		// TODO: Calculate scores server-side
		// TODO: Store submission in database
		// TODO: Calculate actual leaderboard rank

		// For now, return mock response
		const mockResults: PhotoScoreResultDTO[] = guesses.map((guess, index) => {
			// Mock correct answers (same as photo scoring endpoint)
			const mockAnswers = [
				{ lat: 41.38, lon: 2.17, year: 2015, event_name: "Champions League Final", description: "FC Barcelona vs Juventus" },
				{ lat: -22.97, lon: -43.17, year: 2014, event_name: "World Cup Final", description: "Germany vs Argentina" },
				{ lat: 51.48, lon: -0.19, year: 2018, event_name: "FA Cup Final", description: "Chelsea vs Manchester United" },
				{ lat: 40.45, lon: -3.69, year: 2016, event_name: "El Clásico", description: "Real Madrid vs Barcelona" },
				{ lat: -34.54, lon: -58.45, year: 2021, event_name: "Copa America Final", description: "Argentina vs Brazil" },
			];

			const correct = mockAnswers[index];
			const kmError = calculateDistance(guess.guessed_lat, guess.guessed_lon, correct.lat, correct.lon);
			const yearError = Math.abs(guess.guessed_year - correct.year);

			return {
				photo_id: guess.photo_id,
				location_score: calculateLocationScore(kmError),
				time_score: calculateTimeScore(yearError),
				total_score: calculateLocationScore(kmError) + calculateTimeScore(yearError),
				km_error: Math.round(kmError * 10) / 10,
				year_error: yearError,
				correct_lat: correct.lat,
				correct_lon: correct.lon,
				correct_year: correct.year,
				event_name: correct.event_name,
				description: correct.description,
				source_url: null,
				license: "CC BY 4.0",
				credit: "Mock Photo Credit",
			};
		});

		const totalScore = mockResults.reduce((sum, result) => sum + result.total_score, 0);

		const response: DailySubmissionResponseDTO = {
			submission_id: `sub_${Date.now()}`,
			total_score: totalScore,
			total_time_ms,
			leaderboard_rank: Math.floor(Math.random() * 50) + 1, // Mock rank 1-50
			photos: mockResults,
		};

		return new Response(JSON.stringify(response), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
			},
		});
	} catch (error) {
		console.error("[POST /api/daily/submissions] Error:", error);

		return new Response(
			JSON.stringify({
				error: "Failed to submit to leaderboard",
				timestamp: new Date().toISOString(),
			}),
			{
				status: 500,
				headers: {
					"Content-Type": "application/json",
				},
			},
		);
	}
};
