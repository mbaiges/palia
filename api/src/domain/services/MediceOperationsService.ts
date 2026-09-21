import { inject, injectable } from 'tsyringe';
import { randomUUID } from 'crypto';
import type { MediceOperationsRepository } from '@/domain/repositories/MediceOperationsRepository';

const failure = (message: string, status: number) =>
  Object.assign(new Error(message), { status });

@injectable()
export class MediceOperationsService {
  constructor(
    @inject('MediceOperationsRepository')
    private readonly repository: MediceOperationsRepository,
  ) {}

  listHospitals(includeArchived: boolean): Promise<any[]> {
    return this.repository.listHospitals(includeArchived);
  }

  async saveHospital(input: {
    id?: string;
    name: unknown;
    address: unknown;
    zone: unknown;
    timestamp: string;
  }): Promise<any> {
    if (
      typeof input.name !== 'string' || !input.name.trim() ||
      typeof input.address !== 'string' || !input.address.trim()
    ) throw failure('Nombre y domicilio son obligatorios.', 422);
    const values = {
      name: input.name.trim(),
      address: input.address.trim(),
      zone: typeof input.zone === 'string' ? input.zone.trim() || null : null,
      updated_at: input.timestamp,
    };
    const hospital = await this.repository.saveHospital(
      input.id ?? randomUUID(), values, !input.id,
    );
    if (!hospital) throw failure('Centro no encontrado', 404);
    return hospital;
  }

  async setHospitalArchived(id: string, archived: boolean, timestamp: string): Promise<void> {
    const updated = await this.repository.setHospitalArchived(
      id, archived ? timestamp : null, timestamp,
    );
    if (!updated) throw failure('Centro no encontrado', 404);
  }

  async assignPatient(patientId: string, userIds: string[], actorId: string, timestamp: string): Promise<string[]> {
    if (!(await this.repository.patientExists(patientId))) {
      throw failure('Paciente no encontrado', 404);
    }
    const uniqueIds = [...new Set(userIds)];
    const existingIds = await this.repository.existingUserIds(uniqueIds);
    if (existingIds.length !== uniqueIds.length) {
      throw failure('Una o más personas no existen.', 422);
    }
    await this.repository.replacePatientAssignments(patientId, uniqueIds, actorId, timestamp);
    return uniqueIds;
  }
}
