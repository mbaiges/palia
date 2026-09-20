import type { Knex } from 'knex';

/** Replace product-plan roles and finance permissions with a small generic RBAC example. */
export async function up(knex: Knex): Promise<void> {
  await knex.transaction(async (trx) => {
    await trx('roles').insert([
      { role_id: 'user', name: 'User' },
      { role_id: 'editor', name: 'Editor' },
    ]).onConflict('role_id').ignore();

    await trx('permissions').insert([
      { permission_id: 'example:read', description: 'Allows the user to view example items' },
      { permission_id: 'example:write', description: 'Allows the user to create example items' },
    ]).onConflict('permission_id').ignore();

    await trx.raw(`
      INSERT OR IGNORE INTO user_roles (user_id, role_id)
      SELECT user_id, CASE role_id WHEN 'free' THEN 'user' ELSE 'editor' END
      FROM user_roles WHERE role_id IN ('free', 'gold')
    `);

    await trx('role_permissions').whereIn('role_id', ['free', 'gold', 'user', 'editor', 'admin']).delete();
    await trx('role_permissions').insert([
      { role_id: 'user', permission_id: 'example:read' },
      { role_id: 'editor', permission_id: 'example:read' },
      { role_id: 'editor', permission_id: 'example:write' },
      { role_id: 'admin', permission_id: 'example:read' },
      { role_id: 'admin', permission_id: 'example:write' },
    ]);

    await trx('role_permissions').insert([
      { role_id: 'admin', permission_id: 'admin:manage_users' },
      { role_id: 'admin', permission_id: 'admin:manage_settings' },
      { role_id: 'admin', permission_id: 'admin:manage_roles' },
    ]).onConflict(['role_id', 'permission_id']).ignore();

    await trx('user_roles').whereIn('role_id', ['free', 'gold']).delete();
    await trx('roles').whereIn('role_id', ['free', 'gold']).delete();
    await trx('permissions').whereIn('permission_id', ['movements:use', 'investments:use']).delete();
  });
}

export async function down(): Promise<void> {
  // Intentionally irreversible: product-specific RBAC data is not restored.
}
