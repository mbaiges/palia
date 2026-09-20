import type { Client } from '@libsql/client';
import { AppSettingsRepository } from '@/domain/repositories/AppSettingsRepository';
import { DatabaseConfig } from '@/infrastructure/config/database';
import { queryOne, queryAll, execute } from '@/infrastructure/db/libsql';

/**
 * SQLite/libSQL implementation of AppSettingsRepository
 */
export class SqliteAppSettingsRepository implements AppSettingsRepository {
  private client: Client;

  constructor() {
    this.client = DatabaseConfig.getConnection();
  }

  async getAllowedUsers(): Promise<string[]> {
    const rows = await queryAll<{ email: string }>(
      this.client,
      'SELECT email FROM app_settings_allowed_users ORDER BY email'
    );
    return rows.map((row) => row.email.trim().toLowerCase());
  }

  async addAllowedUser(email: string): Promise<void> {
    await execute(this.client, 'INSERT INTO app_settings_allowed_users (email, created_at) VALUES (?, ?)', [
      email.trim().toLowerCase(),
      new Date().toISOString(),
    ]);
  }

  async removeAllowedUser(email: string): Promise<void> {
    await execute(this.client, 'DELETE FROM app_settings_allowed_users WHERE email = ?', [
      email.trim().toLowerCase(),
    ]);
  }

  async isEmailAllowed(email: string): Promise<boolean> {
    const row = await queryOne<{ count: number }>(
      this.client,
      'SELECT COUNT(*) as count FROM app_settings_allowed_users WHERE email = ?',
      [email.trim().toLowerCase()]
    );
    return row ? row.count > 0 : false;
  }
}
