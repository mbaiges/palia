/**
 * Role Priority Use Case
 * Determines the primary role for users with multiple roles based on priority
 * Priority order: admin > editor > user
 */
export class RolePriorityUseCase {
  /**
   * Role priority order (higher number = higher priority)
   */
  private static readonly ROLE_PRIORITY: Record<string, number> = {
    admin: 3,
    editor: 2,
    user: 1,
  };

  /**
   * Get the primary role from a list of role IDs based on priority
   * @param roleIds - Array of role IDs
   * @returns The highest priority role ID, or null if no roles provided
   */
  getPrimaryRole(roleIds: string[]): string | null {
    if (!roleIds || roleIds.length === 0) {
      return null;
    }

    // Sort roles by priority (highest first)
    const sortedRoles = roleIds
      .map(roleId => ({
        roleId,
        priority: RolePriorityUseCase.ROLE_PRIORITY[roleId.toLowerCase()] || 0,
      }))
      .sort((a, b) => b.priority - a.priority);

    // Return the highest priority role, or first role if priorities are equal
    return sortedRoles[0]?.roleId || null;
  }
}

