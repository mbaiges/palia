/**
 * CORS / Socket.IO origin allow-list helpers.
 * In development, also permit private LAN origins so a TV/phone can hit the API.
 */

export function parseAllowedOrigins(clientUrlEnv?: string): string[] {
  if (clientUrlEnv?.trim()) {
    return clientUrlEnv.split(',').map((url) => url.trim()).filter(Boolean);
  }
  return [
    'http://localhost:5173',
    'http://localhost:80',
    'http://localhost:3000',
    'http://localhost',
  ];
}

export function isPrivateLanHostname(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  return false;
}

/** True when origin should be allowed in NODE_ENV=development for LAN TV/phone testing. */
export function isDevLanOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  if (process.env.NODE_ENV !== 'development' && process.env.DEV_AUTH_BYPASS !== 'true') {
    return false;
  }
  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== 'http:' && protocol !== 'https:') return false;
    return isPrivateLanHostname(hostname);
  } catch {
    return false;
  }
}

export function isOriginAllowed(origin: string | undefined, allowedOrigins: string[]): boolean {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  return isDevLanOrigin(origin);
}
