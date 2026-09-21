import { RequestHandler, Router } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { container } from '@/infrastructure/config/container';
import { PingController } from '@/infrastructure/controllers/PingController';
import { UserController } from '@/infrastructure/controllers/UserController';
import { AuthController } from '@/infrastructure/controllers/AuthController';
import { AdminSettingsController } from '@/infrastructure/controllers/AdminSettingsController';
import { NotificationController } from '@/infrastructure/controllers/NotificationController';
import { PushController } from '@/infrastructure/controllers/PushController';
import { AuthMiddleware } from '@/infrastructure/middleware/authMiddleware';
import { PermissionMiddleware } from '@/infrastructure/middleware/permissionMiddleware';
import multer from 'multer';
import { ExampleItemController } from '@/infrastructure/controllers/ExampleItemController';
import { MediaAssetController } from '@/infrastructure/controllers/MediaAssetController';
import { clientDiagnosticsController } from '@/infrastructure/controllers/ClientDiagnosticsController';
import { AuditEventController } from '@/infrastructure/controllers/AuditEventController';
import { isMediaEnabled } from '@/domain/utils/mediaConfig';
import { apiDocsHtml, apiOpenApiDocument } from '@/infrastructure/openapi';
import {
  csrfProtection,
  issueCsrfToken,
} from '@/infrastructure/services/BrowserSession';
import { MediceController } from '@/infrastructure/controllers/MediceController';

