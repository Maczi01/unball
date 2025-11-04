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

  // Form field locators
  private readonly eventNameInput: Locator;
  private readonly yearInput: Locator;
  private readonly licenseInput: Locator;
  private readonly creditInput: Locator;
  private readonly competitionInput: Locator;
  private readonly placeInput: Locator;
  private readonly descriptionTextarea: Locator;
  private readonly notesTextarea: Locator;
  private readonly emailInput: Locator;
  private readonly submitButton: Locator;
  private readonly cancelButton: Locator;

  // Sources section locators
  private readonly addSourceButton: Locator;

  // More info section locators
  private readonly addInfoButton: Locator;

  constructor(page: Page) {
    super(page);

    // Permission denied view locators
    this.permissionDeniedHeading = page.getByRole("heading", { name: /permission required/i });
    this.homeLink = page.getByRole("link", { name: /go to home/i });

    // Form field locators
    this.eventNameInput = page.getByLabel(/event name/i);
    this.yearInput = page.getByLabel(/^year/i);
    this.licenseInput = page.getByLabel(/^license/i);
    this.creditInput = page.getByLabel(/credit.*photographer/i);
    this.competitionInput = page.getByLabel(/competition/i);
    this.placeInput = page.getByLabel(/place.*location name/i);
    this.descriptionTextarea = page.getByLabel(/^description/i);
    this.notesTextarea = page.getByLabel(/notes for moderators/i);
    this.emailInput = page.getByLabel(/your email/i);
    this.submitButton = page.getByRole("button", { name: /submit photo/i });
    this.cancelButton = page.getByRole("button", { name: /cancel/i });

    // Sources and More Info buttons
    this.addSourceButton = page.getByRole("button", { name: /add source/i });
    this.addInfoButton = page.getByRole("button", { name: /add info/i });
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

  /**
   * Fill in basic event details
   */
  async fillEventDetails(eventName: string, year: number) {
    await this.eventNameInput.fill(eventName);
    await this.yearInput.fill(year.toString());
  }

  /**
   * Fill in licensing information
   */
  async fillLicenseInfo(license: string, credit: string) {
    await this.licenseInput.fill(license);
    await this.creditInput.fill(credit);
  }

  /**
   * Fill optional fields
   */
  async fillOptionalFields(options: { competition?: string; place?: string; description?: string; notes?: string; email?: string }) {
    if (options.competition) await this.competitionInput.fill(options.competition);
    if (options.place) await this.placeInput.fill(options.place);
    if (options.description) await this.descriptionTextarea.fill(options.description);
    if (options.notes) await this.notesTextarea.fill(options.notes);
    if (options.email) await this.emailInput.fill(options.email);
  }

  /**
   * Add a photo source
   */
  async addSource(url: string, title?: string, sourceType?: string) {
    await this.addSourceButton.click();

    // Get the last source input group (most recently added)
    const sourceInputs = this.page.locator('[id^="source-url-"]');
    const count = await sourceInputs.count();
    const index = count - 1;

    await this.page.locator(`[id="source-url-${index}"]`).fill(url);
    if (title) {
      await this.page.locator(`[id="source-title-${index}"]`).fill(title);
    }
    if (sourceType) {
      await this.page.locator(`[id="source-type-${index}"]`).click();
      await this.page.getByRole("option", { name: sourceType }).click();
    }
  }

  /**
   * Add additional info (YouTube, article, etc.)
   */
  async addMoreInfo(infoType: string, url: string, title?: string, description?: string) {
    await this.addInfoButton.click();

    // Get the last info input group (most recently added)
    const infoInputs = this.page.locator('[id^="info-url-"]');
    const count = await infoInputs.count();
    const index = count - 1;

    // Select info type
    await this.page.locator(`[id="info-type-${index}"]`).click();
    await this.page.getByRole("option", { name: infoType }).click();

    await this.page.locator(`[id="info-url-${index}"]`).fill(url);
    if (title) {
      await this.page.locator(`[id="info-title-${index}"]`).fill(title);
    }
    if (description) {
      await this.page.locator(`[id="info-description-${index}"]`).fill(description);
    }
  }

  /**
   * Submit the form
   */
  async submit() {
    await this.submitButton.click();
  }

  /**
   * Cancel the form
   */
  async cancel() {
    await this.cancelButton.click();
  }
}
