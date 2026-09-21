import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { DatabaseConfig } from '@/infrastructure/config/database';

const production = process.env.NODE_ENV === 'production';
export const SESSION_COOKIE = production
  ? '__Host-medice_session'
  : 'medice_session';
export const CSRF_COOKIE = production ? '__Host-medice_csrf' : 'medice_csrf';
const sessionHash = (value: string) =>
  createHash('sha256').update(value).digest('hex');

function cookieValue(req: Request, name: string): string | undefined {
  const pair = req.headers.cookie
    ?.split(';')
    .map(part => part.trim())
    .find(part => part.startsWith(`${name}=`));
  return pair ? decodeURIComponent(pair.slice(name.length + 1)) : undefined;
}

export async function createBrowserSession(
  res: Response,
  userId: string,
  jwt: string
): Promise<void> {
  const id = randomBytes(32).toString('base64url');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  await DatabaseConfig.getKnex()('auth_sessions').insert({
    token_hash: sessionHash(id),
    user_id: userId,
    jwt,
    created_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
  });
  const user = await DatabaseConfig.getKnex()('users')
    .where({ id: userId })
    .first();
  if (user) {
    await DatabaseConfig.getKnex()('volunteer_profiles')
      .insert({
        user_id: userId,
        status: 'active',
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .onConflict('user_id')
      .ignore();
  }
  res.cookie(SESSION_COOKIE, id, {
    httpOnly: true,
    secure: production,
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

export async function resolveBrowserSession(
  req: Request
): Promise<{ userId: string; jwt: string } | null> {
  const token = cookieValue(req, SESSION_COOKIE);
  if (!token) return null;
  const row = await DatabaseConfig.getKnex()('auth_sessions')
    .where({ token_hash: sessionHash(token) })
    .first();
  if (!row || Date.parse(row.expires_at) <= Date.now()) return null;
  return { userId: row.user_id, jwt: row.jwt };
}

export async function revokeBrowserSession(req: Request): Promise<void> {
  const token = cookieValue(req, SESSION_COOKIE);
  if (token)
    await DatabaseConfig.getKnex()('auth_sessions')
      .where({ token_hash: sessionHash(token) })
      .delete();
}

export function clearBrowserSession(res: Response): void {
  const options = {
    httpOnly: true,
    secure: production,
    sameSite: 'lax' as const,
    path: '/',
  };
  res.clearCookie(SESSION_COOKIE, options);
}

export function issueCsrfToken(_req: Request, res: Response): string {
  const token = randomBytes(24).toString('base64url');
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: production,
    sameSite: 'lax',
    path: '/',
    maxAge: 8 * 60 * 60 * 1000,
  });
  return token;
}

export function csrfProtection(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  if (req.path.startsWith('/auth/') && !cookieValue(req, SESSION_COOKIE))
    return next();
  if (!cookieValue(req, SESSION_COOKIE)) return next();
  const cookie = cookieValue(req, CSRF_COOKIE) ?? '';
  const header = req.header('x-csrf-token') ?? '';
  const a = Buffer.from(cookie);
  const b = Buffer.from(header);
  const sameOrigin =
    !req.header('origin') ||
    req.header('origin') === `${req.protocol}://${req.get('host')}` ||
    (process.env.CLIENT_URL ?? '')
      .split(',')
      .map(value => value.trim())
      .includes(req.header('origin')!);
  if (
    !sameOrigin ||
    !cookie ||
    a.length !== b.length ||
    !timingSafeEqual(a, b)
  ) {
    res.status(403).json({ success: false, error: 'CSRF validation failed' });
    return;
  }
  next();
}
