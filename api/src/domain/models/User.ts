import { PublicUser } from '@/domain/models/PublicUser';
import { AuthenticatedUser } from '@/domain/models/AuthenticatedUser';

/**
 * User Domain Entity
 * Represents a user authenticated via Google OAuth or email/password
 */
export class User {
  constructor(
    public readonly id: string,
    public readonly googleId: string | null,
    public readonly email: string,
    public readonly name: string,
    public readonly profileImageId?: string,
    public readonly avatarImageId?: string,
    public readonly googleRefreshToken?: string,
    public readonly googleScopes?: string[],
    public readonly passwordHash?: string,
    public readonly emailVerified: boolean = false,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.id || this.id.trim() === '') {
      throw new Error('User ID is required');
    }
    // googleId is required for Google users, null for email/password users
    if (this.googleId !== null && this.googleId.trim() === '') {
      throw new Error('Google ID must be non-empty when provided');
    }
    if (!this.email || this.email.trim() === '') {
      throw new Error('Email is required');
    }
    if (!this.isValidEmail(this.email)) {
      throw new Error('Invalid email format');
    }
    if (!this.name || this.name.trim() === '') {
      throw new Error('Name is required');
    }
  }

  isEmailUser(): boolean {
    return this.googleId === null;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Updates the user's profile information.
   * Returns a new User instance with the updated data.
   */
  update(
    name: string,
    profileImageId?: string,
    avatarImageId?: string,
    googleRefreshToken?: string,
    googleScopes?: string[]
  ): User {
    const updatedUser = new User(
      this.id,
      this.googleId,
      this.email,
      name,
      profileImageId,
      avatarImageId,
      googleRefreshToken,
      googleScopes,
      this.passwordHash,
      this.emailVerified
    );
    updatedUser.updatedAt = new Date();
    return updatedUser;
  }

  /**
   * Convert to plain object
   */
  public toJSON(): Record<string, any> {
    return this.toPublicUser().toJSON();
  }

  /**
   * Convert to PublicUser
   */
  public toPublicUser(): PublicUser {
    return new PublicUser(
      this.id,
      this.googleId ?? '',
      this.email,
      this.name,
      this.profileImageId,
      this.createdAt,
      this.updatedAt
    );
  }

  /**
   * Convert to AuthenticatedUser
   */
  public toAuthenticatedUser(): AuthenticatedUser {
    return new AuthenticatedUser(
      this.id,
      this.googleId ?? '',
      this.email,
      this.name,
      this.profileImageId,
      this.googleScopes,
      this.createdAt,
      this.updatedAt
    );
  }
}
