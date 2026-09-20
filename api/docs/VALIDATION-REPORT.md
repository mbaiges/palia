# Scaffold validation report

This report is the maintenance contract for the API scaffold. It records the reusable platform capabilities and the domain-specific surface intentionally removed.

## Preserved capabilities

- Authentication: Google OAuth, development bypass, email sign-up, verification-code sign-in, resend verification, password reset request/completion, current-user session, sign-out, JWT/token handling, protected routes, and Google access-token upgrade/refresh.
- Authorization and administration: roles, permissions, permission middleware, allowed-user administration, role changes, settings, admin guards, and audit-event filtering/export.
- Generic protected example: CRUD-style authenticated example items with ownership checks and an audit event.
- Media: generic image assets, multipart and compressed data-URL upload paths, Sharp validation/metadata/normalization, local/S3-compatible blob storage, signed access, ownership checks, expiry metadata, cleanup configuration, and test coverage.
- Diagnostics and observability: request IDs, structured response/request logs, client-error ingestion, incident IDs, redaction, rate limiting, and server-side logging of frontend failures.
- Operational validation: standalone `/api/health` smoke/load runner via `npm run smoke:load`, configurable with `SMOKE_BASE_URL`, `SMOKE_REQUESTS`, and `SMOKE_CONCURRENCY`.
- Notifications: persisted generic in-app notification feed with a replaceable repository/event seam, push subscription/unsubscription, VAPID configuration, locale-aware user settings, and frontend push controls.
- Realtime: Socket.IO adapter, generic connection surface, reconnect behavior, and a domain-neutral gateway seam.
- Platform foundations: SQLite/libSQL, migrations, dependency injection, repository/service/controller layering, CORS/LAN development support, email adapters/templates, i18n, Docker configuration, health/ping routes, and environment-driven configuration.

## Removed intentionally

Challenges, chat and chat images, invites, showcase/TV flows, assignments, question answers, source-specific cleanup jobs, source-specific migrations, and source-specific notification event payloads. Chat is explicitly out of scope; standalone media is the preserved image capability.

## Verification gate

Run from this repository:

```text
npm run build
npm test
```

The frontend extraction E2E suite in the sibling frontend repository must also pass before a scaffold change is accepted. Keep `AGENTS.md`, `docs/ARCHITECTURE.md`, this report, and the canonical API `docs/features/scaffolding-extraction/loop-state.md` synchronized when changing a preserved capability.
