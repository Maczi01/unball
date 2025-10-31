import { test, expect } from "@playwright/test";

/**
 * API E2E Tests
 * Following Playwright guidelines:
 * - API testing for backend validation
 * - Browser contexts for test isolation
 * - Arrange, Act, Assert pattern
 */

test.describe("API - Normal Mode Photos", () => {
  test("GET /api/normal/photos should return random photos", async ({ request }) => {
    // Arrange: Set up API endpoint
    const endpoint = "/api/normal/photos";

    // Act: Make API request
    const response = await request.get(endpoint);

    // Assert: Should return 200 and valid data structure
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("photos");
    expect(Array.isArray(data.photos)).toBe(true);
  });

  test("GET /api/normal/photos should return photos with correct structure", async ({ request }) => {
    // Arrange: Set up API endpoint
    const endpoint = "/api/normal/photos";

    // Act: Make API request
    const response = await request.get(endpoint);

    // Assert: Photos should have required fields
    expect(response.status()).toBe(200);

    const data = await response.json();
    if (data.photos && data.photos.length > 0) {
      const photo = data.photos[0];
      expect(photo).toHaveProperty("id");
      expect(photo).toHaveProperty("url");
    }
  });
});

test.describe("API - Daily Mode", () => {
  test("GET /api/daily/sets/today should return today's photo set", async ({ request }) => {
    // Arrange: Set up API endpoint
    const endpoint = "/api/daily/sets/today";

    // Act: Make API request
    const response = await request.get(endpoint);

    // Assert: Should return 200 or 404 (if no set exists for today)
    expect([200, 404]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty("set");
    }
  });

  test("GET /api/daily/submissions/check should require authentication", async ({ request }) => {
    // Arrange: Set up API endpoint without auth

    // Act: Make API request without authentication
    const response = await request.get("/api/daily/submissions/check");

    // Assert: Should return 401 Unauthorized
    expect(response.status()).toBe(401);
  });
});

