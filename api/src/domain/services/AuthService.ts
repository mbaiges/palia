import { injectable, inject } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { User } from '@/domain/models/User';
import { AppError } from '@/domain/errors/AppError';
import { ErrorCode } from '@/domain/errors/ErrorCodes';
import { UserRepository } from '@/domain/repositories/UserRepository';
import { AuthRepository } from '@/domain/repositories/AuthRepository';
import { UserSettingsRepository } from '@/domain/repositories/UserSettingsRepository';
import { AppSettingsRepository } from '@/domain/repositories/AppSettingsRepository';
import { EmailVerificationRepository } from '@/domain/repositories/EmailVerificationRepository';
import { PasswordResetRepository } from '@/domain/repositories/PasswordResetRepository';
import { EmailSender } from '@/domain/repositories/EmailSender';
import { PasswordHasher } from '@/domain/repositories/PasswordHasher';
import { getFrontendBaseUrl } from '@/domain/utils/frontendUrl';

/**
 * Authentication Domain Service
 * Contains pure business logic for authentication
 */
@injectable()
export class AuthService {
  constructor(
    @inject('UserRepository') private readonly userRepository: UserRepository,
    @inject('AuthRepository') private readonly authRepository: AuthRepository,
    @inject('UserSettingsRepository')
    private readonly userSettingsRepository: UserSettingsRepository,
    @inject('AppSettingsRepository')
    private readonly appSettingsRepository: AppSettingsRepository,
    @inject('EmailVerificationRepository')
    private readonly emailVerificationRepository: EmailVerificationRepository,
    @inject('PasswordResetRepository')
    private readonly passwordResetRepository: PasswordResetRepository,
    @inject('EmailSender') private readonly emailSender: EmailSender,
    @inject('PasswordHasher')
    private readonly passwordHasher: PasswordHasher
  ) {}

  /**
   * Find or create user based on Google authentication data
   * @param skipAllowedCheck - When true, skips allowed-emails check (dev bypass only)
   */
  async findOrCreateUser(
    googleId: string,
    email: string,
    name: string,
    profileImageId?: string,
    avatarImageId?: string,
    googleRefreshToken?: string,
    googleScopes?: string[],
    skipAllowedCheck = false
  ): Promise<{ user: User; isNewUser: boolean }> {
    if (!skipAllowedCheck) {
      const isAllowed = await this.appSettingsRepository.isEmailAllowed(email);
      if (!isAllowed) {
        throw new Error('Unauthorized');
      }
    }

    const initialAdminEmails = (process.env.INITIAL_ADMIN_EMAILS ?? '')
      .split(',')
      .map(value => value.trim().toLowerCase())
      .filter(Boolean);
    const isInitialAdmin = initialAdminEmails.includes(
      email.trim().toLowerCase()
    );

    // Check if user exists by Google ID
    let user = await this.userRepository.findByGoogleId(googleId);

    if (user) {
      // User exists - check if profile needs updating
      const updatedUser = user.update(
        name,
        profileImageId,
        avatarImageId,
        googleRefreshToken,
        googleScopes
      );

      if (
        updatedUser.name !== user.name ||
        updatedUser.profileImageId !== user.profileImageId ||
        updatedUser.avatarImageId !== user.avatarImageId ||
        updatedUser.googleRefreshToken !== user.googleRefreshToken ||
        JSON.stringify(updatedUser.googleScopes) !==
          JSON.stringify(user.googleScopes)
      ) {
        // Profile changed, save updates
        user = await this.userRepository.save(updatedUser);
      }

      return {
        user,
        isNewUser: false,
      };
    }

    // User doesn't exist - create new user (Google users are verified by OAuth)
    const newUser = new User(
      this.generateUserId(),
      googleId,
      email,
      name,
      profileImageId,
      avatarImageId,
      googleRefreshToken,
      googleScopes,
      undefined,
      true // emailVerified - Google OAuth verifies email
    );

    const savedUser = await this.userRepository.save(newUser);

    // Assign default 'user' role to new user
    await this.userRepository.assignRole(
      savedUser.id,
      isInitialAdmin ? 'admin' : 'volunteer'
    );

    // Create default settings for the new user
    await this.userSettingsRepository.update(savedUser.id, { theme: 'light' });

    return {
      user: savedUser,
      isNewUser: true,
    };
  }

  /**
   * Refreshes the Google access token for a user.
   * @param userId The ID of the user.
   * @returns The new access token.
   */
  async refreshGoogleAccessToken(userId: string): Promise<string> {
    const user = await this.userRepository.findById(userId);
    if (!user || !user.googleRefreshToken) {
      throw new Error('User not found or no refresh token available.');
    }

    const { accessToken } = await this.authRepository.refreshAccessToken(
      user.googleRefreshToken
    );

    return accessToken;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    return this.userRepository.findById(userId);
  }

