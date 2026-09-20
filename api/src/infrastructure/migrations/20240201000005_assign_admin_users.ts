import type { Knex } from 'knex';

/**
 * Assign admin roles to specific users
 * This migration can be run independently after users have signed up
 * It's idempotent - safe to run multiple times
 */
export async function up(knex: Knex): Promise<void> {
  // List of emails that should have admin role
  const adminEmails = ['matiasbaiges@gmail.com', 'admin@test.com'];

  for (const email of adminEmails) {
    const user = await knex('users').where('email', email).first();

    if (!user) {
      console.log(`⚠️  User ${email} not found, skipping admin role assignment`);
      continue;
    }

    // Check if user already has admin role
    const existingAdminRole = await knex('user_roles')
      .where({ user_id: user.id, role_id: 'admin' })
      .first();

    if (existingAdminRole) {
      console.log(`ℹ️  User ${email} already has admin role, skipping`);
      continue;
    }

    // Remove any existing roles for this user (users should only have one role)
    await knex('user_roles').where('user_id', user.id).delete();

    // Assign admin role
    await knex('user_roles').insert({
      user_id: user.id,
      role_id: 'admin',
    });

    console.log(`✅ Assigned 'admin' role to ${email}`);
  }
}

export async function down(knex: Knex): Promise<void> {
  // List of emails that should have admin role removed
  const adminEmails = ['matiasbaiges@gmail.com', 'admin@test.com'];

  for (const email of adminEmails) {
    const user = await knex('users').where('email', email).first();

    if (!user) {
      continue;
    }

    // Remove admin role and assign free role instead
    await knex('user_roles').where({ user_id: user.id, role_id: 'admin' }).delete();

    // Assign free role as default
    const hasFreeRole = await knex('user_roles')
      .where({ user_id: user.id, role_id: 'free' })
      .first();

    if (!hasFreeRole) {
      await knex('user_roles').insert({
        user_id: user.id,
        role_id: 'free',
      });
    }

    console.log(`✅ Removed 'admin' role from ${email}, assigned 'free' role`);
  }
}

