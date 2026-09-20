import 'reflect-metadata';
import { SqliteAppSettingsRepository } from '@/infrastructure/adapters/repositories/SqliteAppSettingsRepository';
import { DatabaseConfig } from '@/infrastructure/config/database';

describe('SqliteAppSettingsRepository', () => {
  let repository: SqliteAppSettingsRepository;
  const client = DatabaseConfig.getConnection();

  beforeEach(async () => {
    await DatabaseConfig.clean();
    repository = new SqliteAppSettingsRepository();
  });

  describe('getAllowedUsers', () => {
    it('should return empty array when no users exist', async () => {
      const result = await repository.getAllowedUsers();
      expect(result).toEqual([]);
    });

    it('should return all allowed users ordered by email', async () => {
      const now = new Date().toISOString();
      await client.execute({
        sql: 'INSERT INTO app_settings_allowed_users (email, created_at) VALUES (?, ?)',
        args: ['b@example.com', now],
      });
      await client.execute({
        sql: 'INSERT INTO app_settings_allowed_users (email, created_at) VALUES (?, ?)',
        args: ['a@example.com', now],
      });
      await client.execute({
        sql: 'INSERT INTO app_settings_allowed_users (email, created_at) VALUES (?, ?)',
        args: ['c@example.com', now],
      });

      const result = await repository.getAllowedUsers();
      expect(result).toEqual(['a@example.com', 'b@example.com', 'c@example.com']);
    });
  });

  describe('addAllowedUser', () => {
    it('should add a new allowed user', async () => {
      await repository.addAllowedUser('newuser@example.com');
      const result = await repository.getAllowedUsers();
      expect(result).toContain('newuser@example.com');
    });

    it('should normalize email to lowercase and trim', async () => {
      await repository.addAllowedUser('  USER@EXAMPLE.COM  ');
      const result = await repository.isEmailAllowed('user@example.com');
      expect(result).toBe(true);
    });
  });

  describe('removeAllowedUser', () => {
    it('should remove an existing allowed user', async () => {
      const now = new Date().toISOString();
      await client.execute({
        sql: 'INSERT INTO app_settings_allowed_users (email, created_at) VALUES (?, ?)',
        args: ['user@example.com', now],
      });

      await repository.removeAllowedUser('user@example.com');
      const result = await repository.getAllowedUsers();
      expect(result).not.toContain('user@example.com');
    });

    it('should normalize email to lowercase and trim when removing', async () => {
      const now = new Date().toISOString();
      await client.execute({
        sql: 'INSERT INTO app_settings_allowed_users (email, created_at) VALUES (?, ?)',
        args: ['user@example.com', now],
      });

      await repository.removeAllowedUser('  USER@EXAMPLE.COM  ');
      const result = await repository.getAllowedUsers();
      expect(result).not.toContain('user@example.com');
    });
  });

  describe('isEmailAllowed', () => {
    it('should return true when email exists', async () => {
      const now = new Date().toISOString();
      await client.execute({
        sql: 'INSERT INTO app_settings_allowed_users (email, created_at) VALUES (?, ?)',
        args: ['user@example.com', now],
      });

      const result = await repository.isEmailAllowed('user@example.com');
      expect(result).toBe(true);
    });

    it('should return false when email does not exist', async () => {
      const result = await repository.isEmailAllowed('nonexistent@example.com');
      expect(result).toBe(false);
    });

    it('should normalize email to lowercase and trim when checking', async () => {
      const now = new Date().toISOString();
      await client.execute({
        sql: 'INSERT INTO app_settings_allowed_users (email, created_at) VALUES (?, ?)',
        args: ['user@example.com', now],
      });

      const result = await repository.isEmailAllowed('  USER@EXAMPLE.COM  ');
      expect(result).toBe(true);
    });
  });
});
