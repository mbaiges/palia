import type { Client } from '@libsql/client';
import { UserSettingsRepository } from '@/domain/repositories/UserSettingsRepository';
import { UserSettings } from '@/domain/models/UserSettings';
import { DatabaseConfig } from '@/infrastructure/config/database';
import { queryOne, execute } from '@/infrastructure/db/libsql';

export class SqliteUserSettingsRepository implements UserSettingsRepository {
  private client: Client;

  constructor() {
    this.client = DatabaseConfig.getConnection();
  }

  async findByUserId(userId: string): Promise<UserSettings | null> {
    const row = await queryOne<{ user_id: string; theme: string; locale: string | null; created_at: string; updated_at: string }>(
      this.client,
      'SELECT * FROM user_settings WHERE user_id = ?',
      [userId]
    );
    return row ? this.mapRow(row) : null;
  }

  async save(userSettings: UserSettings): Promise<UserSettings> {
    const now = new Date().toISOString();
    await execute(this.client, 'INSERT OR REPLACE INTO user_settings (user_id, theme, locale, created_at, updated_at) VALUES (?, ?, ?, ?, ?)', [
      userSettings.userId,
      userSettings.theme,
      userSettings.locale ?? null,
      now,
      now,
    ]);
    return { ...userSettings, createdAt: now, updatedAt: now };
  }

  async update(userId: string, settings: { theme?: string; locale?: string | null }): Promise<UserSettings> {
    const existing = await this.findByUserId(userId);
    if (!existing) {
      return this.save({
        userId,
        theme: settings.theme ?? 'light',
        locale: settings.locale ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    const now = new Date().toISOString();
    const theme = settings.theme ?? existing.theme;
    const locale = settings.locale !== undefined ? settings.locale : existing.locale;
    await execute(this.client, 'UPDATE user_settings SET theme = ?, locale = ?, updated_at = ? WHERE user_id = ?', [
      theme,
      locale,
      now,
      userId,
    ]);
    return { ...existing, theme, locale, updatedAt: now };
  }

  private mapRow(row: { user_id: string; theme: string; locale: string | null; created_at: string; updated_at: string }): UserSettings {
    return {
      userId: row.user_id,
      theme: row.theme,
      locale: row.locale ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
