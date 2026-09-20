import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable('audit_events')) return;
  await knex.schema.createTable('audit_events', (table) => {
    table.string('id').primary();
    table.string('actor_id').nullable().index();
    table.string('action').notNullable().index();
    table.string('entity_type').notNullable().index();
    table.string('entity_id').nullable();
    table.text('metadata_json').notNullable();
    table.string('created_at').notNullable().index();
  });
}

export async function down(knex: Knex): Promise<void> { await knex.schema.dropTableIfExists('audit_events'); }
