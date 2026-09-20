import type { Client } from '@libsql/client';
import { User } from '@/domain/models/User';
import { PublicUser } from '@/domain/models/PublicUser';
import { UserRepository } from '@/domain/repositories/UserRepository';
import { PaginatedResult } from '@/domain/models/PaginatedResult';
import { SearchUsersParams } from '@/domain/models/SearchUsersParams';
import { SearchUsersWithRolesParams } from '@/domain/models/SearchUsersWithRolesParams';
import { DatabaseConfig } from '@/infrastructure/config/database';
import { encrypt, decrypt } from '@/infrastructure/utils/crypto';
import { queryOne, queryAll, execute } from '@/infrastructure/db/libsql';

type UserRow = {
  id: string;
  google_id: string | null;
  email: string;
  name: string;
  profile_image_id: string | null;
  avatar_image_id: string | null;
  google_refresh_token: string | null;
  google_scopes: string | null;
  password_hash: string | null;
  email_verified: number;
  created_at: string;
  updated_at: string;
};

/**
 * SQLite/libSQL implementation of UserRepository
 */
export class SqliteUserRepository implements UserRepository {
  private client: Client;

  constructor() {
    this.client = DatabaseConfig.getConnection();
  }

  async findById(id: string): Promise<User | null> {
    const row = await queryOne<UserRow>(this.client, 'SELECT * FROM users WHERE id = ?', [id]);
    return row ? this.mapRowToUser(row) : null;
  }

