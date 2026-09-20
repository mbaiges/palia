# Feature inventory

Source: reference application API (copied without local dependencies, databases, build output, or `.env` files).

This is a code-level inventory of what is present in the copied application. It is not yet a proposal for the final scaffold and does not claim that every integration is configured in a fresh environment.

## Current scaffold additions

- Generic authenticated profile/preferences are backed by the existing user-settings persistence endpoint; locale, theme, and push preference controls are intentionally separate from administration.
- Socket.IO exposes a generic authenticated `CLIENT_EVENT` to `SERVER_EVENT` round trip, plus connection-ready and reconnect behavior, without chat or domain-specific event names.
- Service-worker failures and unhandled rejections report bounded best-effort diagnostics to `/api/diagnostics/client-errors`.
- Standalone media endpoints cover authenticated and admin uploads, multipart and compressed data-URL input, stable retrieval, ACL, expiry, and cleanup without chat-image semantics.
- `npm run smoke:load` provides a separate concurrent health-endpoint smoke/load check; it is intentionally independent from browser E2E tests.
- The configured `matiasbaiges@gmail.com` admin/allowed-user value is preserved intentionally as deployment configuration and is not documentation-only.

## Platform and architecture

- TypeScript Node.js API using Express.
- Layered/hexagonal structure: domain models, repositories, services/use cases, application handlers, infrastructure adapters/controllers/routes.
- Dependency injection container using `tsyringe`.
- SQLite/local database support through Knex, with libSQL/Turso support.
- Database migrations and seed-style migrations.
- Environment-based configuration with `env.example`.
- JSON API response/error handling, request logging, CORS, URL/origin configuration, and snake_case request/response mapping.
- Rate limiting for chat polling/sending, image uploads, and showcase-link generation.
- Jest unit/integration tests and TypeScript build/lint/format scripts.

## Authentication and account lifecycle

- Google OAuth sign-in using Google token verification.
- Development authentication bypass, including optional development-admin assignment.
- Email/password sign-up.
- Email verification-code flow.
- Resend verification code.
- Email/password sign-in.
- JWT access-token creation and verification.
- Token refresh.
- Sign-out endpoint.
- Current-user (`me`) endpoint.
- Password-reset request flow with expiring reset tokens.
- Password reset completion flow.
- Bcrypt password hashing.
- Verification and password-reset email templates using React Email.
- Console email sender for local development/testing.
- Resend email sender for real email delivery.
- Localized email content in English, Spanish, and Argentine Spanish.
- Auth middleware with required and optional authentication modes.
- Authenticated user, public user, token payload, and auth-account domain models.

### Authentication endpoints

- `POST /auth/google`
- `POST /auth/dev/bypass`
- `POST /auth/email/sign-up`
- `POST /auth/email/verify`
- `POST /auth/email/sign-in`
- `POST /auth/email/resend-code`
- `POST /auth/email/forgot-password`
- `POST /auth/email/reset-password`
- `GET /auth/verify`
- `POST /auth/refresh`
- `POST /auth/signout`
- `GET /auth/me` (authenticated)

## Authorization, roles, and administration

- Role-based access control with roles, permissions, user-role assignments, and role-permission assignments.
- Permission middleware with named permission checks.
- Admin settings service/controller.
- Allowed-user email allowlist management.
- Authenticated user search with pagination/filter parameters.
- Admin user role updates.
- User lookup by ID and Google ID.
- User deletion.
- Per-user locale/settings update.
- Admin-only protection for settings and role-management operations.

### Admin endpoints

- `GET /admin/settings/allowed_users`
- `POST /admin/settings/allowed_users`
- `DELETE /admin/settings/allowed_users/:email`
- `GET /users` (requires `admin:manage_settings`)
- `PUT /admin/users/:userId/role` (requires `admin:manage_roles`)

## Authenticated example/application features

- Health and status: `GET /ping`, `GET /health`.
- Challenge creation, listing, detail, update, start, end, cancel, leave, and participant administration.
- Challenge question submission and answer retrieval.
- Challenge assignment retrieval.
- Invite creation, listing, acceptance, rejection, public join-token resolution, and authenticated joining.
- Per-challenge chat, message polling, message sending, unread/read-state support, and rate limits.
- Optional chat-image upload, retrieval, cleanup, local/blob storage adapters, and development cleanup endpoints.
- Image upload pipeline: authenticated multipart upload through Multer, file-size limits, Sharp-based decoding/auto-rotation/resizing/WebP conversion, persisted image metadata, thread/user ACL checks, message attachment validation, binary retrieval, and optional showcase display-token access.
- Configurable image feature flag, local path, maximum bytes, maximum dimension, WebP quality, TTL, and cleanup interval.
- Showcase/TV display registration, status, challenge linking, ending, watching, participant chat, pairing/display tokens, and Socket.IO realtime transport.
- In-app notification retrieval and notification event bus/handlers.
- Web Push subscription, unsubscribe, VAPID public-key retrieval, and push notification handling.
- Background cleanup jobs for chat images and showcase sessions.
- S3, Cloudflare R2, and local blob-storage adapters.
- CORS, configurable frontend URL, structured application errors, error codes, and permission errors.

