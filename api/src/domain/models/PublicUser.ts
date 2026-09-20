/**
 * Public User Domain Entity
 * Represents a user's public profile data
 */
export class PublicUser {
  constructor(
    public readonly id: string,
    public readonly googleId: string,
    public readonly email: string,
    public readonly name: string,
    public readonly profileImageId?: string,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.id || this.id.trim() === '') {
      throw new Error('User ID is required');
    }
    // googleId can be empty string for email-only users (serialization)
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

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Convert to plain object
   */
  public toJSON(): Record<string, any> {
    return {
      id: this.id,
      googleId: this.googleId,
      email: this.email,
      name: this.name,
      profileImageId: this.profileImageId,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
