import { Request, Response, NextFunction } from 'express';
import { PermissionMiddleware } from './permissionMiddleware';
import { PermissionRepository } from '@/domain/repositories/PermissionRepository';
import { AuthenticatedRequest } from './authMiddleware';
import { User } from '@/domain/models/User';

describe('PermissionMiddleware', () => {
  let permissionMiddleware: PermissionMiddleware;
  let mockPermissionRepository: jest.Mocked<PermissionRepository>;
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockPermissionRepository = {
      findByUserId: jest.fn(),
      findByPermissionId: jest.fn(),
      findAll: jest.fn(),
    } as any;

    permissionMiddleware = new PermissionMiddleware(mockPermissionRepository);

    mockRequest = {
      user: new User(
        'user-123',
        'google-123',
        'test@example.com',
        'Test User'
      ),
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('requirePermission', () => {
    it('should call next() when user has required permission', async () => {
      mockPermissionRepository.findByUserId.mockResolvedValue([
        'example:read',
        'admin:manage_settings',
      ]);

      const middleware = permissionMiddleware.requirePermission('admin:manage_settings');
      await middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 403 when user lacks required permission', async () => {
      mockPermissionRepository.findByUserId.mockResolvedValue(['example:read']);

      const middleware = permissionMiddleware.requirePermission('admin:manage_settings');
      await middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Forbidden',
        message: "Permission 'admin:manage_settings' is required",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', async () => {
      mockRequest.user = undefined;

      const middleware = permissionMiddleware.requirePermission('admin:manage_settings');
      await middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});

