/**
 * Role Domain Entity
 * Represents a user role/tier in the system
 */
export class Role {
  constructor(
    public readonly roleId: string,
    public readonly name: string
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.roleId || this.roleId.trim() === '') {
      throw new Error('Role ID is required');
    }

    if (!this.name || this.name.trim() === '') {
      throw new Error('Role name is required');
    }
  }

  /**
   * Convert to plain object
   */
  public toJSON(): Record<string, any> {
    return {
      roleId: this.roleId,
      name: this.name,
    };
  }
}