## Image upload and storage endpoints

- `POST /challenges/:id/chats/:type/images` accepts authenticated multipart uploads when chat images are enabled.
- `GET /chat-images/:imageId` returns an image after chat ACL checks, or through the showcase display-token ACL path.
- Development-only endpoints can expire an image or run cleanup manually.
- Expired images are removed from both blob storage and the database by a cleanup job.

## Important image capabilities preserved from the reference frontend

Scaffold scope decision: preserve these as standalone media capabilities. Do not preserve chat, message, participant, showcase, QR, hunt, game, or result-specific image semantics.

The following reference image behaviors are considered important scaffold capabilities, even though the implementation remains Node-specific:

- Generic reusable image endpoints: `POST /api/images`, `POST /api/admin/images`, and `GET /api/images/:image_id`.
- Separate authenticated/admin upload paths for application-managed images.
- Support for QR-spot images and configurable success/failure result images.
- Browser-to-API image upload flow that can accept a JSON data URL when a multipart flow is not appropriate.
- Server-side parsing of image data URLs, base64 decoding, allowed MIME-type validation, and binary signature validation to prevent content/MIME mismatches.
- Support for PNG, JPEG, and WebP input formats.
- Persisted image metadata including ID, source/data URL or storage reference, MIME type, byte size, uploader, and creation timestamp.
- Image references stored on domain records, such as QR spots and game result configuration, instead of duplicating image data across domain tables.
- Image retrieval through stable API URLs based on image IDs.
- Client-side compression/resizing before upload to control mobile payload size and prevent oversized JSON requests.
- A design that can later replace database/data-URL storage with object storage without changing domain-level image references.

The copied Node API now implements the required generic client-error reporting capability.

## Localization and supporting infrastructure

- API translations in `src/locales/en.json`, `es.json`, and `es_AR.json`.
- Locale-aware verification and password-reset emails.
- Crypto helpers, sync/hash utilities, date utilities, and challenge presentation helpers.
- Migration-backed RBAC defaults and admin setup.

## Main source locations

- Routes: `src/infrastructure/routes/index.ts`
- Authentication: `src/application/handlers/AuthHandler.ts`, `src/infrastructure/controllers/AuthController.ts`, `src/domain/services/AuthService.ts`
- Authorization: `src/infrastructure/middleware/authMiddleware.ts`, `permissionMiddleware.ts`, and RBAC repositories/migrations
- Administration: `AdminSettingsController.ts`, `AdminSettingsService.ts`, and `UserController.ts`
- Email: `src/infrastructure/adapters/email/` and `src/infrastructure/emails/`
- Persistence: `src/infrastructure/adapters/repositories/` and `src/infrastructure/migrations/`
- Realtime/showcase: `src/infrastructure/adapters/realtime/`, `ShowcaseController.ts`, and `ShowcaseService.ts`

## Related reference observations

The secondary reference backend is Rust, so it was not copied into this Node scaffold. Its frontend showed additional reusable patterns: profile/settings pages, notifications feed, offline scan queue, and more extensive service-worker behavior. Domain-specific game, scanner, lobby, team, and board experiences remain outside this scaffold.

Implementation note: the secondary reference image path stores encoded image data in the database rather than using the Node blob-storage abstraction. The behavior is important; the final storage mechanism can remain configurable.

## Important observability and client diagnostics capability from the secondary reference

- The frontend creates incident IDs with date/random suffixes, release/version, route, browser, error type, message, stack, request ID, and game/team/flow context.
- User identifiers are anonymized and the browser session identifier is explicitly not an auth token.
- React/render errors, unhandled promise rejections, window errors, network failures, and HTTP 5xx responses are reported to `POST /api/diagnostics/client-errors`.
- A global fetch wrapper adds `X-Request-ID` and correlates client errors with API requests.
- The diagnostics endpoint is intentionally lightweight and best-effort: client reporting must never break the recovery path.
- The API accepts bounded diagnostic fields such as incident ID, kind, release, route, browser, game/team/session/flow context, error name, message, stack, and request ID.
- The API applies a 16 KiB request-body limit and a conservative per-IP diagnostics rate limit.
- The API sanitizes and bounds fields, strips line breaks, anonymizes user identity on the client, and redacts sensitive values such as tokens and passwords before logging.
- The API emits structured `frontend.client_error` server logs through the normal tracing/logging pipeline.
- Request IDs and incident IDs allow an operator to correlate frontend failures with API request logs.
- The secondary reference also has a persisted audit-event stream with filtering and JSON export; that is distinct from client-error diagnostics.
