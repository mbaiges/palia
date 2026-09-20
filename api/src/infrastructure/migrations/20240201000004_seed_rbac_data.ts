import type { Knex } from 'knex';
import { configService } from '@/infrastructure/config/config';

/**
 * Seed RBAC data migration
 * Inserts default roles, permissions, and links them together
 * Also migrates existing allowed emails from config/env to database
 */
export async function up(knex: Knex): Promise<void> {
  // Check if roles already exist
  const existingRoles = await knex('roles').select('role_id');
  if (existingRoles.length > 0) {
    console.log('⚠️  Roles already exist, skipping seed data migration');
    return;
  }

  // Insert default roles
  await knex('roles').insert([
    { role_id: 'free', name: 'Free User' },
    { role_id: 'gold', name: 'Gold User' },
    { role_id: 'admin', name: 'Administrator' },
  ]);

  // Insert default permissions
  await knex('permissions').insert([
    { permission_id: 'movements:use', description: 'Allows user to access movements feature' },
    { permission_id: 'investments:use', description: 'Allows user to access investments feature' },
    { permission_id: 'admin:manage_users', description: 'Allows user to manage other users' },
    { permission_id: 'admin:manage_settings', description: 'Allows user to manage application settings' },
    { permission_id: 'admin:manage_roles', description: 'Allows user to manage user roles' },
  ]);

  // Link permissions to roles
  // Free tier: movements only
  await knex('role_permissions').insert([
    { role_id: 'free', permission_id: 'movements:use' },
  ]);

  // Gold tier: movements + investments
  await knex('role_permissions').insert([
    { role_id: 'gold', permission_id: 'movements:use' },
    { role_id: 'gold', permission_id: 'investments:use' },
  ]);

  // Admin: all permissions
  await knex('role_permissions').insert([
    { role_id: 'admin', permission_id: 'movements:use' },
    { role_id: 'admin', permission_id: 'investments:use' },
    { role_id: 'admin', permission_id: 'admin:manage_users' },
    { role_id: 'admin', permission_id: 'admin:manage_settings' },
    { role_id: 'admin', permission_id: 'admin:manage_roles' },
  ]);

  // Migrate existing allowed emails from config/env to database
  const allowedEmails = configService.getAllowedEmails();
  if (allowedEmails.length > 0) {
    const existingEmails = await knex('app_settings_allowed_users').select('email');
    const existingEmailSet = new Set(existingEmails.map((e) => e.email));

    const emailsToInsert = allowedEmails
      .filter((email) => !existingEmailSet.has(email))
      .map((email) => ({
        email: email.trim(),
        created_at: new Date().toISOString(),
      }));

    if (emailsToInsert.length > 0) {
      await knex('app_settings_allowed_users').insert(emailsToInsert);
      console.log(`✅ Migrated ${emailsToInsert.length} allowed emails from config to database`);
    }
  }

  // Assign 'free' role to all existing users
  const existingUsers = await knex('users').select('id');
  const existingUserRoles = await knex('user_roles').select('user_id', 'role_id');
  const userRoleSet = new Set(existingUserRoles.map((ur) => `${ur.user_id}:${ur.role_id}`));

  const userRolesToInsert = existingUsers
    .filter((user) => !userRoleSet.has(`${user.id}:free`))
    .map((user) => ({
      user_id: user.id,
      role_id: 'free',
    }));

  if (userRolesToInsert.length > 0) {
    await knex('user_roles').insert(userRolesToInsert);
    console.log(`✅ Assigned 'free' role to ${userRolesToInsert.length} existing users`);
  }
}

export async function down(knex: Knex): Promise<void> {
  // Remove role assignments
  await knex('user_roles').delete();

  // Remove role-permission links
  await knex('role_permissions').delete();

  // Remove permissions
  await knex('permissions').delete();

  // Remove roles
  await knex('roles').delete();

  // Note: We don't delete app_settings_allowed_users data on down migration
  // as it may contain manually added entries
}

