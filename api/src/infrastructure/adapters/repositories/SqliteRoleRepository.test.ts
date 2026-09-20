import 'reflect-metadata';
import { SqliteRoleRepository } from '@/infrastructure/adapters/repositories/SqliteRoleRepository';
import { Role } from '@/domain/models/Role';
import { DatabaseConfig } from '@/infrastructure/config/database';

describe('SqliteRoleRepository', () => {
  let repository: SqliteRoleRepository;
  const client = DatabaseConfig.getConnection();

  beforeEach(async () => {
    await DatabaseConfig.clean();
    repository = new SqliteRoleRepository();
  });

  describe('findByRoleId', () => {
    it('should return null when role does not exist', async () => {
      const result = await repository.findByRoleId('nonexistent');
      expect(result).toBeNull();
    });

    it('should return role when it exists', async () => {
      await client.execute({
        sql: 'INSERT INTO roles (role_id, name) VALUES (?, ?)',
        args: ['admin', 'Administrator'],
      });

      const result = await repository.findByRoleId('admin');
      expect(result).toBeInstanceOf(Role);
      expect(result?.roleId).toBe('admin');
      expect(result?.name).toBe('Administrator');
    });
  });

  describe('findAll', () => {
    it('should return empty array when no roles exist', async () => {
      const result = await repository.findAll();
      expect(result).toEqual([]);
    });

    it('should return all roles ordered by role_id', async () => {
      await client.execute({ sql: 'INSERT INTO roles (role_id, name) VALUES (?, ?)', args: ['editor', 'Editor'] });
      await client.execute({ sql: 'INSERT INTO roles (role_id, name) VALUES (?, ?)', args: ['admin', 'Administrator'] });
      await client.execute({ sql: 'INSERT INTO roles (role_id, name) VALUES (?, ?)', args: ['user', 'User'] });

      const result = await repository.findAll();
      expect(result).toHaveLength(3);
      expect(result[0].roleId).toBe('admin');
      expect(result[1].roleId).toBe('editor');
      expect(result[2].roleId).toBe('user');
      expect(result.every((r) => r instanceof Role)).toBe(true);
    });
  });

  describe('findPermissionsByRoleId', () => {
    it('should return empty array when role has no permissions', async () => {
      await client.execute({ sql: 'INSERT INTO roles (role_id, name) VALUES (?, ?)', args: ['user', 'User'] });

      const result = await repository.findPermissionsByRoleId('user');
      expect(result).toEqual([]);
    });

    it('should return all permissions for a role', async () => {
      await client.execute({ sql: 'INSERT INTO roles (role_id, name) VALUES (?, ?)', args: ['admin', 'Administrator'] });
      await client.execute({
        sql: 'INSERT INTO permissions (permission_id, description) VALUES (?, ?)',
        args: ['perm1', 'Permission 1'],
      });
      await client.execute({
        sql: 'INSERT INTO permissions (permission_id, description) VALUES (?, ?)',
        args: ['perm2', 'Permission 2'],
      });
      await client.execute({
        sql: 'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
        args: ['admin', 'perm1'],
      });
      await client.execute({
        sql: 'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
        args: ['admin', 'perm2'],
      });

      const result = await repository.findPermissionsByRoleId('admin');
      expect(result).toHaveLength(2);
      expect(result).toContain('perm1');
      expect(result).toContain('perm2');
    });
  });
});