export function createRoutes(): Router {
  const router = Router();

  router.use(csrfProtection);
  router.get('/auth/csrf', (req, res) =>
    res.json({ token: issueCsrfToken(req, res) })
  );

  router.get('/openapi.json', (_req, res) => res.json(apiOpenApiDocument));
  router.get('/docs', (_req, res) => res.type('html').send(apiDocsHtml));

  const pingController = container.resolve(PingController);
  const userController = container.resolve(UserController);
  const authController = container.resolve(AuthController);
  const adminSettingsController = container.resolve(AdminSettingsController);
  const notificationController = container.resolve(NotificationController);
  const pushController = container.resolve(PushController);
  const exampleItemController = container.resolve(ExampleItemController);
  const mediaAssetController = container.resolve(MediaAssetController);
  const auditEventController = container.resolve(AuditEventController);
  const medice = container.resolve(MediceController);
  const auth = container.resolve(AuthMiddleware);
  const permissionMiddleware = container.resolve(PermissionMiddleware);

  const diagnosticsLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    keyGenerator: req => ipKeyGenerator(req.ip ?? 'unknown'),
    standardHeaders: true,
    legacyHeaders: false,
  });
  const diagnosticsBodyLimit = (req: any, res: any, next: any) => {
    if (Number(req.headers['content-length'] ?? 0) > 16 * 1024) {
      res.status(413).json({ error: 'Diagnostic payload too large' });
      return;
    }
    next();
  };

  router.post(
    '/diagnostics/client-errors',
    diagnosticsLimiter,
    diagnosticsBodyLimit,
    (req, res) => clientDiagnosticsController.receive(req, res)
  );
  router.get(
    '/admin/diagnostics/client-errors',
    auth.authenticate(),
    permissionMiddleware.requirePermission('admin:manage_settings'),
    (req, res) => clientDiagnosticsController.list(req, res)
  );
  router.get(
    '/admin/audit-events',
    auth.authenticate(),
    permissionMiddleware.requirePermission('admin:manage_settings'),
    (req, res, next) => auditEventController.list(req, res).catch(next)
  );
  router.get(
    '/admin/audit-events/export',
    auth.authenticate(),
    permissionMiddleware.requirePermission('admin:manage_settings'),
    (req, res, next) => auditEventController.export(req, res).catch(next)
  );

  // Health & Status (public)
  router.get('/ping', (req, res) => pingController.ping(req, res));
  router.get('/health', (req, res) => pingController.health(req, res));
  router.get('/health/live', (req, res) => pingController.live(req, res));
  router.get('/health/ready', (req, res) => pingController.ready(req, res));
  router.get('/health/config', (req, res) => pingController.config(req, res));

  // Generic authenticated example domain. This is intentionally small and replaceable.
  router.get('/example/items', auth.authenticate(), (req, res) =>
    exampleItemController.listMine(req as any, res)
  );
  router.post('/example/items', auth.authenticate(), (req, res, next) => {
    exampleItemController.create(req as any, res).catch(next);
  });
  router.get(
    '/admin/example/items',
    auth.authenticate(),
    permissionMiddleware.requirePermission('admin:manage_settings'),
    (req, res) => exampleItemController.listAll(req, res)
  );

  // Generic media surface: both upload modes are intentionally domain-neutral.
  const mediaUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: Number(process.env.MEDIA_MAX_UPLOAD_BYTES ?? 10 * 1024 * 1024),
    },
  });
  const mediaEnabled = (_req: any, res: any, next: any) => {
    if (!isMediaEnabled()) {
      res.status(503).json({
        success: false,
        error: 'Media feature is disabled',
        errorCode: 'SERVICE_UNAVAILABLE',
      });
      return;
    }
    next();
  };
  router.get('/media/assets', auth.authenticate(), mediaEnabled, (req, res) =>
    mediaAssetController.listMine(req as any, res)
  );
  router.post(
    '/media/assets/multipart',
    auth.authenticate(),
    mediaEnabled,
    mediaUpload.single('file'),
    (req, res, next) =>
      mediaAssetController.uploadMultipart(req as any, res).catch(next)
  );
  router.post(
    '/media/assets/data-url',
    auth.authenticate(),
    mediaEnabled,
    (req, res, next) =>
      mediaAssetController.uploadDataUrl(req as any, res).catch(next)
  );
  router.get(
    '/media/assets/:id',
    auth.authenticate(),
    mediaEnabled,
    (req, res, next) => mediaAssetController.get(req as any, res).catch(next)
  );
  router.post(
    '/admin/media/assets/multipart',
    auth.authenticate(),
    permissionMiddleware.requirePermission('admin:manage_settings'),
    mediaEnabled,
    mediaUpload.single('file'),
    (req, res, next) =>
      mediaAssetController.uploadMultipartAdmin(req as any, res).catch(next)
  );
  router.post(
    '/admin/media/assets/data-url',
    auth.authenticate(),
    permissionMiddleware.requirePermission('admin:manage_settings'),
    mediaEnabled,
    (req, res, next) =>
      mediaAssetController.uploadDataUrlAdmin(req as any, res).catch(next)
  );
  router.get(
    '/admin/media/assets',
    auth.authenticate(),
    permissionMiddleware.requirePermission('admin:manage_settings'),
    mediaEnabled,
    (req, res) => mediaAssetController.listAll(req, res)
  );

  // Authentication (public)
  router.post(
    '/auth/google',
    (req, res, next) => {
      if (req.header('X-Requested-With') !== 'XmlHttpRequest') {
        res.status(400).json({
          success: false,
          error: 'Google popup request validation failed',
        });
        return;
      }
      next();
    },
    async (req, res, next) => {
      try {
        await authController.signInWithGoogle(req, res);
      } catch (error) {
        next(error);
      }
    }
  );
  router.post(
    '/auth/google/upgrade',
    auth.authenticate(),
    async (req, res, next) => {
      try {
        await authController.upgradeGoogleAuth(req, res);
      } catch (error) {
        next(error);
      }
    }
  );
  router.get(
    '/auth/google/refresh-token',
    auth.authenticate(),
    async (req, res, next) => {
      try {
        await authController.refreshGoogleAccessToken(req, res);
      } catch (error) {
        next(error);
      }
    }
  );
  router.post('/auth/dev/bypass', async (req, res, next) => {
    try {
      await authController.signInWithDevBypass(req, res);
    } catch (error) {
      next(error);
    }
  });
  const emailAuthEnabled: RequestHandler = (_req, res, next) => {
    if (process.env.EMAIL_AUTH_ENABLED === 'true') return next();
    res.status(404).json({ success: false, error: 'Not found' });
  };
  router.post(
    '/auth/email/sign-up',
    emailAuthEnabled,
    async (req, res, next) => {
      try {
        await authController.signUpWithEmail(req, res);
      } catch (error) {
        next(error);
      }
    }
  );
  router.post(
    '/auth/email/verify',
    emailAuthEnabled,
    async (req, res, next) => {
      try {
        await authController.verifyEmail(req, res);
      } catch (error) {
        next(error);
      }
    }
  );
  router.post(
    '/auth/email/sign-in',
    emailAuthEnabled,
    async (req, res, next) => {
      try {
        await authController.signInWithEmail(req, res);
      } catch (error) {
        next(error);
      }
    }
  );
  router.post(
    '/auth/email/resend-code',
    emailAuthEnabled,
    async (req, res, next) => {
      try {
        await authController.resendVerificationCode(req, res);
      } catch (error) {
        next(error);
      }
    }
  );
  router.post(
    '/auth/email/forgot-password',
    emailAuthEnabled,
    async (req, res, next) => {
      try {
        await authController.requestPasswordReset(req, res);
      } catch (error) {
        next(error);
      }
    }
  );
  router.post(
    '/auth/email/reset-password',
    emailAuthEnabled,
    async (req, res, next) => {
      try {
        await authController.resetPassword(req, res);
      } catch (error) {
        next(error);
      }
    }
  );
  router.get('/auth/verify', (req, res) =>
    authController.verifyToken(req, res)
  );
  router.post('/auth/refresh', (req, res) =>
    authController.refreshToken(req, res)
  );
  router.post('/auth/signout', (req, res) => authController.signOut(req, res));
  router.get('/auth/me', auth.authenticate(), (req, res) =>
    authController.getCurrentUser(req, res)
  );

  // Medice domain: all clinical reads require an authenticated, allow-listed account.
  router.get('/bootstrap', auth.authenticate(), (req, res, next) =>
    medice.bootstrap(req, res).catch(next)
  );
  router.get('/patients', auth.authenticate(), (req, res, next) =>
    medice.listPatients(req, res).catch(next)
  );
  router.post(
    '/patients',
    auth.authenticate(),
    permissionMiddleware.requirePermission('medice:manage_domain'),
    (req, res, next) => medice.savePatient(req, res).catch(next)
  );
  router.get('/patients/:patientId', auth.authenticate(), (req, res, next) =>
    medice.getPatient(req, res).catch(next)
  );
  router.patch(
    '/patients/:patientId',
    auth.authenticate(),
    permissionMiddleware.requirePermission('medice:manage_domain'),
    (req, res, next) => medice.savePatient(req, res).catch(next)
  );
  router.post(
    '/patients/:patientId/archive',
    auth.authenticate(),
    permissionMiddleware.requirePermission('medice:manage_domain'),
    (req, res, next) => medice.setPatientArchive(req, res).catch(next)
  );
  router.post(
    '/patients/:patientId/restore',
    auth.authenticate(),
    async (req, res, next) => {
      try {
        await medice.restorePatient(req, res);
      } catch (error) {
        next(error);
      }
    }
  );
  router.put(
    '/patients/:patientId/assignments',
    auth.authenticate(),
    permissionMiddleware.requirePermission('medice:manage_domain'),
    (req, res, next) => medice.assignPatient(req, res).catch(next)
  );
  router.get(
    '/patients/:patientId/follow-ups',
    auth.authenticate(),
    (req, res, next) => medice.listFollowUps(req, res).catch(next)
  );
  router.post(
    '/patients/:patientId/follow-ups',
    auth.authenticate(),
    (req, res, next) => medice.createFollowUp(req, res).catch(next)
  );
  router.get('/alerts', auth.authenticate(), (req, res, next) =>
    medice.listAlerts(req, res).catch(next)
  );
  router.post(
    '/patients/:patientId/alerts',
    auth.authenticate(),
    (req, res, next) => medice.createAlert(req, res).catch(next)
  );
  router.post(
    '/alerts/:alertId/resolve',
    auth.authenticate(),
    (req, res, next) => medice.resolveAlert(req, res).catch(next)
  );
  router.get('/hospitals', auth.authenticate(), (req, res, next) =>
    medice.listHospitals(req, res).catch(next)
  );
  router.post(
    '/hospitals',
    auth.authenticate(),
    permissionMiddleware.requirePermission('medice:manage_domain'),
    (req, res, next) => medice.saveHospital(req, res).catch(next)
  );
  router.patch(
    '/hospitals/:hospitalId',
    auth.authenticate(),
    permissionMiddleware.requirePermission('medice:manage_domain'),
    (req, res, next) => medice.saveHospital(req, res).catch(next)
  );
  router.post(
    '/hospitals/:hospitalId/archive',
    auth.authenticate(),
    permissionMiddleware.requirePermission('medice:manage_domain'),
    (req, res, next) => medice.setHospitalArchive(req, res).catch(next)
  );
  router.post(
    '/hospitals/:hospitalId/restore',
    auth.authenticate(),
    permissionMiddleware.requirePermission('medice:manage_domain'),
    (req, res, next) => medice.setHospitalArchive(req, res).catch(next)
  );
  router.get('/volunteers', auth.authenticate(), (req, res, next) =>
    medice.listVolunteers(req, res).catch(next)
  );
  router.get('/users/me/profile', auth.authenticate(), (req, res, next) =>
    medice.getMyProfile(req, res).catch(next)
  );
  router.patch('/users/me/profile', auth.authenticate(), (req, res, next) =>
    medice.updateMyProfile(req, res).catch(next)
  );
  router.post(
    '/coordinator/allowed-users',
    auth.authenticate(),
    permissionMiddleware.requirePermission('medice:manage_allowlist'),
    (req, res, next) => medice.addVolunteerAllowlist(req, res).catch(next)
  );
  router.get(
    '/coordinator/allowed-users',
    auth.authenticate(),
    permissionMiddleware.requirePermission('medice:manage_allowlist'),
    (req, res, next) => medice.listVolunteerAllowlist(req, res).catch(next)
  );
  router.get('/stats/me', auth.authenticate(), (req, res, next) =>
    medice.getStats(req, res).catch(next)
  );
  router.get(
    '/stats/global',
    auth.authenticate(),
    permissionMiddleware.requirePermission('medice:global_stats'),
    (req, res, next) => medice.getStats(req, res).catch(next)
  );

  // Current user settings (protected)
  router.get('/users/me/settings', auth.authenticate(), (req, res, next) => {
    userController.getMySettings(req as any, res).catch(next);
  });
  router.patch('/users/me/settings', auth.authenticate(), (req, res, next) => {
    userController.updateMySettings(req as any, res).catch(next);
  });

  // Users (protected)
  router.get(
    '/users',
    auth.authenticate(),
    permissionMiddleware.requirePermission('admin:manage_settings'),
    (req, res) => userController.searchUsers(req, res)
  );
  router.put(
    '/admin/users/:userId/role',
    auth.authenticate(),
    permissionMiddleware.requirePermission('admin:manage_roles'),
    (req, res) => userController.updateUserRole(req, res)
  );
  router.get('/users/:id', auth.authenticate(), (req, res) =>
    userController.getUserById(req, res)
  );
  router.get('/users/google/:googleId', auth.authenticate(), (req, res) =>
    userController.getUserByGoogleId(req, res)
  );
  router.delete(
    '/users/:id',
    auth.authenticate(),
    permissionMiddleware.requirePermission('admin:manage_roles'),
    (req, res) => userController.deleteUser(req, res)
  );

  // Admin settings
  router.get(
    '/admin/settings/allowed_users',
    auth.authenticate(),
    permissionMiddleware.requirePermission('admin:manage_settings'),
    (req, res) => adminSettingsController.getAllowedUsers(req, res)
  );
  router.post(
    '/admin/settings/allowed_users',
    auth.authenticate(),
    permissionMiddleware.requirePermission('admin:manage_settings'),
    (req, res) => adminSettingsController.addAllowedUser(req, res)
  );
  router.delete(
    '/admin/settings/allowed_users/:email',
    auth.authenticate(),
    permissionMiddleware.requirePermission('admin:manage_settings'),
    (req, res) => adminSettingsController.removeAllowedUser(req, res)
  );

  // Notifications (protected) - generic in-app notification feed
  router.get('/notifications/me', auth.authenticate(), (req, res) =>
    notificationController.getMyNotifications(req, res)
  );

  // Push subscriptions (protected)
  router.post('/push/subscribe', auth.authenticate(), (req, res) =>
    pushController.subscribe(req, res)
  );
  router.delete('/push/subscribe', auth.authenticate(), (req, res) =>
    pushController.unsubscribe(req, res)
  );
  router.get('/push/vapid-public', auth.authenticate(), (req, res) =>
    pushController.getVapidPublic(req, res)
  );

  return router;
}
