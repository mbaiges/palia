/**
 * Frontend base URL for email links and assets.
 * Set CLIENT_URL in env for remote deployment (e.g. https://app.example.com).
 * Locally defaults to http://localhost:5173.
 */
export function getFrontendBaseUrl(): string {
  const url = process.env.CLIENT_URL?.split(',')[0]?.trim() || 'http://localhost:5173';
  return url.replace(/\/$/, '');
}
