/**
 * Email Sender Interface
 * Abstracts email delivery for transactional emails (verification codes, etc.)
 */
export interface EmailSender {
  /**
   * Send a verification code email to the given address
   * @param to - Recipient email
   * @param code - The 6-digit verification code (plain text for the email body)
   * @param subject - Optional custom subject
   * @param locale - Optional locale (en, es, es_AR) for translated content
   */
  sendVerificationCode(to: string, code: string, subject?: string, locale?: string | null): Promise<void>;

  /**
   * Send a password reset email with the reset link
   * @param to - Recipient email
   * @param resetUrl - Full URL for the reset link (includes token)
   * @param subject - Optional custom subject
   * @param locale - Optional locale (en, es, es_AR) for translated content
   */
  sendPasswordReset(to: string, resetUrl: string, subject?: string, locale?: string | null): Promise<void>;
}
