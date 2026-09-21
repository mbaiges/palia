import 'reflect-metadata';
import { container, Lifecycle } from 'tsyringe';
import { PingController } from '@/infrastructure/controllers/PingController';
import { UserController } from '@/infrastructure/controllers/UserController';
import { AuthController } from '@/infrastructure/controllers/AuthController';
import { AuthHandler } from '@/application/handlers/AuthHandler';
import { AuthService } from '@/domain/services/AuthService';
import { GoogleAuthRepository } from '@/infrastructure/adapters/auth/GoogleAuthRepository';
import { JwtAdapter } from '@/infrastructure/adapters/auth/JwtAdapter';
import { BcryptPasswordHasher } from '@/infrastructure/adapters/auth/BcryptPasswordHasher';
import { ResendEmailSender } from '@/infrastructure/adapters/email/ResendEmailSender';
import { ConsoleEmailSender } from '@/infrastructure/adapters/email/ConsoleEmailSender';
import { SqliteEmailVerificationRepository } from '@/infrastructure/adapters/repositories/SqliteEmailVerificationRepository';
import { SqlitePasswordResetRepository } from '@/infrastructure/adapters/repositories/SqlitePasswordResetRepository';
import { SqliteUserRepository } from '@/infrastructure/adapters/repositories/SqliteUserRepository';
import { SqliteRoleRepository } from '@/infrastructure/adapters/repositories/SqliteRoleRepository';
import { SqlitePermissionRepository } from '@/infrastructure/adapters/repositories/SqlitePermissionRepository';
import { SqliteAppSettingsRepository } from '@/infrastructure/adapters/repositories/SqliteAppSettingsRepository';
import { SqliteUserSettingsRepository } from '@/infrastructure/adapters/repositories/SqliteUserSettingsRepository';
import { AdminSettingsService } from '@/domain/services/AdminSettingsService';
import { AdminSettingsHandler } from '@/application/handlers/AdminSettingsHandler';
import { AdminSettingsController } from '@/infrastructure/controllers/AdminSettingsController';
import { UserService } from '@/domain/services/UserService';
import { AuthMiddleware } from '@/infrastructure/middleware/authMiddleware';
import { PermissionMiddleware } from '@/infrastructure/middleware/permissionMiddleware';
import { AuthConfig } from '@/domain/models/AuthConfig';
import type { EmailSender } from '@/domain/repositories/EmailSender';
import { configService } from '@/infrastructure/config/config';
import { DatabaseConfig } from '@/infrastructure/config/database';

import { NotificationController } from '@/infrastructure/controllers/NotificationController';
import { GenericNotificationService } from '@/infrastructure/services/GenericNotificationService';
import { PushController } from '@/infrastructure/controllers/PushController';
import { SqlitePushSubscriptionRepository } from '@/infrastructure/adapters/repositories/SqlitePushSubscriptionRepository';
import { SqliteNotificationRepository } from '@/infrastructure/adapters/repositories/SqliteNotificationRepository';
import type { BlobStorage } from '@/domain/repositories/BlobStorage';
import { createBlobStorage } from '@/infrastructure/config/createBlobStorage';
import { SocketIORealtimeGateway } from '@/infrastructure/adapters/realtime/SocketIORealtimeGateway';
import { SqliteExampleItemRepository } from '@/infrastructure/adapters/repositories/SqliteExampleItemRepository';
import { ExampleItemService } from '@/domain/services/ExampleItemService';
import { ExampleItemController } from '@/infrastructure/controllers/ExampleItemController';
import { SqliteMediaAssetRepository } from '@/infrastructure/adapters/repositories/SqliteMediaAssetRepository';
import { MediaAssetService } from '@/domain/services/MediaAssetService';
import { MediaAssetController } from '@/infrastructure/controllers/MediaAssetController';
import { AuditEventController } from '@/infrastructure/controllers/AuditEventController';
import { MedicePatientService } from '@/domain/services/MedicePatientService';
import { SqliteMedicePatientRepository } from '@/infrastructure/adapters/repositories/SqliteMedicePatientRepository';
import { MediceController } from '@/infrastructure/controllers/MediceController';

// Database
container.register('Database', {
  useValue: DatabaseConfig.getConnection(),
});