  async findPublicById(id: string): Promise<PublicUser | null> {
    const row = await queryOne<UserRow>(this.client, 'SELECT * FROM users WHERE id = ?', [id]);
    return row ? this.mapRowToPublicUser(row) : null;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const row = await queryOne<UserRow>(
      this.client,
      'SELECT * FROM users WHERE google_id = ?',
      [googleId]
    );
    return row ? this.mapRowToUser(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await queryOne<UserRow>(this.client, 'SELECT * FROM users WHERE email = ?', [email]);
    return row ? this.mapRowToUser(row) : null;
  }

  async findPublicAll(): Promise<PublicUser[]> {
    const rows = await queryAll<UserRow>(
      this.client,
      'SELECT id, google_id, email, name, profile_image_id, created_at, updated_at FROM users ORDER BY created_at DESC'
    );
    return rows.map((row) => this.mapRowToPublicUser(row));
  }

  async searchUsers(params: SearchUsersParams): Promise<PaginatedResult<PublicUser>> {
    const { page, limit, searchQuery } = params;
    const offset = (page - 1) * limit;

    let query = 'SELECT id, google_id, email, name, profile_image_id, created_at, updated_at FROM users';
    const conditions: string[] = [];
    const queryParams: unknown[] = [];

    if (searchQuery?.trim()) {
      const searchTerm = `%${searchQuery.trim()}%`;
      conditions.push('(email LIKE ? OR name LIKE ?)');
      queryParams.push(searchTerm, searchTerm);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY email ASC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    const rows = await queryAll<UserRow>(this.client, query, queryParams);
    const items = rows.map((row) => this.mapRowToPublicUser(row));

    const totalItems = await this.countUsers(searchQuery);
    const totalPages = Math.ceil(totalItems / limit);

    return {
      items,
      totalItems,
      itemCount: items.length,
      itemsPerPage: limit,
      totalPages,
      currentPage: page,
    };
  }

  async countUsers(searchQuery?: string): Promise<number> {
    let query = 'SELECT COUNT(*) as count FROM users';
    const conditions: string[] = [];
    const queryParams: unknown[] = [];

    if (searchQuery?.trim()) {
      const searchTerm = `%${searchQuery.trim()}%`;
      conditions.push('(email LIKE ? OR name LIKE ?)');
      queryParams.push(searchTerm, searchTerm);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const row = await queryOne<{ count: number }>(this.client, query, queryParams);
    return row?.count ?? 0;
  }

  async save(user: User): Promise<User> {
    const existing = await queryOne<{ id: string }>(this.client, 'SELECT id FROM users WHERE id = ?', [user.id]);
    if (existing) {
      await execute(
        this.client,
        'UPDATE users SET name = ?, profile_image_id = ?, avatar_image_id = ?, google_refresh_token = ?, google_scopes = ?, password_hash = ?, email_verified = ?, updated_at = ? WHERE id = ?',
        [
          user.name,
          user.profileImageId || null,
          user.avatarImageId || null,
          user.googleRefreshToken ? encrypt(user.googleRefreshToken) : null,
          user.googleScopes ? JSON.stringify(user.googleScopes) : null,
          user.passwordHash || null,
          user.emailVerified ? 1 : 0,
          user.updatedAt.toISOString(),
          user.id,
        ]
      );
    } else {
      await execute(
        this.client,
        'INSERT INTO users (id, google_id, email, name, profile_image_id, avatar_image_id, google_refresh_token, google_scopes, password_hash, email_verified, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          user.id,
          user.googleId,
          user.email,
          user.name,
          user.profileImageId || null,
          user.avatarImageId || null,
          user.googleRefreshToken ? encrypt(user.googleRefreshToken) : null,
          user.googleScopes ? JSON.stringify(user.googleScopes) : null,
          user.passwordHash || null,
          user.emailVerified ? 1 : 0,
          user.createdAt.toISOString(),
          user.updatedAt.toISOString(),
        ]
      );
    }
    return user;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.client.execute({ sql: 'DELETE FROM users WHERE id = ?', args: [id] });
    return result.rowsAffected > 0;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const row = await queryOne<{ count: number }>(
      this.client,
      'SELECT COUNT(*) as count FROM users WHERE email = ?',
      [email]
    );
    return (row?.count ?? 0) > 0;
  }

  async existsByGoogleId(googleId: string): Promise<boolean> {
    const row = await queryOne<{ count: number }>(
      this.client,
      'SELECT COUNT(*) as count FROM users WHERE google_id = ?',
      [googleId]
    );
    return (row?.count ?? 0) > 0;
  }

  async updateEmailVerified(userId: string, verified: boolean): Promise<void> {
    await execute(
      this.client,
      'UPDATE users SET email_verified = ?, updated_at = ? WHERE id = ?',
      [verified ? 1 : 0, new Date().toISOString(), userId]
    );
  }

  async updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
    await execute(
      this.client,
      'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?',
      [passwordHash, new Date().toISOString(), userId]
    );
  }

  async assignRole(userId: string, roleId: string): Promise<void> {
    await execute(this.client, 'INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)', [
      userId,
      roleId,
    ]);
  }

  async getUserRoles(userId: string): Promise<string[]> {
    const rows = await queryAll<{ role_id: string }>(
      this.client,
      'SELECT role_id FROM user_roles WHERE user_id = ?',
      [userId]
    );
    return rows.map((row) => row.role_id);
  }

  async replaceUserRole(userId: string, newRoleId: string): Promise<void> {
    const txn = await this.client.transaction('write');
    try {
      await txn.execute({ sql: 'DELETE FROM user_roles WHERE user_id = ?', args: [userId] });
      await txn.execute({ sql: 'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', args: [userId, newRoleId] });
      await txn.commit();
    } catch (e) {
      await txn.rollback();
      throw e;
    }
  }

  async searchUsersWithRolesAndAllowed(
    params: SearchUsersWithRolesParams
  ): Promise<
    PaginatedResult<{
      email: string;
      userId: string | null;
      roleIds: string[];
      isAllowed: boolean;
      isRegistered: boolean;
    }>
  > {
    const { page, limit, searchQuery, includeAllowedUsers = false } = params;
    const offset = (page - 1) * limit;
    const searchTerm = searchQuery?.trim() ? `%${searchQuery.trim().toLowerCase()}%` : null;

    const queryParams: unknown[] = [];
    const conditions: string[] = [];

    let registeredUsersQuery = `
      SELECT 
        u.email,
        u.id as userId,
        COALESCE(GROUP_CONCAT(ur.role_id), '') as roleIds,
        CASE WHEN a.email IS NOT NULL THEN 1 ELSE 0 END as isAllowed,
        1 as isRegistered
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN app_settings_allowed_users a ON LOWER(u.email) = LOWER(a.email)
    `;

    if (searchTerm) {
      conditions.push('(LOWER(u.email) LIKE ? OR LOWER(u.name) LIKE ?)');
      queryParams.push(searchTerm, searchTerm);
    }

    if (conditions.length > 0) {
      registeredUsersQuery += ' WHERE ' + conditions.join(' AND ');
    }

    registeredUsersQuery += ' GROUP BY u.id, u.email, a.email';

    let unregisteredUsersQuery = '';
    if (includeAllowedUsers) {
      unregisteredUsersQuery = `
        UNION ALL
        SELECT 
          a.email as email,
          NULL as userId,
          'user' as roleIds,
          1 as isAllowed,
          0 as isRegistered
        FROM app_settings_allowed_users a
        LEFT JOIN users u ON LOWER(a.email) = LOWER(u.email)
        WHERE u.email IS NULL
      `;

      if (searchTerm) {
        unregisteredUsersQuery += ' AND LOWER(a.email) LIKE ?';
        queryParams.push(searchTerm);
      }
    }

    const combinedQuery = `
      SELECT * FROM (
        ${registeredUsersQuery}
        ${unregisteredUsersQuery}
      ) combined
      ORDER BY LOWER(email) ASC
      LIMIT ? OFFSET ?
    `;
    queryParams.push(limit, offset);

    const rows = await queryAll<{
      email: string;
      userId: string | null;
      roleIds: string;
      isAllowed: number;
      isRegistered: number;
    }>(this.client, combinedQuery, queryParams);

    const items = rows.map((row) => ({
      email: row.email,
      userId: row.userId,
      roleIds: row.roleIds ? row.roleIds.split(',').filter((id: string) => id.trim()) : [],
      isAllowed: row.isAllowed === 1,
      isRegistered: row.isRegistered === 1,
    }));

    const countConditions: string[] = [];
    const countParams: unknown[] = [];

    let countRegisteredQuery = `
      SELECT DISTINCT u.id
      FROM users u
      LEFT JOIN app_settings_allowed_users a ON LOWER(u.email) = LOWER(a.email)
    `;

    if (searchTerm) {
      countConditions.push('(LOWER(u.email) LIKE ? OR LOWER(u.name) LIKE ?)');
      countParams.push(searchTerm, searchTerm);
    }

    if (countConditions.length > 0) {
      countRegisteredQuery += ' WHERE ' + countConditions.join(' AND ');
    }

    let countUnregisteredQuery = '';
    if (includeAllowedUsers) {
      countUnregisteredQuery = `
        UNION ALL
        SELECT DISTINCT a.email as id
        FROM app_settings_allowed_users a
        LEFT JOIN users u ON LOWER(a.email) = LOWER(u.email)
        WHERE u.email IS NULL
      `;

      if (searchTerm) {
        countUnregisteredQuery += ' AND LOWER(a.email) LIKE ?';
        countParams.push(searchTerm);
      }
    }

    const countQuery = `
      SELECT COUNT(*) as count FROM (
        ${countRegisteredQuery}
        ${countUnregisteredQuery}
      ) combined
    `;
    const countRow = await queryOne<{ count: number }>(this.client, countQuery, countParams);
    const totalItems = countRow?.count ?? 0;
    const totalPages = Math.ceil(totalItems / limit);

    return {
      items,
      totalItems,
      itemCount: items.length,
      itemsPerPage: limit,
      totalPages,
      currentPage: page,
    };
  }

  private mapRowToUser(row: UserRow): User {
    return new User(
      row.id,
      row.google_id,
      row.email,
      row.name,
      row.profile_image_id ?? undefined,
      row.avatar_image_id ?? undefined,
      row.google_refresh_token ? decrypt(row.google_refresh_token) : undefined,
      row.google_scopes ? JSON.parse(row.google_scopes) : undefined,
      row.password_hash ?? undefined,
      (row.email_verified ?? 0) === 1,
      new Date(row.created_at),
      new Date(row.updated_at)
    );
  }

  private mapRowToPublicUser(row: UserRow): PublicUser {
    return new PublicUser(
      row.id,
      row.google_id ?? '',
      row.email,
      row.name,
      row.profile_image_id ?? undefined,
      new Date(row.created_at),
      new Date(row.updated_at)
    );
  }
}
