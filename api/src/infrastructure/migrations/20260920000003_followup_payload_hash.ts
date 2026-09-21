import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  if (
    (await knex.schema.hasTable('follow_ups')) &&
    !(await knex.schema.hasColumn('follow_ups', 'client_payload_hash'))
  ) {
    await knex.schema.alterTable('follow_ups', table =>
      table.string('client_payload_hash').nullable()
    );
  }
}

export async function down(knex: Knex): Promise<void> {
  if (
    (await knex.schema.hasTable('follow_ups')) &&
    (await knex.schema.hasColumn('follow_ups', 'client_payload_hash'))
  ) {
    await knex.schema.alterTable('follow_ups', table =>
      table.dropColumn('client_payload_hash')
    );
  }
}
