import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('user_settings', (table) => {
    table.string('locale', 10).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('user_settings', (table) => {
    table.dropColumn('locale');
  });
}
