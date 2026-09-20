/**
 * UserPermissions Domain Entity
 * Represents a user's aggregated permissions from all their roles
 */
export class UserPermissions {
  constructor(private readonly permissionIds: string[]) {}

  /**
   * Check if user has a specific permission
   */
  public hasPermission(permissionId: string): boolean {
    return this.permissionIds.includes(permissionId);
  }

  /**
   * Get all permission IDs
   */
  public getPermissionIds(): string[] {
    return [...this.permissionIds];
  }

  /**
   * Convert to plain object
   */
  public toJSON(): Record<string, any> {
    return {
      permissions: this.permissionIds,
    };
  }
}

