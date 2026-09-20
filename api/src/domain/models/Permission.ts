/**
 * Permission Domain Entity
 * Represents a permission/feature that can be granted to roles
 */
export class Permission {
  constructor(
    public readonly permissionId: string,
    public readonly description: string
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.permissionId || this.permissionId.trim() === '') {
      throw new Error('Permission ID is required');
    }

    if (!this.description || this.description.trim() === '') {
      throw new Error('Permission description is required');
    }
  }

  /**
   * Convert to plain object
   */
  public toJSON(): Record<string, any> {
    return {
      permissionId: this.permissionId,
      description: this.description,
    };
  }
}

