import { EmailSender } from '@/domain/repositories/EmailSender';
import { logger } from '@/domain/utils/logger';
import { getFrontendBaseUrl } from '@/domain/utils/frontendUrl';

/**
 * Console email sender - logs verification codes and reset links instead of sending.
 * Used when RESEND_API_KEY is not configured (e.g. local dev).
 */
export class ConsoleEmailSender implements EmailSender {
  async sendVerificationCode(to: string, code: string, _subject?: string, _locale?: string | null): Promise<void> {
    const baseUrl = getFrontendBaseUrl();
    const verifyUrl = `${baseUrl}/login/email?step=verify&email=${encodeURIComponent(to)}&code=${code}`;
    logger.info(
      `[ConsoleEmailSender] Verification code for ${to}: ${code}\n  Verify at: ${verifyUrl}`
    );
  }

  async sendPasswordReset(to: string, resetUrl: string, _subject?: string, _locale?: string | null): Promise<void> {
    logger.info(`[ConsoleEmailSender] Password reset for ${to}\n  Reset at: ${resetUrl}`);
  }
}
