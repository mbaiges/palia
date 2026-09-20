import { injectable, inject } from 'tsyringe';
import { UserRepository } from '@/domain/repositories/UserRepository';
import { PaginatedResult } from '@/domain/models/PaginatedResult';
import { SearchUsersWithRolesParams } from '@/domain/models/SearchUsersWithRolesParams';
import { UserWithRole } from '@/domain/models/UserWithRole';
import { RoleRepository } from '@/domain/repositories/RoleRepository';
import { PermissionRepository } from '@/domain/repositories/PermissionRepository';
import { RolePriorityUseCase } from '@/domain/usecases/RolePriorityUseCase';
import { PermissionHelper } from '@/domain/utils/permissionHelper';
import { AppError } from '@/domain/errors/AppError';
import { ErrorCode } from '@/domain/errors/ErrorCodes';

/**
 * User Domain Service
 * Contains business logic for user operations
 */
@injectable()
export class UserService {
  private readonly rolePriorityUseCase: RolePriorityUseCase;

  constructor(
    @inject('UserRepository')
    private readonly userRepository: UserRepository,
    @inject('RoleRepository')
    private readonly roleRepository: RoleRepository,
    @inject('PermissionRepository')
    private readonly permissionRepository: PermissionRepository
  ) {
    this.rolePriorityUseCase = new RolePriorityUseCase();
  }

  /**
   * Search and paginate users with their roles and allowed status
   * Requires admin:manage_settings permission
   * @param requestingUserId - ID of the user making the request (must be admin)
   * @param params - Search and pagination parameters
   */
  async searchUsersWithRoles(
    requestingUserId: string,
    params: SearchUsersWithRolesParams
  ): Promise<PaginatedResult<UserWithRole>> {
    // Check if requesting user has admin permission
    // This will throw PermissionRequiredError if the user doesn't have the permission
    await PermissionHelper.requirePermission(
      this.permissionRepository,
      requestingUserId,
      'admin:manage_settings'
    );

    const { page, limit, searchQuery, includeAllowedUsers = false } = params;

    // Get all roles to map role IDs to names
    const roles = await this.roleRepository.findAll();
    const roleMap = new Map<string, string>();
    roles.forEach(role => {
      roleMap.set(role.roleId, role.name);
    });

    // Use database-level query to get paginated results
    const paginatedResult = await this.userRepository.searchUsersWithRolesAndAllowed({
      page,
      limit,
      searchQuery,
      includeAllowedUsers,
    });

    // Transform repository results to UserWithRole format
    // Resolve primary role using priority and map to role name
    const items: UserWithRole[] = paginatedResult.items.map(item => {
      // Get primary role based on priority
      const primaryRoleId = this.rolePriorityUseCase.getPrimaryRole(item.roleIds);
      const roleName = primaryRoleId ? roleMap.get(primaryRoleId) || null : null;

      return {
        email: item.email,
        userId: item.userId,
        isAllowed: item.isAllowed,
        isRegistered: item.isRegistered,
        role: roleName,
      };
    });

    return {
      items,
      totalItems: paginatedResult.totalItems,
      itemCount: paginatedResult.itemCount,
      itemsPerPage: paginatedResult.itemsPerPage,
      totalPages: paginatedResult.totalPages,
      currentPage: paginatedResult.currentPage,
    };
  }

  /**
   * Update a user's role
   * Requires admin:manage_roles permission
   * @param requestingUserId - ID of the user making the request (must have admin:manage_roles permission)
   * @param targetUserId - ID of the user whose role is being updated
   * @param newRoleId - The new role ID to assign
   */
  async updateUserRole(
    requestingUserId: string,
    targetUserId: string,
    newRoleId: string
  ): Promise<void> {
    // Verify requesting user has admin:manage_roles permission
    // This will throw PermissionRequiredError if the user doesn't have the permission
    await PermissionHelper.requirePermission(
      this.permissionRepository,
      requestingUserId,
      'admin:manage_roles'
    );

    // Find target user by ID
    const targetUser = await this.userRepository.findById(targetUserId);
    if (!targetUser) {
      throw new AppError('Target user not found', ErrorCode.NOT_FOUND);
    }

    // Validate target user is registered (has userId, not just in allowed_users)
    // Since we found the user by ID, they are registered, so this check is implicit

    // Get all valid roles from RoleRepository
    const allRoles = await this.roleRepository.findAll();
    const validRoleIds = allRoles.map(role => role.roleId);

    // Validate newRoleId exists in valid roles and is not 'admin'
    if (!validRoleIds.includes(newRoleId)) {
      throw new AppError(`Invalid role: ${newRoleId} is not a valid role`, ErrorCode.INVALID_INPUT);
    }

    if (newRoleId === 'admin') {
      throw new AppError('Cannot assign admin role via this endpoint', ErrorCode.INVALID_INPUT);
    }

    // Get target user's current roles
    const currentRoles = await this.userRepository.getUserRoles(targetUserId);

    // Prevent changing admin roles (if target has 'admin' role, throw error)
    if (currentRoles.includes('admin')) {
      throw new AppError('Cannot change role of an administrator', ErrorCode.FORBIDDEN);
    }

    // Call repository to replace role
    await this.userRepository.replaceUserRole(targetUserId, newRoleId);
  }

}

