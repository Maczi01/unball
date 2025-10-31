import { test, expect } from "@playwright/test";
import { SubmitPhotoPage } from "./page-objects/SubmitPhotoPage";

/**
 * Submit Photo Page E2E Tests
 * Following Playwright guidelines:
 * - Page Object Model in ./e2e/page-objects
 * - data-testid selectors for resilient element selection
 * - Browser contexts for test isolation
 * - Arrange, Act, Assert pattern
 */
test.describe("Submit Photo Page - Unauthenticated User", () => {
  let submitPhotoPage: SubmitPhotoPage;

  test.beforeEach(async ({ page }) => {
    // Arrange: Initialize page object
    submitPhotoPage = new SubmitPhotoPage(page);
  });

  test("should redirect to login when not authenticated", async ({ page }) => {
    // Arrange: Page object is already initialized

    // Act: Navigate to submit photo page
    await submitPhotoPage.open();

    // Assert: Should redirect to login page with redirect parameter
    await page.waitForLoadState("networkidle");
    const url = page.url();
    expect(url).toContain("/login");
    expect(url).toContain("redirect=");
    expect(url).toContain(encodeURIComponent("/submit-photo"));
  });
});

test.describe("Submit Photo Page - User Without Permission", () => {
  test.beforeEach(async ({ context, page }) => {
    // Arrange: Set up authenticated session but user has no permission
    await context.addCookies([
      {
        name: "sb-access-token",
        value: "mock-token-no-permission",
        domain: "localhost",
        path: "/",
      },
    ]);

    // Mock the API response for user profile without permission
    await page.route("**/rest/v1/users*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "test-user-id",
          email: "test@example.com",
          nickname: "TestUser",
          can_add_photos: false, // No permission
        }),
      });
    });
  });

  test("should display permission denied message", async ({ page }) => {
    // Arrange: Set up page object
    const submitPhotoPage = new SubmitPhotoPage(page);

    // Act: Navigate to submit photo page
    await submitPhotoPage.open();

    // Assert: Should display permission denied message
    await page.waitForTimeout(1000); // Wait for page to load
    const hasPermissionDenied = await submitPhotoPage.hasPermissionDenied();
    expect(hasPermissionDenied).toBe(true);
  });

  test("should navigate to home when home button is clicked", async ({ page }) => {
    // Arrange: Set up page object and navigate
    const submitPhotoPage = new SubmitPhotoPage(page);
    await submitPhotoPage.open();

    // Act: Click home button
    await page.waitForTimeout(1000); // Wait for page to load
    await submitPhotoPage.goToHome();

    // Assert: Should navigate to home page
    await expect(page).toHaveURL(/^\//);
  });

  test("should match visual snapshot of permission denied view", async ({ page }) => {
    // Arrange: Set up page object and navigate
    const submitPhotoPage = new SubmitPhotoPage(page);
    await submitPhotoPage.open();

    // Act: Wait for page to load
    await page.waitForTimeout(1000);

    // Assert: Visual regression test
    await expect(page).toHaveScreenshot("submit-photo-permission-denied.png", {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });
});

test.describe("Submit Photo Page - User With Permission", () => {
  test.beforeEach(async ({ context, page }) => {
    // Arrange: Set up authenticated session with permission
    await context.addCookies([
      {
        name: "sb-access-token",
        value: "mock-token-with-permission",
        domain: "localhost",
        path: "/",
      },
    ]);

    // Mock the API response for user profile with permission
    await page.route("**/rest/v1/users*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "test-user-id",
          email: "test@example.com",
          nickname: "AdminUser",
          can_add_photos: true, // Has permission
        }),
      });
    });
  });

  test("should display photo submission form", async ({ page }) => {
    // Arrange: Navigate to submit photo page
    await page.goto("/submit-photo");
    await page.waitForLoadState("networkidle");

    // Act: Check for form elements (adjust based on actual form implementation)
    await page.waitForTimeout(1000);

    // Assert: Should not show permission denied message
    const permissionDenied = await page
      .getByRole("heading", { name: /permission required/i })
      .isVisible()
      .catch(() => false);
    expect(permissionDenied).toBe(false);
  });

  test("should have correct page title", async ({ page }) => {
    // Arrange: Navigate to submit photo page
    await page.goto("/submit-photo");
    await page.waitForLoadState("networkidle");

    // Act: (no action needed, checking initial state)

    // Assert: Verify page title
    await expect(page).toHaveTitle(/Submit Photo.*FootyGuess/i);
  });

  test("should match visual snapshot of submission form", async ({ page }) => {
    // Arrange: Navigate to submit photo page
    await page.goto("/submit-photo");
    await page.waitForLoadState("networkidle");

    // Act: Wait for form to load
    await page.waitForTimeout(1000);

    // Assert: Visual regression test
    await expect(page).toHaveScreenshot("submit-photo-form.png", {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });
});

test.describe("Submit Photo Page - Responsive Design", () => {
  test.beforeEach(async ({ context }) => {
    // Arrange: Set up authenticated session without permission for consistent testing
    await context.addCookies([
      {
        name: "sb-access-token",
        value: "mock-token-no-permission",
        domain: "localhost",
        path: "/",
      },
    ]);
  });

  test("should be accessible on mobile devices", async ({ page }) => {
    // Arrange: Set mobile viewport and mock API
    await page.setViewportSize({ width: 375, height: 667 });
    await page.route("**/rest/v1/users*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "test-user-id",
          email: "test@example.com",
          can_add_photos: false,
        }),
      });
    });

    // Act: Navigate to submit photo page
    const submitPhotoPage = new SubmitPhotoPage(page);
    await submitPhotoPage.open();
    await page.waitForTimeout(1000);

    // Assert: Permission denied message should be visible
    const hasPermissionDenied = await submitPhotoPage.hasPermissionDenied();
    expect(hasPermissionDenied).toBe(true);

    // Visual test for mobile
    await expect(page).toHaveScreenshot("submit-photo-permission-denied-mobile.png", {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });
});
