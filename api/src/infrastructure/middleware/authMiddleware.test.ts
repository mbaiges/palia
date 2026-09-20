import 'reflect-metadata';
import { Request, Response, NextFunction } from 'express';
import { AuthMiddleware, AuthenticatedRequest } from '@/infrastructure/middleware/authMiddleware';
import { TokenProvider } from '@/domain/repositories/TokenProvider';
import { UserRepository } from '@/domain/repositories/UserRepository';
import { PermissionRepository } from '@/domain/repositories/PermissionRepository';
import { User } from '@/domain/models/User';

describe('AuthMiddleware', () => {
  let authMiddleware: AuthMiddleware;
  let mockTokenProvider: jest.Mocked<TokenProvider>;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockPermissionRepository: jest.Mocked<PermissionRepository>;
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockTokenProvider = {
      verifyToken: jest.fn(),
      generateToken: jest.fn(),
    } as any;

    mockUserRepository = {
      findById: jest.fn(),
      findByGoogleId: jest.fn(),
      findByEmail: jest.fn(),
      findPublicById: jest.fn(),
      findPublicAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      existsByEmail: jest.fn(),
      existsByGoogleId: jest.fn(),
      assignRole: jest.fn(),
      getUserRoles: jest.fn(),
    } as any;

    mockPermissionRepository = {
      findByUserId: jest.fn(),
      findByPermissionId: jest.fn(),
      findAll: jest.fn(),
    } as any;

    authMiddleware = new AuthMiddleware(
      mockTokenProvider,
      mockUserRepository,
      mockPermissionRepository
    );

    mockRequest = {
      headers: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should return 401 when no token is provided', async () => {
      mockRequest.headers = {};

      const middleware = authMiddleware.authenticate();
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'No token provided' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token is invalid', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };
      mockTokenProvider.verifyToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const middleware = authMiddleware.authenticate();
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not found', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };
      mockTokenProvider.verifyToken.mockReturnValue({ userId: 'user-123' } as any);
      mockUserRepository.findById.mockResolvedValue(null);

      const middleware = authMiddleware.authenticate();
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not found' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should attach user and permissions to request when authentication succeeds', async () => {
      const user = new User('user-123', 'google-123', 'test@example.com', 'Test User');
      const permissions = ['example:read', 'example:write'];

      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };
      mockTokenProvider.verifyToken.mockReturnValue({ userId: 'user-123' } as any);
      mockUserRepository.findById.mockResolvedValue(user);
      mockPermissionRepository.findByUserId.mockResolvedValue(permissions);

      const middleware = authMiddleware.authenticate();
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-123');
      expect(mockPermissionRepository.findByUserId).toHaveBeenCalledWith('user-123');
      expect((mockRequest as AuthenticatedRequest).user).toEqual(user);
      expect((mockRequest as AuthenticatedRequest).userPermissions).toEqual(permissions);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    it('should continue without user when no token is provided', async () => {
      mockRequest.headers = {};

      const middleware = authMiddleware.optionalAuth();
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
    });

    it('should attach user when valid token is provided', async () => {
      const user = new User('user-123', 'google-123', 'test@example.com', 'Test User');

      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };
      mockTokenProvider.verifyToken.mockReturnValue({ userId: 'user-123' } as any);
      mockUserRepository.findById.mockResolvedValue(user);

      const middleware = authMiddleware.optionalAuth();
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockRequest.user).toEqual(user);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without user when token is invalid', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };
      mockTokenProvider.verifyToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const middleware = authMiddleware.optionalAuth();
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without user when user is not found', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };
      mockTokenProvider.verifyToken.mockReturnValue({ userId: 'user-123' } as any);
      mockUserRepository.findById.mockResolvedValue(null);

      const middleware = authMiddleware.optionalAuth();
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });
  });
});

