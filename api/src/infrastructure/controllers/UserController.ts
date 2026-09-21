import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { UserRepository } from '@/domain/repositories/UserRepository';
import { UserSettingsRepository } from '@/domain/repositories/UserSettingsRepository';
import { UserService } from '@/domain/services/UserService';
import { logger } from '@/domain/utils/logger';
import { AuthenticatedRequest } from '@/infrastructure/middleware/authMiddleware';
import { AppError } from '@/domain/errors/AppError';
import { ErrorCode } from '@/domain/errors/ErrorCodes';
import { PermissionRequiredError } from '@/domain/errors/PermissionRequiredError';
import { auditEventService } from '@/infrastructure/services/AuditEventService';

const SUPPORTED_LOCALES = ['en', 'es', 'es_AR'];

/**
 * User Controller
 * Handles HTTP requests for user management
 */
@injectable()
export class UserController {
  constructor(
    @inject('UserRepository') private readonly userRepository: UserRepository,
    @inject('UserSettingsRepository')
    private readonly userSettingsRepository: UserSettingsRepository,
    @inject('UserService') private readonly userService: UserService
  ) {}

  /**
   * Get all users
   */
  public async getUsers(_req: Request, res: Response): Promise<void> {
    try {
      const users = await this.userRepository.findPublicAll();
      res.status(200).json(users.map(user => user.toJSON()));
    } catch (error: any) {
      logger.error('Failed to fetch users', error);
      res
        .status(500)
        .json({ message: 'Failed to fetch users', error: error.message });
    }
  }

