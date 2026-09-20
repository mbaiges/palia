import 'reflect-metadata';
import { SqliteEmailVerificationRepository } from '@/infrastructure/adapters/repositories/SqliteEmailVerificationRepository';
import { EmailVerificationCode } from '@/domain/models/EmailVerificationCode';
import { DatabaseConfig } from '@/infrastructure/config/database';
import { SqliteUserRepository } from '@/infrastructure/adapters/repositories/SqliteUserRepository';
import { User } from '@/domain/models/User';

jest.mock('@/infrastructure/utils/crypto', () => ({
  encrypt: jest.fn((text: string) => `encrypted:${text}`),
  decrypt: jest.fn((text: string) => text.replace('encrypted:', '')),
}));

describe('SqliteEmailVerificationRepository', () => {
  let repository: SqliteEmailVerificationRepository;
  let userRepository: SqliteUserRepository;
  const userId = 'user-evc-1';

  beforeEach(async () => {
    await DatabaseConfig.clean();
    repository = new SqliteEmailVerificationRepository();
    userRepository = new SqliteUserRepository();
    await userRepository.save(new User(userId, 'google-1', 'test@example.com', 'Test User'));
  });

  describe('create', () => {
    it('should insert and return EmailVerificationCode', async () => {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      const code = await repository.create(userId, 'hash-123', expiresAt);

      expect(code).toBeInstanceOf(EmailVerificationCode);
      expect(code.userId).toBe(userId);
      expect(code.codeHash).toBe('hash-123');
      expect(code.expiresAt).toEqual(expiresAt);
      expect(code.id).toBeDefined();
      expect(code.createdAt).toBeInstanceOf(Date);
    });

    it('should invalidate previous codes for same user when creating new one', async () => {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await repository.create(userId, 'hash-old', expiresAt);
      const newCode = await repository.create(userId, 'hash-new', expiresAt);

      const found = await repository.findValidByUserId(userId);
      expect(found).not.toBeNull();
      expect(found?.codeHash).toBe('hash-new');
    });
  });

  describe('findValidByUserId', () => {
    it('should return null when no code exists', async () => {
      const result = await repository.findValidByUserId(userId);
      expect(result).toBeNull();
    });

    it('should return valid code when not expired', async () => {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      const created = await repository.create(userId, 'hash-valid', expiresAt);

      const found = await repository.findValidByUserId(userId);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.codeHash).toBe('hash-valid');
    });

    it('should return null when code is expired', async () => {
      const expiresAt = new Date(Date.now() - 60 * 1000);
      await repository.create(userId, 'hash-expired', expiresAt);

      const found = await repository.findValidByUserId(userId);
      expect(found).toBeNull();
    });
  });

  describe('invalidateForUser', () => {
    it('should delete all codes for user', async () => {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await repository.create(userId, 'hash-1', expiresAt);

      await repository.invalidateForUser(userId);

      const found = await repository.findValidByUserId(userId);
      expect(found).toBeNull();
    });
  });

  describe('deleteExpired', () => {
    it('should delete expired codes and return count', async () => {
      const futureExpiry = new Date(Date.now() + 15 * 60 * 1000);
      const pastExpiry = new Date(Date.now() - 60 * 1000);

      const user2 = 'user-evc-2';
      await userRepository.save(new User(user2, 'google-2', 'test2@example.com', 'Test User 2'));

      await repository.create(userId, 'hash-valid', futureExpiry);
      await repository.create(user2, 'hash-expired', pastExpiry);

      const deleted = await repository.deleteExpired();
      expect(deleted).toBe(1);

      expect(await repository.findValidByUserId(userId)).not.toBeNull();
      expect(await repository.findValidByUserId(user2)).toBeNull();
    });
  });
});
