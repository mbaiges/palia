export interface MediceOperationsRepository {
  listHospitals(includeArchived: boolean): Promise<any[]>;
  saveHospital(id: string, values: Record<string, unknown>, create: boolean): Promise<any | undefined>;
  setHospitalArchived(id: string, archivedAt: string | null, updatedAt: string): Promise<boolean>;
  patientExists(id: string): Promise<boolean>;
  existingUserIds(ids: string[]): Promise<string[]>;
  replacePatientAssignments(patientId: string, userIds: string[], actorId: string, timestamp: string): Promise<void>;
}
