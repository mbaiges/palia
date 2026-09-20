import 'reflect-metadata';
import { AuthHandler } from '@/application/handlers/AuthHandler';
import { AuthService } from '@/domain/services/AuthService';
import { AuthRepository } from '@/domain/repositories/AuthRepository';
import { User } from '@/domain/models/User';
import { AuthenticatedUser } from '@/domain/models/AuthenticatedUser';
import { TokenProvider } from '@/domain/repositories/TokenProvider';
import { PermissionRepository } from '@/domain/repositories/PermissionRepository';
import { EmailVerificationRepository } from '@/domain/repositories/EmailVerificationRepository';
import { EmailSender } from '@/domain/repositories/EmailSender';

// Mock dependencies
jest.mock('@/infrastructure/adapters/auth/JwtAdapter');
const mockAuthService: jest.Mocked<AuthService> = {
  findOrCreateUser: jest.fn(),
  findOrCreateUserForDevBypass: jest.fn(),
  findOrCreateUserForEmailPassword: jest.fn(),
  verifyEmailCode: jest.fn(),
  signInWithEmailPassword: jest.fn(),
  createVerificationCode: jest.fn(),
  getUserByEmail: jest.fn(),
  requestPasswordReset: jest.fn(),
  resetPassword: jest.fn(),
  refreshGoogleAccessToken: jest.fn(),
  updateUserAuth: jest.fn(),
  validateUserExists: jest.fn(),
  getUserById: jest.fn(),
} as any;

const mockAuthRepository: jest.Mocked<AuthRepository> = {
  authenticateWithCode: jest.fn(),
  refreshAccessToken: jest.fn(),
  verifyToken: jest.fn(),
};

const mockTokenProvider: jest.Mocked<TokenProvider> = {
  generateToken: jest.fn(),
  verifyToken: jest.fn(),
};

const mockPermissionRepository: jest.Mocked<PermissionRepository> = {
  findByUserId: jest.fn(),
  findByPermissionId: jest.fn(),
  findAll: jest.fn(),
};

const mockEmailVerificationRepository: jest.Mocked<EmailVerificationRepository> = {
  create: jest.fn(),
  findValidByUserId: jest.fn(),
  invalidateForUser: jest.fn(),
  deleteExpired: jest.fn(),
} as any;

const mockEmailSender: jest.Mocked<EmailSender> = {
  sendVerificationCode: jest.fn(),
  sendPasswordReset: jest.fn(),
} as any;

