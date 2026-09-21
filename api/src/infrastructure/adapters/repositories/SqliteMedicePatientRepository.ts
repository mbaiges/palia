import { injectable } from 'tsyringe';
import type { MedicePatientRepository } from '@/domain/repositories/MedicePatientRepository';
import { DatabaseConfig } from '@/infrastructure/config/database';

@injectable()
export class SqliteMedicePatientRepository implements MedicePatientRepository {
  private get db() {
    return DatabaseConfig.getKnex();
  }

  listPatients(includeArchived: boolean): Promise<any[]> {
    return this.db('patients')
      .modify((query) => {
        if (!includeArchived) query.whereNull('archived_at');
      })
      .orderBy('name')
      .orderBy('id');
  }

  findPatientById(id: string): Promise<any | undefined> {
    return this.db('patients').where({ id }).first();
  }

  async getPatientRelations(patientId: string) {
    const [caregiver, hospitalRow, assignments, activeAlerts] = await Promise.all([
      this.db('caregivers').where({ patient_id: patientId }).first(),
      this.db('patients')
        .join('hospitals', 'patients.hospital_id', 'hospitals.id')
        .where('patients.id', patientId)
        .select('hospitals.*')
        .first(),
      this.db('patient_assignments')
        .where({ patient_id: patientId })
        .select('user_id'),
      this.db('alerts')
        .where({ patient_id: patientId, status: 'active' })
        .select('id'),
    ]);
    return { caregiver, hospital: hospitalRow, assignments, activeAlerts };
  }
}
