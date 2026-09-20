import 'reflect-metadata';
import { UserController } from '@/infrastructure/controllers/UserController';
import { UserRepository } from '@/domain/repositories/UserRepository';
import { UserService } from '@/domain/services/UserService';
import { Request, Response } from 'express';
import { PublicUser } from '@/domain/models/PublicUser';
import { User } from '@/domain/models/User';
import { AuthenticatedRequest } from '@/infrastructure/middleware/authMiddleware';
import { PermissionRequiredError } from '@/domain/errors/PermissionRequiredError';
import { AppError } from '@/domain/errors/AppError';
import { ErrorCode } from '@/domain/errors/ErrorCodes';

jest.mock('@/domain/repositories/UserRepository');
jest.mock('@/domain/services/UserService');

import type { UserSettingsRepository } from '@/domain/repositories/UserSettingsRepository';

describe('UserController', () => {
    let userController: UserController;
    let mockUserRepository: jest.Mocked<UserRepository>;
    let mockUserSettingsRepository: jest.Mocked<UserSettingsRepository>;
    let mockUserService: jest.Mocked<UserService>;
    let mockRequest: Partial<AuthenticatedRequest>;
    let mockResponse: Partial<Response>;
    let mockStatus: jest.Mock;
    let mockJson: jest.Mock;
    const mockUserId = 'user-123';
    const mockUser = new User(mockUserId, 'google-123', 'test@test.com', 'Test User');

    beforeEach(() => {
        mockUserRepository = {
            findPublicAll: jest.fn(),
            findPublicById: jest.fn(),
        } as any;
        mockUserSettingsRepository = {
            findByUserId: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
        } as any;
        mockUserService = {
            searchUsersWithRoles: jest.fn(),
            updateUserRole: jest.fn(),
        } as any;
        userController = new UserController(mockUserRepository, mockUserSettingsRepository, mockUserService);
        mockJson = jest.fn();
        mockStatus = jest.fn().mockReturnValue({ json: mockJson });
        mockResponse = { status: mockStatus };
        mockRequest = { user: mockUser };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getUsers', () => {
        it('should return a list of public users and status 200', async () => {
            // Arrange
            const publicUsers = [
                new PublicUser('1', 'google-1', 'u1@test.com', 'User 1', undefined),
            ];
            mockUserRepository.findPublicAll.mockResolvedValue(publicUsers);

            // Act
            await userController.getUsers(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockUserRepository.findPublicAll).toHaveBeenCalled();
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith(publicUsers.map(u => u.toJSON()));
        });
    });

    describe('getMySettings', () => {
        it('returns persisted locale and theme in the shared settings envelope', async () => {
            mockUserSettingsRepository.findByUserId.mockResolvedValue({ userId: mockUserId, locale: 'es_AR', theme: 'dark', createdAt: '', updatedAt: '' } as any);
            await userController.getMySettings(mockRequest as AuthenticatedRequest, mockResponse as Response);
            expect(mockUserSettingsRepository.findByUserId).toHaveBeenCalledWith(mockUserId);
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith({ success: true, data: { locale: 'es_AR', theme: 'dark' } });
        });
    });

    describe('updateMySettings', () => {
        it('persists theme changes with the shared response shape', async () => {
            mockUserSettingsRepository.update.mockResolvedValue({ userId: mockUserId, locale: 'en', theme: 'dark', createdAt: '', updatedAt: '' } as any);
            mockRequest = { user: mockUser, body: { theme: ' dark ' } };
            await userController.updateMySettings(mockRequest as AuthenticatedRequest, mockResponse as Response);
            expect(mockUserSettingsRepository.update).toHaveBeenCalledWith(mockUserId, { theme: 'dark' });
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith({ success: true, settings: { locale: 'en', theme: 'dark' } });
        });

        it('rejects unsupported themes without writing settings', async () => {
            mockRequest = { user: mockUser, body: { theme: 'sepia' } };
            await userController.updateMySettings(mockRequest as AuthenticatedRequest, mockResponse as Response);
            expect(mockUserSettingsRepository.update).not.toHaveBeenCalled();
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ success: false, error: 'Invalid theme' });
        });
    });

    describe('updateMySettings', () => {
        it('persists theme changes with the shared response shape', async () => {
            mockUserSettingsRepository.update.mockResolvedValue({ userId: mockUserId, locale: 'en', theme: 'dark', createdAt: '', updatedAt: '' } as any);
            mockRequest = { user: mockUser, body: { theme: ' dark ' } };
            await userController.updateMySettings(mockRequest as AuthenticatedRequest, mockResponse as Response);
            expect(mockUserSettingsRepository.update).toHaveBeenCalledWith(mockUserId, { theme: 'dark' });
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith({ success: true, settings: { locale: 'en', theme: 'dark' } });
        });

        it('rejects unsupported themes without writing settings', async () => {
            mockRequest = { user: mockUser, body: { theme: 'sepia' } };
            await userController.updateMySettings(mockRequest as AuthenticatedRequest, mockResponse as Response);
            expect(mockUserSettingsRepository.update).not.toHaveBeenCalled();
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ success: false, error: 'Invalid theme' });
        });
    });

    describe('getUserById', () => {
        it('should return a single public user and status 200', async () => {
            // Arrange
            const userId = '1';
            mockRequest = { params: { id: userId } };
            const publicUser = new PublicUser(userId, 'google-1', 'u1@test.com', 'User 1', undefined);
            mockUserRepository.findPublicById.mockResolvedValue(publicUser);

            // Act
            await userController.getUserById(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockUserRepository.findPublicById).toHaveBeenCalledWith(userId);
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith(publicUser.toJSON());
        });

        it('should return 404 if a user is not found', async () => {
            // Arrange
            const userId = 'non-existent';
            mockRequest = { params: { id: userId } };
            mockUserRepository.findPublicById.mockResolvedValue(null);

            // Act
            await userController.getUserById(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockStatus).toHaveBeenCalledWith(404);
            expect(mockJson).toHaveBeenCalledWith({ message: 'User not found' });
        });
    });

    describe('searchUsers', () => {
        it('should return paginated users with roles and status 200', async () => {
            // Arrange
            const mockResult = {
                items: [
                    { email: 'user1@test.com', userId: '1', isAllowed: true, isRegistered: true, role: 'admin' },
                    { email: 'user2@test.com', userId: '2', isAllowed: true, isRegistered: true, role: 'user' },
                ],
                totalItems: 2,
                itemCount: 2,
                itemsPerPage: 10,
                totalPages: 1,
                currentPage: 1,
            };
            mockUserService.searchUsersWithRoles.mockResolvedValue(mockResult);
            mockRequest.query = { page: '1', limit: '10' };

            // Act
            await userController.searchUsers(mockRequest as AuthenticatedRequest, mockResponse as Response);

            // Assert
            expect(mockUserService.searchUsersWithRoles).toHaveBeenCalledWith(mockUserId, {
                page: 1,
                limit: 10,
                searchQuery: undefined,
                includeAllowedUsers: false,
            });
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith({
                data: mockResult.items,
                meta: {
                    totalItems: 2,
                    itemCount: 2,
                    itemsPerPage: 10,
                    totalPages: 1,
                    currentPage: 1,
                },
            });
        });

        it('should handle search query and include allowed users', async () => {
            // Arrange
            const mockResult = {
                items: [{ email: 'john@test.com', userId: '1', isAllowed: true, isRegistered: true, role: 'admin' }],
                totalItems: 1,
                itemCount: 1,
                itemsPerPage: 10,
                totalPages: 1,
                currentPage: 1,
            };
            mockUserService.searchUsersWithRoles.mockResolvedValue(mockResult);
            mockRequest.query = { page: '1', limit: '10', q: 'john', include_allowed_users: 'true' };

            // Act
            await userController.searchUsers(mockRequest as AuthenticatedRequest, mockResponse as Response);

            // Assert
            expect(mockUserService.searchUsersWithRoles).toHaveBeenCalledWith(mockUserId, {
                page: 1,
                limit: 10,
                searchQuery: 'john',
                includeAllowedUsers: true,
            });
            expect(mockStatus).toHaveBeenCalledWith(200);
        });


        it('should return 400 if page is less than 1', async () => {
            // Arrange
            mockRequest.query = { page: '0', limit: '10' };

            // Act
            await userController.searchUsers(mockRequest as AuthenticatedRequest, mockResponse as Response);

            // Assert
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({
                success: false,
                error: 'Bad Request',
                message: 'Page must be greater than 0',
            });
            // Service should not be called when validation fails
            expect(mockUserService.searchUsersWithRoles).not.toHaveBeenCalled();
        });

        it('should return 400 if limit is less than 1', async () => {
            // Arrange
            mockRequest.query = { page: '1', limit: '0' };

            // Act
            await userController.searchUsers(mockRequest as AuthenticatedRequest, mockResponse as Response);

            // Assert
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({
                success: false,
                error: 'Bad Request',
                message: 'Limit must be greater than 0',
            });
        });

        it('should enforce max limit of 100', async () => {
            // Arrange
            const mockResult = {
                items: [],
                totalItems: 0,
                itemCount: 0,
                itemsPerPage: 100,
                totalPages: 0,
                currentPage: 1,
            };
            mockUserService.searchUsersWithRoles.mockResolvedValue(mockResult);
            mockRequest.query = { page: '1', limit: '500' };

            // Act
            await userController.searchUsers(mockRequest as AuthenticatedRequest, mockResponse as Response);

            // Assert
            expect(mockUserService.searchUsersWithRoles).toHaveBeenCalledWith(mockUserId, {
                page: 1,
                limit: 100, // Should be capped at 100
                searchQuery: undefined,
                includeAllowedUsers: false,
            });
        });

        it('should use default values when query params are missing', async () => {
            // Arrange
            const mockResult = {
                items: [],
                totalItems: 0,
                itemCount: 0,
                itemsPerPage: 20,
                totalPages: 0,
                currentPage: 1,
            };
            mockUserService.searchUsersWithRoles.mockResolvedValue(mockResult);
            mockRequest.query = {};

            // Act
            await userController.searchUsers(mockRequest as AuthenticatedRequest, mockResponse as Response);

            // Assert
            expect(mockUserService.searchUsersWithRoles).toHaveBeenCalledWith(mockUserId, {
                page: 1,
                limit: 20, // Default limit
                searchQuery: undefined,
                includeAllowedUsers: false,
            });
        });

        // Note: Permission check is handled by middleware (permissionMiddleware.requirePermission)
        // This test is removed as the middleware prevents non-admin users from reaching the controller

        it('should return 500 on unexpected error', async () => {
            // Arrange
            const error = new Error('Database error');
            mockUserService.searchUsersWithRoles.mockRejectedValue(error);
            mockRequest.query = { page: '1', limit: '10' };

            // Act
            await userController.searchUsers(mockRequest as AuthenticatedRequest, mockResponse as Response);

            // Assert
            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({
                success: false,
                error: 'Failed to search users',
                message: 'Database error',
            });
        });
    });

    describe('updateUserRole', () => {
        it('should update user role and return 200', async () => {
            // Arrange
            const targetUserId = 'target-user-123';
            mockRequest = {
                user: mockUser,
                params: { userId: targetUserId },
                body: { role: 'editor' },
            };
            mockUserService.updateUserRole.mockResolvedValue(undefined);

            // Act
            await userController.updateUserRole(mockRequest as AuthenticatedRequest, mockResponse as Response);

            // Assert
            expect(mockUserService.updateUserRole).toHaveBeenCalledWith(mockUserId, targetUserId, 'editor');
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith({
                success: true,
                message: 'User role updated successfully',
            });
        });

        it('should return 400 if userId is missing', async () => {
            // Arrange
            mockRequest = {
                user: mockUser,
                params: {},
                body: { role: 'editor' },
            };

            // Act
            await userController.updateUserRole(mockRequest as AuthenticatedRequest, mockResponse as Response);

            // Assert
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({
                success: false,
                error: 'Bad Request',
                message: 'User ID is required',
            });
            expect(mockUserService.updateUserRole).not.toHaveBeenCalled();
        });

        it('should return 400 if role is missing', async () => {
            // Arrange
            mockRequest = {
                user: mockUser,
                params: { userId: 'target-user-123' },
                body: {},
            };

            // Act
            await userController.updateUserRole(mockRequest as AuthenticatedRequest, mockResponse as Response);

            // Assert
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({
                success: false,
                error: 'Bad Request',
                message: 'Role is required',
            });
            expect(mockUserService.updateUserRole).not.toHaveBeenCalled();
        });

        it('should return 404 if target user is not found', async () => {
            // Arrange
            const targetUserId = 'non-existent';
            mockRequest = {
                user: mockUser,
                params: { userId: targetUserId },
                body: { role: 'editor' },
            };
            mockUserService.updateUserRole.mockRejectedValue(new AppError('Target user not found', ErrorCode.NOT_FOUND));

            // Act
            await userController.updateUserRole(mockRequest as AuthenticatedRequest, mockResponse as Response);

            // Assert
            expect(mockStatus).toHaveBeenCalledWith(404);
            expect(mockJson).toHaveBeenCalledWith({
                success: false,
                error: 'Not Found',
                message: 'Target user not found',
            });
        });

        it('should return 409 if trying to change admin role', async () => {
            // Arrange
            const targetUserId = 'admin-user-123';
            mockRequest = {
                user: mockUser,
                params: { userId: targetUserId },
                body: { role: 'editor' },
            };
            mockUserService.updateUserRole.mockRejectedValue(new AppError('Cannot change role of an administrator', ErrorCode.FORBIDDEN));

            // Act
            await userController.updateUserRole(mockRequest as AuthenticatedRequest, mockResponse as Response);

            // Assert
            expect(mockStatus).toHaveBeenCalledWith(409);
            expect(mockJson).toHaveBeenCalledWith({
                success: false,
                error: 'Conflict',
                message: 'Cannot change role of an administrator',
            });
        });

        it('should return 400 if trying to assign admin role', async () => {
            // Arrange
            const targetUserId = 'target-user-123';
            mockRequest = {
                user: mockUser,
                params: { userId: targetUserId },
                body: { role: 'admin' },
            };
            mockUserService.updateUserRole.mockRejectedValue(new AppError('Cannot assign admin role via this endpoint', ErrorCode.INVALID_INPUT));

            // Act
            await userController.updateUserRole(mockRequest as AuthenticatedRequest, mockResponse as Response);

            // Assert
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({
                success: false,
                error: 'Bad Request',
                message: 'Cannot assign admin role via this endpoint',
            });
        });

        it('should return 400 if role is invalid', async () => {
            // Arrange
            const targetUserId = 'target-user-123';
            mockRequest = {
                user: mockUser,
                params: { userId: targetUserId },
                body: { role: 'invalid-role' },
            };
            mockUserService.updateUserRole.mockRejectedValue(new AppError('Invalid role: invalid-role is not a valid role', ErrorCode.INVALID_INPUT));

            // Act
            await userController.updateUserRole(mockRequest as AuthenticatedRequest, mockResponse as Response);

            // Assert
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({
                success: false,
                error: 'Bad Request',
                message: 'Invalid role: invalid-role is not a valid role',
            });
        });

        it('should return 403 if PermissionRequiredError is thrown', async () => {
            // Arrange
            const targetUserId = 'target-user-123';
            mockRequest = {
                user: mockUser,
                params: { userId: targetUserId },
                body: { role: 'editor' },
            };
            mockUserService.updateUserRole.mockRejectedValue(new PermissionRequiredError('admin:manage_roles'));

            // Act
            await userController.updateUserRole(mockRequest as AuthenticatedRequest, mockResponse as Response);

            // Assert
            expect(mockStatus).toHaveBeenCalledWith(403);
            expect(mockJson).toHaveBeenCalledWith({
                success: false,
                error: 'Forbidden',
                message: expect.stringContaining('admin:manage_roles'),
            });
        });

        it('should return 500 on unexpected error', async () => {
            // Arrange
            const targetUserId = 'target-user-123';
            mockRequest = {
                user: mockUser,
                params: { userId: targetUserId },
                body: { role: 'editor' },
            };
            mockUserService.updateUserRole.mockRejectedValue(new Error('Database error'));

            // Act
            await userController.updateUserRole(mockRequest as AuthenticatedRequest, mockResponse as Response);

            // Assert
            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({
                success: false,
                error: 'Failed to update user role',
                message: 'Database error',
            });
        });
    });
});

