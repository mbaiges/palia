export interface MediceDirectoryRepository {
  listVolunteers(): Promise<any[]>;
  listAllowlist(): Promise<any[]>;
  addAllowlist(email: string, actorId: string, timestamp: string): Promise<void>;
  stats(userId: string, global: boolean, periodDays: number): Promise<Record<string, number>>;
}
