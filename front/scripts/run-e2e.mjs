import { spawn } from "node:child_process";
import { createServer } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

function getAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

const [apiPort, frontendPort] = await Promise.all([
  getAvailablePort(),
  getAvailablePort(),
]);
const cli = path.join(
  projectRoot,
  "node_modules",
  "@playwright",
  "test",
  "cli.js",
);
const child = spawn(process.execPath, [cli, "test", ...process.argv.slice(2)], {
  cwd: projectRoot,
  env: {
    ...process.env,
    E2E_API_PORT: String(apiPort),
    E2E_FRONTEND_PORT: String(frontendPort),
  },
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error("Could not start Playwright:", error);
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
