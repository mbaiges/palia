import { UserSettings } from '@/domain/models/UserSettings';

export interface UserSettingsRepository {
  findByUserId(userId: string): Promise<UserSettings | null>;
  save(userSettings: UserSettings): Promise<UserSettings>;
  update(userId: string, settings: { theme?: string; locale?: string | null }): Promise<UserSettings>;
}
