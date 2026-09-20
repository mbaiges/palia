import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('notifications', (table) => {
    table.string('id').primary();
    table.string('user_id').notNullable();
    table.string('type').notNullable();
    table.text('title').notNullable();
    table.text('body').notNullable();
    table.string('created_at').notNullable();
    table.integer('read').notNullable().defaultTo(0);
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
  });
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('notifications');
}
