import { PermissionRepository } from '@/domain/repositories/PermissionRepository';
import { PermissionRequiredError } from '@/domain/errors/PermissionRequiredError';

/**
 * Permission Helper
 * Provides utility functions for checking permissions in services
 */
export class PermissionHelper {
  /**
   * Check if a user has a specific permission
   * Throws PermissionRequiredError if the user doesn't have the permission
   * @param permissionRepository - The permission repository instance
   * @param userId - The user ID to check
   * @param permissionId - The permission ID to check for
   * @throws PermissionRequiredError if user doesn't have the permission
   */
  static async requirePermission(
    permissionRepository: PermissionRepository,
    userId: string,
    permissionId: string
  ): Promise<void> {
    const permissions = await permissionRepository.findByUserId(userId);
    if (!permissions.includes(permissionId)) {
      throw new PermissionRequiredError(permissionId);
    }
  }

  /**
   * Check if a user has any of the specified permissions
   * Throws PermissionRequiredError if the user doesn't have any of the permissions
   * @param permissionRepository - The permission repository instance
   * @param userId - The user ID to check
   * @param permissionIds - Array of permission IDs to check for
   * @throws PermissionRequiredError if user doesn't have any of the permissions
   */
  static async requireAnyPermission(
    permissionRepository: PermissionRepository,
    userId: string,
    permissionIds: string[]
  ): Promise<void> {
    const permissions = await permissionRepository.findByUserId(userId);
    const hasAnyPermission = permissionIds.some(permissionId =>
      permissions.includes(permissionId)
    );
    if (!hasAnyPermission) {
      throw new PermissionRequiredError(
        permissionIds.join(' or '),
        `One of the following permissions is required: ${permissionIds.join(', ')}`
      );
    }
  }
}

