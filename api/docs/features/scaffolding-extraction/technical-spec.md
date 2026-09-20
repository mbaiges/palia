# Technical Spec: Generic App Scaffolding Extraction

| Field | Value |
|-------|-------|
| Status | Draft — depends on functional-spec review |
| Author | Codex |
| Created | 2026-09-18 |
| Updated | 2026-09-18 |
| Product spec | [functional-spec.md](./functional-spec.md) |
| Related | API and frontend `FEATURE_INVENTORY.md`; reference media and diagnostics implementations |

The coordinated implementation loop is tracked in [loop-state.md](./loop-state.md). It is the required preservation checklist for both repositories and must be updated at the end of every implementation iteration.

Cross-backend observable behavior is normative in [API-COMPATIBILITY.md](../../API-COMPATIBILITY.md). Language-specific architecture remains distinct; contract tests must compare all three running APIs rather than infer parity from route lists.

## Summary

Refactor the copied API/frontend into two coordinated repositories that keep mature cross-cutting infrastructure and replace source-app domain code with a small generic example module.

**Complexity:** High. This is a broad extraction/refactoring effort touching routes, dependency injection, migrations, persistence, frontend routing, tests, PWA/push, media, diagnostics, and deployment configuration.

**Infrastructure (v1, currently recommended):** Keep one Node/Express API and one React/Vite frontend; keep SQLite/local development plus libSQL/Turso and S3-compatible/R2 adapters; do not add Redis or a new service in v1; use feature flags for external Google, push, realtime, and production media integrations while keeping every capability demonstrable locally.

## Engineering principles

| Principle | Application |
|-----------|-------------|
| Server authority | Auth, permission, media ACL, token validity, and admin mutations are decided by the API. |
| Capability over domain | Keep interfaces and behavior; rename/replace Challenge/Chat/Showcase/Hunt concepts with generic modules. |
| Ports and adapters | Preserve repository interfaces for auth, mail, media, notifications, tokens, and persistence. |
| Safe defaults | Local providers work out of the box; production providers require explicit environment configuration. |
| Fail closed | Missing auth, invalid permissions, invalid media, and invalid diagnostics are rejected or safely bounded. |
| No secret leakage | Never include passwords, tokens, private keys, or raw secrets in diagnostics, specs, fixtures, or logs. |
| Replaceable example domain | Example model/service/controller/frontend code is isolated and clearly marked for replacement. |

## Architecture

```text
Frontend shell
  ├─ Auth provider + token client + protected routes
  ├─ i18n + theme/tokens + layout
  ├─ Admin screens + permission context
  ├─ Generic example screens
  ├─ Media upload/preview/retrieval components
  ├─ Notifications + push/PWA
  ├─ Client diagnostics + request correlation
  └─ Generic realtime client
          │ HTTPS / WebSocket
API
  ├─ Auth and email lifecycle
  ├─ RBAC/admin/settings
  ├─ Generic example module
  ├─ Media module and storage port
  ├─ Notifications/push/event bus
  ├─ Client diagnostics + redaction/rate limiting
  ├─ Generic realtime gateway (local demo required; production integration configurable)
  ├─ Database/migrations/jobs
  └─ Local/S3/R2/email adapters
```

## Auth & authorization

Keep and test the existing auth contracts:

- Google sign-in.
- Development bypass behind an explicit flag.
- Email sign-up, verification, resend, sign-in, forgot-password, reset-password.
- JWT verification, refresh, sign-out, and current-user.
- Bcrypt password hashing and expiring verification/reset records.
- Local console email and production Resend adapter.
- Auth middleware with required/optional modes.
- Roles, permissions, user-role and role-permission persistence.
- Admin settings, allowed users, user search, and role updates.
- Per-user settings/locale update.

Frontend must retain auth bootstrapping, token/permission storage, refresh behavior, sign-out cleanup, protected route handling, admin route handling, and error/unauthorized states.

## HTTP API

The final routes should be renamed to generic scaffold names, while preserving behavior and test coverage:

| Area | Required surface |
|------|------------------|
| Health | `/ping`, `/health` |
| Auth | Existing `/auth/*` lifecycle endpoints, including Google, dev bypass, email verification, reset, refresh, sign-out, and `/auth/me` |
| User/settings | `/users/me/settings`, authenticated user lookup, and admin-protected user search/role management |
| Admin | Allowed-user management and generic example administration |
| Example domain | Minimal authenticated read/write endpoint, with optional admin mutation/list endpoint |
| Media | Generic upload/retrieve endpoints plus protected example usage; support multipart/blob and compressed JSON/data-url modes |
| Diagnostics | `POST /diagnostics/client-errors` with bounded payloads, request/incident correlation, rate limiting, sanitization, redaction, and structured logs |
| Notifications | Generic authenticated notification feed and push subscription/VAPID endpoints |
| Realtime | Generic authenticated event/channel example with reconnect and failure handling |

