import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { AuthHandler } from '@/application/handlers/AuthHandler';
import { logger } from '@/domain/utils/logger';
import { AppError } from '@/domain/errors/AppError';
import { ErrorCode } from '@/domain/errors/ErrorCodes';
import { parseAcceptLanguage } from '@/infrastructure/i18n';
import { configService } from '@/infrastructure/config/config';

/**
 * Authentication Controller
 * Handles HTTP requests for authentication
 * Delegates business logic to AuthHandler (application layer)
 */
@injectable()
export class AuthController {
  constructor(
    @inject('AuthHandler') private readonly authHandler: AuthHandler
  ) {}

  /**
   * Sign in or sign up with Google
   * POST /api/auth/google
   * Body: { authCode: string }
   */
  async signInWithGoogle(req: Request, res: Response): Promise<void> {
    try {
      const { authCode } = req.body;

      if (!authCode) {
        res.status(400).json({
          success: false,
          error: 'Google authorization code is required',
        });
        return;
      }

      if (!configService.config.googleClientId || !configService.config.googleClientSecret) {
        res.status(503).json({ success: false, error: 'Google authentication is not configured', errorCode: 'SERVICE_UNAVAILABLE' });
        return;
      }

      const result = await this.authHandler.handleGoogleSignIn(authCode);

      res.status(result.isNewUser ? 201 : 200).json({
        success: true,
        message: result.isNewUser
          ? 'Account created successfully'
          : 'Signed in successfully',
        data: {
          user: result.user.toJSON(),
          token: result.token,
          googleAccessToken: result.googleAccessToken,
          isNewUser: result.isNewUser,
          permissions: result.permissions,
        },
      });
    } catch (error: any) {
      logger.error('Google sign-in error', error);
      if (error.message === 'Unauthorized') {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'This user is not authorized to access this application.',
        });
        return;
      }
      
