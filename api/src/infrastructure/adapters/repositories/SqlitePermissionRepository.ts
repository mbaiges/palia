import type { Client } from '@libsql/client';
import { Permission } from '@/domain/models/Permission';
import { PermissionRepository } from '@/domain/repositories/PermissionRepository';
import { DatabaseConfig } from '@/infrastructure/config/database';
import { queryOne, queryAll } from '@/infrastructure/db/libsql';

/**
 * SQLite/libSQL implementation of PermissionRepository
 */
export class SqlitePermissionRepository implements PermissionRepository {
  private client: Client;

  constructor() {
    this.client = DatabaseConfig.getConnection();
  }

  async findByPermissionId(permissionId: string): Promise<Permission | null> {
    const row = await queryOne<{ permission_id: string; description: string }>(
      this.client,
      'SELECT * FROM permissions WHERE permission_id = ?',
      [permissionId]
    );
    return row ? this.mapRowToPermission(row) : null;
  }

  async findAll(): Promise<Permission[]> {
    const rows = await queryAll<{ permission_id: string; description: string }>(
      this.client,
      'SELECT * FROM permissions ORDER BY permission_id'
    );
    return rows.map((row) => this.mapRowToPermission(row));
  }

  async findByUserId(userId: string): Promise<string[]> {
    const rows = await queryAll<{ permission_id: string }>(
      this.client,
      `SELECT DISTINCT rp.permission_id
       FROM user_roles ur
       INNER JOIN role_permissions rp ON ur.role_id = rp.role_id
       WHERE ur.user_id = ?`,
      [userId]
    );
    return rows.map((row) => row.permission_id);
  }

  private mapRowToPermission(row: { permission_id: string; description: string }): Permission {
    return new Permission(row.permission_id, row.description);
  }
}
