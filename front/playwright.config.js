import { defineConfig } from '@playwright/test';
import path from 'node:path';

const artifactDirectory = path.resolve(process.cwd(), '../e2e/artifacts/screenshots/api-front-separation');
const e2eDatabase = `./db/data/api-front-separation-e2e-${process.pid}-${Date.now()}.db`;

export default defineConfig({
  testDir: './tests',
  // The former UI suite used the retired localStorage demo database and
  // hard-coded demo people. Run the API-backed acceptance and responsive
  // smoke suites until those legacy scenarios are rewritten for live data.
  testMatch: ['api-front-separation.spec.js', 'responsive-smoke.spec.js'],
  outputDir: './test-results/api-front-separation',
  timeout: 30000,
  workers: 1,
  expect: {
    timeout: 5000
  },
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    browserName: 'chromium',
    headless: true,
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true,
    video: 'off',
    screenshot: 'off'
  },
  webServer: [
    {
      command: 'npm run dev',
      cwd: path.resolve(process.cwd(), '../api'),
      url: 'http://localhost:3100/api/health/ready',
      reuseExistingServer: false,
      timeout: 120000,
      env: { NODE_ENV: 'test', USE_LOCAL_DB: 'true', DB_CONNECTION_STR: e2eDatabase, PORT: '3100', DEV_AUTH_BYPASS: 'true', DEV_ADMIN_EMAIL: 'admin@medice.test', INITIAL_ADMIN_EMAILS: 'admin@medice.test,matiasbaiges@gmail.com', CLIENT_URL: 'http://localhost:5173', PUSH_ENABLED: 'false' },
    },
    {
      command: 'npm run build:e2e && npm run preview:e2e',
      url: 'http://localhost:5173',
      reuseExistingServer: false,
      timeout: 30000,
      env: { SCAFFOLD_API_PROXY_TARGET: 'http://localhost:3100' },
    },
  ],
});
