import type { Knex } from 'knex';

/**
 * Create admin settings tables migration
 * Creates app_settings_allowed_users table for managing allowed user emails
 */
export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('app_settings_allowed_users');
  if (hasTable) {
    console.log('⚠️  app_settings_allowed_users table already exists, skipping migration');
    return;
  }

  await knex.schema.createTable('app_settings_allowed_users', (table) => {
    table.string('email').primary();
    table.string('created_at').notNullable();
  });

  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_allowed_users_email ON app_settings_allowed_users(email)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('app_settings_allowed_users');
}