      res.status(401).json({
        success: false,
        error: 'Authentication failed',
        message: error.message,
      });
    }
  }

  /**
   * Dev bypass sign in (DEV_AUTH_BYPASS only)
   * POST /api/auth/dev/bypass
   * Body: { email: string, name: string }
   */
  async signInWithDevBypass(req: Request, res: Response): Promise<void> {
    if (process.env.DEV_AUTH_BYPASS !== 'true') {
      res.status(404).json({
        success: false,
        error: 'Not found',
      });
      return;
    }

    try {
      const { email, name } = req.body;

      if (!email || !name) {
        res.status(400).json({
          success: false,
          error: 'Email and name are required',
        });
        return;
      }

      const result = await this.authHandler.handleDevBypass(email, name);

      res.status(result.isNewUser ? 201 : 200).json({
        success: true,
        message: result.isNewUser
          ? 'Account created successfully'
          : 'Signed in successfully',
        data: {
          user: result.user.toJSON(),
          token: result.token,
          googleAccessToken: result.googleAccessToken,
          isNewUser: result.isNewUser,
          permissions: result.permissions,
        },
      });
    } catch (error: any) {
      logger.error('Dev bypass sign-in error', error);
      res.status(401).json({
        success: false,
        error: 'Authentication failed',
        message: error.message,
      });
    }
  }

  /**
   * Upgrade Google authentication with new scopes
   * POST /api/auth/google/upgrade
   * Body: { authCode: string }
   * Headers: Authorization: Bearer <token>
   */
  async upgradeGoogleAuth(req: Request, res: Response): Promise<void> {
    try {
      const { authCode } = req.body;
      const userId = req.user?.id;

      if (!authCode) {
        res.status(400).json({
          success: false,
          error: 'Google authorization code is required',
        });
        return;
      }

      if (!configService.config.googleClientId || !configService.config.googleClientSecret) {
        res.status(503).json({ success: false, error: 'Google authentication is not configured', errorCode: 'SERVICE_UNAVAILABLE' });
        return;
      }

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }

      const result = await this.authHandler.handleGoogleAuthUpgrade(
        authCode,
        userId
      );

      res.status(200).json({
        success: true,
        message: 'Google authentication upgraded successfully',
        data: {
          user: result.user.toJSON(),
          googleAccessToken: result.googleAccessToken,
        },
      });
    } catch (error: any) {
      logger.error('Google auth upgrade error', error);
      res.status(500).json({
        success: false,
        error: 'Google auth upgrade failed',
        message: error.message,
      });
    }
  }

  /**
   * Verify current token
   * GET /api/auth/verify
   * Headers: Authorization: Bearer <token>
   */
  verifyToken(req: Request, res: Response): void {
    try {
      const token = this.extractToken(req);
      if (!token) {
        res.status(401).json({
          success: false,
          error: 'No token provided',
        });
        return;
      }

      const decoded = this.authHandler.handleTokenVerification(token);

      res.status(200).json({
        success: true,
        data: decoded,
      });
    } catch (error: any) {
      logger.error('Token verification error', error);
      res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: error.message,
      });
    }
  }

  /**
   * Refresh token
   * POST /api/auth/refresh
   * Headers: Authorization: Bearer <token>
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const token = this.extractToken(req);
      if (!token) {
        res.status(401).json({
          success: false,
          error: 'No token provided',
        });
        return;
      }

      const decoded = this.authHandler.handleTokenVerification(token);
      const newToken = await this.authHandler.handleTokenRefresh(
        decoded.userId
      );

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          token: newToken,
        },
      });
    } catch (error: any) {
      logger.error('Token refresh error', error);
      res.status(401).json({
        success: false,
        error: 'Token refresh failed',
        message: error.message,
      });
    }
  }

  /**
   * Refresh Google access token
   * GET /api/auth/google/refresh-token
   * Headers: Authorization: Bearer <token>
   */
  async refreshGoogleAccessToken(req: Request, res: Response): Promise<void> {
    try {
      if (!configService.config.googleClientId || !configService.config.googleClientSecret) {
        res.status(503).json({ success: false, error: 'Google authentication is not configured', errorCode: 'SERVICE_UNAVAILABLE' });
        return;
      }
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      const { googleAccessToken } =
        await this.authHandler.handleGoogleAccessTokenRefresh(req.user.id);

      res.status(200).json({
        success: true,
        data: {
          googleAccessToken,
        },
      });
    } catch (error: any) {
      logger.error('Google access token refresh error', error);
      res.status(500).json({
        success: false,
        error: 'Google access token refresh failed',
        message: error.message,
      });
    }
  }

  /**
   * Get current user
   * GET /api/auth/me
   * Headers: Authorization: Bearer <token>
   */
  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      const result = await this.authHandler.handleGetCurrentUser(req.user.id);

      if (!result) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          user: result.user.toJSON(),
          permissions: result.permissions,
        },
      });
    } catch (error: any) {
      logger.error('Get current user error', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get current user',
        message: error.message,
      });
    }
  }

  /**
   * Sign out (client-side token removal)
   * POST /api/auth/signout
   */
  signOut(_req: Request, res: Response): void {
    // In a JWT system, sign out is handled client-side by removing the token
    // This endpoint is here for consistency and can be used for logging
    res.status(200).json({
      success: true,
      message: 'Signed out successfully',
    });
  }

  /**
   * Email sign up - creates user, sends verification code
   * POST /api/auth/email/sign-up
   * Body: { email: string, password: string, name: string }
   */
  async signUpWithEmail(req: Request, res: Response): Promise<void> {
    if (process.env.EMAIL_AUTH_ENABLED === 'false') {
      res.status(404).json({ success: false, error: 'Not found' });
      return;
    }

    try {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        res.status(400).json({
          success: false,
          error: 'Email, password, and name are required',
        });
        return;
      }

      if (password.length < 8) {
        res.status(400).json({
          success: false,
          error: 'Password must be at least 8 characters',
          errorCode: ErrorCode.PASSWORD_MIN_LENGTH,
        });
        return;
      }

      const locale = parseAcceptLanguage(req.headers?.['accept-language']);
      const result = await this.authHandler.handleEmailSignUp(
        email.trim(),
        password,
        name.trim(),
        locale
      );

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      logger.error('Email sign-up error', error);
      const payload: Record<string, unknown> = {
        success: false,
        error: error.message,
      };
      if (error instanceof AppError) payload.errorCode = error.errorCode;
      res.status(400).json(payload);
    }
  }

  /**
   * Email verify - verify code, return JWT
   * POST /api/auth/email/verify
   * Body: { email: string, code: string }
   */
  async verifyEmail(req: Request, res: Response): Promise<void> {
    if (process.env.EMAIL_AUTH_ENABLED === 'false') {
      res.status(404).json({ success: false, error: 'Not found' });
      return;
    }

    try {
      const { email, code } = req.body;

      if (!email || !code) {
        res.status(400).json({
          success: false,
          error: 'Email and code are required',
        });
        return;
      }

      const result = await this.authHandler.handleEmailVerify(
        email.trim(),
        code.trim()
      );

      res.status(200).json({
        success: true,
        message: 'Email verified successfully',
        data: {
          user: result.user.toJSON(),
          token: result.token,
          googleAccessToken: result.googleAccessToken,
          permissions: result.permissions,
        },
      });
    } catch (error: any) {
      logger.error('Email verify error', error);
      const payload: Record<string, unknown> = {
        success: false,
        error: error.message || 'Invalid or expired verification code',
      };
      if (error instanceof AppError) payload.errorCode = error.errorCode;
      res.status(401).json(payload);
    }
  }

  /**
   * Email sign in
   * POST /api/auth/email/sign-in
   * Body: { email: string, password: string }
   */
  async signInWithEmail(req: Request, res: Response): Promise<void> {
    if (process.env.EMAIL_AUTH_ENABLED === 'false') {
      res.status(404).json({ success: false, error: 'Not found' });
      return;
    }

    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email and password are required',
        });
        return;
      }

      const result = await this.authHandler.handleEmailSignIn(
        email.trim(),
        password
      );

      res.status(200).json({
        success: true,
        message: 'Signed in successfully',
        data: {
          user: result.user.toJSON(),
          token: result.token,
          googleAccessToken: result.googleAccessToken,
          permissions: result.permissions,
        },
      });
    } catch (error: any) {
      logger.error('Email sign-in error', error);
      const payload: Record<string, unknown> = {
        success: false,
        error: error.message || 'Invalid email or password',
      };
      if (error instanceof AppError) payload.errorCode = error.errorCode;
      res.status(401).json(payload);
    }
  }

  /**
   * Forgot password - request reset link
   * POST /api/auth/email/forgot-password
   * Body: { email: string }
   */
  async requestPasswordReset(req: Request, res: Response): Promise<void> {
    if (process.env.EMAIL_AUTH_ENABLED === 'false') {
      res.status(404).json({ success: false, error: 'Not found' });
      return;
    }

    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          error: 'Email is required',
        });
        return;
      }

      const locale = parseAcceptLanguage(req.headers?.['accept-language']);
      const result = await this.authHandler.handleRequestPasswordReset(email.trim(), locale);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      logger.error('Forgot password error', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send reset link',
      });
    }
  }

  /**
   * Reset password with token from email
   * POST /api/auth/email/reset-password
   * Body: { email: string, token: string, newPassword: string }
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    if (process.env.EMAIL_AUTH_ENABLED === 'false') {
      res.status(404).json({ success: false, error: 'Not found' });
      return;
    }

    try {
      const { email, token, newPassword } = req.body;

      if (!email || !token || !newPassword) {
        res.status(400).json({
          success: false,
          error: 'Email, token, and new password are required',
        });
        return;
      }

      if (newPassword.length < 8) {
        res.status(400).json({
          success: false,
          error: 'Password must be at least 8 characters',
          errorCode: ErrorCode.PASSWORD_MIN_LENGTH,
        });
        return;
      }

      await this.authHandler.handleResetPassword(
        email.trim(),
        token.trim(),
        newPassword
      );

      res.status(200).json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error: any) {
      logger.error('Reset password error', error);
      const payload: Record<string, unknown> = {
        success: false,
        error: error.message || 'Invalid or expired reset link',
      };
      if (error instanceof AppError) payload.errorCode = error.errorCode;
      res.status(400).json(payload);
    }
  }

  /**
   * Resend verification code
   * POST /api/auth/email/resend-code
   * Body: { email: string }
   */
  async resendVerificationCode(req: Request, res: Response): Promise<void> {
    if (process.env.EMAIL_AUTH_ENABLED === 'false') {
      res.status(404).json({ success: false, error: 'Not found' });
      return;
    }

    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          error: 'Email is required',
        });
        return;
      }

      const locale = parseAcceptLanguage(req.headers?.['accept-language']);
      const result = await this.authHandler.handleEmailResendCode(email.trim(), locale);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      logger.error('Resend code error', error);
      res.status(500).json({
        success: false,
        error: 'Failed to resend code',
      });
    }
  }

  /**
   * Extract JWT token from Authorization header
   */
  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
}
