import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable('example_items')) return;

  await knex.schema.createTable('example_items', (table) => {
    table.string('id').primary();
    table.string('owner_id').notNullable();
    table.string('title').notNullable();
    table.text('description').notNullable().defaultTo('');
    table.string('status').notNullable().defaultTo('active');
    table.string('image_id').nullable();
    table.string('created_at').notNullable();
    table.string('updated_at').notNullable();
    table.foreign('owner_id').references('id').inTable('users').onDelete('CASCADE');
  });

  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_example_items_owner_id ON example_items(owner_id)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('example_items');
}
