import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { TokenProvider } from '@/domain/repositories/TokenProvider';
import { UserRepository } from '@/domain/repositories/UserRepository';
import { PermissionRepository } from '@/domain/repositories/PermissionRepository';
import { User } from '@/domain/models/User';
import { resolveBrowserSession } from '@/infrastructure/services/BrowserSession';

/**
 * Extended Request interface with user data
 */
export interface AuthenticatedRequest extends Request {
  user?: User; // We will attach the full User object now
  userPermissions?: string[]; // User's permissions for this request
}

@injectable()
export class AuthMiddleware {
  constructor(
    @inject('TokenProvider') private readonly tokenProvider: TokenProvider,
    @inject('UserRepository') private readonly userRepository: UserRepository,
    @inject('PermissionRepository')
    private readonly permissionRepository: PermissionRepository
  ) {}

  /**
   * Middleware function to verify JWT token and user existence
   */
  authenticate() {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      let token = this.extractToken(req);
      let sessionUserId: string | undefined;

      if (!token) {
        try {
          const session = await resolveBrowserSession(req);
          token = session?.jwt ?? null;
          sessionUserId = session?.userId;
        } catch {
          token = null;
        }
      }

      if (!token) {
        res.status(401).json({ message: 'No token provided' });
        return;
      }

      try {
        const decoded = this.tokenProvider.verifyToken(token);
        const userId = sessionUserId ?? decoded.userId;
        const user = await this.userRepository.findById(userId);

        if (!user) {
          res.status(401).json({ message: 'User not found' });
          return;
        }

        // Load user permissions
        const permissions = await this.permissionRepository.findByUserId(user.id);

        // Attach user and permissions to request
        (req as AuthenticatedRequest).user = user;
        (req as AuthenticatedRequest).userPermissions = permissions;
        next();
      } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
      }
    };
  }

  /**
   * Optional authentication - doesn't fail if no token
   */
  optionalAuth() {
    return async (
      req: AuthenticatedRequest,
      _res: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const token = this.extractToken(req);

        if (token) {
          const decoded = this.tokenProvider.verifyToken(token);
          const user = await this.userRepository.findById(decoded.userId);
          if (user) {
            req.user = user;
          }
        }

        next();
      } catch (error) {
        // Silent fail - continue without user data
        next();
      }
    };
  }

  /**
   * Extract JWT token from Authorization header
   */
  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return null;
  }
}
