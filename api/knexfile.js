"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Register tsconfig-paths before any imports to enable path aliases in migrations
try {
    require('tsconfig-paths/register');
}
catch (_a) {
    // tsconfig-paths not available (e.g., in production Docker build)
}
var path_1 = __importDefault(require("path"));
var Client_Libsql = require('@libsql/knex-libsql');
function getConnectionUrl() {
    // Tests use file-based DB (same as database.ts)
    var dbPath = process.env.DB_CONNECTION_STR;
    if (process.env.NODE_ENV === 'test' || dbPath === ':memory:') {
        var testPath = dbPath && dbPath !== ':memory:'
            ? path_1.default.resolve(dbPath)
            : path_1.default.resolve(process.cwd(), 'db', 'data', 'jest-test.db');
        return "file:".concat(testPath);
    }
    // USE_LOCAL_DB=true forces local file. In development, default to local (never use Turso by accident)
    var useLocal = process.env.USE_LOCAL_DB === 'true' ||
        process.env.USE_LOCAL_DB === '1' ||
        (process.env.NODE_ENV === 'development' && process.env.USE_LOCAL_DB !== 'false');
    var tursoUrl = process.env.TURSO_DATABASE_URL;
    var tursoToken = process.env.TURSO_AUTH_TOKEN;
    if (!useLocal && tursoUrl) {
        if (tursoToken) {
            var separator = tursoUrl.includes('?') ? '&' : '?';
            return "".concat(tursoUrl).concat(separator, "authToken=").concat(tursoToken);
        }
        return tursoUrl;
    }
    // Local file
    var fallbackPath = process.env.DB_CONNECTION_STR || './db/data/scaffold.db';
    return fallbackPath.startsWith('file:') ? fallbackPath : "file:".concat(path_1.default.resolve(fallbackPath));
}
var connectionUrl = getConnectionUrl();
var config = {
    development: {
        client: Client_Libsql,
        connection: {
            filename: connectionUrl,
        },
        useNullAsDefault: true,
        migrations: {
            directory: path_1.default.join(__dirname, 'src', 'infrastructure', 'migrations'),
            extension: 'ts',
        },
    },
    test: {
        client: Client_Libsql,
        connection: {
            filename: getConnectionUrl(),
        },
        useNullAsDefault: true,
        migrations: {
            directory: path_1.default.join(__dirname, 'dist', 'infrastructure', 'migrations'),
            extension: 'js',
        },
    },
    production: {
        client: Client_Libsql,
        connection: {
            filename: getConnectionUrl(),
        },
        useNullAsDefault: true,
        migrations: {
            directory: path_1.default.join(__dirname, 'dist', 'infrastructure', 'migrations'),
            extension: 'js',
        },
    },
};
exports.default = config;
