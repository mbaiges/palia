import { injectable, inject } from 'tsyringe';
import { AuthService } from '@/domain/services/AuthService';
import { AuthRepository } from '@/domain/repositories/AuthRepository';
import { TokenProvider } from '@/domain/repositories/TokenProvider';
import { PermissionRepository } from '@/domain/repositories/PermissionRepository';
import { EmailVerificationRepository } from '@/domain/repositories/EmailVerificationRepository';
import { EmailSender } from '@/domain/repositories/EmailSender';
import { AuthenticatedUser } from '@/domain/models/AuthenticatedUser';

/**
 * Authentication Response
 */
export interface AuthResponse {
  user: AuthenticatedUser;
  token: string;
  googleAccessToken: string;
  isNewUser: boolean;
  permissions: string[];
}

/**
 * Token Verification Response
 */
export interface TokenVerificationResponse {
  userId: string;
  email: string;
  googleId: string | null;
}

/**
 * Authentication Handler
 * Application layer facade that orchestrates domain services and infrastructure adapters
 * This is where use cases are implemented
 */
@injectable()
export class AuthHandler {
  constructor(
    @inject('AuthService') private readonly authService: AuthService,
    @inject('AuthRepository')
    private readonly authRepository: AuthRepository,
    @inject('TokenProvider') private readonly jwtAdapter: TokenProvider,
    @inject('PermissionRepository')
    private readonly permissionRepository: PermissionRepository,
    @inject('EmailVerificationRepository')
    private readonly emailVerificationRepository: EmailVerificationRepository,
    @inject('EmailSender') private readonly emailSender: EmailSender
  ) {}

  /**
   * Handle Google Sign In/Sign Up
   * Use case: User wants to authenticate with Google
   */
  async handleGoogleSignIn(authCode: string): Promise<AuthResponse> {
    // Step 1: Exchange auth code for tokens (infrastructure)
    const authResult = await this.authRepository.authenticateWithCode(
      authCode
    );

    // Step 2: Find or create user (domain logic)
    // Note: For now, we pass null for profileImageId/avatarImageId
    // Image handling can be enhanced later to create Image records from picture URLs
    const { user, isNewUser } = await this.authService.findOrCreateUser(
      authResult.account.providerId,
      authResult.account.email,
      authResult.account.name,
      undefined, // profileImageId - can be enhanced later
      undefined, // avatarImageId - can be enhanced later
      authResult.refreshToken,
      authResult.scopes
    );

    // Step 3: Generate JWT token (infrastructure)
    const token = this.jwtAdapter.generateToken(user);

    // Step 4: Get user permissions
    const permissions = await this.permissionRepository.findByUserId(user.id);

    return {
      user: user.toAuthenticatedUser(),
      token,
      googleAccessToken: authResult.accessToken,
      isNewUser,
      permissions,
    };
  }

  /**
   * Handle Dev Bypass Sign In (DEV_AUTH_BYPASS only)
   * Use case: Local dev - sign in as fake user without Google OAuth
   */
  async handleDevBypass(email: string, name: string): Promise<AuthResponse> {
    const { user, isNewUser } =
      await this.authService.findOrCreateUserForDevBypass(email, name);

    const token = this.jwtAdapter.generateToken(user);
    const permissions = await this.permissionRepository.findByUserId(user.id);

    return {
      user: user.toAuthenticatedUser(),
      token,
      googleAccessToken: '',
      isNewUser,
      permissions,
    };
  }

  /**
   * Handle Google Auth Upgrade
   * Use case: User wants to grant additional permissions to the application
   */
  async handleGoogleAuthUpgrade(
    authCode: string,
    userId: string
  ): Promise<{ user: AuthenticatedUser; googleAccessToken: string }> {
    // Step 1: Exchange auth code for tokens (infrastructure)
    const authResult = await this.authRepository.authenticateWithCode(
      authCode
    );

    // Step 2: Update user's auth data (scopes and optionally refresh token)
    const user = await this.authService.updateUserAuth(
      userId,
      authResult.scopes || [],
      authResult.refreshToken
    );

    return {
      user: user.toAuthenticatedUser(),
      googleAccessToken: authResult.accessToken,
    };
  }

