export interface MediceProfileRepository {
  find(userId: string): Promise<any | undefined>;
  save(userId: string, profile: Record<string, unknown>, timestamp: string): Promise<void>;
  assignmentCount(userId: string): Promise<number>;
}
