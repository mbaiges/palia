import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('auth_sessions', table => {
    table.string('token_hash').primary();
    table
      .string('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.text('jwt').notNullable();
    table.string('created_at').notNullable();
    table.string('expires_at').notNullable();
  });
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id)'
  );
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_auth_sessions_expiry ON auth_sessions(expires_at)'
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('auth_sessions');
}
