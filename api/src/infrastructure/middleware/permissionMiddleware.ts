import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { PermissionRepository } from '@/domain/repositories/PermissionRepository';
import { AuthenticatedRequest } from './authMiddleware';

/**
 * Permission Middleware
 * Checks if authenticated user has required permission
 */
@injectable()
export class PermissionMiddleware {
  constructor(
    @inject('PermissionRepository')
    private readonly permissionRepository: PermissionRepository
  ) {}

  /**
   * Middleware factory that requires a specific permission
   * Returns 403 if permission missing, 401 if not authenticated
   */
  requirePermission(permissionId: string) {
    return async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      // Check if user is authenticated
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        });
        return;
      }

      // Get user permissions
      const userPermissions = await this.permissionRepository.findByUserId(
        req.user.id
      );

      // Check if user has the required permission
      if (!userPermissions.includes(permissionId)) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: `Permission '${permissionId}' is required`,
        });
        return;
      }

      next();
    };
  }
}

