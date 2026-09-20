import { injectable, inject } from 'tsyringe';
import { AppError } from '@/domain/errors/AppError';
import { ErrorCode } from '@/domain/errors/ErrorCodes';
import { AppSettingsRepository } from '@/domain/repositories/AppSettingsRepository';

/**
 * Admin Settings Domain Service
 * Contains business logic for managing application settings
 */
@injectable()
export class AdminSettingsService {
  constructor(
    @inject('AppSettingsRepository')
    private readonly appSettingsRepository: AppSettingsRepository
  ) {}

  /**
   * Get all allowed user emails
   */
  async getAllowedUsers(): Promise<string[]> {
    return this.appSettingsRepository.getAllowedUsers();
  }

  /**
   * Add an allowed user email
   */
  async addAllowedUser(email: string): Promise<void> {
    // Validate email format
    if (!this.isValidEmail(email)) {
      throw new AppError('Invalid email format', ErrorCode.ADMIN_INVALID_EMAIL);
    }

    // Check if email already exists
    const isAllowed = await this.appSettingsRepository.isEmailAllowed(email);
    if (isAllowed) {
      throw new AppError('Email is already in the allowed users list', ErrorCode.ADMIN_EMAIL_ALREADY_ALLOWED);
    }

    await this.appSettingsRepository.addAllowedUser(email);
  }

  /**
   * Remove an allowed user email
   */
  async removeAllowedUser(email: string): Promise<void> {
    // Validate email format
    if (!this.isValidEmail(email)) {
      throw new AppError('Invalid email format', ErrorCode.ADMIN_INVALID_EMAIL);
    }

    // Check if email exists
    const isAllowed = await this.appSettingsRepository.isEmailAllowed(email);
    if (!isAllowed) {
      throw new AppError('Email is not in the allowed users list', ErrorCode.ADMIN_EMAIL_NOT_ALLOWED);
    }

    await this.appSettingsRepository.removeAllowedUser(email);
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }
}

