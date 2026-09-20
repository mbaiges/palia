import type { Knex } from 'knex';

/**
 * Password reset tokens for forgot-password flow
 * Token expiry: 1 hour
 */
export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('password_reset_tokens');
  if (hasTable) return;

  await knex.schema.createTable('password_reset_tokens', (table) => {
    table.string('id').primary();
    table.string('user_id').notNullable();
    table.string('token_hash').notNullable();
    table.string('expires_at').notNullable();
    table.string('created_at').notNullable();
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
  });
  await knex.raw(
    'CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_expires ON password_reset_tokens(user_id, expires_at)'
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('password_reset_tokens');
}
