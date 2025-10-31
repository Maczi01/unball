import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Home Page Object Model
 * Encapsulates interactions with the home page
 * Following Playwright guidelines: data-testid selectors, browser contexts
 */
export class HomePage extends BasePage {
  // Locators using data-testid convention
  private readonly pageTitle: Locator;
  private readonly playNormalButton: Locator;
  private readonly playDailyButton: Locator;

  constructor(page: Page) {
    super(page);

    // Define locators using data-testid for resilient element selection
    this.pageTitle = page.getByTestId("page-title");
    this.playNormalButton = page.getByTestId("play-normal-button");
    this.playDailyButton = page.getByTestId("play-daily-button");
  }

  /**
   * Navigate to home page
   */
  async open() {
    await this.goto("/");
    await this.waitForPageLoad();
  }

  /**
   * Check if home page is loaded
   */
  async isLoaded(): Promise<boolean> {
    return this.pageTitle.isVisible();
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
   * Get the main heading text
   */
  async getHeadingText(): Promise<string> {
    return (await this.pageTitle.textContent()) || "";
  }
}
