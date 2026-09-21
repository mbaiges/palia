import type { Client } from '@libsql/client';
import { v4 as uuidv4 } from 'uuid';
import type {
  PushSubscriptionRepository,
  PushSubscriptionRecord,
  PushSubscriptionInput,
} from '@/domain/repositories/PushSubscriptionRepository';
import { DatabaseConfig } from '@/infrastructure/config/database';
import { queryAll, execute } from '@/infrastructure/db/libsql';

type PushSubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
  locale?: string | null;
};

export class SqlitePushSubscriptionRepository implements PushSubscriptionRepository {
  private client: Client;

  constructor() {
    this.client = DatabaseConfig.getConnection();
  }

  private mapRow(row: PushSubscriptionRow): PushSubscriptionRecord {
    return {
      id: row.id,
      userId: row.user_id,
      endpoint: row.endpoint,
      p256dh: row.p256dh,
      auth: row.auth,
      createdAt: row.created_at,
      locale: row.locale ?? undefined,
    };
  }

  async save(userId: string, subscription: PushSubscriptionInput): Promise<void> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const { endpoint, keys, locale } = subscription;

    // Browser endpoints are device-scoped. Rebinding prevents a shared browser
    // from continuing to deliver a previous account's alerts after sign-in.
    await execute(this.client, 'DELETE FROM push_subscriptions WHERE endpoint = ? AND user_id <> ?', [endpoint, userId]);

    await execute(
      this.client,
      `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, created_at, locale)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, endpoint) DO UPDATE SET
         p256dh = excluded.p256dh,
         auth = excluded.auth,
         locale = excluded.locale`,
      [id, userId, endpoint, keys.p256dh, keys.auth, now, locale ?? null]
    );
  }

  async findByUserId(userId: string): Promise<PushSubscriptionRecord[]> {
    const rows = await queryAll<PushSubscriptionRow>(
      this.client,
      'SELECT * FROM push_subscriptions WHERE user_id = ?',
      [userId]
    );
    return rows.map((r) => this.mapRow(r));
  }

  async deleteByEndpoint(endpoint: string): Promise<void> {
    await execute(this.client, 'DELETE FROM push_subscriptions WHERE endpoint = ?', [endpoint]);
  }

  async deleteByEndpointIfExists(endpoint: string): Promise<void> {
    await this.deleteByEndpoint(endpoint);
  }
}
