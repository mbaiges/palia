import { randomUUID } from 'crypto';
import { injectable } from 'tsyringe';
import { DatabaseConfig } from '@/infrastructure/config/database';
import type { MediceAlertRepository } from '@/domain/repositories/MediceAlertRepository';

@injectable()
export class SqliteMediceAlertRepository implements MediceAlertRepository {
  private get db() { return DatabaseConfig.getKnex(); }
  async list(input: { status?: string; patientId?: string; limit: number; offset: number }) {
    const query = this.db('alerts as a').join('patients as p', 'p.id', 'a.patient_id').join('users as u', 'u.id', 'a.created_by').leftJoin('users as resolver', 'resolver.id', 'a.resolved_by').select('a.*', 'p.name as patient_name', 'u.name as author_name', 'resolver.name as resolved_by_name').orderBy('a.created_at', 'desc');
    if (input.status === 'active' || input.status === 'resolved') query.where('a.status', input.status);
    if (input.patientId) query.where('a.patient_id', input.patientId);
    const count: any = await query.clone().clearSelect().clearOrder().count({ count: 'a.id' }).first();
    const rows = await query.limit(input.limit).offset(input.offset);
    return { rows, total: Number(count?.count ?? 0) };
  }
  findPatient(id: string) { return this.db('patients').where({ id }).first(); }
  async create(alert: any, actorId: string) { await this.db.transaction(async (trx) => { await trx('alerts').insert(alert); await trx('audit_events').insert({ id: randomUUID(), actor_id: actorId, action: 'alert.created', entity_type: 'alert', entity_id: alert.id, metadata_json: JSON.stringify({ patientId: alert.patient_id, source: 'standalone' }), created_at: alert.created_at }); }); }
  async resolve(id: string, actorId: string, note: string | null, timestamp: string) { return this.db.transaction(async (trx) => { const alert: any = await trx('alerts').where({ id, status: 'active' }).first('patient_id'); if (!alert) return null; await trx('alerts').where({ id, status: 'active' }).update({ status: 'resolved', resolved_by: actorId, resolved_at: timestamp, resolution_note: note }); await trx('audit_events').insert({ id: randomUUID(), actor_id: actorId, action: 'alert.resolved', entity_type: 'alert', entity_id: id, metadata_json: JSON.stringify({ patientId: alert.patient_id, resolutionNoteProvided: Boolean(note) }), created_at: timestamp }); return { patientId: alert.patient_id }; }); }
}
