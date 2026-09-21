export interface MediceAlertRepository {
  list(input: { status?: string; patientId?: string; limit: number; offset: number }): Promise<{ rows: any[]; total: number }>;
  findPatient(id: string): Promise<any | undefined>;
  create(alert: any, actorId: string): Promise<void>;
  resolve(id: string, actorId: string, note: string | null, timestamp: string): Promise<{ patientId: string } | null>;
}
