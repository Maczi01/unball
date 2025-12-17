import type { SupabaseClient } from "@/db/supabase.client";

interface ContactSubmission {
  email: string;
  topic: string;
  message: string;
  ip_address?: string;
  user_agent?: string;
}

interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
  reason?: string;
}

const RATE_LIMITS = {
  MAX_MESSAGES_PER_IP_PER_DAY: 5,
  MAX_MESSAGES_PER_EMAIL_PER_HOUR: 2,
  COOLDOWN_HOURS: 24,
  EMAIL_COOLDOWN_HOURS: 1,
};

export class ContactService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Check if the IP address has exceeded rate limits
   */
  async checkIPRateLimit(ipAddress: string): Promise<RateLimitResult> {
    // Check submissions from this IP in the last 24 hours
    const oneDayAgo = new Date(Date.now() - RATE_LIMITS.COOLDOWN_HOURS * 60 * 60 * 1000);

    const { data, error } = await this.supabase
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      .from("contact_submissions")
      .select("id, created_at")
      .eq("ip_address", ipAddress)
      .gte("created_at", oneDayAgo.toISOString());

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Rate limit check error:", error);
      // Allow submission on error to not block legitimate users
      return { allowed: true };
    }

    if (data && data.length >= RATE_LIMITS.MAX_MESSAGES_PER_IP_PER_DAY) {
      // Calculate seconds until the oldest message expires
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      const oldestSubmission = new Date(data[0].created_at);
      const retryAfter = Math.ceil(
        (oldestSubmission.getTime() + RATE_LIMITS.COOLDOWN_HOURS * 60 * 60 * 1000 - Date.now()) / 1000
      );

      return {
        allowed: false,
        retryAfter: Math.max(retryAfter, 0),
        reason: `Too many submissions from your IP address. Please try again in ${Math.ceil(retryAfter / 3600)} hours.`,
      };
    }

    return { allowed: true };
  }

  /**
   * Check if the email has exceeded rate limits
   */
  async checkEmailRateLimit(email: string): Promise<RateLimitResult> {
    // Check submissions from this email in the last hour
    const oneHourAgo = new Date(Date.now() - RATE_LIMITS.EMAIL_COOLDOWN_HOURS * 60 * 60 * 1000);

    const { data, error } = await this.supabase
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      .from("contact_submissions")
      .select("id, created_at")
      .eq("email", email)
      .gte("created_at", oneHourAgo.toISOString());

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Email rate limit check error:", error);
      return { allowed: true };
    }

    if (data && data.length >= RATE_LIMITS.MAX_MESSAGES_PER_EMAIL_PER_HOUR) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      const oldestSubmission = new Date(data[0].created_at);
      const retryAfter = Math.ceil(
        (oldestSubmission.getTime() + RATE_LIMITS.EMAIL_COOLDOWN_HOURS * 60 * 60 * 1000 - Date.now()) / 1000
      );

      return {
        allowed: false,
        retryAfter: Math.max(retryAfter, 0),
        reason: `Too many submissions from this email. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`,
      };
    }

    return { allowed: true };
  }

  /**
   * Submit a contact form
   */
  async submitContactForm(
    submission: ContactSubmission
  ): Promise<{ success: boolean; error?: string; retryAfter?: number }> {
    // Check IP rate limit
    if (submission.ip_address) {
      const ipCheck = await this.checkIPRateLimit(submission.ip_address);
      if (!ipCheck.allowed) {
        return {
          success: false,
          error: ipCheck.reason,
          retryAfter: ipCheck.retryAfter,
        };
      }
    }

    // Check email rate limit
    const emailCheck = await this.checkEmailRateLimit(submission.email);
    if (!emailCheck.allowed) {
      return {
        success: false,
        error: emailCheck.reason,
        retryAfter: emailCheck.retryAfter,
      };
    }

    // Insert the submission
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const { error } = await this.supabase.from("contact_submissions").insert({
      email: submission.email,
      topic: submission.topic,
      message: submission.message,
      ip_address: submission.ip_address,
      user_agent: submission.user_agent,
      status: "pending",
    });

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Contact submission error:", error);
      return {
        success: false,
        error: "Failed to submit your message. Please try again later.",
      };
    }

    return { success: true };
  }
}
