import 'reflect-metadata';
import { container, Lifecycle } from 'tsyringe';
import { AuthController } from '@/infrastructure/controllers/AuthController';
import { NotificationController } from '@/infrastructure/controllers/NotificationController';
import { PushController } from '@/infrastructure/controllers/PushController';
import { SocketIORealtimeGateway } from '@/infrastructure/adapters/realtime/SocketIORealtimeGateway';
import { AuthHandler } from '@/application/handlers/AuthHandler';
import { AuthService } from '@/domain/services/AuthService';
import { UserRepository } from '@/domain/repositories/UserRepository';
import { TokenProvider } from '@/domain/repositories/TokenProvider';
import { AuthRepository } from '@/domain/repositories/AuthRepository';

// We need to import the container configuration to ensure it's loaded
import '@/infrastructure/config/container';

describe('Dependency Injection Container', () => {
  it('should resolve all dependencies and adhere to lifecycles', () => {
    // Should resolve AuthController with all its dependencies
    const authController = container.resolve(AuthController);
    expect(authController).toBeInstanceOf(AuthController);

    // Should resolve NotificationController with all its dependencies
    const notificationController = container.resolve(NotificationController);
    expect(notificationController).toBeInstanceOf(NotificationController);

    // Should resolve PushController with all its dependencies
    const pushController = container.resolve(PushController);
    expect(pushController).toBeInstanceOf(PushController);

    const realtimeGateway = container.resolve(SocketIORealtimeGateway);
    expect(realtimeGateway).toBeInstanceOf(SocketIORealtimeGateway);

    // Should resolve AuthHandler with all its dependencies
    const authHandler = container.resolve<AuthHandler>('AuthHandler');
    expect(authHandler).toBeInstanceOf(AuthHandler);

    // Should resolve AuthService with all its dependencies
    const authService = container.resolve<AuthService>('AuthService');
    expect(authService).toBeInstanceOf(AuthService);

    // Should resolve repositories as singletons
    const userRepository1 = container.resolve<UserRepository>('UserRepository');
    const userRepository2 = container.resolve<UserRepository>('UserRepository');
    expect(userRepository1).toBeInstanceOf(Object);
    expect(userRepository1).toBe(userRepository2);

    // Should resolve adapters as singletons
    const tokenProvider1 = container.resolve<TokenProvider>('TokenProvider');
    const tokenProvider2 = container.resolve<TokenProvider>('TokenProvider');
    expect(tokenProvider1).toBeInstanceOf(Object);
    expect(tokenProvider1).toBe(tokenProvider2);

    // Should resolve auth repository as singleton
    const authRepository1 = container.resolve<AuthRepository>('AuthRepository');
    const authRepository2 = container.resolve<AuthRepository>('AuthRepository');
    expect(authRepository1).toBeInstanceOf(Object);
    expect(authRepository1).toBe(authRepository2);
  });
});