Do not preserve source-specific route names such as `/challenges`, `/showcase`, `/invites`, or `/chat` in the scaffold-facing API.

## Media architecture

Use a generic `MediaAsset` port and keep two input adapters:

1. **Multipart/blob path** — a standalone generic media path; suitable for larger images, protected retrieval, object storage, TTL, and cleanup.
2. **Compressed JSON/data-url path** — derived from a reference implementation; suitable for small admin/mobile images where client-side compression keeps JSON under the body limit.

Shared behavior:

- Validate supported image formats and actual binary signatures.
- Normalize dimensions/orientation and enforce configurable byte/dimension limits.
- Store metadata separately from domain records.
- Return stable media IDs and API URLs.
- Enforce uploader/admin/domain ACLs on the server.
- Use local storage for development and S3/R2-compatible storage for production-oriented deployments.
- Support cleanup of expired/unused assets where TTL is enabled.
- Keep frontend previews as temporary object URLs and revoke them deterministically.

The database should reference media IDs from generic example records rather than embedding image data in domain tables. The reference database/data-URL behavior is a supported compatibility pattern, not a reason to couple the scaffold to database blobs permanently. Chat threads, chat messages, and chat-image attachment semantics are explicitly excluded.

## Client diagnostics and logging

Frontend:

- Install one diagnostics module at app bootstrap.
- Wrap `fetch` to add `X-Request-ID`, observe network errors and 5xx responses, and avoid recursive reporting for the diagnostics endpoint.
- Listen for window errors and unhandled rejections.
- Expose `reportClientError`, context setters, incident formatting, and an error-boundary integration.
- Include release, route, browser, kind, error name/message/stack, request ID, and bounded app context.
- Anonymize user identifiers and use a non-authenticated ephemeral session ID.
- Keep reporting best-effort and show a recoverable incident ID/details to the user.

API:

- Add a public but rate-limited diagnostics route, because failures may occur before auth is available.
- Apply a 16 KiB default body limit or equivalent configurable bound.
- Deserialize only known fields, strip line breaks, bound lengths, and reject malformed payloads safely.
- Redact tokens, passwords, and other sensitive patterns before logging.
- Emit structured `frontend.client_error` logs with incident/request correlation.
- Keep normal request tracing/logging compatible with the diagnostic request ID.

## Realtime

Replace Socket.IO showcase events with a generic authenticated example channel. Preserve connection lifecycle, authorization, reconnect handling, error handling, and at least one client-to-server/server-to-client event. The capability must be demonstrable locally even if production realtime configuration is disabled.

## Data model

Keep core tables/entities for:

- users and auth accounts;
- email verification and password-reset tokens;
- roles, permissions, user-role and role-permission links;
- allowed users;
- user settings/locale;
- generic notifications and push subscriptions;
- media assets and optional expiration/ownership metadata;
- client diagnostic logs; structured server logs are required, and an admin-readable recent-diagnostics view may use a bounded local store for the demo;
- a minimal `example_items` or equivalent table used only to demonstrate protected CRUD and media references.

Remove or replace challenge, participant, assignment, chat-thread/message, invite, showcase-session, hunt, QR, lobby, and source-specific game tables.

## Frontend

Keep the application shell and replace feature modules as follows:

| Current/source module | Scaffold treatment |
|-----------------------|--------------------|
| `auth` | Keep and remove product copy/branding. |
| `admin` | Keep RBAC/settings/user management; add generic example/media admin screen. |
| `notifications` | Keep generic feed/push behavior. |
| `home` | Convert to generic authenticated dashboard. |
| `challenges`, `join`, `showcase` | Replace with generic example, media, and realtime demos. |
| `chat` portions | Remove chat semantics but reuse image preview/blob/lightbox primitives where appropriate. |
| `unauthorized`, `notFound` | Keep. |
| theme/i18n/shared shell | Keep; replace source strings and tokens where branded. |
| PWA/service worker | Keep and remove source-specific caching/routes. |

Use English, Spanish, and Argentine Spanish as supported scaffold locales, but replace source-product nouns with generic translations.
Implement mobile-first responsive behavior with deliberate desktop layouts rather than relying only on accidental wrapping. Verify phone and desktop viewports for auth, dashboard/example, admin, media, notifications, diagnostics, and error states. Keep touch targets, mobile file selection/previews, compact navigation, desktop navigation, responsive tables/cards, and accessible keyboard behavior as scaffold primitives.

## Security checklist

