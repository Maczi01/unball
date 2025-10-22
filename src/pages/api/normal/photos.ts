import type { APIRoute } from "astro";
import type { NormalRoundResponseDTO } from "@/types";

export const prerender = false;

/**
 * GET /api/normal/photos
 * Retrieves 5 random photos for Normal mode practice
 *
 * @returns 200 - Random photo set with round ID
 * @returns 500 - Server error
 */
export const GET: APIRoute = async ({ locals }) => {
	try {
		// TODO: Implement actual random photo selection from database
		// For now, return mock data for UI testing
		const mockData: NormalRoundResponseDTO = {
			round_id: `round_${Date.now()}`,
			photos: [
				{
					id: "photo_1",
					photo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Jogo_no_Est%C3%A1dio_do_Maracan%C3%A3%2C_antes_da_Copa_do_Mundo_de_1950.tif/lossy-page1-1280px-Jogo_no_Est%C3%A1dio_do_Maracan%C3%A3%2C_antes_da_Copa_do_Mundo_de_1950.tif.jpg",
					thumbnail_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Jogo_no_Est%C3%A1dio_do_Maracan%C3%A3%2C_antes_da_Copa_do_Mundo_de_1950.tif/lossy-page1-1280px-Jogo_no_Est%C3%A1dio_do_Maracan%C3%A3%2C_antes_da_Copa_do_Mundo_de_1950.tif.jpg",
					competition: "Champions League",
					place: "Spain",
					tags: ["club", "european"],
				},
				{
					id: "photo_2",
					photo_url: "https://via.placeholder.com/800x600/9333ea/ffffff?text=Football+Photo+2",
					thumbnail_url: "https://via.placeholder.com/200x150/9333ea/ffffff?text=Photo+2",
					competition: "World Cup",
					place: "Brazil",
					tags: ["international", "tournament"],
				},
				{
					id: "photo_3",
					photo_url: "https://via.placeholder.com/800x600/10b981/ffffff?text=Football+Photo+3",
					thumbnail_url: "https://via.placeholder.com/200x150/10b981/ffffff?text=Photo+3",
					competition: "Premier League",
					place: "England",
					tags: ["club", "domestic"],
				},
				{
					id: "photo_4",
					photo_url: "https://via.placeholder.com/800x600/f59e0b/ffffff?text=Football+Photo+4",
					thumbnail_url: "https://via.placeholder.com/200x150/f59e0b/ffffff?text=Photo+4",
					competition: "La Liga",
					place: "Spain",
					tags: ["club", "domestic"],
				},
				{
					id: "photo_5",
					photo_url: "https://via.placeholder.com/800x600/ef4444/ffffff?text=Football+Photo+5",
					thumbnail_url: "https://via.placeholder.com/200x150/ef4444/ffffff?text=Photo+5",
					competition: "Copa America",
					place: "Argentina",
					tags: ["international", "tournament"],
				},
			],
		};

		return new Response(JSON.stringify(mockData), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
			},
		});
	} catch (error) {
		console.error("[GET /api/normal/photos] Error:", error);

		return new Response(
			JSON.stringify({
				error: "Failed to retrieve photos",
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
