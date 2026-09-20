import type { Client } from '@libsql/client';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseConfig } from '@/infrastructure/config/database';
import { execute, queryAll } from '@/infrastructure/db/libsql';
import type {
  CreateNotificationInput,
  NotificationRecord,
  NotificationRepository,
} from '@/domain/repositories/NotificationRepository';

type NotificationRow = {
  id: string;
  user_id: string;
  type: 'system' | 'example';
  title: string;
  body: string;
  created_at: string;
  read: number;
};

export class SqliteNotificationRepository implements NotificationRepository {
  private readonly client: Client;

  constructor() {
    this.client = DatabaseConfig.getConnection();
  }

  async findByUserId(userId: string): Promise<NotificationRecord[]> {
    const rows = await queryAll<NotificationRow>(
      this.client,
      'SELECT id, user_id, type, title, body, created_at, read FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      type: row.type,
      title: row.title,
      body: row.body,
      createdAt: row.created_at,
      read: Boolean(row.read),
    }));
  }

  async create(input: CreateNotificationInput): Promise<NotificationRecord> {
    const record: NotificationRecord = {
      id: uuidv4(),
      userId: input.userId,
      type: input.type,
      title: input.title.trim(),
      body: input.body.trim(),
      createdAt: new Date().toISOString(),
      read: false,
    };
    await execute(
      this.client,
      'INSERT INTO notifications (id, user_id, type, title, body, created_at, read) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [record.id, record.userId, record.type, record.title, record.body, record.createdAt, 0]
    );
    return record;
  }

  async createOnce(input: CreateNotificationInput & { id: string }): Promise<void> {
    await execute(
      this.client,
      'INSERT OR IGNORE INTO notifications (id, user_id, type, title, body, created_at, read) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [input.id, input.userId, input.type, input.title.trim(), input.body.trim(), new Date().toISOString(), 0]
    );
  }
}
