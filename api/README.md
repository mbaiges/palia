# API application scaffold

Reusable Node.js/TypeScript API foundation for applications that need authentication, authorization, media, notifications, observability, and a small replaceable example domain.

## Included features

- Email/password sign-up, verification, sign-in, resend verification, password reset, sign-out, current-user, JWT refresh, Google OAuth, and development bypass.
- RBAC with roles, permissions, allow-listed users, admin settings, user search, role management, and protected routes.
- Generic authenticated example CRUD with ownership checks and audit events.
- Persisted notification feed, Web Push subscriptions, VAPID public-key delivery, and cleanup-job seams.
- Authenticated Socket.IO realtime namespace with connection lifecycle, reconnect support, `CLIENT_EVENT` and `SERVER_EVENT` examples.
- Standalone media assets: authenticated/admin uploads, multipart and compressed data-URL input, PNG/JPEG/WebP validation, Sharp normalization, stable IDs, ACL, expiry, cleanup, and local/S3-compatible/R2 storage.
- Client diagnostics ingestion with request/incident correlation, bounded fields, rate limiting, sanitization, redaction, and structured logs.
- Persisted audit events with admin filtering and JSON export.
- SQLite/Knex for local development and libSQL/Turso-compatible persistence.
- Localized email/API messages, CORS, rate limits, Docker/deployment configuration, and safe structured errors.

## Architecture

The code follows a pragmatic hexagonal structure:

- `src/domain`: models, errors, repository contracts, services, and business rules.
- `src/application`: handlers and use-case orchestration.
- `src/infrastructure`: Express routes/controllers, persistence, storage, email, jobs, realtime, and configuration.
- `src/infrastructure/config/container.ts`: dependency-injection composition root.

Keep provider integrations behind interfaces, keep HTTP mapping in controllers, business rules in services, and persistence in repositories. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [FEATURE_INVENTORY.md](FEATURE_INVENTORY.md), and [docs/VALIDATION-REPORT.md](docs/VALIDATION-REPORT.md).

## Local development

```bash
npm install
copy env.example .env
npm run dev
```

The development server runs on `http://localhost:3000`. Health endpoints are available at `/api/health` and `/api/ping`. `npm run dev` uses a local SQLite database by default; configure Turso/libSQL or an S3-compatible provider through environment variables when needed.

Never commit `.env`, database files, media blobs, or secrets. The configured administrative allow-list is deployment configuration and should be reviewed before using this scaffold for a new application.

## Validation commands

```bash
npm run build
npm test
npm run lint
npm run format:check
npm run smoke:load
```

`smoke:load` is intentionally separate from browser E2E. Configure it with `SMOKE_BASE_URL`, `SMOKE_REQUESTS`, and `SMOKE_CONCURRENCY`.

## Scope boundaries

The example domain is deliberately small and replaceable. Domain-specific chat, challenge, invite, game, scanner, display, and image semantics are not part of this scaffold. Standalone media remains supported without coupling it to a domain workflow.

Preservation rules live in [AGENTS.md](AGENTS.md) and the canonical loop state at [docs/features/scaffolding-extraction/loop-state.md](docs/features/scaffolding-extraction/loop-state.md).

## Medice application

This repository uses the scaffold runtime for the Medice application. Its domain routes are defined in `src/infrastructure/routes/index.ts`; schema migrations are in `src/infrastructure/migrations/`; `src/infrastructure/controllers/MediceController.ts` currently implements the Medice HTTP and persistence flows. Browser sessions use HttpOnly cookies and CSRF protection. The React client is served by Vite in development and by the combined root Docker image in a single-origin deployment.

For this repository, email/password authentication remains disabled, Google identities must pass the configured allow-list, and `INITIAL_ADMIN_EMAILS` provides bootstrap admin access. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `JWT_SECRET`, `ENCRYPTION_KEY`, and the environment-specific origin in the API process. Do not place API secrets in frontend environment variables. Local tests force SQLite and use disposable/test database files; Turso configuration is intentionally not covered by the local validation workflow.

From the monorepo root, use `npm run api:dev`, `npm run api:build`, and `npm run api:test`. The end-to-end suite is `npm run test:e2e:api-front-separation` and exercises the local API plus frontend together.
