import { Permission } from '@/domain/models/Permission';

/**
 * Permission Repository Interface
 * Defines methods for accessing permission data
 */
export interface PermissionRepository {
  /**
   * Find a permission by its ID
   */
  findByPermissionId(permissionId: string): Promise<Permission | null>;

  /**
   * Find all permissions
   */
  findAll(): Promise<Permission[]>;

  /**
   * Find all permissions for a specific user (aggregated from their roles)
   */
  findByUserId(userId: string): Promise<string[]>;
}