  /**
   * Get user by Google ID
   */
  async getUserByGoogleId(googleId: string): Promise<User | null> {
    return this.userRepository.findByGoogleId(googleId);
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  /**
   * Validate user exists
   */
  async validateUserExists(userId: string): Promise<boolean> {
    const user = await this.userRepository.findById(userId);
    return user !== null;
  }

  /**
   * Updates the Google refresh token and/or scopes for a user.
   * @param userId The ID of the user.
   * @param scopes The new set of Google scopes.
   * @param refreshToken The new refresh token, if provided.
   */
  async updateUserAuth(
    userId: string,
    scopes: string[],
    refreshToken?: string
  ): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const newRefreshToken = refreshToken || user.googleRefreshToken;
    const updatedUser = user.update(
      user.name,
      user.profileImageId,
      user.avatarImageId,
      newRefreshToken,
      scopes
    );

    return this.userRepository.save(updatedUser);
  }

  /**
   * Find or create user for dev bypass (skips allowed-emails check).
   * Only used when DEV_AUTH_BYPASS=true. Uses fake googleId: dev-{sanitized-email}
   * If DEV_ADMIN_EMAIL matches the sign-in email, assigns admin role instead of user.
   */
  async findOrCreateUserForDevBypass(
    email: string,
    name: string
  ): Promise<{ user: User; isNewUser: boolean }> {
    const googleId = `dev-${email.replace(/[^a-z0-9]/gi, '')}`;
    const result = await this.findOrCreateUser(
      googleId,
      email,
      name,
      undefined,
      undefined,
      undefined,
      undefined,
      true
    );

    // When DEV_ADMIN_EMAIL is set, assign admin role to that user for local testing
    const devAdminEmail = process.env.DEV_ADMIN_EMAIL?.trim().toLowerCase();
    if (devAdminEmail && email.trim().toLowerCase() === devAdminEmail) {
      try {
        await this.userRepository.replaceUserRole(result.user.id, 'admin');
        const user = await this.userRepository.findById(result.user.id);
        return { user: user ?? result.user, isNewUser: result.isNewUser };
      } catch (err: any) {
        // If admin role doesn't exist (e.g. FK constraint), log and ensure user has user role
        if (
          err?.code === 'SQLITE_CONSTRAINT' ||
          err?.message?.includes('FOREIGN KEY')
        ) {
          const { logger } = await import('@/domain/utils/logger');
          logger.info(
            'Dev bypass: could not assign admin role (role may not exist). Run migrations. Signing in with user role.'
          );
          // Safety: replaceUserRole may have deleted the user's role before failing.
          // Ensure they have at least user role so permissions aren't empty.
          try {
            await this.userRepository.replaceUserRole(result.user.id, 'user');
          } catch {
            // If user role also fails, assignRole (INSERT OR IGNORE) may work
            await this.userRepository.assignRole(result.user.id, 'user');
          }
          const user = await this.userRepository.findById(result.user.id);
          return { user: user ?? result.user, isNewUser: result.isNewUser };
        }
        throw err;
      }
    }

    return result;
  }

  /**
   * Sign up with email/password. Creates unverified user, caller must send verification code.
   */
  async findOrCreateUserForEmailPassword(
    email: string,
    name: string,
    password: string
  ): Promise<{ user: User; isNewUser: boolean }> {
    const isAllowed = await this.appSettingsRepository.isEmailAllowed(email);
    if (!isAllowed) {
      throw new Error('Unauthorized');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await this.userRepository.findByEmail(normalizedEmail);

    if (existingUser) {
      if (existingUser.isEmailUser() && !existingUser.emailVerified) {
        throw new AppError(
          'User already exists with this email. Please verify your account.',
          ErrorCode.USER_EXISTS_NEEDS_VERIFICATION
        );
      }
      if (existingUser.isEmailUser()) {
        throw new AppError(
          'An account with this email already exists.',
          ErrorCode.EMAIL_ALREADY_EXISTS
        );
      }
      // Google user with same email - don't allow email sign-up
      throw new AppError(
        'An account with this email already exists. Please sign in with Google.',
        ErrorCode.EMAIL_ALREADY_EXISTS_GOOGLE
      );
    }

    const passwordHash = await this.passwordHasher.hash(password);
    const newUser = new User(
      this.generateUserId(),
      null, // googleId - email user
      normalizedEmail,
      name.trim(),
      undefined,
      undefined,
      undefined,
      undefined,
      passwordHash,
      false // emailVerified - must verify
    );

    const savedUser = await this.userRepository.save(newUser);
    await this.userRepository.assignRole(savedUser.id, 'user');
    await this.userSettingsRepository.update(savedUser.id, { theme: 'light' });

    return { user: savedUser, isNewUser: true };
  }

  /**
   * Verify email code and mark user as verified.
   */
  async verifyEmailCode(email: string, code: string): Promise<User> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.userRepository.findByEmail(normalizedEmail);
    if (!user) {
      throw new AppError(
        'Invalid or expired verification code',
        ErrorCode.INVALID_VERIFICATION_CODE
      );
    }

    const storedCode = await this.emailVerificationRepository.findValidByUserId(
      user.id
    );
    if (!storedCode) {
      throw new AppError(
        'Invalid or expired verification code',
        ErrorCode.INVALID_VERIFICATION_CODE
      );
    }

    const codeHash = this.hashVerificationCode(code);
    if (
      !crypto.timingSafeEqual(
        Buffer.from(storedCode.codeHash, 'hex'),
        Buffer.from(codeHash, 'hex')
      )
    ) {
      throw new AppError(
        'Invalid or expired verification code',
        ErrorCode.INVALID_VERIFICATION_CODE
      );
    }

    await this.emailVerificationRepository.invalidateForUser(user.id);
    await this.userRepository.updateEmailVerified(user.id, true);

    const verifiedUser = await this.userRepository.findById(user.id);
    if (!verifiedUser) {
      throw new Error('User not found');
    }

    return verifiedUser;
  }

