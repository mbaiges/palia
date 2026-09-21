import { createHash, randomUUID } from 'crypto';
import { inject, injectable } from 'tsyringe';
import type { MediceFollowUpRepository } from '@/domain/repositories/MediceFollowUpRepository';
import type { ClinicalAlertNotifier } from '@/domain/repositories/ClinicalAlertNotifier';

const failure = (message: string, status: number) => Object.assign(new Error(message), { status });
const parseJson = (value: unknown, fallback: unknown) => {
  if (typeof value !== 'string') return value ?? fallback;
  try { return JSON.parse(value); } catch { return fallback; }
};

@injectable()
export class MediceFollowUpService {
  constructor(
    @inject('MediceFollowUpRepository') private readonly repository: MediceFollowUpRepository,
    @inject('ClinicalAlertNotifier') private readonly notifications: ClinicalAlertNotifier,
  ) {}

  async list(patientId: string): Promise<any[]> {
    const rows = await this.repository.listForPatient(patientId);
    return Promise.all(rows.map(async (row) => ({
      id: row.id,
      patientId: row.patient_id,
      authorId: row.author_id,
      authorName: row.author_name,
      occurredAt: row.occurred_at,
      recordedAt: row.recorded_at,
      date: row.occurred_at,
      contactType: row.contact_type === 'in_person' ? 'Presencial' : 'Remoto',
      durationMinutes: row.duration_minutes,
      durationHours: row.duration_minutes / 60,
      symptoms: parseJson(row.symptoms, {}),
      symptomObservations: row.symptom_observations,
      socialRisk: parseJson(row.social_risk, {}),
      equipmentNeeds: parseJson(row.equipment_needs, []),
      equipmentOther: row.equipment_other,
      interventions: row.interventions,
      alertActivated: await this.repository.hasAlertForFollowUp(row.id),
    })));
  }

  async create(input: {
    patientId: string;
    authorId: string;
    body: any;
    idempotencyKey?: string | null;
  }): Promise<{ status: number; data: Record<string, unknown> }> {
    const body = input.body ?? {};
    const duration = Number(body.durationMinutes ??
      (body.contactType === 'remote' || body.contactType === 'Remoto' ? 60 : 120));
    if (!Number.isInteger(duration) || duration < 15 || duration > 1440 || duration % 15 !== 0) {
      throw failure('La duración debe ser de 15 a 1440 minutos, en incrementos de 15.', 422);
    }
    if (typeof body.symptomObservations !== 'string' || typeof body.interventions !== 'string') {
      throw failure('Observaciones e intervenciones son obligatorias.', 422);
    }
    const patient = await this.repository.findPatient(input.patientId);
    if (!patient) throw failure('Paciente no encontrado', 404);
    if (patient.archived_at) throw failure('No se pueden registrar seguimientos en pacientes archivados.', 409);
    const mutationId = body.clientMutationId ?? input.idempotencyKey ?? null;
    const payloadHash = createHash('sha256').update(JSON.stringify({
      patientId: patient.id, ...body, clientMutationId: undefined,
    })).digest('hex');
    if (mutationId) {
      const prior = await this.repository.findByMutation(input.authorId, String(mutationId));
      if (prior) {
        if (prior.client_payload_hash !== payloadHash) {
          throw failure('El identificador de operación ya fue usado con otro contenido.', 409);
        }
        return { status: 200, data: {
          id: prior.id, patientId: prior.patient_id,
          occurredAt: prior.occurred_at, recordedAt: prior.recorded_at,
        } };
      }
    }

    const id = randomUUID();
    const timestamp = new Date().toISOString();
    const contactType = ['remote', 'Remoto'].includes(body.contactType) ? 'remote' : 'in_person';
    const alertId = body.alert && typeof body.alert === 'object' ? randomUUID() : null;
    await this.repository.createFollowUp({
      id, patient, authorId: input.authorId, body, mutationId, payloadHash,
      timestamp, duration, contactType, alertId,
    });
    if (alertId) {
      try {
        const recipients = await this.repository.findAssignedActiveUserIds(patient.id);
        await Promise.all([...new Set(recipients.filter((userId) => userId !== input.authorId))]
          .map((userId) => this.notifications.sendGenericClinicalAlert(userId, alertId)));
      } catch (error) {
        console.error('Could not notify assigned team about a clinical alert', error);
      }
    }
    return { status: 201, data: {
      id, patientId: patient.id, authorId: input.authorId,
      occurredAt: body.occurredAt ?? timestamp, recordedAt: timestamp,
      contactType, durationMinutes: duration,
    } };
  }
}
