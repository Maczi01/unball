import type { APIRoute } from "astro";
import type { PhotoScoreResultDTO } from "@/types";
import { calculateDistance, calculateLocationScore, calculateTimeScore } from "@/lib/utils/scoreCalculation";

export const prerender = false;

/**
 * POST /api/photos/{photo_id}/score
 * Calculates score for a single photo guess
 *
 * @returns 200 - Score result with revealed answer
 * @returns 400 - Invalid guess data
 * @returns 404 - Photo not found
 * @returns 500 - Server error
 */
export const POST: APIRoute = async ({ params, request, locals }) => {
	try {
		const { photo_id } = params;

		if (!photo_id) {
			return new Response(
				JSON.stringify({
					error: "Photo ID is required",
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
		const body = await request.json();
		const { guessed_lat, guessed_lon, guessed_year } = body;

		// Validate input
		if (
			typeof guessed_lat !== "number" ||
			typeof guessed_lon !== "number" ||
			typeof guessed_year !== "number"
		) {
			return new Response(
				JSON.stringify({
					error: "Invalid guess data",
					details: ["guessed_lat, guessed_lon, and guessed_year must be numbers"],
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

		// TODO: Fetch actual photo data from database
		// For now, return mock correct answer
		const correctAnswers: Record<string, { lat: number; lon: number; year: number; event_name: string; description: string; source_url: string | null }> = {
			photo_1: {
				lat: 41.38,
				lon: 2.17,
				year: 2015,
				event_name: "Champions League Final",
				description: "FC Barcelona vs Juventus at Camp Nou",
				source_url: "https://www.youtube.com/watch?v=example1",
			},
			photo_2: {
				lat: -22.97,
				lon: -43.17,
				year: 2014,
				event_name: "World Cup Final",
				description: "Germany vs Argentina at Maracanã Stadium",
				source_url: "https://www.youtube.com/watch?v=example2",
			},
			photo_3: {
				lat: 51.48,
				lon: -0.19,
				year: 2018,
				event_name: "FA Cup Final",
				description: "Chelsea vs Manchester United at Wembley Stadium",
				source_url: "https://www.youtube.com/watch?v=example3",
			},
			photo_4: {
				lat: 40.45,
				lon: -3.69,
				year: 2016,
				event_name: "El Clásico",
				description: "Real Madrid vs Barcelona at Santiago Bernabéu",
				source_url: "https://www.youtube.com/watch?v=example4",
			},
			photo_5: {
				lat: -34.54,
				lon: -58.45,
				year: 2021,
				event_name: "Copa America Final",
				description: "Argentina vs Brazil at Estadio Maracanã",
				source_url: "https://www.youtube.com/watch?v=example5",
			},
		};

		const correctAnswer = correctAnswers[photo_id];

		if (!correctAnswer) {
			return new Response(
				JSON.stringify({
					error: "Photo not found",
					timestamp: new Date().toISOString(),
				}),
				{
					status: 404,
					headers: {
						"Content-Type": "application/json",
					},
				},
			);
		}

		// Calculate score
		const kmError = calculateDistance(
			guessed_lat,
			guessed_lon,
			correctAnswer.lat,
			correctAnswer.lon,
		);

		const yearError = Math.abs(guessed_year - correctAnswer.year);
		const locationScore = calculateLocationScore(kmError);
		const timeScore = calculateTimeScore(yearError);
		const totalScore = locationScore + timeScore;

		const result: PhotoScoreResultDTO = {
			photo_id,
			location_score: locationScore,
			time_score: timeScore,
			total_score: totalScore,
			km_error: Math.round(kmError * 10) / 10,
			year_error: yearError,
			correct_lat: correctAnswer.lat,
			correct_lon: correctAnswer.lon,
			correct_year: correctAnswer.year,
			event_name: correctAnswer.event_name,
			description: correctAnswer.description,
			source_url: correctAnswer.source_url,
			license: "CC BY 4.0",
			credit: "Mock Photo Credit",
		};

		return new Response(JSON.stringify(result), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
			},
		});
	} catch (error) {
		console.error("[POST /api/photos/:photo_id/score] Error:", error);

		return new Response(
			JSON.stringify({
				error: "Failed to calculate score",
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
