import { inject, injectable } from 'tsyringe';
import type { NotificationRepository } from '@/domain/repositories/NotificationRepository';
import type { PushSubscriptionRepository } from '@/domain/repositories/PushSubscriptionRepository';
import webpush from 'web-push';
import { logger } from '@/domain/utils/logger';

export type GenericNotification = {
  id: string;
  type: 'system' | 'example';
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  data?: { notificationId: string; alertId?: string };
};

@injectable()
export class GenericNotificationService {
  constructor(
    @inject('NotificationRepository') private readonly repository: NotificationRepository,
    @inject('PushSubscriptionRepository') private readonly pushRepository: PushSubscriptionRepository
  ) {}

  async getMyNotifications(userId: string): Promise<GenericNotification[]> {
    const notifications = await this.repository.findByUserId(userId);
    return notifications.map(({ id, type, title, body, createdAt, read }) => ({ id, type, title, body, createdAt, read }));
  }

  async createExampleNotification(userId: string): Promise<void> {
    const notification = await this.repository.create({
      userId,
      type: 'example',
      title: 'Example item created',
      body: 'Your example item was created successfully.',
    });
    await this.sendPushBestEffort(userId, notification);
  }

  async sendGenericClinicalAlert(userId: string, alertId: string): Promise<void> {
    const notification = {
      id: `alert-${alertId}-${userId}`,
      userId,
      type: 'system' as const,
      title: 'Palia',
      body: 'Hay una actualización. Inicia sesión para consultar la información.',
      createdAt: new Date().toISOString(),
      read: false,
      data: { notificationId: `alert-${alertId}-${userId}`, alertId },
    };
    await this.repository.createOnce({ id: notification.id, userId, type: notification.type, title: notification.title, body: notification.body });
    await this.sendPushBestEffort(userId, notification);
  }

  private async sendPushBestEffort(userId: string, notification: GenericNotification): Promise<void> {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    if (['false', '0'].includes((process.env.PUSH_ENABLED ?? 'true').toLowerCase()) || !publicKey || !privateKey) return;
    try {
      webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? 'mailto:admin@example.com', publicKey, privateKey);
      const subscriptions = await this.pushRepository.findByUserId(userId);
      await Promise.all(subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification({
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          }, JSON.stringify({ title: notification.title, body: notification.body, type: notification.type, data: notification.data ?? { notificationId: notification.id } }));
        } catch (error: any) {
          if (error?.statusCode === 404 || error?.statusCode === 410) {
            await this.pushRepository.deleteByEndpointIfExists(subscription.endpoint);
          }
          logger.error('Push notification delivery failed', error, { userId, notificationId: notification.id });
        }
      }));
    } catch (error: any) {
      logger.error('Push notification delivery skipped', error, { userId, notificationId: notification.id });
    }
  }
}
