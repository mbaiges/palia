// Force the scaffold test DB path before any .env or DB code runs.
const path = require('path');
module.exports = async () => {
  process.env.NODE_ENV = 'test';
  process.env.DB_CONNECTION_STR = path.resolve(process.cwd(), 'db', 'data', 'jest-test.db');
};
