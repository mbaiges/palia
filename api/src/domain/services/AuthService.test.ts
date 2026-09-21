import 'reflect-metadata';
import * as crypto from 'crypto';
import { AuthService } from '@/domain/services/AuthService';
import { MockUserRepository } from '@/domain/repositories/mocks/MockUserRepository';
import { User } from '@/domain/models/User';
import { UserSettingsRepository } from '@/domain/repositories/UserSettingsRepository';
import { AppSettingsRepository } from '@/domain/repositories/AppSettingsRepository';
import { EmailVerificationRepository } from '@/domain/repositories/EmailVerificationRepository';
import { PasswordResetRepository } from '@/domain/repositories/PasswordResetRepository';
import { EmailSender } from '@/domain/repositories/EmailSender';
import { PasswordHasher } from '@/domain/repositories/PasswordHasher';
import { AppError } from '@/domain/errors/AppError';
import { ErrorCode } from '@/domain/errors/ErrorCodes';

const mockUserSettingsRepository: jest.Mocked<UserSettingsRepository> = {
  findByUserId: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
};

const mockAppSettingsRepository: jest.Mocked<AppSettingsRepository> = {
  getAllowedUsers: jest.fn(),
  addAllowedUser: jest.fn(),
  removeAllowedUser: jest.fn(),
  isEmailAllowed: jest.fn(),
};

const mockEmailVerificationRepository: jest.Mocked<EmailVerificationRepository> =
  {
    create: jest.fn(),
    findValidByUserId: jest.fn(),
    invalidateForUser: jest.fn(),
    deleteExpired: jest.fn(),
  } as any;

const mockPasswordResetRepository: jest.Mocked<PasswordResetRepository> = {
  create: jest.fn().mockResolvedValue({} as any),
  findValidByUserId: jest.fn(),
  invalidateForUser: jest.fn().mockResolvedValue(undefined),
  deleteExpired: jest.fn().mockResolvedValue(0),
};

const mockEmailSender: jest.Mocked<EmailSender> = {
  sendVerificationCode: jest.fn().mockResolvedValue(undefined),
  sendPasswordReset: jest.fn().mockResolvedValue(undefined),
};

