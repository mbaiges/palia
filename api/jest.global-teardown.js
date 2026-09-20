const path = require('path');
const fs = require('fs');
const { DatabaseConfig } = require(path.join(process.cwd(), 'dist', 'infrastructure', 'config', 'database.js'));

module.exports = async () => {
  await DatabaseConfig.close();
  await new Promise((r) => setTimeout(r, 300));
  const testDbPath = path.resolve(process.cwd(), 'db', 'data', 'jest-test.db');
  try {
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  } catch (_) {}
};