// Repositories
container.register(
  'UserRepository',
  { useClass: SqliteUserRepository },
  { lifecycle: Lifecycle.Singleton }
);
container.register(
  'RoleRepository',
  { useClass: SqliteRoleRepository },
  { lifecycle: Lifecycle.Singleton }
);
container.register(
  'PermissionRepository',
  { useClass: SqlitePermissionRepository },
  { lifecycle: Lifecycle.Singleton }
);
container.register(
  'AppSettingsRepository',
  { useClass: SqliteAppSettingsRepository },
  { lifecycle: Lifecycle.Singleton }
);
container.register(
  'UserSettingsRepository',
  { useClass: SqliteUserSettingsRepository },
  { lifecycle: Lifecycle.Singleton }
);
container.register<BlobStorage>('BlobStorage', { useValue: createBlobStorage() });
container.register(
  'PushSubscriptionRepository',
  { useClass: SqlitePushSubscriptionRepository },
  { lifecycle: Lifecycle.Singleton }
);
container.register(
  'ExampleItemRepository',
  { useClass: SqliteExampleItemRepository },
  { lifecycle: Lifecycle.Singleton }
);
container.register(
  'NotificationRepository',
  { useClass: SqliteNotificationRepository },
  { lifecycle: Lifecycle.Singleton }
);
container.register(
  'MediaAssetRepository',
  { useClass: SqliteMediaAssetRepository },
  { lifecycle: Lifecycle.Singleton }
);
container.register(
  'MedicePatientRepository',
  { useClass: SqliteMedicePatientRepository },
  { lifecycle: Lifecycle.Singleton },
);

// Auth repository
container.register(
  'AuthRepository',
  { useClass: GoogleAuthRepository },
  { lifecycle: Lifecycle.Singleton }
);

container.register(
  'EmailVerificationRepository',
  { useClass: SqliteEmailVerificationRepository },
  { lifecycle: Lifecycle.Singleton }
);
container.register(
  'PasswordResetRepository',
  { useClass: SqlitePasswordResetRepository },
  { lifecycle: Lifecycle.Singleton }
);

const emailSender: EmailSender =
  process.env.RESEND_API_KEY
    ? new ResendEmailSender(
        process.env.RESEND_API_KEY,
        process.env.EMAIL_FROM
      )
    : new ConsoleEmailSender();

container.register<EmailSender>('EmailSender', { useValue: emailSender });

container.register(
  'PasswordHasher',
  { useClass: BcryptPasswordHasher },
  { lifecycle: Lifecycle.Singleton }
);

// Adapters
container.register(JwtAdapter, { useClass: JwtAdapter });
container.register(
  'TokenProvider',
  { useClass: JwtAdapter },
  { lifecycle: Lifecycle.Singleton }
);

// Auth config
container.register<AuthConfig>('AuthConfig', {
  useValue: {
    allowedEmails: configService.getAllowedEmails(),
  },
});

// Domain Services
container.register('AuthService', { useClass: AuthService });
container.register('AdminSettingsService', { useClass: AdminSettingsService });
container.register('UserService', { useClass: UserService });
container.register('GenericNotificationService', { useClass: GenericNotificationService });
container.register('ExampleItemService', { useClass: ExampleItemService });
container.register('MediaAssetService', { useClass: MediaAssetService });
container.register('MedicePatientService', { useClass: MedicePatientService });
container.register(SocketIORealtimeGateway, { useClass: SocketIORealtimeGateway });

// Application Handlers
container.register('AuthHandler', { useClass: AuthHandler });
container.register('AdminSettingsHandler', { useClass: AdminSettingsHandler });

// Controllers
container.register('PingController', { useClass: PingController });
container.register('UserController', { useClass: UserController });
container.register('AuthController', { useClass: AuthController });
container.register('AdminSettingsController', { useClass: AdminSettingsController });
container.register('NotificationController', { useClass: NotificationController });
container.register('PushController', { useClass: PushController });
container.register('ExampleItemController', { useClass: ExampleItemController });
container.register('MediaAssetController', { useClass: MediaAssetController });
container.register('AuditEventController', { useClass: AuditEventController });
container.register('MediceController', { useClass: MediceController });

// Middleware
container.register('AuthMiddleware', { useClass: AuthMiddleware });
container.register('PermissionMiddleware', { useClass: PermissionMiddleware });

export { container };
