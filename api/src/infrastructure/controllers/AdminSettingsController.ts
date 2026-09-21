import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { AppError } from '@/domain/errors/AppError';
import { ErrorCode } from '@/domain/errors/ErrorCodes';
import { AdminSettingsHandler } from '@/application/handlers/AdminSettingsHandler';
import { logger } from '@/domain/utils/logger';
import { DatabaseConfig } from '@/infrastructure/config/database';
import { auditEventService } from '@/infrastructure/services/AuditEventService';

const sendError = (res: Response, status: number, error: unknown) => {
  const e = error as Error;
  const payload: Record<string, unknown> = { error: e.message };
  if (error instanceof AppError) payload.errorCode = error.errorCode;
  res.status(status).json(payload);
};

/**
 * Admin Settings Controller
 * Handles HTTP requests for admin settings management
 */
@injectable()
export class AdminSettingsController {
  constructor(
    @inject('AdminSettingsHandler')
    private readonly adminSettingsHandler: AdminSettingsHandler
  ) {}

  /**
   * Get all allowed users
   * GET /api/admin/settings/allowed_users
   */
  async getAllowedUsers(_req: Request, res: Response): Promise<void> {
    try {
      const emails = await this.adminSettingsHandler.getAllowedUsers();

      res.status(200).json({
        success: true,
        data: {
          allowedUsers: emails,
        },
      });
    } catch (error: any) {
      logger.error('Get allowed users error', error);
      sendError(res, 500, error);
    }
  }

  /**
   * Add an allowed user
   * POST /api/admin/settings/allowed_users
   * Body: { email: string }
   */
  async addAllowedUser(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email || typeof email !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Email is required',
        });
        return;
      }

      await this.adminSettingsHandler.addAllowedUser(email);
      await auditEventService.record({
        actorId: (req as any).user?.id ?? null,
        action: 'access.allowlist_added',
        entityType: 'allowlist',
        entityId: null,
        metadata: {},
      });

      res.status(201).json({
        success: true,
        message: 'Allowed user added successfully',
      });
    } catch (error: any) {
      logger.error('Add allowed user error', error);
      const status =
        error instanceof AppError && error.errorCode === ErrorCode.ADMIN_EMAIL_ALREADY_ALLOWED ? 409
        : error instanceof AppError && error.errorCode === ErrorCode.ADMIN_INVALID_EMAIL ? 400
        : error.message?.includes('already') ? 409
        : error.message?.includes('Invalid email') ? 400
        : 500;
      sendError(res, status, error);
    }
  }

  /**
   * Remove an allowed user
   * DELETE /api/admin/settings/allowed_users/:email
   */
  async removeAllowedUser(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.params;

      if (!email) {
        res.status(400).json({
          success: false,
          error: 'Email is required',
        });
        return;
      }

      // Decode email from URL (in case it contains special characters)
      const decodedEmail = decodeURIComponent(email);
      const emailNormalized = decodedEmail.trim().toLowerCase();
      const user = await DatabaseConfig.getKnex()('users').whereRaw('LOWER(email) = ?', [emailNormalized]).first('id');
      if (user && user.id === (req as any).user?.id) {
        res.status(409).json({ error: 'No se puede retirar el acceso de la sesión actual.' });
        return;
      }

      await this.adminSettingsHandler.removeAllowedUser(decodedEmail);

      if (user) await DatabaseConfig.getKnex()('auth_sessions').where({ user_id: user.id }).delete();
      await auditEventService.record({
        actorId: (req as any).user?.id ?? null,
        action: 'access.allowlist_removed',
        entityType: 'allowlist',
        entityId: null,
        metadata: { sessionsRevoked: Boolean(user) },
      });

      res.status(200).json({
        success: true,
        message: 'Allowed user removed successfully',
      });
    } catch (error: any) {
      logger.error('Remove allowed user error', error);
      const status =
        error instanceof AppError && error.errorCode === ErrorCode.ADMIN_EMAIL_NOT_ALLOWED ? 404
        : error instanceof AppError && error.errorCode === ErrorCode.ADMIN_INVALID_EMAIL ? 400
        : error.message?.includes('not in') ? 404
        : error.message?.includes('Invalid email') ? 400
        : 500;
      sendError(res, status, error);
    }
  }
}