  /**
   * Handle Token Verification
   * Use case: Verify if a JWT token is valid
   */
  handleTokenVerification(token: string): TokenVerificationResponse {
    // Verify token (infrastructure)
    const payload = this.jwtAdapter.verifyToken(token);

    return {
      userId: payload.userId,
      email: payload.email,
      googleId: payload.googleId,
    };
  }

  /**
   * Handle Token Refresh
   * Use case: User wants to refresh their session token
   */
  async handleTokenRefresh(userId: string): Promise<string> {
    // Validate user exists (domain logic)
    const userExists = await this.authService.validateUserExists(userId);

    if (!userExists) {
      throw new Error('User not found');
    }

    // Get user (domain logic)
    const user = await this.authService.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate new token (infrastructure)
    return this.jwtAdapter.generateToken(user);
  }

  /**
   * Handle Get Current User
   * Use case: Get user information from token
   */
  async handleGetCurrentUser(userId: string): Promise<{
    user: AuthenticatedUser;
    permissions: string[];
  } | null> {
    const user = await this.authService.getUserById(userId);
    if (!user) {
      return null;
    }

    // Get user permissions
    const permissions = await this.permissionRepository.findByUserId(userId);

    return {
      user: user.toAuthenticatedUser(),
      permissions,
    };
  }

  /**
   * Handle Google Access Token Refresh
   * Use case: User needs a new Google access token to interact with Google services
   */
  async handleGoogleAccessTokenRefresh(
    userId: string
  ): Promise<{ googleAccessToken: string }> {
    const googleAccessToken = await this.authService.refreshGoogleAccessToken(
      userId
    );

    return { googleAccessToken };
  }

  /**
   * Handle Email Sign Up
   * Creates user, sends verification code
   */
  async handleEmailSignUp(
    email: string,
    password: string,
    name: string,
    locale?: string | null
  ): Promise<{ message: string }> {
    const { user } = await this.authService.findOrCreateUserForEmailPassword(
      email,
      name,
      password
    );

    const { code, codeHash, expiresAt } =
      this.authService.createVerificationCode(user.id);
    await this.emailVerificationRepository.create(user.id, codeHash, expiresAt);
    await this.emailSender.sendVerificationCode(user.email, code, undefined, locale);

    return { message: 'Verification code sent to your email' };
  }

  /**
   * Handle Email Verification
   * Verifies code, returns JWT
   */
  async handleEmailVerify(
    email: string,
    code: string
  ): Promise<AuthResponse> {
    const user = await this.authService.verifyEmailCode(email, code);
    const token = this.jwtAdapter.generateToken(user);
    const permissions = await this.permissionRepository.findByUserId(user.id);

    return {
      user: user.toAuthenticatedUser(),
      token,
      googleAccessToken: '',
      isNewUser: false,
      permissions,
    };
  }

  /**
   * Handle Email Sign In
   */
  async handleEmailSignIn(email: string, password: string): Promise<AuthResponse> {
    const user = await this.authService.signInWithEmailPassword(email, password);
    const token = this.jwtAdapter.generateToken(user);
    const permissions = await this.permissionRepository.findByUserId(user.id);

    return {
      user: user.toAuthenticatedUser(),
      token,
      googleAccessToken: '',
      isNewUser: false,
      permissions,
    };
  }

  /**
   * Handle Resend Verification Code
   */
  async handleEmailResendCode(email: string, locale?: string | null): Promise<{ message: string }> {
    const user = await this.authService.getUserByEmail(email.trim().toLowerCase());
    if (!user || !user.isEmailUser() || user.emailVerified) {
      // Generic message to avoid enumeration
      return { message: 'If an account exists, a new code has been sent' };
    }

    const { code, codeHash, expiresAt } =
      this.authService.createVerificationCode(user.id);
    await this.emailVerificationRepository.create(user.id, codeHash, expiresAt);
    await this.emailSender.sendVerificationCode(user.email, code, undefined, locale);

    return { message: 'If an account exists, a new code has been sent' };
  }

  /**
   * Handle Request Password Reset
   */
  async handleRequestPasswordReset(email: string, locale?: string | null): Promise<{ message: string }> {
    await this.authService.requestPasswordReset(email, locale);
    return { message: 'If an account exists, a reset link has been sent to your email' };
  }

  /**
   * Handle Reset Password
   */
  async handleResetPassword(
    email: string,
    token: string,
    newPassword: string
  ): Promise<void> {
    await this.authService.resetPassword(email, token, newPassword);
  }
}
