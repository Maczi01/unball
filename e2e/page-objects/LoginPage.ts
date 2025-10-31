import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Login Page Object Model
 * Encapsulates interactions with the login page
 * Following Playwright guidelines: data-testid selectors for resilient tests
 */
export class LoginPage extends BasePage {
  // Locators using data-testid convention
  private readonly loginForm: Locator;
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly submitButton: Locator;
  private readonly errorMessage: Locator;
  private readonly signupLink: Locator;
  private readonly guestLink: Locator;

  constructor(page: Page) {
    super(page);

    // Define locators using data-testid for resilient element selection
    this.loginForm = page.getByTestId("login-form");
    this.emailInput = page.getByTestId("login-email-input");
    this.passwordInput = page.getByTestId("login-password-input");
    this.submitButton = page.getByTestId("login-submit-button");
    this.errorMessage = page.getByTestId("login-error");
    this.signupLink = page.getByRole("link", { name: /sign up/i });
    this.guestLink = page.getByRole("link", { name: /continue as guest/i });
  }

  /**
   * Navigate to login page
   */
  async open() {
    await this.goto("/login");
    await this.waitForPageLoad();
  }

  /**
   * Navigate to login page with redirect URL
   */
  async openWithRedirect(redirectUrl: string) {
    await this.goto(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
    await this.waitForPageLoad();
  }

  /**
   * Check if login form is loaded
   */
  async isLoaded(): Promise<boolean> {
    return this.loginForm.isVisible();
  }

  /**
   * Fill email input
   */
  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  /**
   * Fill password input
   */
  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  /**
   * Click submit button
   */
  async clickSubmit() {
    await this.submitButton.click();
  }

  /**
   * Perform complete login action
   * @param email - User email
   * @param password - User password
   */
  async login(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickSubmit();
  }

  /**
   * Check if error message is visible
   */
  async hasError(): Promise<boolean> {
    return this.errorMessage.isVisible();
  }

  /**
   * Get error message text
   */
  async getErrorText(): Promise<string> {
    return (await this.errorMessage.textContent()) || "";
  }

  /**
   * Click on sign up link
   */
  async goToSignup() {
    await this.signupLink.click();
  }

  /**
   * Click on continue as guest link
   */
  async continueAsGuest() {
    await this.guestLink.click();
  }

  /**
   * Check if submit button is disabled
   */
  async isSubmitDisabled(): Promise<boolean> {
    return this.submitButton.isDisabled();
  }
}
