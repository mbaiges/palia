// Register tsconfig-paths before any imports to enable path aliases in migrations
try {
  require('tsconfig-paths/register');
} catch {
  // tsconfig-paths not available (e.g., in production Docker build)
}

import type { Knex } from 'knex';
import path from 'path';

const Client_Libsql = require('@libsql/knex-libsql');

function getConnectionUrl(): string {
  // Tests use file-based DB (same as database.ts)
  const dbPath = process.env.DB_CONNECTION_STR;
  if (process.env.NODE_ENV === 'test' || dbPath === ':memory:') {
    const testPath =
      dbPath && dbPath !== ':memory:'
        ? path.resolve(dbPath)
        : path.resolve(process.cwd(), 'db', 'data', 'jest-test.db');
    return `file:${testPath}`;
  }

  // USE_LOCAL_DB=true forces local file. In development, default to local (never use Turso by accident)
  const useLocal =
    process.env.USE_LOCAL_DB === 'true' ||
    process.env.USE_LOCAL_DB === '1' ||
    (process.env.NODE_ENV === 'development' && process.env.USE_LOCAL_DB !== 'false');
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (!useLocal && tursoUrl) {
    if (tursoToken) {
      const separator = tursoUrl.includes('?') ? '&' : '?';
      return `${tursoUrl}${separator}authToken=${tursoToken}`;
    }
    return tursoUrl;
  }
  // Local file
  const fallbackPath = process.env.DB_CONNECTION_STR || './db/data/scaffold.db';
  return fallbackPath.startsWith('file:') ? fallbackPath : `file:${path.resolve(fallbackPath)}`;
}

const connectionUrl = getConnectionUrl();

const config: { [key: string]: Knex.Config } = {
  development: {
    client: Client_Libsql as any,
    connection: {
      filename: connectionUrl,
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(__dirname, 'src', 'infrastructure', 'migrations'),
      extension: 'ts',
    },
  },

  test: {
    client: Client_Libsql as any,
    connection: {
      filename: getConnectionUrl(),
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(__dirname, 'dist', 'infrastructure', 'migrations'),
      extension: 'js',
    },
  },

  production: {
    client: Client_Libsql as any,
    connection: {
      filename: getConnectionUrl(),
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(__dirname, 'dist', 'infrastructure', 'migrations'),
      extension: 'js',
    },
  },
};

export default config;
