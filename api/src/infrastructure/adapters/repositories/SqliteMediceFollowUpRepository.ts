import { randomUUID } from 'crypto';
import { injectable } from 'tsyringe';
import { DatabaseConfig } from '@/infrastructure/config/database';
import type { MediceFollowUpRepository } from '@/domain/repositories/MediceFollowUpRepository';

@injectable()
export class SqliteMediceFollowUpRepository implements MediceFollowUpRepository {
  private get db() { return DatabaseConfig.getKnex(); }

  findPatient(id: string): Promise<any | undefined> {
    return this.db('patients').where({ id }).first();
  }

  findByMutation(authorId: string, mutationId: string): Promise<any | undefined> {
    return this.db('follow_ups').where({ author_id: authorId, client_mutation_id: mutationId }).first();
  }

  listForPatient(patientId: string): Promise<any[]> {
    return this.db('follow_ups as f')
      .join('users as u', 'u.id', 'f.author_id')
      .where({ 'f.patient_id': patientId })
      .select('f.*', 'u.name as author_name')
      .orderBy('f.occurred_at', 'desc')
      .orderBy('f.id', 'desc');
  }

  async hasAlertForFollowUp(followUpId: string): Promise<boolean> {
    return Boolean(await this.db('alerts').where({ follow_up_id: followUpId }).first());
  }

  async createFollowUp(input: Record<string, any>): Promise<void> {
    const { id, patient, authorId, body, mutationId, payloadHash, timestamp, duration, contactType, alertId } = input;
    await this.db.transaction(async (trx) => {
      await trx('follow_ups').insert({
        id, patient_id: patient.id, author_id: authorId,
        occurred_at: body.occurredAt ?? timestamp, recorded_at: timestamp,
        contact_type: contactType, duration_minutes: duration,
        symptoms: JSON.stringify(body.symptoms ?? {}),
        symptom_observations: body.symptomObservations,
        social_risk: JSON.stringify(body.socialRisk ?? {}),
        equipment_needs: JSON.stringify(body.equipmentNeeds ?? body.equipment ?? []),
        equipment_other: body.equipmentOther ?? '', interventions: body.interventions,
        client_mutation_id: mutationId, client_payload_hash: payloadHash,
      });
      if (alertId) await trx('alerts').insert({
        id: alertId, patient_id: patient.id, follow_up_id: id,
        level: body.alert.level ?? 'standard', motive: body.alert.motive ?? 'other',
        observations: body.alert.observations ?? '', status: 'active',
        created_by: authorId, created_at: timestamp,
      });
      await trx('audit_events').insert({
        id: randomUUID(), actor_id: authorId, action: 'follow_up.created',
        entity_type: 'follow_up', entity_id: id,
        metadata_json: JSON.stringify({ patientId: patient.id, alertCreated: Boolean(alertId) }),
        created_at: timestamp,
      });
      if (alertId) await trx('audit_events').insert({
        id: randomUUID(), actor_id: authorId, action: 'alert.created',
        entity_type: 'alert', entity_id: alertId,
        metadata_json: JSON.stringify({ patientId: patient.id, source: 'follow_up' }),
        created_at: timestamp,
      });
    });
  }

  async findAssignedActiveUserIds(patientId: string): Promise<string[]> {
    const rows = await this.db('patient_assignments as pa')
      .join('volunteer_profiles as vp', 'vp.user_id', 'pa.user_id')
      .where({ 'pa.patient_id': patientId, 'vp.status': 'active' })
      .select('pa.user_id');
    return rows.map((row: any) => String(row.user_id));
  }
}
