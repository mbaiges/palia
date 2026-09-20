import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { ExampleItemService } from '@/domain/services/ExampleItemService';
import type { AuthenticatedRequest } from '@/infrastructure/middleware/authMiddleware';
import { auditEventService } from '@/infrastructure/services/AuditEventService';
import { GenericNotificationService } from '@/infrastructure/services/GenericNotificationService';
import { logger } from '@/domain/utils/logger';

@injectable()
export class ExampleItemController {
  constructor(
    @inject('ExampleItemService') private readonly service: ExampleItemService,
    @inject('GenericNotificationService') private readonly notifications: GenericNotificationService
  ) {}

  async listMine(req: AuthenticatedRequest, res: Response): Promise<void> {
    const items = await this.service.listForUser(req.user!.id);
    res.json({ items });
  }

  async listAll(_req: Request, res: Response): Promise<void> {
    const items = await this.service.listAll();
    res.json({ items });
  }

  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    const item = await this.service.create(req.user!.id, req.body ?? {});
    await auditEventService.record({ actorId: req.user!.id, action: 'example_item.created', entityType: 'example_item', entityId: item.id, metadata: { title: item.title } });
    try {
      await this.notifications.createExampleNotification(req.user!.id);
    } catch (error) {
      logger.error('Could not persist example-item notification', error, { userId: req.user!.id, exampleItemId: item.id });
    }
    res.status(201).json({ item });
  }
}
