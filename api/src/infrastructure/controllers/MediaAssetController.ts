import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { MediaAssetService } from '@/domain/services/MediaAssetService';
import type { AuthenticatedRequest } from '@/infrastructure/middleware/authMiddleware';
import { auditEventService } from '@/infrastructure/services/AuditEventService';

@injectable()
export class MediaAssetController {
  constructor(@inject('MediaAssetService') private readonly service: MediaAssetService) {}

  async uploadMultipart(req: AuthenticatedRequest, res: Response): Promise<void> {
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file?.buffer?.length) { res.status(400).json({ error: 'file is required' }); return; }
    const asset = await this.service.create(req.user!.id, file.buffer);
    await auditEventService.record({ actorId: req.user!.id, action: 'media_asset.uploaded', entityType: 'media_asset', entityId: asset.id, metadata: { mode: 'multipart' } });
    res.status(201).json({ asset });
  }

  async uploadDataUrl(req: AuthenticatedRequest, res: Response): Promise<void> {
    const asset = await this.service.create(req.user!.id, String(req.body?.data_url ?? req.body?.dataUrl ?? ''));
    await auditEventService.record({ actorId: req.user!.id, action: 'media_asset.uploaded', entityType: 'media_asset', entityId: asset.id, metadata: { mode: 'data-url' } });
    res.status(201).json({ asset });
  }

  async uploadMultipartAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
    return this.uploadMultipart(req, res);
  }

  async uploadDataUrlAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
    return this.uploadDataUrl(req, res);
  }

  async listMine(req: AuthenticatedRequest, res: Response): Promise<void> { res.json({ assets: await this.service.listForUser(req.user!.id) }); }
  async listAll(_req: Request, res: Response): Promise<void> { res.json({ assets: await this.service.listAll() }); }

  async get(req: AuthenticatedRequest, res: Response): Promise<void> {
    const result = await this.service.getForUser(req.params.id, req.user!.id);
    res.setHeader('Content-Type', result.asset.mimeType);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(result.body);
  }
}
