import 'reflect-metadata';
import { SqlitePasswordResetRepository } from '@/infrastructure/adapters/repositories/SqlitePasswordResetRepository';
import { DatabaseConfig } from '@/infrastructure/config/database';
import { SqliteUserRepository } from '@/infrastructure/adapters/repositories/SqliteUserRepository';
import { User } from '@/domain/models/User';

jest.mock('@/infrastructure/utils/crypto', () => ({
  encrypt: jest.fn((text: string) => `encrypted:${text}`),
  decrypt: jest.fn((text: string) => text.replace('encrypted:', '')),
}));

describe('SqlitePasswordResetRepository', () => {
  let repository: SqlitePasswordResetRepository;
  let userRepository: SqliteUserRepository;
  const userId = 'user-pr-1';

  beforeEach(async () => {
    await DatabaseConfig.clean();
    repository = new SqlitePasswordResetRepository();
    userRepository = new SqliteUserRepository();
    await userRepository.save(new User(userId, 'google-1', 'test@example.com', 'Test User'));
  });

  describe('create', () => {
    it('should insert and return PasswordResetToken', async () => {
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      const token = await repository.create(userId, 'token-hash-123', expiresAt);

      expect(token.userId).toBe(userId);
      expect(token.tokenHash).toBe('token-hash-123');
      expect(token.expiresAt).toEqual(expiresAt);
      expect(token.id).toBeDefined();
      expect(token.createdAt).toBeInstanceOf(Date);
    });

    it('should invalidate previous tokens for same user when creating new one', async () => {
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await repository.create(userId, 'hash-old', expiresAt);
      const newToken = await repository.create(userId, 'hash-new', expiresAt);

      const found = await repository.findValidByUserId(userId);
      expect(found).not.toBeNull();
      expect(found?.tokenHash).toBe('hash-new');
    });
  });

  describe('findValidByUserId', () => {
    it('should return null when no token exists', async () => {
      const result = await repository.findValidByUserId(userId);
      expect(result).toBeNull();
    });

    it('should return valid token when not expired', async () => {
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      const created = await repository.create(userId, 'hash-valid', expiresAt);

      const found = await repository.findValidByUserId(userId);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.tokenHash).toBe('hash-valid');
    });

    it('should return null when token is expired', async () => {
      const expiresAt = new Date(Date.now() - 60 * 1000);
      await repository.create(userId, 'hash-expired', expiresAt);

      const found = await repository.findValidByUserId(userId);
      expect(found).toBeNull();
    });
  });

  describe('invalidateForUser', () => {
    it('should delete all tokens for user', async () => {
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await repository.create(userId, 'hash-1', expiresAt);

      await repository.invalidateForUser(userId);

      const found = await repository.findValidByUserId(userId);
      expect(found).toBeNull();
    });
  });

  describe('deleteExpired', () => {
    it('should delete expired tokens and return count', async () => {
      const futureExpiry = new Date(Date.now() + 60 * 60 * 1000);
      const pastExpiry = new Date(Date.now() - 60 * 1000);

      const user2 = 'user-pr-2';
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
