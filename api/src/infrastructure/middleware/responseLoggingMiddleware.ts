import { Request, Response, NextFunction } from 'express';
import onFinished from 'on-finished';
import { logger } from '../../domain/utils/logger';

export const responseLoggingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  onFinished(res, () => {
    const message = `${req.method} ${req.originalUrl} - ${res.statusCode} ${res.statusMessage}`;
      logger.info(message);
  });

  next();
};
