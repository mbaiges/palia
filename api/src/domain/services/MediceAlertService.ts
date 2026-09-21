import { randomUUID } from 'crypto';
import { inject, injectable } from 'tsyringe';
import type { MediceAlertRepository } from '@/domain/repositories/MediceAlertRepository';
import type { ClinicalAlertNotifier } from '@/domain/repositories/ClinicalAlertNotifier';

const failure = (message: string, status: number) => Object.assign(new Error(message), { status });

@injectable()
export class MediceAlertService {
  constructor(
    @inject('MediceAlertRepository') private readonly repository: MediceAlertRepository,
    @inject('ClinicalAlertNotifier') private readonly notifier: ClinicalAlertNotifier,
  ) {}

  async list(input: { status?: string; patientId?: string; limit: number; offset: number }) {
    const result = await this.repository.list(input);
    const rows = result.rows.map((row) => ({
      id: row.id, patientId: row.patient_id, patientName: row.patient_name,
      followUpId: row.follow_up_id, level: row.level, motive: row.motive,
      observations: row.observations, status: row.status, authorId: row.created_by,
      authorName: row.author_name, createdAt: row.created_at, resolvedBy: row.resolved_by,
      resolvedByName: row.resolved_by_name, resolvedAt: row.resolved_at,
      resolutionNote: row.resolution_note,
    }));
    return { data: rows, page: {
      limit: input.limit,
      nextCursor: input.offset + rows.length < result.total ? String(input.offset + rows.length) : null,
      total: result.total,
    }};
  }

  async create(patientId: string, actorId: string, body: any) {
    if (!body.level || !body.motive || !body.observations?.trim()) throw failure('Nivel, motivo y observaciones son obligatorios.', 422);
    const patient = await this.repository.findPatient(patientId);
    if (!patient) throw failure('Paciente no encontrado', 404);
    if (patient.archived_at) throw failure('No se pueden activar alertas en pacientes archivados.', 409);
    const alert = { id: randomUUID(), patient_id: patientId, follow_up_id: null,
      level: body.level, motive: body.motive, observations: body.observations.trim(),
      status: 'active', created_by: actorId, created_at: new Date().toISOString(),
      resolved_by: null, resolved_at: null, resolution_note: null };
    await this.repository.create(alert, actorId);
    return alert;
  }

  resolve(id: string, actorId: string, note: unknown) {
    return this.repository.resolve(id, actorId, typeof note === 'string' ? note.trim() || null : null, new Date().toISOString());
  }
}
