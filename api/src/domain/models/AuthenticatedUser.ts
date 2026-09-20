/**
 * Authenticated User Data Transfer Object
 * Represents a user's profile data for authenticated contexts, including scopes.
 */
export class AuthenticatedUser {
  constructor(
    public readonly id: string,
    public readonly googleId: string,
    public readonly email: string,
    public readonly name: string,
    public readonly profileImageId?: string,
    public readonly googleScopes?: string[],
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

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
      googleScopes: this.googleScopes,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
