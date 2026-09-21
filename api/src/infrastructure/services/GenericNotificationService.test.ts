import { GenericNotificationService } from './GenericNotificationService';
import type { NotificationRepository } from '@/domain/repositories/NotificationRepository';
import type { PushSubscriptionRepository } from '@/domain/repositories/PushSubscriptionRepository';
import webpush from 'web-push';
import { logger } from '@/domain/utils/logger';

jest.mock('web-push', () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn().mockResolvedValue(undefined),
}));

describe('GenericNotificationService', () => {
  const pushRepository: jest.Mocked<PushSubscriptionRepository> = {
    save: jest.fn(),
    findByUserId: jest.fn().mockResolvedValue([]),
    deleteByUserAndEndpoint: jest.fn(),
    deleteByEndpoint: jest.fn(),
    deleteByEndpointIfExists: jest.fn(),
  };
  it('returns only persisted notifications without seeding scaffold content', async () => {
    const repository: jest.Mocked<NotificationRepository> = {
      findByUserId: jest.fn().mockResolvedValue([
        {
          id: 'notification-1',
          userId: 'user-1',
          type: 'system',
          title: 'Welcome',
          body: 'Hello',
          createdAt: '2026-01-01T00:00:00Z',
          read: false,
        },
      ]),
      create: jest.fn().mockResolvedValue({
        id: 'notification-1',
        userId: 'user-1',
        type: 'system',
        title: 'Welcome',
        body: 'Hello',
        createdAt: '2026-01-01T00:00:00Z',
        read: false,
      }),
      createOnce: jest.fn().mockResolvedValue(undefined),
    };
    const service = new GenericNotificationService(repository, pushRepository);

    await expect(service.getMyNotifications('user-1')).resolves.toEqual([
      expect.objectContaining({ id: 'notification-1', type: 'system' }),
    ]);
    expect(repository.createOnce).not.toHaveBeenCalled();
  });

  it('persists generic clinical notifications without patient details', async () => {
    const repository: jest.Mocked<NotificationRepository> = {
      findByUserId: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      createOnce: jest.fn().mockResolvedValue(undefined),
    };
    const service = new GenericNotificationService(repository, pushRepository);
    delete process.env.VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;
    await service.sendGenericClinicalAlert('user-2', 'alert-1');
    expect(repository.createOnce).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'alert-alert-1-user-2',
        userId: 'user-2',
        title: 'Palia',
        body: 'Hay una actualización. Inicia sesión para consultar la información.',
      })
    );
  });

  it('sends only a generic push payload to the subscribed user', async () => {
    const repository: jest.Mocked<NotificationRepository> = {
      findByUserId: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      createOnce: jest.fn().mockResolvedValue(undefined),
    };
    const subscribedPush: jest.Mocked<PushSubscriptionRepository> = {
      save: jest.fn(),
      findByUserId: jest.fn().mockResolvedValue([
        {
          id: 'sub-1',
          userId: 'user-2',
          endpoint: 'https://push.example/sub',
          p256dh: 'p256dh',
          auth: 'auth',
          createdAt: '2026-01-01T00:00:00Z',
        },
      ]),
      deleteByUserAndEndpoint: jest.fn(),
      deleteByEndpoint: jest.fn(),
      deleteByEndpointIfExists: jest.fn(),
    };
    const previous = {
      enabled: process.env.PUSH_ENABLED,
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY,
    };
    process.env.PUSH_ENABLED = 'true';
    process.env.VAPID_PUBLIC_KEY = 'public-test-key';
    process.env.VAPID_PRIVATE_KEY = 'private-test-key';
    const service = new GenericNotificationService(repository, subscribedPush);
    try {
      await service.sendGenericClinicalAlert('user-2', 'alert-id-1');
      expect(webpush.sendNotification).toHaveBeenCalledTimes(1);
      const payload = JSON.parse(
        (webpush.sendNotification as jest.Mock).mock.calls[0][1]
      );
      expect(payload).toEqual({
        title: 'Palia',
        body: 'Hay una actualización. Inicia sesión para consultar la información.',
        type: 'system',
        data: {
          notificationId: 'alert-alert-id-1-user-2',
          alertId: 'alert-id-1',
        },
      });
      expect(JSON.stringify(payload)).not.toMatch(
        /patient|paciente|clinical|diagnosis|name|motive/i
      );
    } finally {
      if (previous.enabled === undefined) delete process.env.PUSH_ENABLED;
      else process.env.PUSH_ENABLED = previous.enabled;
      if (previous.publicKey === undefined) delete process.env.VAPID_PUBLIC_KEY;
      else process.env.VAPID_PUBLIC_KEY = previous.publicKey;
      if (previous.privateKey === undefined)
        delete process.env.VAPID_PRIVATE_KEY;
      else process.env.VAPID_PRIVATE_KEY = previous.privateKey;
      (webpush.sendNotification as jest.Mock).mockClear();
    }
  });

  it('removes expired push subscriptions when the provider returns 404 or 410', async () => {
    const repository: jest.Mocked<NotificationRepository> = {
      findByUserId: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      createOnce: jest.fn().mockResolvedValue(undefined),
    };
    const expiredSubscription: jest.Mocked<PushSubscriptionRepository> = {
      save: jest.fn(),
      findByUserId: jest.fn().mockResolvedValue([
        {
          id: 'expired-sub',
          userId: 'user-3',
          endpoint: 'https://push.example/expired',
          p256dh: 'p256dh',
          auth: 'auth',
          createdAt: '2026-01-01T00:00:00Z',
        },
      ]),
      deleteByUserAndEndpoint: jest.fn(),
      deleteByEndpoint: jest.fn(),
      deleteByEndpointIfExists: jest.fn().mockResolvedValue(undefined),
    };
    const previous = {
      enabled: process.env.PUSH_ENABLED,
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY,
    };
    const loggerSpy = jest.spyOn(logger, 'error').mockImplementation();
    process.env.PUSH_ENABLED = 'true';
    process.env.VAPID_PUBLIC_KEY = 'public-test-key';
    process.env.VAPID_PRIVATE_KEY = 'private-test-key';
    (webpush.sendNotification as jest.Mock).mockRejectedValueOnce(
      Object.assign(new Error('gone'), { statusCode: 410 }),
    );
    try {
      await new GenericNotificationService(repository, expiredSubscription)
        .sendGenericClinicalAlert('user-3', 'alert-3');
      expect(expiredSubscription.deleteByEndpointIfExists).toHaveBeenCalledWith(
        'https://push.example/expired',
      );
      expect(repository.createOnce).toHaveBeenCalled();
    } finally {
      loggerSpy.mockRestore();
      if (previous.enabled === undefined) delete process.env.PUSH_ENABLED;
      else process.env.PUSH_ENABLED = previous.enabled;
      if (previous.publicKey === undefined) delete process.env.VAPID_PUBLIC_KEY;
      else process.env.VAPID_PUBLIC_KEY = previous.publicKey;
      if (previous.privateKey === undefined)
        delete process.env.VAPID_PRIVATE_KEY;
      else process.env.VAPID_PRIVATE_KEY = previous.privateKey;
      (webpush.sendNotification as jest.Mock).mockReset().mockResolvedValue(undefined);
    }
  });

  it('keeps the in-app notification when the push provider fails transiently', async () => {
    const repository: jest.Mocked<NotificationRepository> = {
      findByUserId: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      createOnce: jest.fn().mockResolvedValue(undefined),
    };
    const subscribedPush: jest.Mocked<PushSubscriptionRepository> = {
      ...pushRepository,
      findByUserId: jest.fn().mockResolvedValue([
        {
          id: 'sub-transient',
          userId: 'user-4',
          endpoint: 'https://push.example/transient',
          p256dh: 'p256dh',
          auth: 'auth',
          createdAt: '2026-01-01T00:00:00Z',
        },
      ]),
    };
    const previous = {
      enabled: process.env.PUSH_ENABLED,
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY,
    };
    const loggerSpy = jest.spyOn(logger, 'error').mockImplementation();
    process.env.PUSH_ENABLED = 'true';
    process.env.VAPID_PUBLIC_KEY = 'public-test-key';
    process.env.VAPID_PRIVATE_KEY = 'private-test-key';
    (webpush.sendNotification as jest.Mock).mockRejectedValueOnce(
      new Error('temporary provider failure'),
    );
    try {
      await new GenericNotificationService(repository, subscribedPush)
        .sendGenericClinicalAlert('user-4', 'alert-4');
      expect(repository.createOnce).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'alert-alert-4-user-4' }),
      );
      expect(subscribedPush.deleteByEndpointIfExists).not.toHaveBeenCalled();
    } finally {
      loggerSpy.mockRestore();
      if (previous.enabled === undefined) delete process.env.PUSH_ENABLED;
      else process.env.PUSH_ENABLED = previous.enabled;
      if (previous.publicKey === undefined) delete process.env.VAPID_PUBLIC_KEY;
      else process.env.VAPID_PUBLIC_KEY = previous.publicKey;
      if (previous.privateKey === undefined)
        delete process.env.VAPID_PRIVATE_KEY;
      else process.env.VAPID_PRIVATE_KEY = previous.privateKey;
      (webpush.sendNotification as jest.Mock).mockReset().mockResolvedValue(undefined);
    }
  });

  it('persists a generic example notification and tolerates missing push configuration', async () => {
    const repository: jest.Mocked<NotificationRepository> = {
      findByUserId: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({
        id: 'n1',
        userId: 'user-1',
        type: 'example',
        title: 'Example item created',
        body: 'Your example item was created successfully.',
        createdAt: '2026-01-01T00:00:00Z',
        read: false,
      }),
      createOnce: jest.fn().mockResolvedValue(undefined),
    };
    const service = new GenericNotificationService(repository, pushRepository);
    delete process.env.VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;
    await expect(
      service.createExampleNotification('user-1')
    ).resolves.toBeUndefined();
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', type: 'example' })
    );
  });
});
