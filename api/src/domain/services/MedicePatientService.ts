import { inject, injectable } from 'tsyringe';
import type { MedicePatientRepository } from '@/domain/repositories/MedicePatientRepository';

const normalizeText = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
const digits = (value: unknown) => String(value ?? '').replace(/\D/g, '');

@injectable()
export class MedicePatientService {
  constructor(
    @inject('MedicePatientRepository')
    private readonly repository: MedicePatientRepository,
  ) {}

  async findById(id: string): Promise<any | undefined> {
    const patient = await this.repository.findPatientById(id);
    return patient ? this.toDto(patient) : undefined;
  }

  async getDto(row: any): Promise<any> {
    return this.toDto(row);
  }

  async list(input: {
    includeArchived: boolean;
    query: unknown;
    status: string;
    limit: number;
    offset: number;
  }): Promise<{ data: any[]; page: { limit: number; nextCursor: string | null; total: number } }> {
    const query = normalizeText(input.query);
    const rows = await this.repository.listPatients(input.includeArchived);
    const candidates = rows.filter((row) => {
      if (!query) return true;
      return (
        [row.name, row.dni, row.diagnosis].some((value) =>
          normalizeText(value).includes(query),
        ) || (digits(query).length > 0 && digits(row.dni).includes(digits(query)))
      );
    });
    const patients = await Promise.all(candidates.map((row) => this.toDto(row)));
    const filtered = input.status === 'all'
      ? patients
      : patients.filter((patient) => input.status === 'critical'
        ? patient.currentStatus === 'Alerta'
        : input.status === 'observation'
          ? patient.currentStatus === 'En Observación'
          : patient.currentStatus === 'Estable');
    return {
      data: filtered.slice(input.offset, input.offset + input.limit),
      page: {
        limit: input.limit,
        nextCursor: input.offset + input.limit < filtered.length
          ? String(input.offset + input.limit)
          : null,
        total: filtered.length,
      },
    };
  }

  private async toDto(row: any): Promise<any> {
    const { caregiver, hospital, assignments, activeAlerts } =
      await this.repository.getPatientRelations(row.id);
    return {
      id: row.id,
      name: row.name,
      dni: row.dni,
      dob: row.dob,
      address: row.address,
      diagnosis: row.diagnosis,
      hospitalId: row.hospital_id,
      hospitalName: hospital?.name ?? null,
      complexSituation: Boolean(row.complex_situation),
      currentStatus: activeAlerts.length
        ? 'Alerta'
        : row.complex_situation
          ? 'En Observación'
          : 'Estable',
      assignedVolunteers: assignments.map((item: any) => item.user_id),
      archivedAt: row.archived_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      caregiver: caregiver
        ? {
            patientId: row.id,
            name: caregiver.name,
            relation: caregiver.relation,
            phone: caregiver.phone,
            livesWithPatient: Boolean(caregiver.lives_with_patient),
            burdenLevel: caregiver.burden_level,
          }
        : null,
      activeAlerts: activeAlerts.length,
    };
  }
}
