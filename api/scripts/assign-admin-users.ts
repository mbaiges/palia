#!/usr/bin/env ts-node
/**
 * Script to run the admin user assignment migration
 * Usage: npm run assign-admin-users
 *
 * This script directly runs the 20240201000005_assign_admin_users migration
 * to assign admin roles to users listed in that migration file.
 *
 * This is idempotent - safe to run multiple times.
 */

import 'dotenv/config';
import fs from 'fs';
import knex from 'knex';
import path from 'path';
import type { Knex } from 'knex';

// Load knexfile config
function loadKnexConfig() {
  const projectRoot = process.cwd();
  const knexfilePath = path.join(projectRoot, 'knexfile.ts');
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require(knexfilePath);
    return config.default || config;
  } catch (error) {
    throw new Error(`Could not load knexfile from ${knexfilePath}. Error: ${error}`);
  }
}

async function runAdminMigration() {
  const knexConfig = loadKnexConfig();
  const env = process.env.NODE_ENV || 'development';
  const config = knexConfig[env] || knexConfig.development;

  // Ensure database directory exists for local file: URLs (libsql/Turso URLs don't need this)
  const filename = (config.connection as { filename: string })?.filename;
  if (filename?.startsWith('file:')) {
    const filePath = filename.replace(/^file:/, '');
    const dbDir = path.dirname(path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath));
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log(`📁 Created database directory: ${dbDir}`);
    }
  }

  const knexInstance = knex(config as Knex.Config);

  try {
    console.log('🔄 Running admin user assignment migration...');
    
    // Import and run the migration directly
    const migrationModule = await import('../src/infrastructure/migrations/20240201000005_assign_admin_users');
    
    // Run the migration's up function
    await migrationModule.up(knexInstance);
    
    // Mark the migration as completed in knex_migrations table
    const migrationName = '20240201000005_assign_admin_users.ts';
    const hasMigrationsTable = await knexInstance.schema.hasTable('knex_migrations');
    
    if (hasMigrationsTable) {
      const hasMigrationRecord = await knexInstance('knex_migrations')
        .where('name', migrationName)
        .first();
      
      if (!hasMigrationRecord) {
        // Get the latest batch number
        const latestBatch = await knexInstance('knex_migrations')
          .max('batch as maxBatch')
          .first();
        const batch = latestBatch?.maxBatch ? (latestBatch.maxBatch as number) + 1 : 1;
        
        // Insert migration record
        await knexInstance('knex_migrations').insert({
          name: migrationName,
          batch: batch,
          migration_time: new Date().toISOString(),
        });
        console.log('✅ Migration marked as completed in database');
      } else {
        console.log('ℹ️  Migration was already marked as completed, but re-ran the logic');
      }
    }

    console.log('✅ Admin user assignment migration completed successfully!');
  } catch (error: any) {
    console.error('❌ Error running admin migration:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await knexInstance.destroy();
  }
}

// Run the script
runAdminMigration();

