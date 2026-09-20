/**
 * Email Verification Code Domain Entity
 * Represents a one-time verification code sent to a user's email
 */
export class EmailVerificationCode {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly codeHash: string,
    public readonly expiresAt: Date,
    public readonly createdAt: Date = new Date()
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.id || this.id.trim() === '') {
      throw new Error('Verification code ID is required');
    }
    if (!this.userId || this.userId.trim() === '') {
      throw new Error('User ID is required');
    }
    if (!this.codeHash || this.codeHash.trim() === '') {
      throw new Error('Code hash is required');
    }
    if (!this.expiresAt || !(this.expiresAt instanceof Date)) {
      throw new Error('Valid expiration date is required');
    }
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }
}
