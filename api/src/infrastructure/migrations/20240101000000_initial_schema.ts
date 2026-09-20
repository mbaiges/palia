import type { Knex } from 'knex';

/**
 * Initial database schema migration
 * Creates base tables: users, user_settings
 */
export async function up(knex: Knex): Promise<void> {
  // Check if tables already exist (for databases that were created with the old inline schema)
  const hasUsersTable = await knex.schema.hasTable('users');
  if (hasUsersTable) {
    console.log('⚠️  Tables already exist, marking migration as applied');
    // Mark this migration as applied in knex_migrations table (if it exists)
    const migrationName = '20240101000000_initial_schema.ts';
    const hasMigrationsTable = await knex.schema.hasTable('knex_migrations');
    
    if (hasMigrationsTable) {
      const hasMigrationRecord = await knex('knex_migrations')
        .where('name', migrationName)
        .first();
      
      if (!hasMigrationRecord) {
        // Get the latest batch number
        const latestBatch = await knex('knex_migrations')
          .max('batch as maxBatch')
          .first();
        const batch = latestBatch?.maxBatch ? (latestBatch.maxBatch as number) + 1 : 1;
        
        // Insert migration record
        await knex('knex_migrations').insert({
          name: migrationName,
          batch: batch,
          migration_time: new Date().toISOString(),
        });
      }
    }
    return;
  }

  // Create users table
  await knex.schema.createTable('users', (table) => {
    table.string('id').primary();
    table.string('google_id').unique().notNullable();
    table.string('email').unique().notNullable();
    table.string('name').notNullable();
    table.string('picture').nullable();
    table.string('google_refresh_token').nullable();
    table.string('google_scopes').nullable();
    table.string('created_at').notNullable();
    table.string('updated_at').notNullable();
  });

  // Create indexes for users
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');

  // Create user_settings table
  await knex.schema.createTable('user_settings', (table) => {
    table.string('user_id').primary();
    table.string('spreadsheet_id').nullable();
    table.string('theme').nullable();
    table.string('created_at').notNullable();
    table.string('updated_at').notNullable();
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  // Drop tables in reverse order of dependencies
  await knex.schema.dropTableIfExists('user_settings');
  await knex.schema.dropTableIfExists('users');
}
