import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const incoming = req.header('X-Request-ID');
  const requestId = incoming?.replace(/[^a-zA-Z0-9._:-]/g, '').slice(0, 128) || crypto.randomUUID();
  res.setHeader('X-Request-ID', requestId);
  (req as Request & { requestId: string }).requestId = requestId;
  next();
};
