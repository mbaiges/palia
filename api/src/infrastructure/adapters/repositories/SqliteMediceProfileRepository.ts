import { injectable } from 'tsyringe';
import { DatabaseConfig } from '@/infrastructure/config/database';
import type { MediceProfileRepository } from '@/domain/repositories/MediceProfileRepository';
@injectable()
export class SqliteMediceProfileRepository implements MediceProfileRepository {
  private get db() { return DatabaseConfig.getKnex(); }
  find(userId: string) { return this.db('volunteer_profiles').where({ user_id: userId }).first(); }
  async save(userId: string, profile: Record<string, unknown>, timestamp: string) { await this.db('volunteer_profiles').insert({ ...profile, created_at: timestamp, updated_at: timestamp }).onConflict('user_id').merge({ ...profile, updated_at: timestamp }); }
  async assignmentCount(userId: string) { const row: any = await this.db('patient_assignments').where({ user_id: userId }).count({ count: '*' }).first(); return Number(row?.count ?? 0); }
}