describe('AuthHandler', () => {
  let authHandler: AuthHandler;

  beforeEach(() => {
    authHandler = new AuthHandler(
      mockAuthService,
      mockAuthRepository,
      mockTokenProvider,
      mockPermissionRepository,
      mockEmailVerificationRepository,
      mockEmailSender
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleGoogleSignIn', () => {
    it('should orchestrate the sign-in flow and return an auth response', async () => {
      // Arrange
      const authCode = 'test-auth-code';
      const googleId = 'google-123';
      const email = 'test@example.com';
      const name = 'Test User';
      const user = new User('user-123', googleId, email, name, undefined, undefined, undefined, undefined, undefined, true);
      const authResult = { user, isNewUser: true };
      const token = 'test-jwt-token';
      const authenticatedUser: AuthenticatedUser = user.toAuthenticatedUser();
      const permissions = ['example:read', 'example:write'];
      const repoAuthResult = {
        accessToken: 'google-access-token',
        refreshToken: 'google-refresh-token',
        scopes: ['scope1'],
        account: { provider: 'google', providerId: googleId, email, name, picture: '' },
      };

      mockAuthRepository.authenticateWithCode.mockResolvedValue(repoAuthResult);
      mockAuthService.findOrCreateUser.mockResolvedValue(authResult);
      mockTokenProvider.generateToken.mockReturnValue(token);
      mockPermissionRepository.findByUserId.mockResolvedValue(permissions);

      // Act
      const result = await authHandler.handleGoogleSignIn(authCode);

      // Assert
      expect(mockAuthRepository.authenticateWithCode).toHaveBeenCalledWith(authCode);
      expect(mockAuthService.findOrCreateUser).toHaveBeenCalledWith(
        googleId,
        email,
        name,
        undefined, // profileImageId
        undefined, // avatarImageId
        repoAuthResult.refreshToken,
        repoAuthResult.scopes
      );
      expect(mockTokenProvider.generateToken).toHaveBeenCalledWith(user);
      expect(mockPermissionRepository.findByUserId).toHaveBeenCalledWith(user.id);

      expect(result).toEqual({
        user: authenticatedUser,
        token: token,
        googleAccessToken: repoAuthResult.accessToken,
        isNewUser: true,
        permissions,
      });
    });
  });

  describe('handleDevBypass', () => {
    it('should create/find user and return auth response without Google OAuth', async () => {
      const email = 'alice@test.com';
      const name = 'Alice';
      const user = new User('user-123', 'dev-alicetestcom', email, name);
      const authResult = { user, isNewUser: true };
      const token = 'test-jwt-token';
      const authenticatedUser: AuthenticatedUser = user.toAuthenticatedUser();
      const permissions: string[] = [];

      mockAuthService.findOrCreateUserForDevBypass.mockResolvedValue(authResult);
      mockTokenProvider.generateToken.mockReturnValue(token);
      mockPermissionRepository.findByUserId.mockResolvedValue(permissions);

      const result = await authHandler.handleDevBypass(email, name);

      expect(mockAuthService.findOrCreateUserForDevBypass).toHaveBeenCalledWith(email, name);
      expect(mockAuthRepository.authenticateWithCode).not.toHaveBeenCalled();
      expect(mockTokenProvider.generateToken).toHaveBeenCalledWith(user);
      expect(mockPermissionRepository.findByUserId).toHaveBeenCalledWith(user.id);

      expect(result).toEqual({
        user: authenticatedUser,
        token,
        googleAccessToken: '',
        isNewUser: true,
        permissions,
      });
    });
  });

  describe('handleGetCurrentUser', () => {
    it('should return user and permissions when user exists', async () => {
      // Arrange
      const userId = 'user-123';
      const googleId = 'google-123';
      const email = 'test@example.com';
      const name = 'Test User';
      const user = new User(userId, googleId, email, name, undefined, undefined);
      const permissions = ['example:read', 'example:write'];
      const authenticatedUser: AuthenticatedUser = user.toAuthenticatedUser();

      mockAuthService.getUserById.mockResolvedValue(user);
      mockPermissionRepository.findByUserId.mockResolvedValue(permissions);

      // Act
      const result = await authHandler.handleGetCurrentUser(userId);

      // Assert
      expect(mockAuthService.getUserById).toHaveBeenCalledWith(userId);
      expect(mockPermissionRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual({
        user: authenticatedUser,
        permissions,
      });
    });

    it('should return null when user does not exist', async () => {
      // Arrange
      const userId = 'non-existent';
      mockAuthService.getUserById.mockResolvedValue(null);

      // Act
      const result = await authHandler.handleGetCurrentUser(userId);

      // Assert
      expect(mockAuthService.getUserById).toHaveBeenCalledWith(userId);
      expect(mockPermissionRepository.findByUserId).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('handleEmailSignUp', () => {
    it('should create user, store code, send email, and return message', async () => {
      const user = new User('user-1', null, 'new@example.com', 'New User', undefined, undefined, undefined, undefined, 'hash', false);
      const code = '123456';
      const codeHash = 'abc123';
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      mockAuthService.findOrCreateUserForEmailPassword.mockResolvedValue({ user, isNewUser: true });
      mockAuthService.createVerificationCode.mockReturnValue({ code, codeHash, expiresAt });
      mockEmailVerificationRepository.create.mockResolvedValue({} as any);

      const result = await authHandler.handleEmailSignUp('new@example.com', 'password123', 'New User');

      expect(mockAuthService.findOrCreateUserForEmailPassword).toHaveBeenCalledWith('new@example.com', 'New User', 'password123');
      expect(mockAuthService.createVerificationCode).toHaveBeenCalledWith(user.id);
      expect(mockEmailVerificationRepository.create).toHaveBeenCalledWith(user.id, codeHash, expiresAt);
      expect(mockEmailSender.sendVerificationCode).toHaveBeenCalledWith('new@example.com', code, undefined, undefined);
      expect(result).toEqual({ message: 'Verification code sent to your email' });
    });
  });

  describe('handleEmailVerify', () => {
    it('should verify code and return auth response', async () => {
      const user = new User('user-1', null, 'verify@example.com', 'User', undefined, undefined, undefined, undefined, 'hash', true);
      const token = 'jwt-token';
      const permissions = ['example:read'];

      mockAuthService.verifyEmailCode.mockResolvedValue(user);
      mockTokenProvider.generateToken.mockReturnValue(token);
      mockPermissionRepository.findByUserId.mockResolvedValue(permissions);

      const result = await authHandler.handleEmailVerify('verify@example.com', '123456');

      expect(mockAuthService.verifyEmailCode).toHaveBeenCalledWith('verify@example.com', '123456');
      expect(mockTokenProvider.generateToken).toHaveBeenCalledWith(user);
      expect(result.user).toEqual(user.toAuthenticatedUser());
      expect(result.token).toBe(token);
      expect(result.googleAccessToken).toBe('');
      expect(result.permissions).toEqual(permissions);
    });
  });

  describe('handleEmailSignIn', () => {
    it('should sign in and return auth response', async () => {
      const user = new User('user-1', null, 'signin@example.com', 'User', undefined, undefined, undefined, undefined, 'hash', true);
      const token = 'jwt-token';
      const permissions = ['example:read'];

      mockAuthService.signInWithEmailPassword.mockResolvedValue(user);
      mockTokenProvider.generateToken.mockReturnValue(token);
      mockPermissionRepository.findByUserId.mockResolvedValue(permissions);

      const result = await authHandler.handleEmailSignIn('signin@example.com', 'password123');

      expect(mockAuthService.signInWithEmailPassword).toHaveBeenCalledWith('signin@example.com', 'password123');
      expect(result.token).toBe(token);
      expect(result.user).toEqual(user.toAuthenticatedUser());
    });
  });

  describe('handleEmailResendCode', () => {
    it('should send new code when user exists and is unverified', async () => {
      const user = new User('user-1', null, 'resend@example.com', 'User', undefined, undefined, undefined, undefined, 'hash', false);
      const code = '654321';
      const codeHash = 'xyz789';
      const expiresAt = new Date();

      mockAuthService.getUserByEmail.mockResolvedValue(user);
      mockAuthService.createVerificationCode.mockReturnValue({ code, codeHash, expiresAt });

      const result = await authHandler.handleEmailResendCode('resend@example.com');

      expect(mockAuthService.getUserByEmail).toHaveBeenCalledWith('resend@example.com');
      expect(mockEmailSender.sendVerificationCode).toHaveBeenCalledWith('resend@example.com', code, undefined, undefined);
      expect(result).toEqual({ message: 'If an account exists, a new code has been sent' });
    });

    it('should return generic message when user does not exist', async () => {
      mockAuthService.getUserByEmail.mockResolvedValue(null);

      const result = await authHandler.handleEmailResendCode('nonexistent@example.com');

      expect(mockEmailSender.sendVerificationCode).not.toHaveBeenCalled();
      expect(result).toEqual({ message: 'If an account exists, a new code has been sent' });
    });

    it('should return generic message when user is already verified', async () => {
      const user = new User('user-1', null, 'verified@example.com', 'User', undefined, undefined, undefined, undefined, 'hash', true);
      mockAuthService.getUserByEmail.mockResolvedValue(user);

      const result = await authHandler.handleEmailResendCode('verified@example.com');

      expect(mockEmailSender.sendVerificationCode).not.toHaveBeenCalled();
      expect(result).toEqual({ message: 'If an account exists, a new code has been sent' });
    });
  });

  describe('handleRequestPasswordReset', () => {
    it('should delegate to authService and return generic message', async () => {
      mockAuthService.requestPasswordReset.mockResolvedValue(undefined);

      const result = await authHandler.handleRequestPasswordReset('reset@example.com');

      expect(mockAuthService.requestPasswordReset).toHaveBeenCalledWith('reset@example.com', undefined);
      expect(result).toEqual({ message: 'If an account exists, a reset link has been sent to your email' });
    });
  });

  describe('handleResetPassword', () => {
    it('should delegate to authService', async () => {
      mockAuthService.resetPassword.mockResolvedValue(undefined);

      await authHandler.handleResetPassword('reset@example.com', 'token123', 'newpassword123');

      expect(mockAuthService.resetPassword).toHaveBeenCalledWith('reset@example.com', 'token123', 'newpassword123');
    });
  });
});
