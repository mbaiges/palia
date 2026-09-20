import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('push_subscriptions', (table) => {
    table.string('locale', 10).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('push_subscriptions', (table) => {
    table.dropColumn('locale');
  });
}
