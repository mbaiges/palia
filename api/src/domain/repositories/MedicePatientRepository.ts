export interface MedicePatientRepository {
  listPatients(includeArchived: boolean): Promise<any[]>;
  findPatientById(id: string): Promise<any | undefined>;
  getPatientRelations(patientId: string): Promise<{
    caregiver: any;
    hospital: any;
    assignments: any[];
    activeAlerts: any[];
  }>;
}
