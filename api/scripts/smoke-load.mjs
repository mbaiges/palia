const baseUrl = (process.env.SMOKE_BASE_URL ?? 'http://localhost:3000/api').replace(/\/$/, '');
const total = Number(process.env.SMOKE_REQUESTS ?? 25);
const concurrency = Math.max(1, Number(process.env.SMOKE_CONCURRENCY ?? 5));

async function check() {
  const started = performance.now();
  const response = await fetch(`${baseUrl}/health`);
  const body = await response.text();
  if (!response.ok) throw new Error(`health returned ${response.status}: ${body}`);
  return performance.now() - started;
}

const latencies = [];
let next = 0;
async function worker() {
  while (next < total) {
    next += 1;
    latencies.push(await check());
  }
}

try {
  await Promise.all(Array.from({ length: Math.min(concurrency, total) }, worker));
  const sorted = [...latencies].sort((a, b) => a - b);
  const percentile = (p) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
  console.log(JSON.stringify({ baseUrl, requests: total, concurrency, p50Ms: Math.round(percentile(0.5)), p95Ms: Math.round(percentile(0.95)), maxMs: Math.round(sorted.at(-1)) }));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
