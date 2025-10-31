import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Submit Photo Page Object Model
 * Encapsulates interactions with the submit photo page
 * Following Playwright guidelines: resilient selectors, browser contexts
 */
export class SubmitPhotoPage extends BasePage {
  // Locators for permission denied view
  private readonly permissionDeniedHeading: Locator;
  private readonly homeLink: Locator;

  constructor(page: Page) {
    super(page);

    // Permission denied view locators
    this.permissionDeniedHeading = page.getByRole("heading", { name: /permission required/i });
    this.homeLink = page.getByRole("link", { name: /go to home/i });
  }

  /**
   * Navigate to submit photo page
   */
  async open() {
    await this.goto("/submit-photo");
    await this.waitForPageLoad();
  }

  /**
   * Check if permission denied message is visible
   */
  async hasPermissionDenied(): Promise<boolean> {
    return this.permissionDeniedHeading.isVisible();
  }

  /**
   * Click on home link
   */
  async goToHome() {
    await this.homeLink.click();
  }

  /**
   * Check if user is redirected to login
   */
  async isRedirectedToLogin(): Promise<boolean> {
    await this.page.waitForURL(/\/login/);
    return this.page.url().includes("/login");
  }
}
