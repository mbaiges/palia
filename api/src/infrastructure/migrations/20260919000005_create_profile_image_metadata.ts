import type { Knex } from 'knex';

/**
 * Keeps generic user profile-image references valid on clean installs.
 * Binary uploads and their ownership/expiry lifecycle use `media_assets`.
 */
export async function up(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable('images')) return;

  await knex.schema.createTable('images', (table) => {
    table.string('image_id').primary().notNullable();
    table.text('url').notNullable();
    table.timestamp('created_at').notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  // Keep the referenced table on rollback so user foreign keys remain valid.
}
