#!/usr/bin/env ts-node
/**
 * Reset Turso database: drop all tables, then run migrations from zero.
 * Usage: npm run db:reset-turso
 *
 * Requires: TURSO_DATABASE_URL, TURSO_AUTH_TOKEN in .env
 * Uses Turso (not local DB) - ensure USE_LOCAL_DB is not set.
 */

import 'dotenv/config';
import { createClient } from '@libsql/client';
import knex from 'knex';
import path from 'path';

async function resetTurso() {
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;

  if (!url || !token) {
    console.error('❌ TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set in .env');
    process.exit(1);
  }

  if (process.env.USE_LOCAL_DB === 'true' || process.env.USE_LOCAL_DB === '1') {
    console.error('❌ Unset USE_LOCAL_DB to reset Turso (this script targets remote Turso only)');
    process.exit(1);
  }

  const client = createClient({ url, authToken: token });
  console.log('📦 Connected to Turso:', url.replace(/\/\/[^@]+@/, '//***@'));

  try {
    // Get all tables (exclude sqlite_ internal tables)
    const tablesResult = await client.execute(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`
    );
    const tables = tablesResult.rows
      .map((r) => (r as Record<string, unknown>).name as string)
      .filter(Boolean);

    if (tables.length === 0) {
      console.log('ℹ️  No tables to drop.');
    } else {
      console.log(`🗑️  Dropping ${tables.length} tables...`);
      await client.execute('PRAGMA foreign_keys = OFF');
      for (const table of tables) {
        await client.execute(`DROP TABLE IF EXISTS "${table}"`);
        console.log(`   - ${table}`);
      }
      await client.execute('PRAGMA foreign_keys = ON');
    }

    client.close();
    console.log('✅ Turso reset complete. Running migrations...\n');
  } catch (err) {
    client.close();
    console.error('❌ Reset failed:', err);
    process.exit(1);
  }

  // Run migrations via Knex (connects to Turso using env vars)
  delete process.env.USE_LOCAL_DB; // Force Turso, not local file
  const knexfilePath = path.join(process.cwd(), 'knexfile.ts');
  const knexConfig = require(knexfilePath).default || require(knexfilePath);
  const config = knexConfig.development;

  const knexInstance = knex(config);
  try {
    const [batch, migrations] = await knexInstance.migrate.latest();
    console.log(`✅ Migrations complete. Batch ${batch}, ran:`, migrations.length ? migrations : '(none - already up to date)');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await knexInstance.destroy();
  }

  console.log('\n✅ Turso reset and migrations done.');
}

resetTurso();
