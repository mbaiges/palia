import { randomUUID } from 'crypto';
import { injectable } from 'tsyringe';
import { DatabaseConfig } from '@/infrastructure/config/database';
import type { MediceOperationsRepository } from '@/domain/repositories/MediceOperationsRepository';

@injectable()
export class SqliteMediceOperationsRepository implements MediceOperationsRepository {
  private get db() { return DatabaseConfig.getKnex(); }

  listHospitals(includeArchived: boolean): Promise<any[]> {
    const query = this.db('hospitals').orderBy('name');
    if (!includeArchived) query.whereNull('archived_at');
    return query;
  }

  async saveHospital(id: string, values: Record<string, unknown>, create: boolean): Promise<any | undefined> {
    if (create) {
      await this.db('hospitals').insert({ id, ...values, created_at: values.updated_at, archived_at: null });
    } else if (!(await this.db('hospitals').where({ id }).update(values))) {
      return undefined;
    }
    return this.db('hospitals').where({ id }).first();
  }

  async setHospitalArchived(id: string, archivedAt: string | null, updatedAt: string): Promise<boolean> {
    return Boolean(await this.db('hospitals').where({ id }).update({ archived_at: archivedAt, updated_at: updatedAt }));
  }

  async patientExists(id: string): Promise<boolean> {
    return Boolean(await this.db('patients').where({ id }).first());
  }

  async existingUserIds(ids: string[]): Promise<string[]> {
    if (!ids.length) return [];
    const rows = await this.db('users').whereIn('id', ids).select('id');
    return rows.map((row: any) => String(row.id));
  }

  async replacePatientAssignments(patientId: string, userIds: string[], actorId: string, timestamp: string): Promise<void> {
    await this.db.transaction(async (trx) => {
      await trx('patient_assignments').where({ patient_id: patientId }).delete();
      if (userIds.length) await trx('patient_assignments').insert(userIds.map((userId) => ({
        patient_id: patientId, user_id: userId, created_by: actorId, created_at: timestamp,
      })));
      await trx('audit_events').insert({
        id: randomUUID(), actor_id: actorId, action: 'patient.assignments_updated',
        entity_type: 'patient', entity_id: patientId,
        metadata_json: JSON.stringify({ assignmentCount: userIds.length }), created_at: timestamp,
      });
    });
  }
}
