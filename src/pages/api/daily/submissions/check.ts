import type { APIRoute } from "astro";
import type { SubmissionCheckResponseDTO } from "@/types";

export const prerender = false;

/**
 * GET /api/daily/submissions/check
 * Checks if the user has already submitted today's Daily challenge
 *
 * @returns 200 - Submission status
 * @returns 400 - Missing device token
 * @returns 500 - Server error
 */
export const GET: APIRoute = async ({ request, locals }) => {
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

		// TODO: Check database for existing submission
		// For now, always return false (not submitted)
		const response: SubmissionCheckResponseDTO = {
			has_submitted: false,
			submission: null,
		};

		return new Response(JSON.stringify(response), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
			},
		});
	} catch (error) {
		console.error("[GET /api/daily/submissions/check] Error:", error);

		return new Response(
			JSON.stringify({
				error: "Failed to check submission status",
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
