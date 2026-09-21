import 'reflect-metadata';
import { AuthController } from '@/infrastructure/controllers/AuthController';
import { AuthHandler } from '@/application/handlers/AuthHandler';
import { Request, Response } from 'express';
import { User } from '@/domain/models/User';
import { AppError } from '@/domain/errors/AppError';
import { ErrorCode } from '@/domain/errors/ErrorCodes';
import { configService } from '@/infrastructure/config/config';
import { resolveBrowserSession } from '@/infrastructure/services/BrowserSession';

jest.mock('@/application/handlers/AuthHandler');
jest.mock('@/infrastructure/services/BrowserSession', () => ({
  createBrowserSession: jest.fn().mockResolvedValue(undefined),
  revokeBrowserSession: jest.fn().mockResolvedValue(undefined),
  clearBrowserSession: jest.fn(),
  resolveBrowserSession: jest.fn().mockResolvedValue(null),
}));
const mockResolveBrowserSession = jest.mocked(resolveBrowserSession);

const mockUser = new User('1', 'google-1', 'a@a.com', 'Test User', '', '');
const mockAuthenticatedUser = mockUser.toAuthenticatedUser();

describe('AuthController', () => {
  let authController: AuthController;
  let mockAuthHandler: jest.Mocked<AuthHandler>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockStatus: jest.Mock;
  let mockJson: jest.Mock;

  beforeEach(() => {
    configService.config.googleClientId = 'test-client-id';
    configService.config.googleClientSecret = 'test-client-secret';
    mockAuthHandler = new (AuthHandler as any)() as jest.Mocked<AuthHandler>;
    authController = new AuthController(mockAuthHandler);
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockResponse = {
      status: mockStatus,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signInWithGoogle', () => {
    it('returns service unavailable when Google OAuth is not configured', async () => {
      configService.config.googleClientId = '';
      configService.config.googleClientSecret = '';
      mockRequest = { body: { authCode: 'code' } };
      await authController.signInWithGoogle(
        mockRequest as Request,
        mockResponse as Response
      );
      expect(mockAuthHandler.handleGoogleSignIn).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(503);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Google authentication is not configured',
        errorCode: 'SERVICE_UNAVAILABLE',
      });
    });

    it('should return 201 for a new user', async () => {
      // Arrange
      const authCode = 'test-auth-code';
      mockRequest = { body: { authCode } };
      const authResult = {
        user: mockAuthenticatedUser,
        token: 'test-token',
        googleAccessToken: 'test-access-token',
        isNewUser: true,
        permissions: ['example:read'],
      };
      mockAuthHandler.handleGoogleSignIn.mockResolvedValue(authResult);

      // Act
      await authController.signInWithGoogle(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthHandler.handleGoogleSignIn).toHaveBeenCalledWith(authCode);
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Account created successfully',
        data: {
          user: authResult.user.toJSON(),
          role: 'volunteer',
          isNewUser: authResult.isNewUser,
          permissions: authResult.permissions,
        },
      });
    });

    it('should return 200 for an existing user', async () => {
      // Arrange
      const authCode = 'test-auth-code';
      mockRequest = { body: { authCode } };
      const authResult = {
        user: mockAuthenticatedUser,
        token: 'test-token',
        googleAccessToken: 'test-access-token',
        isNewUser: false,
        permissions: ['example:read', 'example:write'],
      };
      mockAuthHandler.handleGoogleSignIn.mockResolvedValue(authResult);

      // Act
      await authController.signInWithGoogle(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Signed in successfully',
          data: expect.objectContaining({
            isNewUser: false,
            permissions: authResult.permissions,
            role: 'volunteer',
          }),
        })
      );
    });

    it('should return 400 if authCode is missing', async () => {
      // Arrange
      mockRequest = { body: {} };

      // Act
      await authController.signInWithGoogle(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Google authorization code is required',
      });
    });

    it('should return 403 if user is not authorized', async () => {
      // Arrange
      const authCode = 'test-auth-code';
      mockRequest = { body: { authCode } };
      mockAuthHandler.handleGoogleSignIn.mockRejectedValue(
        new Error('Unauthorized')
      );
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // Act
      await authController.signInWithGoogle(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Forbidden',
        message: 'This user is not authorized to access this application.',
      });

      consoleErrorSpy.mockRestore();
    });

    it('should return 401 for other authentication failures', async () => {
      // Arrange
      const authCode = 'test-auth-code';
      mockRequest = { body: { authCode } };
      const errorMessage = 'Authentication failed for some other reason';
      mockAuthHandler.handleGoogleSignIn.mockRejectedValue(
        new Error(errorMessage)
      );
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // Act
      await authController.signInWithGoogle(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication failed',
        message: errorMessage,
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('refreshToken', () => {
    it('rejects a Bearer token when no browser session cookie is present', async () => {
      mockRequest = {
        headers: { authorization: 'Bearer scaffold-jwt' },
      } as any;
      mockResolveBrowserSession.mockResolvedValue(null);

      await authController.refreshToken(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'No browser session provided',
      });
      expect(mockAuthHandler.handleTokenRefresh).not.toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    it('should return 200 with user and permissions when authenticated', async () => {
      // Arrange
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockRequest = { user: mockUser } as any;
      const handlerResult = {
        user: mockAuthenticatedUser,
        permissions: ['example:read', 'example:write'],
      };
      mockAuthHandler.handleGetCurrentUser.mockResolvedValue(handlerResult);

      // Act
      await authController.getCurrentUser(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthHandler.handleGetCurrentUser).toHaveBeenCalledWith(
        mockUser.id
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          user: handlerResult.user.toJSON(),
          permissions: handlerResult.permissions,
          role: 'volunteer',
        },
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      // Arrange
      mockRequest = {};

      // Act
      await authController.getCurrentUser(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
      });
      expect(mockAuthHandler.handleGetCurrentUser).not.toHaveBeenCalled();
    });

    it('should return 404 when user is not found', async () => {
      // Arrange
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockRequest = { user: mockUser } as any;
      mockAuthHandler.handleGetCurrentUser.mockResolvedValue(null);

      // Act
      await authController.getCurrentUser(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'User not found',
      });
    });

    it('should return 500 on error', async () => {
      // Arrange
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockRequest = { user: mockUser } as any;
      const error = new Error('Database error');
      mockAuthHandler.handleGetCurrentUser.mockRejectedValue(error);
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // Act
      await authController.getCurrentUser(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to get current user',
        message: 'Database error',
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('signInWithDevBypass', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should return 404 when DEV_AUTH_BYPASS is not set', async () => {
      process.env.DEV_AUTH_BYPASS = 'false';
      mockRequest = { body: { email: 'alice@test.com', name: 'Alice' } };

      await authController.signInWithDevBypass(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Not found',
      });
      expect(mockAuthHandler.handleDevBypass).not.toHaveBeenCalled();
    });

    it('should return 201 for new user when DEV_AUTH_BYPASS is set', async () => {
      process.env.DEV_AUTH_BYPASS = 'true';
      mockRequest = { body: { email: 'alice@test.com', name: 'Alice' } };
      const authResult = {
        user: mockAuthenticatedUser,
        token: 'test-token',
        googleAccessToken: '',
        isNewUser: true,
        permissions: [] as string[],
      };
      mockAuthHandler.handleDevBypass = jest.fn().mockResolvedValue(authResult);

      await authController.signInWithDevBypass(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockAuthHandler.handleDevBypass).toHaveBeenCalledWith(
        'alice@test.com',
        'Alice'
      );
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Account created successfully',
        data: {
          user: authResult.user.toJSON(),
          isNewUser: true,
          permissions: [],
          role: 'volunteer',
        },
      });
    });

    it('should return 200 for existing user when DEV_AUTH_BYPASS is set', async () => {
      process.env.DEV_AUTH_BYPASS = 'true';
      mockRequest = { body: { email: 'bob@test.com', name: 'Bob' } };
      const authResult = {
        user: mockAuthenticatedUser,
        token: 'test-token',
        googleAccessToken: '',
        isNewUser: false,
        permissions: [] as string[],
      };
      mockAuthHandler.handleDevBypass = jest.fn().mockResolvedValue(authResult);

      await authController.signInWithDevBypass(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Signed in successfully',
          data: expect.objectContaining({ isNewUser: false }),
        })
      );
    });

    it('should return 400 when email or name is missing', async () => {
      process.env.DEV_AUTH_BYPASS = 'true';
      mockRequest = { body: { email: 'alice@test.com' } };

      await authController.signInWithDevBypass(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Email and name are required',
      });
      expect(mockAuthHandler.handleDevBypass).not.toHaveBeenCalled();
    });

    it('should return 401 on handler error', async () => {
      process.env.DEV_AUTH_BYPASS = 'true';
      mockRequest = { body: { email: 'alice@test.com', name: 'Alice' } };
      mockAuthHandler.handleDevBypass = jest
        .fn()
        .mockRejectedValue(new Error('Some error'));
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await authController.signInWithDevBypass(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication failed',
        message: 'Some error',
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('signUpWithEmail', () => {
    const originalEmailAuth = process.env.EMAIL_AUTH_ENABLED;

    beforeEach(() => {
      process.env.EMAIL_AUTH_ENABLED = 'true';
    });

    afterEach(() => {
      process.env.EMAIL_AUTH_ENABLED = originalEmailAuth;
    });

    it('should return 200 on success', async () => {
      mockRequest = {
        body: {
          email: 'new@example.com',
          password: 'password123',
          name: 'New User',
        },
      };
      mockAuthHandler.handleEmailSignUp.mockResolvedValue({
        message: 'Verification code sent to your email',
      });

      await authController.signUpWithEmail(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Verification code sent to your email',
      });
    });

    it('should return 400 when email, password, or name missing', async () => {
      mockRequest = { body: { email: 'new@example.com' } };

      await authController.signUpWithEmail(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Email, password, and name are required',
      });
    });

    it('should return 400 when password too short', async () => {
      mockRequest = {
        body: { email: 'new@example.com', password: 'short', name: 'User' },
      };

      await authController.signUpWithEmail(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Password must be at least 8 characters',
        errorCode: ErrorCode.PASSWORD_MIN_LENGTH,
      });
    });

    it('should return 404 when EMAIL_AUTH_ENABLED is false', async () => {
      process.env.EMAIL_AUTH_ENABLED = 'false';
      mockRequest = {
        body: {
          email: 'new@example.com',
          password: 'password123',
          name: 'User',
        },
      };

      await authController.signUpWithEmail(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Not found',
      });
    });

    it('should return 400 on handler error', async () => {
      mockRequest = {
        body: {
          email: 'new@example.com',
          password: 'password123',
          name: 'User',
        },
      };
      mockAuthHandler.handleEmailSignUp.mockRejectedValue(
        new Error('Email already exists')
      );
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await authController.signUpWithEmail(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Email already exists',
      });
      consoleErrorSpy.mockRestore();
    });

    it('should return 400 with errorCode when AppError (USER_EXISTS_NEEDS_VERIFICATION)', async () => {
      mockRequest = {
        body: {
          email: 'existing@example.com',
          password: 'password123',
          name: 'User',
        },
      };
      mockAuthHandler.handleEmailSignUp.mockRejectedValue(
        new AppError(
          'User already exists with this email. Please verify your account.',
          ErrorCode.USER_EXISTS_NEEDS_VERIFICATION
        )
      );
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await authController.signUpWithEmail(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error:
          'User already exists with this email. Please verify your account.',
        errorCode: ErrorCode.USER_EXISTS_NEEDS_VERIFICATION,
      });
      consoleErrorSpy.mockRestore();
    });
  });

  describe('verifyEmail', () => {
    const originalEmailAuth = process.env.EMAIL_AUTH_ENABLED;

    beforeEach(() => {
      process.env.EMAIL_AUTH_ENABLED = 'true';
    });

    afterEach(() => {
      process.env.EMAIL_AUTH_ENABLED = originalEmailAuth;
    });

    it('should return 200 on success', async () => {
      mockRequest = { body: { email: 'verify@example.com', code: '123456' } };
      mockAuthHandler.handleEmailVerify.mockResolvedValue({
        user: mockAuthenticatedUser,
        token: 'jwt',
        googleAccessToken: '',
        isNewUser: false,
        permissions: ['example:read'],
      });

      await authController.verifyEmail(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Email verified successfully',
          data: expect.objectContaining({ token: 'jwt' }),
        })
      );
    });

    it('should return 400 when email or code missing', async () => {
      mockRequest = { body: { email: 'verify@example.com' } };

      await authController.verifyEmail(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Email and code are required',
      });
    });

    it('should return 404 when EMAIL_AUTH_ENABLED is false', async () => {
      process.env.EMAIL_AUTH_ENABLED = 'false';
      mockRequest = { body: { email: 'verify@example.com', code: '123456' } };

      await authController.verifyEmail(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(404);
    });

    it('should return 401 with errorCode on invalid code', async () => {
      mockRequest = { body: { email: 'verify@example.com', code: '000000' } };
      mockAuthHandler.handleEmailVerify.mockRejectedValue(
        new AppError(
          'Invalid or expired verification code',
          ErrorCode.INVALID_VERIFICATION_CODE
        )
      );
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await authController.verifyEmail(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid or expired verification code',
          errorCode: ErrorCode.INVALID_VERIFICATION_CODE,
        })
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('signInWithEmail', () => {
    const originalEmailAuth = process.env.EMAIL_AUTH_ENABLED;

    beforeEach(() => {
      process.env.EMAIL_AUTH_ENABLED = 'true';
    });

    afterEach(() => {
      process.env.EMAIL_AUTH_ENABLED = originalEmailAuth;
    });

    it('should return 200 on success', async () => {
      mockRequest = {
        body: { email: 'signin@example.com', password: 'password123' },
      };
      mockAuthHandler.handleEmailSignIn.mockResolvedValue({
        user: mockAuthenticatedUser,
        token: 'jwt',
        googleAccessToken: '',
        isNewUser: false,
        permissions: ['example:read'],
      });

      await authController.signInWithEmail(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Signed in successfully',
          data: expect.objectContaining({ token: 'jwt' }),
        })
      );
    });

    it('should return 400 when email or password missing', async () => {
      mockRequest = { body: { email: 'signin@example.com' } };

      await authController.signInWithEmail(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Email and password are required',
      });
    });

    it('should return 401 with errorCode on invalid credentials', async () => {
      mockRequest = {
        body: { email: 'signin@example.com', password: 'wrong' },
      };
      mockAuthHandler.handleEmailSignIn.mockRejectedValue(
        new AppError('Invalid email or password', ErrorCode.INVALID_CREDENTIALS)
      );
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await authController.signInWithEmail(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid email or password',
          errorCode: ErrorCode.INVALID_CREDENTIALS,
        })
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('resendVerificationCode', () => {
    const originalEmailAuth = process.env.EMAIL_AUTH_ENABLED;

    beforeEach(() => {
      process.env.EMAIL_AUTH_ENABLED = 'true';
    });

    afterEach(() => {
      process.env.EMAIL_AUTH_ENABLED = originalEmailAuth;
    });

    it('should return 200 on success', async () => {
      mockRequest = { body: { email: 'resend@example.com' } };
      mockAuthHandler.handleEmailResendCode.mockResolvedValue({
        message: 'If an account exists, a new code has been sent',
      });

      await authController.resendVerificationCode(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'If an account exists, a new code has been sent',
      });
    });

    it('should return 400 when email missing', async () => {
      mockRequest = { body: {} };

      await authController.resendVerificationCode(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Email is required',
      });
    });

    it('should return 500 on handler error', async () => {
      mockRequest = { body: { email: 'resend@example.com' } };
      mockAuthHandler.handleEmailResendCode.mockRejectedValue(
        new Error('Email service failed')
      );
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await authController.resendVerificationCode(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to resend code',
      });
      consoleErrorSpy.mockRestore();
    });
  });

  describe('requestPasswordReset', () => {
    const originalEmailAuth = process.env.EMAIL_AUTH_ENABLED;

    beforeEach(() => {
      process.env.EMAIL_AUTH_ENABLED = 'true';
    });

    afterEach(() => {
      process.env.EMAIL_AUTH_ENABLED = originalEmailAuth;
    });

    it('should return 200 on success', async () => {
      mockRequest = { body: { email: 'reset@example.com' } };
      mockAuthHandler.handleRequestPasswordReset.mockResolvedValue({
        message:
          'If an account exists, a reset link has been sent to your email',
      });

      await authController.requestPasswordReset(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message:
          'If an account exists, a reset link has been sent to your email',
      });
    });

    it('should return 400 when email missing', async () => {
      mockRequest = { body: {} };

      await authController.requestPasswordReset(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Email is required',
      });
    });

    it('should return 404 when EMAIL_AUTH_ENABLED is false', async () => {
      process.env.EMAIL_AUTH_ENABLED = 'false';
      mockRequest = { body: { email: 'reset@example.com' } };

      await authController.requestPasswordReset(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(404);
    });

    it('should return 500 on handler error', async () => {
      mockRequest = { body: { email: 'reset@example.com' } };
      mockAuthHandler.handleRequestPasswordReset.mockRejectedValue(
        new Error('Email failed')
      );
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await authController.requestPasswordReset(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to send reset link',
      });
      consoleErrorSpy.mockRestore();
    });
  });

  describe('resetPassword', () => {
    const originalEmailAuth = process.env.EMAIL_AUTH_ENABLED;

    beforeEach(() => {
      process.env.EMAIL_AUTH_ENABLED = 'true';
    });

    afterEach(() => {
      process.env.EMAIL_AUTH_ENABLED = originalEmailAuth;
    });

    it('should return 200 on success', async () => {
      mockRequest = {
        body: {
          email: 'reset@example.com',
          token: 'token123',
          newPassword: 'newpassword123',
        },
      };
      mockAuthHandler.handleResetPassword.mockResolvedValue(undefined);

      await authController.resetPassword(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Password reset successfully',
      });
    });

    it('should return 400 when email, token, or newPassword missing', async () => {
      mockRequest = { body: { email: 'reset@example.com', token: 'token123' } };

      await authController.resetPassword(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Email, token, and new password are required',
      });
    });

    it('should return 400 when newPassword too short', async () => {
      mockRequest = {
        body: {
          email: 'reset@example.com',
          token: 'token123',
          newPassword: 'short',
        },
      };

      await authController.resetPassword(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Password must be at least 8 characters',
        errorCode: ErrorCode.PASSWORD_MIN_LENGTH,
      });
    });

    it('should return 400 with errorCode on invalid token', async () => {
      mockRequest = {
        body: {
          email: 'reset@example.com',
          token: 'invalid',
          newPassword: 'newpassword123',
        },
      };
      mockAuthHandler.handleResetPassword.mockRejectedValue(
        new AppError(
          'Invalid or expired reset link',
          ErrorCode.INVALID_RESET_TOKEN
        )
      );
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await authController.resetPassword(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid or expired reset link',
          errorCode: ErrorCode.INVALID_RESET_TOKEN,
        })
      );
      consoleErrorSpy.mockRestore();
    });
  });
});
