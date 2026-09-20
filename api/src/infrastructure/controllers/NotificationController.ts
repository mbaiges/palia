import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { GenericNotificationService } from '@/infrastructure/services/GenericNotificationService';
import { AuthenticatedUser } from '@/domain/models/AuthenticatedUser';

@injectable()
export class NotificationController {
  constructor(
    @inject('GenericNotificationService')
    private readonly notificationService: GenericNotificationService
  ) {}

  private getUser(req: Request): AuthenticatedUser {
    const user = (req as any).user as AuthenticatedUser;
    if (!user) throw new Error('Unauthorized');
    return user;
  }

  async getMyNotifications(req: Request, res: Response): Promise<void> {
    try {
      const user = this.getUser(req);
      const notifications = await this.notificationService.getMyNotifications(user.id);
      res.json({ notifications });
    } catch (error: any) {
      res.status(error.message === 'Unauthorized' ? 401 : 500).json({ error: error.message });
    }
  }
}
