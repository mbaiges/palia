import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable('media_assets')) return;
  await knex.schema.createTable('media_assets', (table) => {
    table.string('id').primary();
    table.string('owner_id').notNullable().index();
    table.string('storage_key').notNullable();
    table.string('mime_type').notNullable();
    table.integer('byte_size').notNullable();
    table.integer('width').notNullable();
    table.integer('height').notNullable();
    table.string('created_at').notNullable();
    table.string('expires_at').nullable();
  });
}

export async function down(knex: Knex): Promise<void> { await knex.schema.dropTableIfExists('media_assets'); }
