import type { Client } from '@libsql/client';
import { Role } from '@/domain/models/Role';
import { RoleRepository } from '@/domain/repositories/RoleRepository';
import { DatabaseConfig } from '@/infrastructure/config/database';
import { queryOne, queryAll } from '@/infrastructure/db/libsql';

/**
 * SQLite/libSQL implementation of RoleRepository
 */
export class SqliteRoleRepository implements RoleRepository {
  private client: Client;

  constructor() {
    this.client = DatabaseConfig.getConnection();
  }

  async findByRoleId(roleId: string): Promise<Role | null> {
    const row = await queryOne<{ role_id: string; name: string }>(
      this.client,
      'SELECT * FROM roles WHERE role_id = ?',
      [roleId]
    );
    return row ? this.mapRowToRole(row) : null;
  }

  async findAll(): Promise<Role[]> {
    const rows = await queryAll<{ role_id: string; name: string }>(
      this.client,
      'SELECT * FROM roles ORDER BY role_id'
    );
    return rows.map((row) => this.mapRowToRole(row));
  }

  async findPermissionsByRoleId(roleId: string): Promise<string[]> {
    const rows = await queryAll<{ permission_id: string }>(
      this.client,
      'SELECT permission_id FROM role_permissions WHERE role_id = ?',
      [roleId]
    );
    return rows.map((row) => row.permission_id);
  }

  private mapRowToRole(row: { role_id: string; name: string }): Role {
    return new Role(row.role_id, row.name);
  }
}
