import { test, expect } from '@playwright/test';
import { HomePage } from './pages/HomePage';

/**
 * Example E2E test using Playwright and Page Object Model
 * Following guidelines: resilient locators, browser contexts, visual comparison
 */
test.describe('Home Page', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    // Initialize page object and navigate
    homePage = new HomePage(page);
    await homePage.open();
  });

  test('should display home page correctly', async () => {
    // Assert page is loaded
    const isLoaded = await homePage.isLoaded();
    expect(isLoaded).toBe(true);

    // Check heading text
    const headingText = await homePage.getHeadingText();
    expect(headingText).toContain('FootyGuess');
  });

  test('should have correct page title', async ({ page }) => {
    // Assert
    await expect(page).toHaveTitle(/FootyGuess/i);
  });

  test('should navigate to normal mode when play button is clicked', async ({ page }) => {
    // Act
    await homePage.clickPlayNormal();

    // Assert - should navigate to game page
    await expect(page).toHaveURL(/\/play\/normal/i);
  });

  test('should navigate to daily mode when daily button is clicked', async ({ page }) => {
    // Act
    await homePage.clickPlayDaily();

    // Assert - should navigate to daily game page
    await expect(page).toHaveURL(/\/play\/daily/i);
  });

  test('should navigate to leaderboard', async ({ page }) => {
    // Act
    await homePage.goToLeaderboard();

    // Assert
    await expect(page).toHaveURL(/\/leaderboard/i);
  });

  test('should match visual snapshot', async ({ page }) => {
    // Visual regression test
    await expect(page).toHaveScreenshot('home-page.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Assert page is still loaded correctly
    const isLoaded = await homePage.isLoaded();
    expect(isLoaded).toBe(true);

    // Visual test for mobile
    await expect(page).toHaveScreenshot('home-page-mobile.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });
});

test.describe('Home Page - Performance', () => {
  test('should load within 2 seconds', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Assert load time is under 2 seconds
    expect(loadTime).toBeLessThan(2000);
  });
});
