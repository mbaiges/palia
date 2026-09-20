import { GenericNotificationService } from './GenericNotificationService';
import type { NotificationRepository } from '@/domain/repositories/NotificationRepository';
import type { PushSubscriptionRepository } from '@/domain/repositories/PushSubscriptionRepository';

describe('GenericNotificationService', () => {
  const pushRepository: jest.Mocked<PushSubscriptionRepository> = {
    save: jest.fn(), findByUserId: jest.fn().mockResolvedValue([]),
    deleteByEndpoint: jest.fn(), deleteByEndpointIfExists: jest.fn(),
  };
  it('persists a generic welcome notification when the feed is empty', async () => {
    const repository: jest.Mocked<NotificationRepository> = {
      findByUserId: jest.fn().mockResolvedValue([
          {
            id: 'notification-1', userId: 'user-1', type: 'system',
            title: 'Welcome', body: 'Hello', createdAt: '2026-01-01T00:00:00Z', read: false,
          },
        ]),
      create: jest.fn().mockResolvedValue({
        id: 'notification-1', userId: 'user-1', type: 'system',
        title: 'Welcome', body: 'Hello', createdAt: '2026-01-01T00:00:00Z', read: false,
      }),
      createOnce: jest.fn().mockResolvedValue(undefined),
    };
    const service = new GenericNotificationService(repository, pushRepository);

    await expect(service.getMyNotifications('user-1')).resolves.toEqual([
      expect.objectContaining({ id: 'notification-1', type: 'system' }),
    ]);
    expect(repository.createOnce).toHaveBeenCalledWith(expect.objectContaining({ id: 'welcome-user-1', userId: 'user-1' }));
  });

  it('persists a generic example notification and tolerates missing push configuration', async () => {
    const repository: jest.Mocked<NotificationRepository> = {
      findByUserId: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: 'n1', userId: 'user-1', type: 'example', title: 'Example item created', body: 'Your example item was created successfully.', createdAt: '2026-01-01T00:00:00Z', read: false }),
      createOnce: jest.fn().mockResolvedValue(undefined),
    };
    const service = new GenericNotificationService(repository, pushRepository);
    delete process.env.VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;
    await expect(service.createExampleNotification('user-1')).resolves.toBeUndefined();
    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1', type: 'example' }));
  });
});
