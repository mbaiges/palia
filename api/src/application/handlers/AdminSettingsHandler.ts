import { injectable, inject } from 'tsyringe';
import { AdminSettingsService } from '@/domain/services/AdminSettingsService';

/**
 * Admin Settings Handler
 * Application layer facade that orchestrates admin settings operations
 */
@injectable()
export class AdminSettingsHandler {
  constructor(
    @inject('AdminSettingsService')
    private readonly adminSettingsService: AdminSettingsService
  ) {}

  /**
   * Get all allowed users
   */
  async getAllowedUsers(): Promise<string[]> {
    return this.adminSettingsService.getAllowedUsers();
  }

  /**
   * Add an allowed user
   */
  async addAllowedUser(email: string): Promise<void> {
    return this.adminSettingsService.addAllowedUser(email);
  }

  /**
   * Remove an allowed user
   */
  async removeAllowedUser(email: string): Promise<void> {
    return this.adminSettingsService.removeAllowedUser(email);
  }
}