  /**
   * Sign in with email and password.
   */
  async signInWithEmailPassword(
    email: string,
    password: string
  ): Promise<User> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.userRepository.findByEmail(normalizedEmail);

    if (!user) {
      throw new AppError(
        'Invalid email or password',
        ErrorCode.INVALID_CREDENTIALS
      );
    }

    if (!user.isEmailUser() || !user.passwordHash) {
      throw new AppError(
        'Invalid email or password',
        ErrorCode.INVALID_CREDENTIALS
      );
    }

    const valid = await this.passwordHasher.verify(password, user.passwordHash);
    if (!valid) {
      throw new AppError(
        'Invalid email or password',
        ErrorCode.INVALID_CREDENTIALS
      );
    }

    if (!user.emailVerified) {
      throw new AppError(
        'Please verify your email before signing in',
        ErrorCode.EMAIL_NOT_VERIFIED
      );
    }

    return user;
  }

  /**
   * Create and return a verification code for a user (hashed for storage).
   */
  createVerificationCode(userId: string): {
    code: string;
    codeHash: string;
    expiresAt: Date;
  } {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    const codeHash = this.hashVerificationCode(code);
    return { code, codeHash, expiresAt };
  }

  /**
   * Request password reset. Sends reset email if user exists and is email/password user.
   * Always returns generic success to avoid enumeration.
   */
  async requestPasswordReset(
    email: string,
    locale?: string | null
  ): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.userRepository.findByEmail(normalizedEmail);

    if (!user || !user.isEmailUser() || !user.passwordHash) {
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashVerificationCode(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.passwordResetRepository.create(user.id, tokenHash, expiresAt);

    const baseUrl = getFrontendBaseUrl();
    const resetUrl = `${baseUrl}/login/reset-password?email=${encodeURIComponent(normalizedEmail)}&token=${token}`;

    await this.emailSender.sendPasswordReset(
      normalizedEmail,
      resetUrl,
      undefined,
      locale
    );
  }

  /**
   * Reset password using token from email link.
   */
  async resetPassword(
    email: string,
    token: string,
    newPassword: string
  ): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.userRepository.findByEmail(normalizedEmail);

    if (!user || !user.isEmailUser() || !user.passwordHash) {
      throw new AppError(
        'Invalid or expired reset link',
        ErrorCode.INVALID_RESET_TOKEN
      );
    }

    const storedToken = await this.passwordResetRepository.findValidByUserId(
      user.id
    );
    if (!storedToken) {
      throw new AppError(
        'Invalid or expired reset link',
        ErrorCode.INVALID_RESET_TOKEN
      );
    }

    const tokenHash = this.hashVerificationCode(token);
    if (
      !crypto.timingSafeEqual(
        Buffer.from(storedToken.tokenHash, 'hex'),
        Buffer.from(tokenHash, 'hex')
      )
    ) {
      throw new AppError(
        'Invalid or expired reset link',
        ErrorCode.INVALID_RESET_TOKEN
      );
    }

    const passwordHash = await this.passwordHasher.hash(newPassword);
    await this.userRepository.updatePasswordHash(user.id, passwordHash);
    await this.passwordResetRepository.invalidateForUser(user.id);
  }

  private hashVerificationCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  /**
   * Generate unique user ID using UUID v4
   */
  private generateUserId(): string {
    return uuidv4();
  }
}
