export interface MediceFollowUpRepository {
  findPatient(id: string): Promise<any | undefined>;
  findByMutation(authorId: string, mutationId: string): Promise<any | undefined>;
  listForPatient(patientId: string): Promise<any[]>;
  hasAlertForFollowUp(followUpId: string): Promise<boolean>;
  createFollowUp(input: Record<string, any>): Promise<void>;
  findAssignedActiveUserIds(patientId: string): Promise<string[]>;
}
