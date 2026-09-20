import 'reflect-metadata';
import { UserService } from './UserService';
import { UserRepository } from '@/domain/repositories/UserRepository';
import { RoleRepository } from '@/domain/repositories/RoleRepository';
import { PermissionRepository } from '@/domain/repositories/PermissionRepository';
import { UserWithRole } from '@/domain/models/UserWithRole';
import { Role } from '@/domain/models/Role';
import { PermissionRequiredError } from '@/domain/errors/PermissionRequiredError';
import { AppError } from '@/domain/errors/AppError';
import { ErrorCode } from '@/domain/errors/ErrorCodes';
import { User } from '@/domain/models/User';

jest.mock('@/domain/repositories/UserRepository');
jest.mock('@/domain/repositories/RoleRepository');
jest.mock('@/domain/repositories/PermissionRepository');

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockRoleRepository: jest.Mocked<RoleRepository>;
  let mockPermissionRepository: jest.Mocked<PermissionRepository>;
  const mockUserId = 'user-123';

  beforeEach(() => {
    mockUserRepository = {
      searchUsersWithRolesAndAllowed: jest.fn(),
      findById: jest.fn(),
      getUserRoles: jest.fn(),
      replaceUserRole: jest.fn(),
    } as any;
    mockRoleRepository = {
      findAll: jest.fn(),
    } as any;
    mockPermissionRepository = {
      findByUserId: jest.fn(),
    } as any;

    userService = new UserService(
      mockUserRepository,
      mockRoleRepository,
      mockPermissionRepository
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('searchUsersWithRoles', () => {
    it('should return paginated users with roles when user has admin permission', async () => {
      // Arrange
      mockPermissionRepository.findByUserId.mockResolvedValue(['admin:manage_settings']);
      mockUserRepository.searchUsersWithRolesAndAllowed.mockResolvedValue({
        items: [
          {
            email: 'user1@test.com',
            userId: '1',
            roleIds: ['admin'],
            isAllowed: true,
            isRegistered: true,
          },
          {
            email: 'user2@test.com',
            userId: '2',
            roleIds: ['user'],
            isAllowed: true,
            isRegistered: true,
          },
        ],
        totalItems: 2,
        itemCount: 2,
        itemsPerPage: 10,
        totalPages: 1,
        currentPage: 1,
      });
      mockRoleRepository.findAll.mockResolvedValue([
        new Role('admin', 'Admin'),
        new Role('user', 'User'),
      ]);

      // Act
      const result = await userService.searchUsersWithRoles(mockUserId, {
        page: 1,
        limit: 10,
      });

      // Assert
      expect(result.items).toHaveLength(2);
      expect(result.items[0].email).toBe('user1@test.com');
      expect(result.items[0].isRegistered).toBe(true);
      expect(result.items[0].role).toBe('Admin');
      expect(result.totalItems).toBe(2);
      expect(mockUserRepository.searchUsersWithRolesAndAllowed).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        searchQuery: undefined,
        includeAllowedUsers: false,
      });
    });

    it('should throw PermissionRequiredError when user does not have admin permission', async () => {
      // Arrange
      mockPermissionRepository.findByUserId.mockResolvedValue([]);

      // Act & Assert
      await expect(
        userService.searchUsersWithRoles(mockUserId, {
          page: 1,
          limit: 10,
        })
      ).rejects.toThrow(PermissionRequiredError);
      await expect(
        userService.searchUsersWithRoles(mockUserId, {
          page: 1,
          limit: 10,
        })
      ).rejects.toThrow('admin:manage_settings');
    });

    it('should filter users by search query', async () => {
      // Arrange
      mockPermissionRepository.findByUserId.mockResolvedValue(['admin:manage_settings']);
      mockUserRepository.searchUsersWithRolesAndAllowed.mockResolvedValue({
        items: [
          {
            email: 'john@test.com',
            userId: '1',
            roleIds: ['user'],
            isAllowed: true,
            isRegistered: true,
          },
        ],
        totalItems: 1,
        itemCount: 1,
        itemsPerPage: 10,
        totalPages: 1,
        currentPage: 1,
      });
      mockRoleRepository.findAll.mockResolvedValue([new Role('user', 'User')]);

      // Act
      const result = await userService.searchUsersWithRoles(mockUserId, {
        page: 1,
        limit: 10,
        searchQuery: 'john',
      });

      // Assert
      expect(mockUserRepository.searchUsersWithRolesAndAllowed).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        searchQuery: 'john',
        includeAllowedUsers: false,
      });
      expect(result.items).toHaveLength(1);
    });

    it('should include allowed users when includeAllowedUsers is true', async () => {
      // Arrange
      mockPermissionRepository.findByUserId.mockResolvedValue(['admin:manage_settings']);
      mockUserRepository.searchUsersWithRolesAndAllowed.mockResolvedValue({
        items: [
          {
            email: 'user1@test.com',
            userId: '1',
            roleIds: ['user'],
            isAllowed: true,
            isRegistered: true,
          },
          {
            email: 'unregistered@test.com',
            userId: null,
            roleIds: ['user'],
            isAllowed: true,
            isRegistered: false,
          },
        ],
        totalItems: 2,
        itemCount: 2,
        itemsPerPage: 10,
        totalPages: 1,
        currentPage: 1,
      });
      mockRoleRepository.findAll.mockResolvedValue([new Role('user', 'User')]);

      // Act
      const result = await userService.searchUsersWithRoles(mockUserId, {
        page: 1,
        limit: 10,
        includeAllowedUsers: true,
      });

      // Assert
      expect(mockUserRepository.searchUsersWithRolesAndAllowed).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        searchQuery: undefined,
        includeAllowedUsers: true,
      });
      expect(result.items.length).toBe(2);
      const unregisteredUser = result.items.find(u => u.email === 'unregistered@test.com');
      expect(unregisteredUser).toBeDefined();
      expect(unregisteredUser!.isRegistered).toBe(false);
      expect(unregisteredUser!.isAllowed).toBe(true);
      expect(unregisteredUser!.role).toBe('User');
    });

    it('should set isAllowed correctly based on repository data', async () => {
      // Arrange
      mockPermissionRepository.findByUserId.mockResolvedValue(['admin:manage_settings']);
      mockUserRepository.searchUsersWithRolesAndAllowed.mockResolvedValue({
        items: [
          {
            email: 'allowed@test.com',
            userId: '1',
            roleIds: ['user'],
            isAllowed: true,
            isRegistered: true,
          },
          {
            email: 'notallowed@test.com',
            userId: '2',
            roleIds: ['user'],
            isAllowed: false,
            isRegistered: true,
          },
        ],
        totalItems: 2,
        itemCount: 2,
        itemsPerPage: 10,
        totalPages: 1,
        currentPage: 1,
      });
      mockRoleRepository.findAll.mockResolvedValue([new Role('user', 'User')]);

      // Act
      const result = await userService.searchUsersWithRoles(mockUserId, {
        page: 1,
        limit: 10,
      });

      // Assert
      expect(result.items[0].isAllowed).toBe(true);
      expect(result.items[1].isAllowed).toBe(false);
    });

    it('should handle users with no roles', async () => {
      // Arrange
      mockPermissionRepository.findByUserId.mockResolvedValue(['admin:manage_settings']);
      mockUserRepository.searchUsersWithRolesAndAllowed.mockResolvedValue({
        items: [
          {
            email: 'user1@test.com',
            userId: '1',
            roleIds: [],
            isAllowed: true,
            isRegistered: true,
          },
        ],
        totalItems: 1,
        itemCount: 1,
        itemsPerPage: 10,
        totalPages: 1,
        currentPage: 1,
      });
      mockRoleRepository.findAll.mockResolvedValue([new Role('user', 'User')]);

      // Act
      const result = await userService.searchUsersWithRoles(mockUserId, {
        page: 1,
        limit: 10,
      });

      // Assert
      expect(result.items[0].role).toBeNull();
    });

    it('should prioritize admin role over editor and user', async () => {
      // Arrange
      mockPermissionRepository.findByUserId.mockResolvedValue(['admin:manage_settings']);
      mockUserRepository.searchUsersWithRolesAndAllowed.mockResolvedValue({
        items: [
          {
            email: 'user1@test.com',
            userId: '1',
            roleIds: ['user', 'editor', 'admin'],
            isAllowed: true,
            isRegistered: true,
          },
        ],
        totalItems: 1,
        itemCount: 1,
        itemsPerPage: 10,
        totalPages: 1,
        currentPage: 1,
      });
      mockRoleRepository.findAll.mockResolvedValue([
        new Role('admin', 'Admin'),
        new Role('editor', 'Editor'),
        new Role('user', 'User'),
      ]);

      // Act
      const result = await userService.searchUsersWithRoles(mockUserId, {
        page: 1,
        limit: 10,
      });

      // Assert
      expect(result.items[0].role).toBe('Admin');
    });

    it('should prioritize editor role over user', async () => {
      // Arrange
      mockPermissionRepository.findByUserId.mockResolvedValue(['admin:manage_settings']);
      mockUserRepository.searchUsersWithRolesAndAllowed.mockResolvedValue({
        items: [
          {
            email: 'user1@test.com',
            userId: '1',
            roleIds: ['user', 'editor'],
            isAllowed: true,
            isRegistered: true,
          },
        ],
        totalItems: 1,
        itemCount: 1,
        itemsPerPage: 10,
        totalPages: 1,
        currentPage: 1,
      });
      mockRoleRepository.findAll.mockResolvedValue([
        new Role('editor', 'Editor'),
        new Role('user', 'User'),
      ]);

      // Act
      const result = await userService.searchUsersWithRoles(mockUserId, {
        page: 1,
        limit: 10,
      });

      // Assert
      expect(result.items[0].role).toBe('Editor');
    });
  });

  describe('updateUserRole', () => {
    const targetUserId = 'target-user-123';
    const requestingUserId = 'admin-user-123';

    beforeEach(() => {
      mockUserRepository.findById = jest.fn();
      mockUserRepository.getUserRoles = jest.fn();
      mockUserRepository.replaceUserRole = jest.fn();
    });

    it('should update user role when requesting user has admin:manage_roles permission', async () => {
      // Arrange
      const targetUser = new User(targetUserId, 'google-target', 'target@test.com', 'Target User');
      mockPermissionRepository.findByUserId.mockResolvedValue(['admin:manage_roles']);
      mockUserRepository.findById.mockResolvedValue(targetUser);
      mockRoleRepository.findAll.mockResolvedValue([
        new Role('user', 'User'),
        new Role('editor', 'Editor'),
        new Role('admin', 'Administrator'),
      ]);
      mockUserRepository.getUserRoles.mockResolvedValue(['user']);

      // Act
      await userService.updateUserRole(requestingUserId, targetUserId, 'editor');

      // Assert
      expect(mockUserRepository.replaceUserRole).toHaveBeenCalledWith(targetUserId, 'editor');
    });

    it('should throw PermissionRequiredError when requesting user lacks admin:manage_roles permission', async () => {
      // Arrange
      mockPermissionRepository.findByUserId.mockResolvedValue([]);

      // Act & Assert
      await expect(
        userService.updateUserRole(requestingUserId, targetUserId, 'editor')
      ).rejects.toThrow(PermissionRequiredError);
      await expect(
        userService.updateUserRole(requestingUserId, targetUserId, 'editor')
      ).rejects.toThrow('admin:manage_roles');
      expect(mockUserRepository.replaceUserRole).not.toHaveBeenCalled();
    });

    it('should throw AppError with NOT_FOUND when target user is not found', async () => {
      // Arrange
      mockPermissionRepository.findByUserId.mockResolvedValue(['admin:manage_roles']);
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        userService.updateUserRole(requestingUserId, targetUserId, 'editor')
      ).rejects.toThrow(AppError);
      await expect(
        userService.updateUserRole(requestingUserId, targetUserId, 'editor')
      ).rejects.toThrow('Target user not found');
      expect(mockUserRepository.replaceUserRole).not.toHaveBeenCalled();
    });

    it('should throw AppError with INVALID_INPUT when new role is not a valid role', async () => {
      // Arrange
      const targetUser = new User(targetUserId, 'google-target', 'target@test.com', 'Target User');
      mockPermissionRepository.findByUserId.mockResolvedValue(['admin:manage_roles']);
      mockUserRepository.findById.mockResolvedValue(targetUser);
      mockRoleRepository.findAll.mockResolvedValue([
        new Role('user', 'User'),
        new Role('editor', 'Editor'),
      ]);

      // Act & Assert
      await expect(
        userService.updateUserRole(requestingUserId, targetUserId, 'invalid-role')
      ).rejects.toThrow(AppError);
      await expect(
        userService.updateUserRole(requestingUserId, targetUserId, 'invalid-role')
      ).rejects.toThrow('Invalid role: invalid-role is not a valid role');
      expect(mockUserRepository.replaceUserRole).not.toHaveBeenCalled();
    });

    it('should throw AppError with INVALID_INPUT when trying to assign admin role', async () => {
      // Arrange
      const targetUser = new User(targetUserId, 'google-target', 'target@test.com', 'Target User');
      mockPermissionRepository.findByUserId.mockResolvedValue(['admin:manage_roles']);
      mockUserRepository.findById.mockResolvedValue(targetUser);
      mockRoleRepository.findAll.mockResolvedValue([
        new Role('user', 'User'),
        new Role('editor', 'Editor'),
        new Role('admin', 'Administrator'),
      ]);

      // Act & Assert
      await expect(
        userService.updateUserRole(requestingUserId, targetUserId, 'admin')
      ).rejects.toThrow(AppError);
      await expect(
        userService.updateUserRole(requestingUserId, targetUserId, 'admin')
      ).rejects.toThrow('Cannot assign admin role via this endpoint');
      expect(mockUserRepository.replaceUserRole).not.toHaveBeenCalled();
    });

    it('should throw AppError with FORBIDDEN when trying to change admin user role', async () => {
      // Arrange
      const targetUser = new User(targetUserId, 'google-target', 'target@test.com', 'Target User');
      mockPermissionRepository.findByUserId.mockResolvedValue(['admin:manage_roles']);
      mockUserRepository.findById.mockResolvedValue(targetUser);
      mockRoleRepository.findAll.mockResolvedValue([
        new Role('user', 'User'),
        new Role('editor', 'Editor'),
        new Role('admin', 'Administrator'),
      ]);
      mockUserRepository.getUserRoles.mockResolvedValue(['admin']);

      // Act & Assert
      await expect(
        userService.updateUserRole(requestingUserId, targetUserId, 'editor')
      ).rejects.toThrow(AppError);
      await expect(
        userService.updateUserRole(requestingUserId, targetUserId, 'editor')
      ).rejects.toThrow('Cannot change role of an administrator');
      expect(mockUserRepository.replaceUserRole).not.toHaveBeenCalled();
    });
  });
});

