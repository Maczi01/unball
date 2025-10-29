import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Home Page Object Model
 * Encapsulates interactions with the home page
 */
export class HomePage extends BasePage {
  // Locators - using resilient selectors
  private readonly heading: Locator;
  private readonly playNormalButton: Locator;
  private readonly playDailyButton: Locator;
  private readonly leaderboardLink: Locator;

  constructor(page: Page) {
    super(page);

    // Define locators using accessible selectors
    this.heading = page.getByRole('heading', { name: /FootyGuess Daily/i });
    this.playNormalButton = page.getByRole('button', { name: /play normal/i });
    this.playDailyButton = page.getByRole('button', { name: /play daily/i });
    this.leaderboardLink = page.getByRole('link', { name: /leaderboard/i });
  }

  /**
   * Navigate to home page
   */
  async open() {
    await this.goto('/');
    await this.waitForPageLoad();
  }

  /**
   * Check if home page is loaded
   */
  async isLoaded(): Promise<boolean> {
    return this.heading.isVisible();
  }

  /**
   * Click Play Normal Mode button
   */
  async clickPlayNormal() {
    await this.playNormalButton.click();
  }

  /**
   * Click Play Daily Mode button
   */
  async clickPlayDaily() {
    await this.playDailyButton.click();
  }

  /**
   * Navigate to leaderboard
   */
  async goToLeaderboard() {
    await this.leaderboardLink.click();
  }

  /**
   * Get the main heading text
   */
  async getHeadingText(): Promise<string> {
    return this.heading.textContent() || '';
  }
}
