import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Signup Page Object Model
 * Encapsulates interactions with the signup page
 * Following Playwright guidelines: data-testid selectors for resilient tests
 */
export class SignupPage extends BasePage {
  // Locators using data-testid convention
  private readonly signupForm: Locator;
  private readonly emailInput: Locator;
  private readonly nicknameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly confirmPasswordInput: Locator;
  private readonly submitButton: Locator;
  private readonly errorMessage: Locator;
  private readonly loginLink: Locator;
  private readonly guestLink: Locator;

  constructor(page: Page) {
    super(page);

    // Define locators using data-testid for resilient element selection
    this.signupForm = page.getByTestId("signup-form");
    this.emailInput = page.getByTestId("signup-email-input");
    this.nicknameInput = page.getByTestId("signup-nickname-input");
    this.passwordInput = page.getByTestId("signup-password-input");
    this.confirmPasswordInput = page.getByTestId("signup-confirm-password-input");
    this.submitButton = page.getByTestId("signup-submit-button");
    this.errorMessage = page.getByTestId("signup-error");
    this.loginLink = page.getByRole("link", { name: /log in/i });
    this.guestLink = page.getByRole("link", { name: /continue as guest/i });
  }

  /**
   * Navigate to signup page
   */
  async open() {
    await this.goto("/signup");
    await this.waitForPageLoad();
  }

  /**
   * Check if signup form is loaded
   */
  async isLoaded(): Promise<boolean> {
    return this.signupForm.isVisible();
  }

  /**
   * Fill email input
   */
  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  /**
   * Fill nickname input
   */
  async fillNickname(nickname: string) {
    await this.nicknameInput.fill(nickname);
  }

  /**
   * Fill password input
   */
  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  /**
   * Fill confirm password input
   */
  async fillConfirmPassword(password: string) {
    await this.confirmPasswordInput.fill(password);
  }

  /**
   * Click submit button
   */
  async clickSubmit() {
    await this.submitButton.click();
  }

  /**
   * Perform complete signup action
   * @param email - User email
   * @param password - User password
   * @param nickname - Optional nickname
   */
  async signup(email: string, password: string, nickname?: string) {
    await this.fillEmail(email);
    if (nickname) {
      await this.fillNickname(nickname);
    }
    await this.fillPassword(password);
    await this.fillConfirmPassword(password);
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
   * Click on login link
   */
  async goToLogin() {
    await this.loginLink.click();
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
