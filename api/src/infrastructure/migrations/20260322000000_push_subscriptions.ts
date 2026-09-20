import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('push_subscriptions', (table) => {
    table.string('id').primary();
    table.string('user_id').notNullable();
    table.text('endpoint').notNullable();
    table.text('p256dh').notNullable();
    table.text('auth').notNullable();
    table.string('created_at').notNullable();
    table.unique(['user_id', 'endpoint']);
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
  });

  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('push_subscriptions');
}
