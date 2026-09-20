import type { Knex } from 'knex';

/**
 * Ensures default roles exist (idempotent).
 * Fixes dev bypass FK error when admin role is missing.
 */
export async function up(knex: Knex): Promise<void> {
  const defaultRoles = [
    { role_id: 'user', name: 'User' },
    { role_id: 'editor', name: 'Editor' },
    { role_id: 'admin', name: 'Administrator' },
  ];

  for (const role of defaultRoles) {
    const exists = await knex('roles').where('role_id', role.role_id).first();
    if (!exists) {
      await knex('roles').insert(role);
      console.log(`✅ Inserted missing role: ${role.role_id}`);
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  // No-op - we don't remove roles on rollback as they may be in use
}
