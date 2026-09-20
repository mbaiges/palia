// Register tsconfig-paths before any imports to enable path aliases in migrations
try {
  require('tsconfig-paths/register');
} catch {
  // tsconfig-paths not available (e.g., in production Docker build)
}

import fs from 'fs';
import path from 'path';
import { createClient, type Client } from '@libsql/client';
import knex, { Knex } from 'knex';

// Load knexfile - handle both .ts (source) and .js (compiled) versions
function loadKnexConfig() {
  const projectRoot = process.cwd();
  const knexfilePath = path.join(projectRoot, 'knexfile.js');

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require(knexfilePath);
    return config.default || config;
  } catch {
    try {
      const knexfileTsPath = path.join(projectRoot, 'knexfile.ts');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const config = require(knexfileTsPath);
      return config.default || config;
    } catch (error) {
      throw new Error(`Could not load knexfile from ${knexfilePath}. Error: ${error}`);
    }
  }
}

const knexConfig = loadKnexConfig();

function getLibsqlConfig(): { url: string; authToken?: string } {
  // Tests use file-based DB. file::memory:?cache=shared does not share between
  // @libsql/knex-libsql (migrations) and @libsql/client (repos) - different connection stacks.
  const dbPath = process.env.DB_CONNECTION_STR;
  if (process.env.NODE_ENV === 'test' || dbPath === ':memory:') {
    const testPath =
      dbPath && dbPath !== ':memory:'
        ? path.resolve(dbPath)
        : path.resolve(process.cwd(), 'db', 'data', 'jest-test.db');
    const testDir = path.dirname(testPath);
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    return { url: testPath.startsWith('file:') ? testPath : `file:${testPath}` };
  }

  // USE_LOCAL_DB=true forces local file. In development, default to local (never use Turso by accident)
  const useLocal =
    process.env.USE_LOCAL_DB === 'true' ||
    process.env.USE_LOCAL_DB === '1' ||
    (process.env.NODE_ENV === 'development' && process.env.USE_LOCAL_DB !== 'false');
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (!useLocal && tursoUrl) {
    return { url: tursoUrl, authToken: tursoToken };
  }
  const fallbackPath = process.env.DB_CONNECTION_STR || './db/data/scaffold.db';
  const absolutePath = path.resolve(fallbackPath);
  const dir = path.dirname(absolutePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return { url: absolutePath.startsWith('file:') ? absolutePath : `file:${absolutePath}` };
}

export class DatabaseConfig {
  private static instance: Client | null = null;
  private static knexInstance: Knex | null = null;
  private static migrationsRun = false;

  public static getConnection(): Client {
    if (!this.instance) {
      this.instance = this.createConnection();
    }
    return this.instance;
  }

  /**
   * Get Knex instance for running migrations
   */
  public static getKnex(): Knex {
    if (!this.knexInstance) {
      const env = process.env.DB_CONNECTION_STR === ':memory:' ? 'test' : (process.env.NODE_ENV || 'development');
      const baseConfig = knexConfig[env] || knexConfig.development;
      this.knexInstance = knex({ ...baseConfig });
    }
    return this.knexInstance;
  }

  private static createConnection(): Client {
    const { url, authToken } = getLibsqlConfig();
    const client = createClient({
      url,
      authToken: authToken || undefined,
    });
    console.log(`📦 Database connected: ${url}`);
    this.instance = client;
    // Migrations are run explicitly in bootstrap() before server starts
    return client;
  }

  public static async close(): Promise<void> {
    if (this.knexInstance) {
      await this.knexInstance.destroy();
      this.knexInstance = null;
    }
    if (this.instance) {
      this.instance.close();
      this.instance = null;
      console.log('🔌 Database connection closed');
    }
  }

  public static async initializeTables(): Promise<void> {
    if (this.migrationsRun) return;

    if (!this.instance) {
      this.getConnection();
    }

    const knexInstance = this.getKnex();
    try {
      const hasMigrationsTable = await knexInstance.schema.hasTable('knex_migrations');
      if (!hasMigrationsTable) {
        await knexInstance.schema.createTable('knex_migrations', (table) => {
          table.increments('id').primary();
          table.string('name', 255);
          table.integer('batch');
          table.timestamp('migration_time');
        });
      }

      const hasLockTable = await knexInstance.schema.hasTable('knex_migrations_lock');
      if (!hasLockTable) {
        await knexInstance.schema.createTable('knex_migrations_lock', (table) => {
          table.increments('index').primary();
          table.integer('is_locked');
        });
        await knexInstance('knex_migrations_lock').insert({ is_locked: 0 });
      }

      await knexInstance.migrate.latest();
      this.migrationsRun = true;
      console.log('✅ Database migrations completed');
      await this.populateDatabaseFromEnv(knexInstance);
    } catch (error: any) {
      if (error?.code === 'SQLITE_ERROR' && error?.message?.includes('already exists')) {
        try {
          await knexInstance.migrate.latest();
          this.migrationsRun = true;
          console.log('✅ Database migrations completed');
          await this.populateDatabaseFromEnv(knexInstance);
          return;
        } catch (migrateError: any) {
          if (migrateError?.name === 'MigrationLocked' || migrateError?.message?.includes('already locked')) {
            if (process.env.DB_CONNECTION_STR === ':memory:') {
              this.migrationsRun = true;
              await this.populateDatabaseFromEnv(knexInstance).catch(() => {});
              return;
            }
          }
          throw migrateError;
        }
      }
      if (error?.name === 'MigrationLocked' || error?.message?.includes('already locked')) {
        if (process.env.DB_CONNECTION_STR === ':memory:') {
          this.migrationsRun = true;
          await this.populateDatabaseFromEnv(knexInstance).catch(() => {});
          return;
        }
        throw error;
      }
      console.error('❌ Migration error:', error);
      throw error;
    }
  }

  private static async populateDatabaseFromEnv(knexInstance: Knex): Promise<void> {
    try {
      await this.populateAllowedUsers(knexInstance);
      await this.ensureDevAdminRole(knexInstance);
    } catch (error: any) {
      console.warn('⚠️  Failed to populate database from environment:', error.message);
    }
  }

  /**
   * When DEV_AUTH_BYPASS=true and DEV_ADMIN_EMAIL are set, ensure that user has admin role.
   * No-op in production (requires both env vars). Runs at API startup so existing dev users
   * get admin even if assign-admin-users ran before they signed in.
   */
  private static async ensureDevAdminRole(knexInstance: Knex): Promise<void> {
    if (process.env.DEV_AUTH_BYPASS !== 'true') return;

    const devAdminEmail = process.env.DEV_ADMIN_EMAIL?.trim().toLowerCase();
    if (!devAdminEmail) return;

    const hasRolesTable = await knexInstance.schema.hasTable('roles');
    const hasUserRolesTable = await knexInstance.schema.hasTable('user_roles');
    if (!hasRolesTable || !hasUserRolesTable) return;

    const user = await knexInstance('users')
      .whereRaw('LOWER(email) = ?', [devAdminEmail])
      .first();
    if (!user) return;

    const existingAdmin = await knexInstance('user_roles')
      .where({ user_id: user.id, role_id: 'admin' })
      .first();
    if (existingAdmin) return;

    await knexInstance('user_roles').where('user_id', user.id).delete();
    await knexInstance('user_roles').insert({ user_id: user.id, role_id: 'admin' });
    console.log(`✅ Assigned admin role to ${devAdminEmail} (dev bypass)`);
  }

  private static async populateAllowedUsers(knexInstance: Knex): Promise<void> {
    try {
      const { configService } = await import('@/infrastructure/config/config');
      const allowedEmails = configService.getAllowedEmails();
      if (allowedEmails.length === 0) return;

      const hasTable = await knexInstance.schema.hasTable('app_settings_allowed_users');
      if (!hasTable) return;

      const existingEmails = await knexInstance('app_settings_allowed_users').select('email');
      const existingEmailSet = new Set(existingEmails.map((e) => e.email.toLowerCase()));

      const emailsToInsert = allowedEmails
        .map((email) => email.trim())
        .filter((email) => email && !existingEmailSet.has(email.toLowerCase()));

      if (emailsToInsert.length === 0) return;

      const now = new Date().toISOString();
      await knexInstance('app_settings_allowed_users').insert(
        emailsToInsert.map((email) => ({ email, created_at: now }))
      );
      console.log(`✅ Synced ${emailsToInsert.length} allowed user(s) from ALLOWED_EMAILS`);
    } catch (error: any) {
      console.warn('⚠️  Failed to populate allowed users:', error.message);
      throw error;
    }
  }

  public static async reset(): Promise<void> {
    const knexInstance = this.getKnex();
    try {
      await knexInstance.migrate.rollback(undefined, true);
      await knexInstance.migrate.latest();
      console.log('🔄 Database reset complete');
    } catch (error) {
      console.error('❌ Reset error:', error);
      throw error;
    }
  }

  /**
   * Clean all data from tables (async, for testing)
   */
  public static async clean(): Promise<void> {
    const client = this.getConnection();
    const tables = [
      'push_subscriptions',
      'media_assets',
      'user_roles',
      'role_permissions',
      'permissions',
      'roles',
      'app_settings_allowed_users',
      'user_settings',
      'email_verification_codes',
      'password_reset_tokens',
      'users',
    ];
    for (const table of tables) {
      try {
        await client.execute({ sql: `DELETE FROM ${table}` });
      } catch (error: any) {
        if (!error?.message?.includes('no such table')) throw error;
      }
    }
  }
}

process.on('SIGINT', async () => {
  await DatabaseConfig.close();
  process.exit(0);
});
