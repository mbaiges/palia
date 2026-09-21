import { defineConfig } from "@playwright/test";
import path from "node:path";

const e2eDatabase = `./db/data/api-front-separation-e2e-${process.pid}-${Date.now()}.db`;
const apiPort = Number(process.env.E2E_API_PORT ?? 3100);
const frontendPort = Number(process.env.E2E_FRONTEND_PORT ?? 5173);
const apiOrigin = `http://127.0.0.1:${apiPort}`;
const frontendOrigin = `http://127.0.0.1:${frontendPort}`;

export default defineConfig({
  testDir: "./tests",
  // The former UI suite used the retired localStorage demo database and
  // hard-coded demo people. Run the API-backed acceptance and responsive
  // smoke suites until those legacy scenarios are rewritten for live data.
  testMatch: ["api-front-separation.spec.js", "responsive-smoke.spec.js"],
  outputDir: "./test-results/api-front-separation",
  timeout: 30000,
  workers: 1,
  expect: {
    timeout: 5000,
  },
  reporter: "list",
  use: {
    baseURL: frontendOrigin,
    browserName: "chromium",
    headless: true,
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true,
    video: "off",
    screenshot: "off",
  },
  webServer: [
    {
      command: "npm run dev",
      cwd: path.resolve(process.cwd(), "../api"),
      url: `${apiOrigin}/api/health/ready`,
      reuseExistingServer: false,
      timeout: 120000,
      env: {
        NODE_ENV: "test",
        TEST_GOOGLE_AUTH: "true",
        USE_LOCAL_DB: "true",
        DB_CONNECTION_STR: e2eDatabase,
        PORT: String(apiPort),
        DEV_AUTH_BYPASS: "true",
        DEV_ADMIN_EMAIL: "admin@medice.test",
        INITIAL_ADMIN_EMAILS: "admin@medice.test,matiasbaiges@gmail.com",
        CLIENT_URL: frontendOrigin,
        PUSH_ENABLED: "false",
      },
    },
    {
      command: `npm run build:e2e && npm run preview:e2e -- --port ${frontendPort}`,
      url: frontendOrigin,
      reuseExistingServer: false,
      timeout: 30000,
      env: {
        SCAFFOLD_API_PROXY_TARGET: apiOrigin,
        VITE_GOOGLE_CLIENT_ID: "test-google-client-id",
      },
    },
  ],
});
