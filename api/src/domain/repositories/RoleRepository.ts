import { Role } from '@/domain/models/Role';

/**
 * Role Repository Interface
 * Defines methods for accessing role data
 */
export interface RoleRepository {
  /**
   * Find a role by its ID
   */
  findByRoleId(roleId: string): Promise<Role | null>;

  /**
   * Find all roles
   */
  findAll(): Promise<Role[]>;

  /**
   * Find all permissions for a specific role
   */
  findPermissionsByRoleId(roleId: string): Promise<string[]>;
}

