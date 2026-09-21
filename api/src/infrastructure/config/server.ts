import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createRoutes } from '@/infrastructure/routes';
import { responseLoggingMiddleware } from '@/infrastructure/middleware/responseLoggingMiddleware';
import { snakeCaseMiddleware } from '@/infrastructure/middleware/snakeCaseMiddleware';
import {
  isOriginAllowed,
  parseAllowedOrigins,
} from '@/domain/utils/corsOrigins';
import { requestIdMiddleware } from '@/infrastructure/middleware/requestIdMiddleware';
import { AppError } from '@/domain/errors/AppError';
import { appErrorStatus } from '@/infrastructure/config/appErrorStatus';
import path from 'path';

export function parseTrustProxyHops(value: string | undefined): number {
  const normalized = value?.trim();
  if (!normalized) return 0;
  if (!/^\d+$/.test(normalized)) {
    throw new Error('TRUST_PROXY_HOPS must be a non-negative integer');
  }
  const hops = Number(normalized);
  if (!Number.isSafeInteger(hops) || hops > 10) {
    throw new Error('TRUST_PROXY_HOPS must be between 0 and 10');
  }
  return hops;
}

export class Server {
  private app: Application;
  private port: number;

  constructor(port: number = 3000) {
    this.app = express();
    this.port = port;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    this.app.set('trust proxy', parseTrustProxyHops(process.env.TRUST_PROXY_HOPS));
    const allowedOrigins = parseAllowedOrigins(process.env.CLIENT_URL);

    const corsOptions = {
      origin: (
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void
      ) => {
        if (isOriginAllowed(origin, allowedOrigins)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    };
    this.app.use(cors(corsOptions));
    this.app.use(requestIdMiddleware);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Snake case transformation middleware (must be before routes)
    this.app.use(snakeCaseMiddleware);

    // Response logging middleware
    this.app.use(responseLoggingMiddleware);
  }

  private setupRoutes(): void {
    // API routes
    this.app.use('/api', createRoutes());

    const frontendDirectory = process.env.FRONT_DIST_DIR;
    if (frontendDirectory)
      this.app.use(
        express.static(frontendDirectory, { index: false, fallthrough: true })
      );

    // Root route
    this.app.get('/', (_req: Request, res: Response) => {
      if (frontendDirectory) {
        res.sendFile(path.join(frontendDirectory, 'index.html'));
        return;
      }
      res.json({
        message: 'Welcome to the application scaffold API',
        version: '1.0.0',
        documentation: '/api',
      });
    });

    // 404 handler
    this.app.use((req: Request, res: Response) => {
      if (
        frontendDirectory &&
        req.method === 'GET' &&
        !req.path.startsWith('/api/') &&
        req.accepts('html')
      ) {
        res.sendFile(path.join(frontendDirectory, 'index.html'));
        return;
      }
      res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method,
      });
    });
  }

  private setupErrorHandling(): void {
    // Global error handler
    this.app.use(
      (err: Error, req: Request, res: Response, _next: NextFunction) => {
        if (err instanceof AppError) {
          res.status(appErrorStatus(err)).json({
            success: false,
            error: err.message,
            errorCode: err.errorCode,
          });
          return;
        }

        // Log the error for debugging
        console.error('❌ Unhandled error:', {
          message: err.message,
          stack: err.stack,
          path: req.path,
          method: req.method,
        });
        res.status(500).json({
          error: 'Internal server error',
          message:
            process.env.NODE_ENV === 'development'
              ? err.message
              : 'Something went wrong',
          timestamp: new Date().toISOString(),
        });
      }
    );
  }

  public start(): void {
    this.app.listen(this.port, () => {
      this.logReady();
    });
  }

  public getApp(): Application {
    return this.app;
  }

  public getPort(): number {
    return this.port;
  }

  public logReady(): void {
    console.log(`🚀 Server running on port ${this.port}`);
    console.log(`📚 API Documentation: http://localhost:${this.port}/api`);
    console.log(`🏥 Health Check: http://localhost:${this.port}/api/health`);
    console.log(`📡 Ping: http://localhost:${this.port}/api/ping`);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  const port = parseInt(process.env.PORT || '3000', 10);
  const server = new Server(port);
  server.start();
}
