import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import { container } from './infrastructure/config/container';
import { DatabaseConfig } from './infrastructure/config/database';
import { Server } from './infrastructure/config/server';
import { startMediaAssetCleanupJob } from './infrastructure/jobs/mediaAssetCleanupJob';
import { SocketIORealtimeGateway } from './infrastructure/adapters/realtime/SocketIORealtimeGateway';

async function bootstrap() {
  // Run migrations before accepting requests (skip for in-memory test DB)
  if (process.env.DB_CONNECTION_STR !== ':memory:') {
    await DatabaseConfig.initializeTables();
  }

  const port = parseInt(process.env.PORT || '3000', 10);
  const server = new Server(port);
  const httpServer = createServer(server.getApp());
  container.resolve(SocketIORealtimeGateway).attach(httpServer);

  httpServer.listen(port, () => {
    server.logReady();
  });

  startMediaAssetCleanupJob();
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
