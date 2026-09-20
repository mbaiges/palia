import { UserSettings } from './UserSettings';

describe('UserSettings', () => {
  it('should have correct shape', () => {
    const settings: UserSettings = {
      userId: 'user-1',
      theme: 'dark',
      locale: 'es',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(settings.userId).toBe('user-1');
    expect(settings.theme).toBe('dark');
  });
});
