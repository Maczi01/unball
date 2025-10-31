import { test, expect } from "@playwright/test";
import { HomePage } from "./page-objects/HomePage";

/**
 * Home Page E2E Tests
 * Following Playwright guidelines:
 * - Page Object Model in ./e2e/page-objects
 * - data-testid selectors for resilient element selection
 * - Browser contexts for test isolation
 * - Arrange, Act, Assert pattern
 */
test.describe("Home Page", () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    // Arrange: Initialize page object and navigate
    homePage = new HomePage(page);
    await homePage.open();
  });

  test("should display home page correctly", async () => {
    // Arrange: Page is already loaded in beforeEach

    // Act: Get page state
    const isLoaded = await homePage.isLoaded();
    const headingText = await homePage.getHeadingText();

    // Assert: Verify page is loaded with correct content
    expect(isLoaded).toBe(true);
    expect(headingText).toContain("FootyGuess");
  });

  test("should have correct page title", async ({ page }) => {
    // Arrange: Page is already loaded in beforeEach

    // Act: (no action needed, checking initial state)

    // Assert: Verify page title
    await expect(page).toHaveTitle(/FootyGuess/i);
  });

  test("should navigate to normal mode when play button is clicked", async ({ page }) => {
    // Arrange: Page is already loaded in beforeEach

    // Act: Click play normal mode button
    await homePage.clickPlayNormal();

    // Assert: Should navigate to game page
    await expect(page).toHaveURL(/\/play\/normal/i);
  });

  test("should navigate to daily mode when daily button is clicked", async ({ page }) => {
    // Arrange: Page is already loaded in beforeEach

    // Act: Click play daily mode button
    await homePage.clickPlayDaily();

    // Assert: Should navigate to daily game page
    await expect(page).toHaveURL(/\/play\/daily/i);
  });

  test("should match visual snapshot", async ({ page }) => {
    // Arrange: Page is already loaded in beforeEach

    // Act: (no action needed, visual comparison)

    // Assert: Visual regression test
    await expect(page).toHaveScreenshot("home-page.png", {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test("should be responsive on mobile", async ({ page }) => {
    // Arrange: Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Act: Check if page loaded correctly
    const isLoaded = await homePage.isLoaded();

    // Assert: Page should be loaded and render correctly
    expect(isLoaded).toBe(true);
    await expect(page).toHaveScreenshot("home-page-mobile.png", {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });
});

test.describe("Home Page - Performance", () => {
  test("should load within 2 seconds", async ({ page }) => {
    // Arrange: Track start time
    const startTime = Date.now();

    // Act: Navigate to home page
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Assert: Load time should be under 2 seconds
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(2000);
  });
});
