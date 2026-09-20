import type { Request, Response } from 'express';
import { auditEventService } from '@/infrastructure/services/AuditEventService';

export class AuditEventController {
  async list(req: Request, res: Response): Promise<void> {
    const events = await auditEventService.list({ action: typeof req.query.action === 'string' ? req.query.action : undefined, entityType: typeof req.query.entity_type === 'string' ? req.query.entity_type : undefined, limit: Number(req.query.limit) || 100 });
    res.json({ events });
  }

  async export(req: Request, res: Response): Promise<void> {
    const events = await auditEventService.list({ action: typeof req.query.action === 'string' ? req.query.action : undefined, entityType: typeof req.query.entity_type === 'string' ? req.query.entity_type : undefined, limit: Number(req.query.limit) || 500 });
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="audit-events.json"');
    res.json({ events });
  }
}
