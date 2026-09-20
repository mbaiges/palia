/**
 * Password Reset Repository Interface
 * Manages reset tokens for forgot-password flow
 */
export interface PasswordResetToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface PasswordResetRepository {
  create(userId: string, tokenHash: string, expiresAt: Date): Promise<PasswordResetToken>;
  findValidByUserId(userId: string): Promise<PasswordResetToken | null>;
  invalidateForUser(userId: string): Promise<void>;
  deleteExpired(): Promise<number>;
}
