import type { APIRoute } from 'astro';

import { getTodaysDailySet } from '@/lib/services/daily-sets.service';

export const prerender = false;

/**
 * GET /api/daily/sets/today
 * Retrieves today's published daily set with 5 photos
 *
 * @returns 200 - Daily set with photos
 * @returns 404 - No daily set published for today
 * @returns 500 - Server error
 */
export const GET: APIRoute = async ({ locals }) => {
	try {
		const dailySet = await getTodaysDailySet(locals.supabase);

		if (!dailySet) {
			return new Response(
				JSON.stringify({
					error: 'No daily set published for today',
					fallback: 'Try Normal mode instead',
					timestamp: new Date().toISOString(),
				}),
				{
					status: 404,
					headers: {
						'Content-Type': 'application/json',
					},
				},
			);
		}

		return new Response(JSON.stringify(dailySet), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
				'Cache-Control': 'public, max-age=300, s-maxage=300',
			},
		});
	} catch (error) {
		console.error('[GET /api/daily/sets/today] Error:', error);

		return new Response(
			JSON.stringify({
				error: 'Failed to retrieve daily set',
				timestamp: new Date().toISOString(),
			}),
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	}
};
