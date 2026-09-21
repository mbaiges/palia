import type { Server as HttpServer } from 'http';
import { Server as SocketServer, type Socket } from 'socket.io';
import { inject, injectable } from 'tsyringe';
import type { TokenProvider } from '@/domain/repositories/TokenProvider';
import { isOriginAllowed, parseAllowedOrigins } from '@/domain/utils/corsOrigins';

/** Generic authenticated Socket.IO surface intended to be replaced by a domain channel. */
@injectable()
export class SocketIORealtimeGateway {
  private io: SocketServer | null = null;

  constructor(@inject('TokenProvider') private readonly tokenProvider: TokenProvider) {}

  attach(httpServer: HttpServer): void {
    const allowedOrigins = parseAllowedOrigins(process.env.CLIENT_URL);
    this.io = new SocketServer(httpServer, {
      path: '/socket.io',
      cors: {
        origin: (origin, callback) => {
          const allowed = isOriginAllowed(origin, allowedOrigins);
          callback(allowed ? null : new Error('Not allowed by CORS'), allowed);
        },
        credentials: true,
      },
    });

    const namespace = this.io.of('/realtime');
    namespace.use((socket, next) => {
      try {
        const payload = this.tokenProvider.verifyToken(String(socket.handshake.auth?.token ?? ''));
        socket.data.userId = payload.userId;
        next();
      } catch {
        next(new Error('Unauthorized'));
      }
    });
    namespace.on('connection', (socket) => this.handleConnection(socket));
  }

  close(): Promise<void> {
    const io = this.io;
    this.io = null;
    if (!io) return Promise.resolve();
    return new Promise((resolve, reject) => {
      io.close((error?: Error) => (error ? reject(error) : resolve()));
    });
  }

  private handleConnection(socket: Socket): void {
    socket.emit('REALTIME_READY', { userId: socket.data.userId });
    socket.on('PING', (payload: unknown, ack?: (value: unknown) => void) => {
      const result = { ok: true, payload: payload ?? null, at: new Date().toISOString() };
      socket.emit('PONG', result);
      if (typeof ack === 'function') ack(result);
    });
    socket.on('CLIENT_EVENT', (payload: unknown, ack?: (value: unknown) => void) => {
      const result = { ok: true, payload: payload ?? null };
      socket.emit('SERVER_EVENT', result);
      if (typeof ack === 'function') ack(result);
    });
  }
}
