import type { Client } from '@libsql/client';
import { v4 as uuidv4 } from 'uuid';
import type { PasswordResetRepository, PasswordResetToken } from '@/domain/repositories/PasswordResetRepository';
import { DatabaseConfig } from '@/infrastructure/config/database';
import { queryOne, execute } from '@/infrastructure/db/libsql';

type PrtRow = {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
};

export class SqlitePasswordResetRepository implements PasswordResetRepository {
  private client: Client;

  constructor() {
    this.client = DatabaseConfig.getConnection();
  }

  async create(userId: string, tokenHash: string, expiresAt: Date): Promise<PasswordResetToken> {
    await this.invalidateForUser(userId);

    const id = uuidv4();
    const now = new Date().toISOString();

    await execute(
      this.client,
      'INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)',
      [id, userId, tokenHash, expiresAt.toISOString(), now]
    );

    return {
      id,
      userId,
      tokenHash,
      expiresAt,
      createdAt: new Date(now),
    };
  }

  async findValidByUserId(userId: string): Promise<PasswordResetToken | null> {
    const now = new Date().toISOString();
    const row = await queryOne<PrtRow>(
      this.client,
      'SELECT * FROM password_reset_tokens WHERE user_id = ? AND expires_at > ? ORDER BY created_at DESC LIMIT 1',
      [userId, now]
    );

    if (!row) return null;

    const token: PasswordResetToken = {
      id: row.id,
      userId: row.user_id,
      tokenHash: row.token_hash,
      expiresAt: new Date(row.expires_at),
      createdAt: new Date(row.created_at),
    };

    return new Date(row.expires_at) > new Date() ? token : null;
  }

  async invalidateForUser(userId: string): Promise<void> {
    await execute(this.client, 'DELETE FROM password_reset_tokens WHERE user_id = ?', [userId]);
  }

  async deleteExpired(): Promise<number> {
    const now = new Date().toISOString();
    const result = await execute(
      this.client,
      'DELETE FROM password_reset_tokens WHERE expires_at <= ?',
      [now]
    );
    return result.rowsAffected;
  }
}
