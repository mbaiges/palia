import type { Knex } from 'knex';

const PERMISSIONS = [
  { permission_id: 'example:read', description: 'Allows the user to view example items' },
  { permission_id: 'example:write', description: 'Allows the user to create example items' },
  { permission_id: 'admin:manage_users', description: 'Allows user to manage other users' },
  { permission_id: 'admin:manage_settings', description: 'Allows user to manage application settings' },
  { permission_id: 'admin:manage_roles', description: 'Allows user to manage user roles' },
];

const ROLE_PERMISSIONS = [
  { role_id: 'user', permission_id: 'example:read' },
  { role_id: 'editor', permission_id: 'example:read' },
  { role_id: 'editor', permission_id: 'example:write' },
  { role_id: 'admin', permission_id: 'example:read' },
  { role_id: 'admin', permission_id: 'example:write' },
  { role_id: 'admin', permission_id: 'admin:manage_users' },
  { role_id: 'admin', permission_id: 'admin:manage_settings' },
  { role_id: 'admin', permission_id: 'admin:manage_roles' },
];

/**
 * Ensures role_permissions are populated when empty.
 * Fixes case where seed migration (004) skipped because roles existed,
 * leaving role_permissions empty and users with no permissions.
 */
export async function up(knex: Knex): Promise<void> {
  const rpCount = await knex('role_permissions').count('* as c').first();
  if (rpCount && Number((rpCount as { c: number }).c) > 0) return;

  // Ensure permissions exist
  for (const p of PERMISSIONS) {
    const exists = await knex('permissions').where('permission_id', p.permission_id).first();
    if (!exists) {
      await knex('permissions').insert(p);
    }
  }

  await knex('role_permissions').insert(ROLE_PERMISSIONS);
  console.log(`✅ Inserted ${ROLE_PERMISSIONS.length} role_permissions`);
}

export async function down(knex: Knex): Promise<void> {
  // No-op - we don't remove role_permissions on rollback
}
