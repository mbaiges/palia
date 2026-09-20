import type { Knex } from 'knex';

/**
 * Create RBAC tables migration
 * Creates roles, permissions, user_roles, and role_permissions tables
 */
export async function up(knex: Knex): Promise<void> {
  // Create roles table
  const hasRolesTable = await knex.schema.hasTable('roles');
  if (!hasRolesTable) {
    await knex.schema.createTable('roles', (table) => {
      table.string('role_id').primary();
      table.string('name').unique().notNullable();
    });
    await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_roles_role_id ON roles(role_id)');
  }

  // Create permissions table
  const hasPermissionsTable = await knex.schema.hasTable('permissions');
  if (!hasPermissionsTable) {
    await knex.schema.createTable('permissions', (table) => {
      table.string('permission_id').primary();
      table.string('description').notNullable();
    });
    await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_permissions_permission_id ON permissions(permission_id)');
  }

  // Create user_roles table
  const hasUserRolesTable = await knex.schema.hasTable('user_roles');
  if (!hasUserRolesTable) {
    await knex.schema.createTable('user_roles', (table) => {
      table.string('user_id').notNullable();
      table.string('role_id').notNullable();
      table.primary(['user_id', 'role_id']);
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.foreign('role_id').references('role_id').inTable('roles').onDelete('CASCADE');
    });
    await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id)');
    await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id)');
  }

  // Create role_permissions table
  const hasRolePermissionsTable = await knex.schema.hasTable('role_permissions');
  if (!hasRolePermissionsTable) {
    await knex.schema.createTable('role_permissions', (table) => {
      table.string('role_id').notNullable();
      table.string('permission_id').notNullable();
      table.primary(['role_id', 'permission_id']);
      table.foreign('role_id').references('role_id').inTable('roles').onDelete('CASCADE');
      table.foreign('permission_id').references('permission_id').inTable('permissions').onDelete('CASCADE');
    });
    await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id)');
    await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id)');
  }
}

export async function down(knex: Knex): Promise<void> {
  // Drop tables in reverse order of dependencies
  await knex.schema.dropTableIfExists('role_permissions');
  await knex.schema.dropTableIfExists('user_roles');
  await knex.schema.dropTableIfExists('permissions');
  await knex.schema.dropTableIfExists('roles');
}

