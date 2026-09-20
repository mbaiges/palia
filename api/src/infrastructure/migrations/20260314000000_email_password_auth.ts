import type { Knex } from 'knex';

/**
 * Email/Password authentication support
 * - Makes google_id nullable (email-only users have no Google ID)
 * - Adds password_hash, email_verified
 * - Creates email_verification_codes table
 */
export async function up(knex: Knex): Promise<void> {
  const hasUsersTable = await knex.schema.hasTable('users');
  if (!hasUsersTable) {
    console.log('⚠️  Users table does not exist, skipping migration');
    return;
  }

  // Check if already migrated
  const hasPasswordHash = await knex.schema.hasColumn('users', 'password_hash');
  if (hasPasswordHash) {
    console.log('⚠️  Email password auth columns already exist, skipping');
    return;
  }

  // SQLite: must recreate table to change google_id to nullable
  await knex.raw('PRAGMA foreign_keys = OFF');

  await knex.schema.raw(`
    CREATE TABLE users_new (
      id TEXT PRIMARY KEY,
      google_id TEXT UNIQUE,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT,
      email_verified INTEGER NOT NULL DEFAULT 0,
      profile_image_id TEXT,
      avatar_image_id TEXT,
      google_refresh_token TEXT,
      google_scopes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (profile_image_id) REFERENCES images(image_id) ON DELETE SET NULL,
      FOREIGN KEY (avatar_image_id) REFERENCES images(image_id) ON DELETE SET NULL
    )
  `);

  // Copy data: existing users are Google users, mark as verified
  await knex.raw(`
    INSERT INTO users_new (id, google_id, email, name, password_hash, email_verified, profile_image_id, avatar_image_id, google_refresh_token, google_scopes, created_at, updated_at)
    SELECT id, google_id, email, name, NULL, 1, profile_image_id, avatar_image_id, google_refresh_token, google_scopes, created_at, updated_at FROM users
  `);

  await knex.schema.dropTable('users');
  await knex.raw('ALTER TABLE users_new RENAME TO users');

  await knex.raw('CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');

  await knex.raw('PRAGMA foreign_keys = ON');

  // Create email_verification_codes table
  const hasEvcTable = await knex.schema.hasTable('email_verification_codes');
  if (!hasEvcTable) {
    await knex.schema.createTable('email_verification_codes', (table) => {
      table.string('id').primary();
      table.string('user_id').notNullable();
      table.string('code_hash').notNullable();
      table.string('expires_at').notNullable();
      table.string('created_at').notNullable();
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    });
    await knex.raw(
      'CREATE INDEX IF NOT EXISTS idx_email_verification_codes_user_expires ON email_verification_codes(user_id, expires_at)'
    );
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasUsersTable = await knex.schema.hasTable('users');
  if (!hasUsersTable) return;

  // Drop email_verification_codes first
  await knex.schema.dropTableIfExists('email_verification_codes');

  // Revert users: google_id back to NOT NULL (email users would need to be removed first)
  const hasPasswordHash = await knex.schema.hasColumn('users', 'password_hash');
  if (!hasPasswordHash) return;

  await knex.raw('PRAGMA foreign_keys = OFF');

  await knex.schema.raw(`
    CREATE TABLE users_old (
      id TEXT PRIMARY KEY,
      google_id TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      profile_image_id TEXT,
      avatar_image_id TEXT,
      google_refresh_token TEXT,
      google_scopes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (profile_image_id) REFERENCES images(image_id) ON DELETE SET NULL,
      FOREIGN KEY (avatar_image_id) REFERENCES images(image_id) ON DELETE SET NULL
    )
  `);

  // Only copy users with google_id (email-only users are dropped)
  await knex.raw(`
    INSERT INTO users_old (id, google_id, email, name, profile_image_id, avatar_image_id, google_refresh_token, google_scopes, created_at, updated_at)
    SELECT id, google_id, email, name, profile_image_id, avatar_image_id, google_refresh_token, google_scopes, created_at, updated_at FROM users WHERE google_id IS NOT NULL
  `);

  await knex.schema.dropTable('users');
  await knex.raw('ALTER TABLE users_old RENAME TO users');

  await knex.raw('CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');

  await knex.raw('PRAGMA foreign_keys = ON');
}
