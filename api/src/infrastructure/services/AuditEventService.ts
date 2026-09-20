import crypto from 'node:crypto';
import type { Client } from '@libsql/client';
import type { AuditEvent } from '@/domain/models/AuditEvent';
import { DatabaseConfig } from '@/infrastructure/config/database';
import { execute, queryAll } from '@/infrastructure/db/libsql';

export class AuditEventService {
  private readonly client: Client = DatabaseConfig.getConnection();

  async record(input: Omit<AuditEvent, 'id' | 'createdAt'>): Promise<AuditEvent> {
    const event: AuditEvent = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    await execute(this.client, 'INSERT INTO audit_events (id, actor_id, action, entity_type, entity_id, metadata_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)', [event.id, event.actorId, event.action, event.entityType, event.entityId, JSON.stringify(event.metadata), event.createdAt]);
    return event;
  }

  async list(filters: { action?: string; entityType?: string; limit?: number } = {}): Promise<AuditEvent[]> {
    const clauses: string[] = [];
    const values: unknown[] = [];
    if (filters.action) { clauses.push('action = ?'); values.push(filters.action); }
    if (filters.entityType) { clauses.push('entity_type = ?'); values.push(filters.entityType); }
    const limit = Math.min(Math.max(filters.limit ?? 100, 1), 500);
    const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';
    const rows = await queryAll<any>(this.client, `SELECT * FROM audit_events${where} ORDER BY created_at DESC LIMIT ${limit}`, values);
    return rows.map((row) => ({ id: row.id, actorId: row.actor_id, action: row.action, entityType: row.entity_type, entityId: row.entity_id, metadata: JSON.parse(row.metadata_json || '{}'), createdAt: row.created_at }));
  }
}

export const auditEventService = new AuditEventService();