  /**
   * Get user by ID
   */
  public async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await this.userRepository.findPublicById(id);

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.status(200).json(user.toJSON());
    } catch (error: any) {
      logger.error('Failed to fetch user by id', error);
      res
        .status(500)
        .json({ message: 'Failed to fetch user', error: error.message });
    }
  }

  /**
   * Get user by Google ID
   */
  public async getUserByGoogleId(req: Request, res: Response): Promise<void> {
    try {
      const { googleId } = req.params;
      const user = await this.userRepository.findByGoogleId(googleId);

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.status(200).json(user.toJSON());
    } catch (error: any) {
      logger.error('Failed to fetch user by google id', error);
      res
        .status(500)
        .json({ message: 'Failed to fetch user', error: error.message });
    }
  }

  /**
   * Delete user by ID
   */
  public async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const actorId = (req as AuthenticatedRequest).user!.id;
      const roles = await this.userRepository.getUserRoles(id);
      if (roles.includes('admin')) {
        res.status(409).json({
          message:
            'Administrator accounts cannot be deleted through this endpoint',
        });
        return;
      }
      const deleted = await this.userRepository.delete(id);

      if (!deleted) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      await auditEventService.record({
        actorId,
        action: 'user.deleted',
        entityType: 'user',
        entityId: id,
        metadata: {},
      });

      res.status(204).send();
    } catch (error: any) {
      logger.error('Failed to delete user', error);
      res
        .status(500)
        .json({ message: 'Failed to delete user', error: error.message });
    }
  }

  /**
   * Read current user's settings (locale, theme)
   * GET /api/users/me/settings
   */
  async getMySettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const settings = await this.userSettingsRepository.findByUserId(
        req.user!.id
      );
      res.status(200).json({
        success: true,
        data: {
          locale: settings?.locale ?? 'en',
          theme: settings?.theme ?? 'light',
        },
      });
    } catch (error: any) {
      logger.error('Get user settings error', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Update current user's settings (locale, theme)
   * PATCH /api/users/me/settings
   * Body: { locale?: string }
   */
  async updateMySettings(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      if (
        !req.body ||
        typeof req.body !== 'object' ||
        Array.isArray(req.body)
      ) {
        res.status(400).json({ success: false, error: 'Invalid settings' });
        return;
      }
      const userId = req.user!.id;
      const { locale, theme } = req.body || {};

      if (locale !== undefined) {
        if (typeof locale !== 'string') {
          res.status(400).json({
            success: false,
            error: 'Invalid locale',
            message: `Locale must be one of: ${SUPPORTED_LOCALES.join(', ')}`,
          });
          return;
        }
        const normalized = locale.trim();
        if (normalized && !SUPPORTED_LOCALES.includes(normalized)) {
          res.status(400).json({
            success: false,
            error: 'Invalid locale',
            message: `Locale must be one of: ${SUPPORTED_LOCALES.join(', ')}`,
          });
          return;
        }
      }

      if (
        theme !== undefined &&
        (typeof theme !== 'string' ||
          !['light', 'dark', 'system'].includes(theme.trim()))
      ) {
        res.status(400).json({ success: false, error: 'Invalid theme' });
        return;
      }

      const updatePayload: { locale?: string | null; theme?: string } = {};
      if (locale !== undefined) {
        updatePayload.locale = locale.trim() || null;
      }
      if (theme !== undefined) updatePayload.theme = theme.trim();
      const settings = await this.userSettingsRepository.update(
        userId,
        updatePayload
      );

      res.status(200).json({
        success: true,
        settings: {
          locale: settings.locale ?? 'en',
          theme: settings.theme || 'light',
        },
      });
    } catch (error: any) {
      logger.error('Update user settings error', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Search and paginate users with their roles and allowed status
   * GET /api/users?page=1&limit=10&q=john&include_allowed_users=true
   * Requires admin:manage_settings permission (enforced by middleware)
   */
  async searchUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // User authentication and admin permission are already checked by middleware
      const userId = req.user!.id;

      // Parse query parameters
      const pageParam = req.query.page as string;
      const page = pageParam ? parseInt(pageParam, 10) : 1;
      const limitParam = req.query.limit as string;
      const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 20; // Default 20, max 100
      const searchQuery = req.query.q as string | undefined;
      const includeAllowedUsers = req.query.include_allowed_users === 'true';

      // Validate pagination parameters
      if (page < 1) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Page must be greater than 0',
        });
        return;
      }

      if (limit < 1) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Limit must be greater than 0',
        });
        return;
      }

      const result = await this.userService.searchUsersWithRoles(userId, {
        page,
        limit,
        searchQuery,
        includeAllowedUsers,
      });

      res.status(200).json({
        data: result.items,
        meta: {
          totalItems: result.totalItems,
          itemCount: result.itemCount,
          itemsPerPage: result.itemsPerPage,
          totalPages: result.totalPages,
          currentPage: result.currentPage,
        },
      });
    } catch (error: any) {
      logger.error('Search users error', error);

      // Handle PermissionRequiredError (shouldn't happen due to middleware, but handle defensively)
      if (error instanceof PermissionRequiredError) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: error.message,
        });
        return;
      }

      // Handle AppError instances
      if (error instanceof AppError) {
        res.status(500).json({
          success: false,
          error: 'Failed to search users',
          message: error.message,
        });
        return;
      }

      // Handle unexpected errors
      res.status(500).json({
        success: false,
        error: 'Failed to search users',
        message: error.message,
      });
    }
  }

  /**
   * Update a user's role
   * PUT /admin/users/:userId/role
   * Requires admin:manage_roles permission (enforced by middleware)
   * Body: { role: string }
   */
  async updateUserRole(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      // User authentication and admin:manage_roles permission are already checked by middleware
      const requestingUserId = req.user!.id;
      const { userId } = req.params;
      const { role } = req.body;

      // Validate input
      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'User ID is required',
        });
        return;
      }

      if (!role || typeof role !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Role is required',
        });
        return;
      }

      await this.userService.updateUserRole(requestingUserId, userId, role);
      await auditEventService.record({
        actorId: requestingUserId,
        action: 'user.role_updated',
        entityType: 'user',
        entityId: userId,
        metadata: { role },
      });

      res.status(200).json({
        success: true,
        message: 'User role updated successfully',
      });
    } catch (error: any) {
      logger.error('Update user role error', error);

      // Handle PermissionRequiredError (shouldn't happen due to middleware, but handle defensively)
      if (error instanceof PermissionRequiredError) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: error.message,
        });
        return;
      }

      // Handle AppError instances
      if (error instanceof AppError) {
        switch (error.errorCode) {
          case ErrorCode.NOT_FOUND:
            res.status(404).json({
              success: false,
              error: 'Not Found',
              message: error.message,
            });
            return;
          case ErrorCode.INVALID_INPUT:
            res.status(400).json({
              success: false,
              error: 'Bad Request',
              message: error.message,
            });
            return;
          case ErrorCode.FORBIDDEN:
            res.status(409).json({
              success: false,
              error: 'Conflict',
              message: error.message,
            });
            return;
          default:
            res.status(500).json({
              success: false,
              error: 'Failed to update user role',
              message: error.message,
            });
            return;
        }
      }

      // Handle unexpected errors
      res.status(500).json({
        success: false,
        error: 'Failed to update user role',
        message: error.message,
      });
    }
  }
}
