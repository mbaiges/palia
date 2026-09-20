import 'reflect-metadata';
import { SqlitePermissionRepository } from '@/infrastructure/adapters/repositories/SqlitePermissionRepository';
import { Permission } from '@/domain/models/Permission';
import { DatabaseConfig } from '@/infrastructure/config/database';

describe('SqlitePermissionRepository', () => {
  let repository: SqlitePermissionRepository;
  const client = DatabaseConfig.getConnection();

  beforeEach(async () => {
    await DatabaseConfig.clean();
    repository = new SqlitePermissionRepository();
  });

  describe('findByPermissionId', () => {
    it('should return null when permission does not exist', async () => {
      const result = await repository.findByPermissionId('nonexistent');
      expect(result).toBeNull();
    });

    it('should return permission when it exists', async () => {
      await client.execute({
        sql: 'INSERT INTO permissions (permission_id, description) VALUES (?, ?)',
        args: ['example:read', 'Allows the user to view example items'],
      });

      const result = await repository.findByPermissionId('example:read');
      expect(result).toBeInstanceOf(Permission);
      expect(result?.permissionId).toBe('example:read');
      expect(result?.description).toBe('Allows the user to view example items');
    });
  });

  describe('findAll', () => {
    it('should return empty array when no permissions exist', async () => {
      const result = await repository.findAll();
      expect(result).toEqual([]);
    });

    it('should return all permissions ordered by permission_id', async () => {
      await client.execute({
        sql: 'INSERT INTO permissions (permission_id, description) VALUES (?, ?)',
        args: ['perm2', 'Permission 2'],
      });
      await client.execute({
        sql: 'INSERT INTO permissions (permission_id, description) VALUES (?, ?)',
        args: ['perm1', 'Permission 1'],
      });
      await client.execute({
        sql: 'INSERT INTO permissions (permission_id, description) VALUES (?, ?)',
        args: ['perm3', 'Permission 3'],
      });

      const result = await repository.findAll();
      expect(result).toHaveLength(3);
      expect(result[0].permissionId).toBe('perm1');
      expect(result[1].permissionId).toBe('perm2');
      expect(result[2].permissionId).toBe('perm3');
      expect(result.every((p) => p instanceof Permission)).toBe(true);
    });
  });

  describe('findByUserId', () => {
    it('should return empty array when user has no roles', async () => {
      const userId = 'user-1';
      const now = new Date().toISOString();
      await client.execute({
        sql: 'INSERT INTO users (id, google_id, email, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        args: [userId, 'google-1', 'user@example.com', 'Test User', now, now],
      });

      const result = await repository.findByUserId(userId);
      expect(result).toEqual([]);
    });

    it('should return all permissions for user through their roles', async () => {
      const userId = 'user-1';
      const now = new Date().toISOString();
      await client.execute({
        sql: 'INSERT INTO users (id, google_id, email, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        args: [userId, 'google-1', 'user@example.com', 'Test User', now, now],
      });
      await client.execute({
        sql: 'INSERT INTO roles (role_id, name) VALUES (?, ?)',
        args: ['admin', 'Administrator'],
      });
      await client.execute({
        sql: 'INSERT INTO permissions (permission_id, description) VALUES (?, ?)',
        args: ['perm1', 'Permission 1'],
      });
      await client.execute({
        sql: 'INSERT INTO permissions (permission_id, description) VALUES (?, ?)',
        args: ['perm2', 'Permission 2'],
      });
      await client.execute({
        sql: 'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
        args: [userId, 'admin'],
      });
      await client.execute({
        sql: 'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
        args: ['admin', 'perm1'],
      });
      await client.execute({
        sql: 'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
        args: ['admin', 'perm2'],
      });

      const result = await repository.findByUserId(userId);
      expect(result).toHaveLength(2);
      expect(result).toContain('perm1');
      expect(result).toContain('perm2');
    });

    it('should return distinct permissions when user has multiple roles with overlapping permissions', async () => {
      const userId = 'user-1';
      const now = new Date().toISOString();
      await client.execute({
        sql: 'INSERT INTO users (id, google_id, email, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        args: [userId, 'google-1', 'user@example.com', 'Test User', now, now],
      });
      await client.execute({ sql: 'INSERT INTO roles (role_id, name) VALUES (?, ?)', args: ['role1', 'Role 1'] });
      await client.execute({ sql: 'INSERT INTO roles (role_id, name) VALUES (?, ?)', args: ['role2', 'Role 2'] });
      await client.execute({
        sql: 'INSERT INTO permissions (permission_id, description) VALUES (?, ?)',
        args: ['perm1', 'Permission 1'],
      });
      await client.execute({
        sql: 'INSERT INTO permissions (permission_id, description) VALUES (?, ?)',
        args: ['perm2', 'Permission 2'],
      });
      await client.execute({
        sql: 'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
        args: [userId, 'role1'],
      });
      await client.execute({
        sql: 'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
        args: [userId, 'role2'],
      });
      await client.execute({
        sql: 'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
        args: ['role1', 'perm1'],
      });
      await client.execute({
        sql: 'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
        args: ['role1', 'perm2'],
      });
      await client.execute({
        sql: 'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
        args: ['role2', 'perm1'],
      });

      const result = await repository.findByUserId(userId);
      expect(result).toHaveLength(2);
      expect(result).toContain('perm1');
      expect(result).toContain('perm2');
    });
  });
});