const mockPasswordHasher: jest.Mocked<PasswordHasher> = {
  hash: jest.fn().mockResolvedValue('hashed-password'),
  verify: jest.fn().mockResolvedValue(true),
};

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: MockUserRepository;

  beforeEach(() => {
    mockUserRepository = new MockUserRepository();
    mockAppSettingsRepository.isEmailAllowed.mockResolvedValue(true);
    mockUserRepository.assignRole = jest.fn().mockResolvedValue(undefined);
    mockUserRepository.replaceUserRole = jest.fn().mockResolvedValue(undefined);
    mockPasswordHasher.verify.mockResolvedValue(true);
    authService = new AuthService(
      mockUserRepository,
      jest.fn() as any,
      mockUserSettingsRepository,
      mockAppSettingsRepository,
      mockEmailVerificationRepository,
      mockPasswordResetRepository,
      mockEmailSender,
      mockPasswordHasher
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockUserRepository.clear();
  });

  it('should create a new user if they do not exist', async () => {
    const result = await authService.findOrCreateUser(
      'google123',
      'test@example.com',
      'Test User',
      undefined,
      undefined,
      undefined,
      undefined
    );

    expect(result.isNewUser).toBe(true);
    expect(result.user).toBeInstanceOf(User);
    expect(result.user.email).toBe('test@example.com');
    expect(mockUserSettingsRepository.update).toHaveBeenCalled();
    expect(mockUserRepository.assignRole).toHaveBeenCalledWith(
      expect.any(String),
      'volunteer'
    );
  });

  it('should return an existing user if they do exist', async () => {
    await authService.findOrCreateUser(
      'google123',
      'test@example.com',
      'Test User',
      undefined,
      undefined,
      undefined,
      undefined
    );
    const result = await authService.findOrCreateUser(
      'google123',
      'test@example.com',
      'Test User',
      undefined,
      undefined,
      undefined,
      undefined
    );

    expect(result.isNewUser).toBe(false);
    expect(result.user.googleId).toBe('google123');
    expect(mockUserSettingsRepository.update).toHaveBeenCalledTimes(1);
  });

  it('does not reassign the bootstrap admin role on subsequent logins', async () => {
    const originalEmails = process.env.INITIAL_ADMIN_EMAILS;
    process.env.INITIAL_ADMIN_EMAILS = 'bootstrap@example.com';

    try {
      const first = await authService.findOrCreateUser(
        'google-bootstrap',
        'bootstrap@example.com',
        'Bootstrap Admin'
      );
      await authService.findOrCreateUser(
        'google-bootstrap',
        'bootstrap@example.com',
        'Bootstrap Admin'
      );

      expect(mockUserRepository.assignRole).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.assignRole).toHaveBeenCalledWith(
        first.user.id,
        'admin'
      );
      expect(mockUserRepository.replaceUserRole).not.toHaveBeenCalled();
    } finally {
      if (originalEmails === undefined) delete process.env.INITIAL_ADMIN_EMAILS;
      else process.env.INITIAL_ADMIN_EMAILS = originalEmails;
    }
  });

  it("should update a user's profile information on subsequent logins", async () => {
    await authService.findOrCreateUser(
      'google123',
      'test@example.com',
      'Old Name',
      'old_profile_id',
      undefined,
      undefined,
      undefined
    );
    const result = await authService.findOrCreateUser(
      'google123',
      'test@example.com',
      'New Name',
      'new_profile_id',
      undefined,
      undefined,
      undefined
    );

    expect(result.isNewUser).toBe(false);
    expect(result.user.name).toBe('New Name');
  });

  it("should throw 'Unauthorized' if email is not in the allowed list", async () => {
    mockAppSettingsRepository.isEmailAllowed.mockResolvedValue(false);

    await expect(
      authService.findOrCreateUser(
        'google123',
        'unauthorized@example.com',
        'Unauthorized User',
        undefined,
        undefined,
        undefined,
        undefined
      )
    ).rejects.toThrow('Unauthorized');

    expect(mockAppSettingsRepository.isEmailAllowed).toHaveBeenCalledWith(
      'unauthorized@example.com'
    );
  });

  describe('findOrCreateUserForDevBypass', () => {
    it('should create a new user without checking allowed emails', async () => {
      mockAppSettingsRepository.isEmailAllowed.mockResolvedValue(false);

      const result = await authService.findOrCreateUserForDevBypass(
        'alice@test.com',
        'Alice'
      );

      expect(result.isNewUser).toBe(true);
      expect(result.user).toBeInstanceOf(User);
      expect(result.user.email).toBe('alice@test.com');
      expect(result.user.name).toBe('Alice');
      expect(result.user.googleId).toBe('dev-alicetestcom');
      expect(mockAppSettingsRepository.isEmailAllowed).not.toHaveBeenCalled();
    });

    it('should return existing user on second call with same email', async () => {
      const first = await authService.findOrCreateUserForDevBypass(
        'bob@test.com',
        'Bob'
      );
      const second = await authService.findOrCreateUserForDevBypass(
        'bob@test.com',
        'Bob'
      );

      expect(first.isNewUser).toBe(true);
      expect(second.isNewUser).toBe(false);
      expect(second.user.id).toBe(first.user.id);
      expect(second.user.googleId).toBe('dev-bobtestcom');
    });

    it('should assign admin role when DEV_ADMIN_EMAIL matches', async () => {
      const originalEnv = process.env.DEV_ADMIN_EMAIL;
      process.env.DEV_ADMIN_EMAIL = 'admin@test.com';

      const result = await authService.findOrCreateUserForDevBypass(
        'admin@test.com',
        'Admin'
      );

      expect(result.isNewUser).toBe(true);
      expect(result.user.email).toBe('admin@test.com');
      expect(mockUserRepository.replaceUserRole).toHaveBeenCalledWith(
        result.user.id,
        'admin'
      );

      process.env.DEV_ADMIN_EMAIL = originalEnv;
    });

    it('should not assign admin role when DEV_ADMIN_EMAIL does not match', async () => {
      process.env.DEV_ADMIN_EMAIL = 'admin@test.com';

      const result = await authService.findOrCreateUserForDevBypass(
        'alice@test.com',
        'Alice'
      );

      expect(result.user.email).toBe('alice@test.com');
      expect(mockUserRepository.replaceUserRole).not.toHaveBeenCalled();

      delete process.env.DEV_ADMIN_EMAIL;
    });
  });

  describe('findOrCreateUserForEmailPassword', () => {
    it('should create a new email/password user when allowed', async () => {
      const result = await authService.findOrCreateUserForEmailPassword(
        'new@example.com',
        'New User',
        'password123'
      );

      expect(result.isNewUser).toBe(true);
      expect(result.user.email).toBe('new@example.com');
      expect(result.user.name).toBe('New User');
      expect(result.user.googleId).toBeNull();
      expect(result.user.passwordHash).toBe('hashed-password');
      expect(result.user.emailVerified).toBe(false);
      expect(mockPasswordHasher.hash).toHaveBeenCalledWith('password123');
      expect(mockUserRepository.assignRole).toHaveBeenCalledWith(
        expect.any(String),
        'user'
      );
    });

    it('should throw when email is not allowed', async () => {
      mockAppSettingsRepository.isEmailAllowed.mockResolvedValue(false);

      await expect(
        authService.findOrCreateUserForEmailPassword(
          'unauthorized@example.com',
          'User',
          'password123'
        )
      ).rejects.toThrow('Unauthorized');
    });

    it('should throw USER_EXISTS_NEEDS_VERIFICATION when user exists and is unverified', async () => {
      await authService.findOrCreateUserForEmailPassword(
        'existing@example.com',
        'User',
        'password123'
      );
      mockUserRepository.assignRole = jest.fn().mockResolvedValue(undefined);

      await expect(
        authService.findOrCreateUserForEmailPassword(
          'existing@example.com',
          'User',
          'password123'
        )
      ).rejects.toMatchObject({
        message:
          'User already exists with this email. Please verify your account.',
        errorCode: ErrorCode.USER_EXISTS_NEEDS_VERIFICATION,
      });
    });

    it('should throw when verified email user exists', async () => {
      const { user } = await authService.findOrCreateUserForEmailPassword(
        'verified@example.com',
        'User',
        'password123'
      );
      await mockUserRepository.updateEmailVerified(user.id, true);

      await expect(
        authService.findOrCreateUserForEmailPassword(
          'verified@example.com',
          'Other',
          'otherpass'
        )
      ).rejects.toThrow('An account with this email already exists.');
    });

    it('should throw when Google user exists with same email', async () => {
      await authService.findOrCreateUser(
        'google-123',
        'google@example.com',
        'Google User',
        undefined,
        undefined,
        undefined,
        undefined
      );

      await expect(
        authService.findOrCreateUserForEmailPassword(
          'google@example.com',
          'User',
          'password123'
        )
      ).rejects.toThrow(
        'An account with this email already exists. Please sign in with Google.'
      );
    });
  });

  describe('verifyEmailCode', () => {
    it('should verify valid code and mark user as verified', async () => {
      const { user } = await authService.findOrCreateUserForEmailPassword(
        'verify@example.com',
        'User',
        'password123'
      );
      const { code, codeHash, expiresAt } = authService.createVerificationCode(
        user.id
      );
      const storedCode = {
        id: '1',
        userId: user.id,
        codeHash,
        expiresAt,
        createdAt: new Date(),
      };
      mockEmailVerificationRepository.findValidByUserId.mockResolvedValue(
        storedCode as any
      );

      const verified = await authService.verifyEmailCode(
        'verify@example.com',
        code
      );

      expect(verified.emailVerified).toBe(true);
      expect(
        mockEmailVerificationRepository.invalidateForUser
      ).toHaveBeenCalledWith(user.id);
    });

    it('should throw INVALID_VERIFICATION_CODE when user not found', async () => {
      await expect(
        authService.verifyEmailCode('nonexistent@example.com', '123456')
      ).rejects.toThrow(AppError);
      await expect(
        authService.verifyEmailCode('nonexistent@example.com', '123456')
      ).rejects.toMatchObject({
        errorCode: ErrorCode.INVALID_VERIFICATION_CODE,
      });
    });

    it('should throw INVALID_VERIFICATION_CODE when no stored code', async () => {
      await authService.findOrCreateUserForEmailPassword(
        'nocode@example.com',
        'User',
        'password123'
      );
      mockEmailVerificationRepository.findValidByUserId.mockResolvedValue(null);

      await expect(
        authService.verifyEmailCode('nocode@example.com', '123456')
      ).rejects.toThrow(AppError);
      await expect(
        authService.verifyEmailCode('nocode@example.com', '123456')
      ).rejects.toMatchObject({
        errorCode: ErrorCode.INVALID_VERIFICATION_CODE,
      });
    });

    it('should throw INVALID_VERIFICATION_CODE when code does not match', async () => {
      const { user } = await authService.findOrCreateUserForEmailPassword(
        'wrong@example.com',
        'User',
        'password123'
      );
      const wrongHash = crypto
        .createHash('sha256')
        .update('999999')
        .digest('hex');
      mockEmailVerificationRepository.findValidByUserId.mockResolvedValue({
        id: '1',
        userId: user.id,
        codeHash: wrongHash,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        createdAt: new Date(),
      } as any);

      await expect(
        authService.verifyEmailCode('wrong@example.com', '123456')
      ).rejects.toThrow(AppError);
    });
  });

  describe('signInWithEmailPassword', () => {
    it('should return user on valid credentials', async () => {
      const { user } = await authService.findOrCreateUserForEmailPassword(
        'signin@example.com',
        'User',
        'password123'
      );
      await mockUserRepository.updateEmailVerified(user.id, true);

      const result = await authService.signInWithEmailPassword(
        'signin@example.com',
        'password123'
      );

      expect(result.email).toBe('signin@example.com');
      expect(mockPasswordHasher.verify).toHaveBeenCalledWith(
        'password123',
        'hashed-password'
      );
    });

    it('should throw INVALID_CREDENTIALS when user not found', async () => {
      await expect(
        authService.signInWithEmailPassword('nobody@example.com', 'password123')
      ).rejects.toThrow(AppError);
      await expect(
        authService.signInWithEmailPassword('nobody@example.com', 'password123')
      ).rejects.toMatchObject({
        errorCode: ErrorCode.INVALID_CREDENTIALS,
      });
    });

    it('should throw INVALID_CREDENTIALS when password wrong', async () => {
      await authService.findOrCreateUserForEmailPassword(
        'wrongpass@example.com',
        'User',
        'password123'
      );
      const user = await mockUserRepository.findByEmail(
        'wrongpass@example.com'
      );
      if (user) await mockUserRepository.updateEmailVerified(user.id, true);
      mockPasswordHasher.verify.mockResolvedValue(false);

      await expect(
        authService.signInWithEmailPassword('wrongpass@example.com', 'wrong')
      ).rejects.toThrow(AppError);
      await expect(
        authService.signInWithEmailPassword('wrongpass@example.com', 'wrong')
      ).rejects.toMatchObject({
        errorCode: ErrorCode.INVALID_CREDENTIALS,
      });
    });

    it('should throw EMAIL_NOT_VERIFIED when user not verified', async () => {
      await authService.findOrCreateUserForEmailPassword(
        'unverified@example.com',
        'User',
        'password123'
      );

      await expect(
        authService.signInWithEmailPassword(
          'unverified@example.com',
          'password123'
        )
      ).rejects.toThrow(AppError);
      await expect(
        authService.signInWithEmailPassword(
          'unverified@example.com',
          'password123'
        )
      ).rejects.toMatchObject({
        errorCode: ErrorCode.EMAIL_NOT_VERIFIED,
      });
    });

    it('should throw INVALID_CREDENTIALS when user is Google-only', async () => {
      await authService.findOrCreateUser(
        'google-1',
        'googleonly@example.com',
        'Google User',
        undefined,
        undefined,
        undefined,
        undefined
      );

      await expect(
        authService.signInWithEmailPassword('googleonly@example.com', 'any')
      ).rejects.toThrow(AppError);
      await expect(
        authService.signInWithEmailPassword('googleonly@example.com', 'any')
      ).rejects.toMatchObject({
        errorCode: ErrorCode.INVALID_CREDENTIALS,
      });
    });
  });

  describe('createVerificationCode', () => {
    it('should return code, codeHash, and expiresAt', () => {
      const userId = 'user-123';
      const result = authService.createVerificationCode(userId);

      expect(result.code).toMatch(/^\d{6}$/);
      expect(result.codeHash).toMatch(/^[a-f0-9]{64}$/);
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('requestPasswordReset', () => {
    it('should create token and send email when user exists', async () => {
      const { user } = await authService.findOrCreateUserForEmailPassword(
        'reset@example.com',
        'User',
        'password123'
      );

      await authService.requestPasswordReset('reset@example.com');

      expect(mockPasswordResetRepository.create).toHaveBeenCalledWith(
        user.id,
        expect.any(String),
        expect.any(Date)
      );
      expect(mockEmailSender.sendPasswordReset).toHaveBeenCalledWith(
        'reset@example.com',
        expect.stringContaining('/login/reset-password'),
        undefined,
        undefined
      );
    });

    it('should do nothing when user does not exist', async () => {
      await authService.requestPasswordReset('nonexistent@example.com');

      expect(mockPasswordResetRepository.create).not.toHaveBeenCalled();
      expect(mockEmailSender.sendPasswordReset).not.toHaveBeenCalled();
    });

    it('should do nothing when user is Google-only', async () => {
      await authService.findOrCreateUser(
        'google-1',
        'google@example.com',
        'Google User',
        undefined,
        undefined,
        undefined,
        undefined
      );

      await authService.requestPasswordReset('google@example.com');

      expect(mockPasswordResetRepository.create).not.toHaveBeenCalled();
      expect(mockEmailSender.sendPasswordReset).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should update password and invalidate token when valid', async () => {
      const { user } = await authService.findOrCreateUserForEmailPassword(
        'reset2@example.com',
        'User',
        'oldpass'
      );
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      mockPasswordResetRepository.findValidByUserId.mockResolvedValue({
        id: '1',
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date(),
      } as any);

      await authService.resetPassword(
        'reset2@example.com',
        token,
        'newpassword123'
      );

      expect(mockPasswordHasher.hash).toHaveBeenCalledWith('newpassword123');
      expect(
        mockPasswordResetRepository.invalidateForUser
      ).toHaveBeenCalledWith(user.id);
      const updatedUser = await mockUserRepository.findById(user.id);
      expect(updatedUser?.passwordHash).toBe('hashed-password');
    });

    it('should throw INVALID_RESET_TOKEN when user not found', async () => {
      await expect(
        authService.resetPassword('nobody@example.com', 'token', 'newpass123')
      ).rejects.toThrow(AppError);
      await expect(
        authService.resetPassword('nobody@example.com', 'token', 'newpass123')
      ).rejects.toMatchObject({
        errorCode: ErrorCode.INVALID_RESET_TOKEN,
      });
    });

    it('should throw INVALID_RESET_TOKEN when no stored token', async () => {
      await authService.findOrCreateUserForEmailPassword(
        'notoken@example.com',
        'User',
        'pass123'
      );
      mockPasswordResetRepository.findValidByUserId.mockResolvedValue(null);

      await expect(
        authService.resetPassword(
          'notoken@example.com',
          'anytoken',
          'newpass123'
        )
      ).rejects.toThrow(AppError);
      await expect(
        authService.resetPassword(
          'notoken@example.com',
          'anytoken',
          'newpass123'
        )
      ).rejects.toMatchObject({
        errorCode: ErrorCode.INVALID_RESET_TOKEN,
      });
    });

    it('should throw INVALID_RESET_TOKEN when token does not match', async () => {
      const { user } = await authService.findOrCreateUserForEmailPassword(
        'wrongtoken@example.com',
        'User',
        'pass123'
      );
      const wrongHash = crypto
        .createHash('sha256')
        .update('wrongtoken')
        .digest('hex');
      mockPasswordResetRepository.findValidByUserId.mockResolvedValue({
        id: '1',
        userId: user.id,
        tokenHash: wrongHash,
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date(),
      } as any);

      await expect(
        authService.resetPassword(
          'wrongtoken@example.com',
          'validtoken',
          'newpass123'
        )
      ).rejects.toThrow(AppError);
    });
  });
});
