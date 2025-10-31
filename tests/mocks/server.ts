import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/**
 * Mock Service Worker server setup for Node.js tests
 * This sets up request interception for unit and integration tests
 */
export const server = setupServer(...handlers);

// Enable API mocking before tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: "warn" });
});

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
});

// Clean up after tests
afterAll(() => {
  server.close();
});
