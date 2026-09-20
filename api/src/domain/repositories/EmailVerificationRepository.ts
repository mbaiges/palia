import { EmailVerificationCode } from '@/domain/models/EmailVerificationCode';

/**
 * Email Verification Repository Interface
 * Manages verification codes for email sign-up
 */
export interface EmailVerificationRepository {
  /**
   * Create a new verification code for a user (invalidates previous codes)
   */
  create(userId: string, codeHash: string, expiresAt: Date): Promise<EmailVerificationCode>;

  /**
   * Find a valid (non-expired) verification code for a user
   */
  findValidByUserId(userId: string): Promise<EmailVerificationCode | null>;

  /**
   * Invalidate all verification codes for a user
   */
  invalidateForUser(userId: string): Promise<void>;

  /**
   * Delete expired codes (cleanup)
   */
  deleteExpired(): Promise<number>;
}
