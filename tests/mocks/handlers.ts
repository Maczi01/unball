import { http, HttpResponse } from 'msw';

/**
 * Mock Service Worker (MSW) handlers for API mocking
 * Add your API endpoint mocks here
 */
export const handlers = [
  // Example: Mock health check endpoint
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'ok' });
  }),

  // Example: Mock photos endpoint
  http.get('/api/photos', () => {
    return HttpResponse.json({
      photos: [
        {
          id: 1,
          url: 'https://example.com/photo1.jpg',
          location: { lat: 51.5074, lng: -0.1278 },
          year: 1966,
          description: 'Test photo 1',
        },
      ],
    });
  }),

  // Example: Mock score submission
  http.post('/api/scores', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      score: body,
    });
  }),

  // Add more handlers as needed for your API endpoints
];
