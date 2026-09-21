import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import { container } from './infrastructure/config/container';
import { DatabaseConfig } from './infrastructure/config/database';
import { Server } from './infrastructure/config/server';
import { startMediaAssetCleanupJob } from './infrastructure/jobs/mediaAssetCleanupJob';
import { SocketIORealtimeGateway } from './infrastructure/adapters/realtime/SocketIORealtimeGateway';
import { validateAuthRuntimeConfig } from './domain/utils/authRuntimeConfig';

async function bootstrap() {
  validateAuthRuntimeConfig();
  // Run migrations before accepting requests (skip for in-memory test DB)
  if (process.env.DB_CONNECTION_STR !== ':memory:') {
    await DatabaseConfig.initializeTables();
  }

  const port = parseInt(process.env.PORT || '3000', 10);
  const server = new Server(port);
  const httpServer = createServer(server.getApp());
  const realtimeGateway = container.resolve(SocketIORealtimeGateway);
  realtimeGateway.attach(httpServer);

  httpServer.listen(port, () => {
    server.logReady();
  });

  const stopMediaAssetCleanupJob = startMediaAssetCleanupJob();
  let shutdownPromise: Promise<void> | undefined;
  const shutdown = (signal: NodeJS.Signals) => {
    if (shutdownPromise) return shutdownPromise;
    console.log(`[Shutdown] Received ${signal}; closing server gracefully.`);
    stopMediaAssetCleanupJob();
    const forceCloseTimer = setTimeout(() => {
      httpServer.closeAllConnections();
    }, Number(process.env.SHUTDOWN_TIMEOUT_MS ?? 10_000));
    forceCloseTimer.unref();
    shutdownPromise = (async () => {
      try {
        await realtimeGateway.close();
        await DatabaseConfig.close();
      } catch (error) {
        console.error('[Shutdown] Graceful shutdown failed:', error);
        process.exitCode = 1;
      } finally {
        clearTimeout(forceCloseTimer);
      }
    })();
    return shutdownPromise;
  };
  process.once('SIGTERM', () => void shutdown('SIGTERM'));
  process.once('SIGINT', () => void shutdown('SIGINT'));
}

bootstrap().catch(err => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