- [ ] Passwords are hashed and never logged.
- [ ] JWT signing/refresh/sign-out behavior is preserved and tested.
- [ ] Verification/reset tokens expire, are single-use where intended, and are never logged.
- [ ] All admin mutations enforce server-side permissions.
- [ ] Media upload validates type, signature, byte size, dimensions, and storage failures.
- [ ] Media retrieval enforces ownership/domain/admin ACLs.
- [ ] Local and production storage credentials are environment-only.
- [ ] Client diagnostics are bounded, rate-limited, redacted, and safe before authentication.
- [ ] Diagnostics do not recursively report themselves.
- [ ] CORS, cookie/header/token behavior, and request IDs remain explicit.

## Deployment and environment

Preserve Docker/nginx/API deployment patterns and `env.example`, but rename source-specific variables. Group configuration into:

- API/database/runtime.
- Auth/JWT/Google.
- Email provider.
- Local/S3/R2 media storage.
- Media limits/TTL/cleanup.
- Diagnostics rate/body limits and release metadata.
- Push/PWA.
- Optional realtime.

No real secrets belong in either repository.

## Testing

| Layer | Scope |
|-------|-------|
| Domain/unit | Auth lifecycle, RBAC/permission rules, media validation/metadata, diagnostics redaction/bounds, example service. |
| API/controller | Every auth/admin/media/example/notification/diagnostics contract and failure path. |
| Frontend unit | Auth provider/service, protected routes, permissions, i18n/locale sync, theme/tokens, media compression/preview/blob handling, diagnostics module, error boundary. |
| Integration | Local database migrations, local email, local media storage, cleanup jobs, object-storage adapter contract. |
| Feature E2E | Sign-up/sign-in/reset, admin management, protected example CRUD, image upload/retrieval, diagnostics capture, locale/theme, notification/PWA, realtime, and audit events at both mobile and desktop viewports. |
| Regression | Ensure no source-product terminology or source-specific routes remain in scaffold-facing behavior. |

## Implementation phases

| Phase | Deliverable |
|-------|-------------|
| 0 | Freeze copied baseline; record current tests/build behavior; create a branch or safe working state. |
| 1 | Extract and rename core API auth/RBAC/settings/email modules; remove source branding from configuration and translations. |
| 2 | Replace source domain persistence/routes/services with minimal generic example model and protected CRUD. |
| 3 | Generalize media layer, preserving multipart/blob and compressed data-url behaviors, local/S3/R2 adapters, ACLs, limits, TTL, and cleanup. |
| 4 | Port client diagnostics end-to-end with request correlation, redaction, rate limiting, structured API logs, and error-boundary UX. |
| 5 | Replace frontend source features with generic responsive mobile/desktop dashboard/example/admin/media screens while preserving auth/admin/i18n/theme/tokens/PWA/notifications. |
| 6 | Add generic notification, push/PWA, audit-event, and realtime demonstrations; remove source-specific sockets/jobs/routes. |
| 7 | Update migrations, env examples, Docker/nginx, docs, `.agentic` setup references, and repository names/metadata. |
| 8 | Run unit/integration/feature E2E suites, scan for source-specific terms, visually verify key frontend journeys, and produce a preservation checklist. |

## Acceptance mapping

- Functional AC 1–2 → Phase 1; auth unit/API/E2E suites.
- Functional AC 3–5 → Phases 1, 2, and 5; permission, admin, locale, theme, and route tests.
- Functional AC 6 → Phase 2; generic example API/frontend/E2E tests.
- Functional AC 7–8 → Phase 3; media validation, storage, ACL, preview, upload/retrieval, and cleanup tests.
- Functional AC 9 → Phase 4; diagnostics client/API/redaction/rate-limit/log-correlation tests.
- Functional AC 10 → Phases 5–6; notification/PWA/realtime/audit tests.
- Functional AC 11–12 → Phase 8; complete verification and source-term scan.
- Functional AC 14–16 → cross-backend parity iteration: media feature-off/expiry, notifications and push side effects, OAuth unavailable statuses, diagnostic redaction, common health/settings/docs routes, differential API tests, and shared frontend E2E for each backend.

## Out of scope (technical)

- Destructive deletion of the original reference repositories.
- Git commit/push until the user explicitly approves the implementation result.
- New infrastructure services such as Redis, Kafka, or hosted error tracking in v1.
- Automatic generator/CLI packaging.

## Open items

- Confirm the generic example resource name and whether it needs CRUD or only read/write demonstration.
- Confirm default Google/push/production-object-storage provider behavior; the capabilities remain required and must work with local/mock providers.
- Confirm whether recent diagnostics are shown in the admin UI in addition to structured server logs.
- Confirm whether the canonical specs should be duplicated into the frontend repository or linked from this cross-repo planning document.
