import type { Client } from '@libsql/client';
import { v4 as uuidv4 } from 'uuid';
import { EmailVerificationCode } from '@/domain/models/EmailVerificationCode';
import { EmailVerificationRepository } from '@/domain/repositories/EmailVerificationRepository';
import { DatabaseConfig } from '@/infrastructure/config/database';
import { queryOne, queryAll, execute } from '@/infrastructure/db/libsql';

type EvcRow = {
  id: string;
  user_id: string;
  code_hash: string;
  expires_at: string;
  created_at: string;
};

export class SqliteEmailVerificationRepository implements EmailVerificationRepository {
  private client: Client;

  constructor() {
    this.client = DatabaseConfig.getConnection();
  }

  async create(userId: string, codeHash: string, expiresAt: Date): Promise<EmailVerificationCode> {
    await this.invalidateForUser(userId);

    const id = uuidv4();
    const now = new Date().toISOString();

    await execute(
      this.client,
      'INSERT INTO email_verification_codes (id, user_id, code_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)',
      [id, userId, codeHash, expiresAt.toISOString(), now]
    );

    return new EmailVerificationCode(id, userId, codeHash, expiresAt, new Date(now));
  }

  async findValidByUserId(userId: string): Promise<EmailVerificationCode | null> {
    const now = new Date().toISOString();
    const row = await queryOne<EvcRow>(
      this.client,
      'SELECT * FROM email_verification_codes WHERE user_id = ? AND expires_at > ? ORDER BY created_at DESC LIMIT 1',
      [userId, now]
    );

    if (!row) return null;

    const code = new EmailVerificationCode(
      row.id,
      row.user_id,
      row.code_hash,
      new Date(row.expires_at),
      new Date(row.created_at)
    );

    return code.isExpired() ? null : code;
  }

  async invalidateForUser(userId: string): Promise<void> {
    await execute(this.client, 'DELETE FROM email_verification_codes WHERE user_id = ?', [
      userId,
    ]);
  }

  async deleteExpired(): Promise<number> {
    const now = new Date().toISOString();
    const result = await execute(
      this.client,
      'DELETE FROM email_verification_codes WHERE expires_at <= ?',
      [now]
    );
    return result.rowsAffected;
  }
}
