export type NotificationType = 'system' | 'example';

export interface NotificationRecord {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
}

export interface NotificationRepository {
  findByUserId(userId: string): Promise<NotificationRecord[]>;
  create(input: CreateNotificationInput): Promise<NotificationRecord>;
  createOnce(input: CreateNotificationInput & { id: string }): Promise<void>;
}
