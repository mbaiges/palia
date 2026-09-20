const path = require('path');
const fs = require('fs');
require('tsconfig-paths').register({ baseUrl: path.join(process.cwd(), 'dist'), paths: { '@/*': ['*'] } });
const NodeEnvironment = require('jest-environment-node').default;

class CustomEnvironment extends NodeEnvironment {
  async setup() {
    await super.setup();
    // Init test DB once (runs before any test file - uses file so Knex and libsql share same DB)
    if (process.env.NODE_ENV === 'test' && !global.__dbInitialized) {
      global.__dbInitialized = true;
      // Use the same path as DB_CONNECTION_STR from global setup.
      const testDbPath = (process.env.DB_CONNECTION_STR || path.resolve(process.cwd(), 'db', 'data', 'jest-test.db')).replace(/^file:/, '');
      const testDbDir = path.dirname(testDbPath);
      if (!fs.existsSync(testDbDir)) fs.mkdirSync(testDbDir, { recursive: true });
      if (fs.existsSync(testDbPath)) {
        try {
          fs.unlinkSync(testDbPath);
        } catch (_) {}
      }
      const { DatabaseConfig } = require(path.join(process.cwd(), 'dist', 'infrastructure', 'config', 'database.js'));
      DatabaseConfig.getKnex();
      await DatabaseConfig.initializeTables();
      DatabaseConfig.getConnection();
    }
    this.global.db = global.__JEST_DB_CONNECTION__;
  }

  async teardown() {
    await super.teardown();
  }
}

module.exports = CustomEnvironment;