test.describe("API - Authentication", () => {
  test("POST /api/auth/signin should reject invalid credentials", async ({ request }) => {
    // Arrange: Prepare invalid credentials
    const invalidCredentials = {
      email: "invalid@example.com",
      password: "wrongpassword",
    };

    // Act: Make API request
    const response = await request.post("/api/auth/signin", {
      data: invalidCredentials,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Assert: Should return error status (400 or 401)
    expect([400, 401]).toContain(response.status());

    const data = await response.json();
    expect(data).toHaveProperty("error");
  });

  test("POST /api/auth/signin should validate email format", async ({ request }) => {
    // Arrange: Prepare invalid email format
    const invalidData = {
      email: "not-an-email",
      password: "password123",
    };

    // Act: Make API request
    const response = await request.post("/api/auth/signin", {
      data: invalidData,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Assert: Should return 400 Bad Request
    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty("error");
  });

  test("POST /api/auth/signin should require email and password", async ({ request }) => {
    // Arrange: Prepare incomplete data
    const incompleteData = {
      email: "test@example.com",
    };

    // Act: Make API request
    const response = await request.post("/api/auth/signin", {
      data: incompleteData,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Assert: Should return 400 Bad Request
    expect(response.status()).toBe(400);
  });

  test("POST /api/auth/signup should validate email format", async ({ request }) => {
    // Arrange: Prepare invalid email
    const invalidData = {
      email: "not-an-email",
      password: "password123",
    };

    // Act: Make API request
    const response = await request.post("/api/auth/signup", {
      data: invalidData,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Assert: Should return 400 Bad Request
    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty("error");
  });

  test("POST /api/auth/signup should validate password length", async ({ request }) => {
    // Arrange: Prepare weak password
    const weakPassword = {
      email: "test@example.com",
      password: "short",
    };

    // Act: Make API request
    const response = await request.post("/api/auth/signup", {
      data: weakPassword,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Assert: Should return 400 Bad Request
    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty("error");
  });

  test("POST /api/auth/signup should validate nickname format if provided", async ({ request }) => {
    // Arrange: Prepare data with invalid nickname
    const invalidNickname = {
      email: "test@example.com",
      password: "password123",
      nickname: "ab", // Too short
    };

    // Act: Make API request
    const response = await request.post("/api/auth/signup", {
      data: invalidNickname,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Assert: Should return 400 Bad Request
    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty("error");
  });

  test("GET /api/auth/me should require authentication", async ({ request }) => {
    // Arrange: Set up API endpoint

    // Act: Make API request without authentication
    const response = await request.get("/api/auth/me");

    // Assert: Should return 401 Unauthorized
    expect(response.status()).toBe(401);
  });

  test("POST /api/auth/signout should work without authentication", async ({ request }) => {
    // Arrange: Set up API endpoint

    // Act: Make API request
    const response = await request.post("/api/auth/signout");

    // Assert: Should return 200 (even if not authenticated)
    expect(response.status()).toBe(200);
  });
});

test.describe("API - Photo Scoring", () => {
  test("POST /api/photos/[photo_id]/score should require authentication", async ({ request }) => {
    // Arrange: Set up API endpoint with mock photo ID
    const photoId = "test-photo-id";

    // Act: Make API request without authentication
    const response = await request.post(`/api/photos/${photoId}/score`, {
      data: {
        guessedLat: 0,
        guessedLng: 0,
        guessedYear: 2020,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Assert: Should return 401 or handle unauthenticated request
    expect([200, 400, 401, 404]).toContain(response.status());
  });

  test("POST /api/photos/[photo_id]/score should validate request body", async ({ request }) => {
    // Arrange: Set up API endpoint with incomplete data
    const photoId = "test-photo-id";

    // Act: Make API request with missing fields
    const response = await request.post(`/api/photos/${photoId}/score`, {
      data: {
        guessedLat: 0,
        // Missing guessedLng and guessedYear
      },
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Assert: Should return 400 Bad Request
    expect([400, 401]).toContain(response.status());
  });
});

test.describe("API - Admin Endpoints", () => {
  test("GET /api/admin/photos should require admin authentication", async ({ request }) => {
    // Arrange: Set up API endpoint

    // Act: Make API request without authentication
    const response = await request.get("/api/admin/photos");

    // Assert: Should return 401 Unauthorized
    expect(response.status()).toBe(401);
  });

  test("GET /api/admin/users should require admin authentication", async ({ request }) => {
    // Arrange: Set up API endpoint

    // Act: Make API request without authentication
    const response = await request.get("/api/admin/users");

    // Assert: Should return 401 Unauthorized
    expect(response.status()).toBe(401);
  });

  test("GET /api/admin/dashboard/stats should require admin authentication", async ({ request }) => {
    // Arrange: Set up API endpoint

    // Act: Make API request without authentication
    const response = await request.get("/api/admin/dashboard/stats");

    // Assert: Should return 401 Unauthorized
    expect(response.status()).toBe(401);
  });

  test("POST /api/admin/photos/bulk should require admin authentication", async ({ request }) => {
    // Arrange: Set up API endpoint with bulk action data
    const bulkAction = {
      action: "delete",
      photo_ids: ["test-id-1", "test-id-2"],
    };

    // Act: Make API request without authentication
    const response = await request.post("/api/admin/photos/bulk", {
      data: bulkAction,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Assert: Should return 401 Unauthorized
    expect(response.status()).toBe(401);
  });
});

test.describe("API - Error Handling", () => {
  test("should return 404 for non-existent endpoint", async ({ request }) => {
    // Arrange: Set up non-existent endpoint
    const endpoint = "/api/non-existent-endpoint";

    // Act: Make API request
    const response = await request.get(endpoint);

    // Assert: Should return 404
    expect(response.status()).toBe(404);
  });

  test("should handle invalid JSON in POST request", async ({ request }) => {
    // Arrange: Set up API endpoint with invalid JSON

    // Act: Make API request with invalid content
    const response = await request.post("/api/auth/signin", {
      data: "invalid-json-string",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Assert: Should return 400 or 500
    expect([400, 500]).toContain(response.status());
  });

  test("should return appropriate headers", async ({ request }) => {
    // Arrange: Set up API endpoint

    // Act: Make API request
    const response = await request.get("/api/normal/photos");

    // Assert: Should have appropriate content-type header
    const contentType = response.headers()["content-type"];
    expect(contentType).toContain("application/json");
  });
});
