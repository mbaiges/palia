import { Request, Response, NextFunction } from 'express';
import { toSnakeCaseObject } from '@/infrastructure/utils/snakeCase';

/**
 * Middleware to convert response body keys from camelCase to snake_case
 * This ensures all API responses use snake_case as per the API contract
 */
export function snakeCaseMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const pathname = req.originalUrl.split('?')[0];
  if (pathname === '/api/openapi.json' || pathname.startsWith('/api/docs')) {
    next();
    return;
  }
  const originalJson = res.json.bind(res);

  res.json = function (body: any): Response {
    if (body && typeof body === 'object') {
      const convertedBody = toSnakeCaseObject(body);
      return originalJson(convertedBody);
    }
    return originalJson(body);
  };

  next();
}

