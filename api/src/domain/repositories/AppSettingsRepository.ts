/**
 * App Settings Repository Interface
 * Defines methods for accessing application settings data
 */
export interface AppSettingsRepository {
  /**
   * Get all allowed user emails
   */
  getAllowedUsers(): Promise<string[]>;

  /**
   * Add an allowed user email
   */
  addAllowedUser(email: string): Promise<void>;

  /**
   * Remove an allowed user email
   */
  removeAllowedUser(email: string): Promise<void>;

  /**
   * Check if an email is allowed
   */
  isEmailAllowed(email: string): Promise<boolean>;
}

