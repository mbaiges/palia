# Loop state: scaffolding-extraction

Updated: 2026-09-20
Iteration: 19 — cross-backend API contract unification
Status: COMPLETE
Canonical owner: API repository
Scope: coordinated API and frontend scaffolds

Chat is intentionally out of scope. Standalone reference-style image/media upload, retrieval, preview, storage, ACL, expiry, and cleanup are preserved without chat-image endpoints or chat terminology.

## Contract

The cross-backend HTTP and observable-side-effect contract is additionally defined in [API-COMPATIBILITY.md](../../API-COMPATIBILITY.md). Iteration 19 must close its differences across Node, Go, and Rust; language-specific internals (including password hashing) remain intentionally different.

Every item below is checked only after implementation, tests, build validation, and UI screenshot review where applicable. `FEATURE_INVENTORY.md`, `functional-spec.md`, and `technical-spec.md` remain the source inventories/specifications; `AGENTS.md`, `docs/ARCHITECTURE.md`, and `docs/VALIDATION-REPORT.md` explain how to preserve them.

## Verification evidence

- API: `npm run build` passed; `npm test -- --runInBand` passed with 39 suites and 319 tests.
- Frontend: `npm run build` passed; `npm test -- --run` passed with 32 files and 190 tests.
- Frontend extraction E2E: 20/20 passed across mobile and desktop, including profile/preferences and generic realtime event demonstrations.
- Smoke/load: `npm run smoke:load` passed against a running API with 25 requests at concurrency 5 (`p50=6ms`, `p95=29ms`, `max=67ms`).
- Screenshots: 30 current mobile/desktop screenshots were regenerated and visually reviewed; notification, media, admin, locale/theme, profile, example, realtime, diagnostics, and all auth captures showed no clipping, overlap, source branding, or broken responsive state.

## Iteration 17 scope

- Persist the generic in-app notification feed instead of returning a stubbed empty array.
- Add a reusable frontend cache-first resource hook with stale/background refresh and a bounded retry helper.
- Add a reusable durable offline mutation queue with bounded attempts and idempotency-key handoff.
- Preserve accessible loading, empty, error, list, and live-update states in the generic notification example.
- Keep existing Axios GET deduplication; do not introduce a second request-cache implementation.
- Keep source-specific scanner, QR, hunt, lobby, team, leaderboard, location, and scoring behavior out of scope.

## Iteration 18 scope

- Preserve the existing configured admin email exactly as requested; do not alter `src/config.yml` or the admin-assignment migration.
- Replace the stale “grading/re-grading” wording with generic role-update wording.
- Complete Spanish and Argentine Spanish notification translations.
- Add generic authenticated profile/preferences UI using existing user settings persistence.
- Report service-worker errors and unhandled rejections through the existing diagnostics endpoint.
- Demonstrate authenticated realtime client/server events in the frontend.
- Make media expired/not-found states visible and testable in the frontend.
- Add standalone API smoke/load validation separate from UI E2E.

## Preservation checklist

### API — authentication and account lifecycle

- [x] API-A01 email/password sign-up; [x] API-A02 email verification; [x] API-A03 resend verification; [x] API-A04 email sign-in; [x] API-A05 Google OAuth; [x] API-A06 explicit development bypass; [x] API-A07 JWT creation/verification; [x] API-A08 token refresh; [x] API-A09 sign-out; [x] API-A10 current user; [x] API-A11 non-enumerating reset request; [x] API-A12 expiring reset completion; [x] API-A13 bcrypt; [x] API-A14 console email; [x] API-A15 Resend email; [x] API-A16 localized emails; [x] API-A17 required/optional auth middleware.

### API — authorization, administration, settings, and infrastructure

- [x] API-B01 roles/permissions persistence; [x] API-B02 permission middleware; [x] API-B03 allowed users; [x] API-B04 paginated user search; [x] API-B05 role updates; [x] API-B06 safe user management; [x] API-B07 user settings; [x] API-B08 locale persistence; [x] API-B09 admin failure/unauthorized behavior.
- [x] API-C01 health/ping; [x] API-C02 protected example read; [x] API-C03 protected example write; [x] API-C04 admin example management; [x] API-C05 generic notification feed; [x] API-C06 push subscribe/unsubscribe/VAPID; [x] API-C07 generic cleanup-job pattern; [x] API-C08 authenticated realtime seam; [x] API-C09 SQLite/Knex; [x] API-C10 libSQL/Turso; [x] API-C11 migrations/seed setup; [x] API-C12 CORS/URLs/logging/errors; [x] API-C13 sensitive-endpoint rate limits; [x] API-C14 Docker/deployment/env examples.

### API — images and media

- [x] API-D01 protected image upload; [x] API-D02 admin upload; [x] API-D03 multipart; [x] API-D04 compressed data URL; [x] API-D05 PNG/JPEG/WebP; [x] API-D06 MIME/signature checks; [x] API-D07 Sharp decode/orientation/resize/WebP; [x] API-D08 byte/dimension limits; [x] API-D09 stable IDs/retrieval; [x] API-D10 separate metadata; [x] API-D11 local storage; [x] API-D12 S3-compatible; [x] API-D13 R2-compatible; [x] API-D14 ACL; [x] API-D15 expiry/blob cleanup; [x] API-D16 generic media references.

### API — diagnostics, audit, observability

- [x] API-E01 unauthenticated client-error ingestion; [x] API-E02 bounded fields/body; [x] API-E03 per-IP rate limit; [x] API-E04 sanitization; [x] API-E05 redaction; [x] API-E06 structured `frontend.client_error`; [x] API-E07 request/incident correlation; [x] API-E08 persisted audit events; [x] API-E09 admin filtering/export.

### Frontend — shell, auth, permissions, admin, responsive UI

- [x] FRONT-A01 React/TypeScript/Vite shell; [x] FRONT-A02 auth bootstrap; [x] FRONT-A03 email sign-in; [x] FRONT-A04 sign-up; [x] FRONT-A05 verification/resend; [x] FRONT-A06 forgot password; [x] FRONT-A07 reset password; [x] FRONT-A08 Google sign-in; [x] FRONT-A09 dev bypass; [x] FRONT-A10 token persistence/refresh/sign-out; [x] FRONT-A11 permission helpers; [x] FRONT-A12 protected routes; [x] FRONT-A13 admin routes; [x] FRONT-A14 unauthorized/not-found; [x] FRONT-A15 admin settings/allowed users; [x] FRONT-A16 user search/pagination; [x] FRONT-A17 role updates; [x] FRONT-A18 generic dashboard/example; [x] FRONT-A19 mobile layouts; [x] FRONT-A20 desktop layouts; [x] FRONT-A21 responsive/accessibility foundations.

### Frontend — i18n, themes, tokens, PWA, notifications, realtime

- [x] FRONT-B01 i18next integration; [x] FRONT-B02 English; [x] FRONT-B03 Spanish; [x] FRONT-B04 Argentine Spanish; [x] FRONT-B05 browser detection; [x] FRONT-B06 authenticated locale sync; [x] FRONT-B07 theme provider; [x] FRONT-B08 toggle/persistence; [x] FRONT-B09 centralized tokens/typings; [x] FRONT-B10 responsive behavior; [x] FRONT-B11 PWA/service worker; [x] FRONT-B12 in-app notifications; [x] FRONT-B13 push controls; [x] FRONT-B14 generic realtime/reconnect; [x] FRONT-B15 audit filtering/export.

### Frontend — images/media and client diagnostics

- [x] FRONT-C01 protected image UI; [x] FRONT-C02 admin image boundary; [x] FRONT-C03 type validation/errors; [x] FRONT-C04 preview/object URL cleanup; [x] FRONT-C05 multipart; [x] FRONT-C06 compressed data URL; [x] FRONT-C07 decode/dimension validation; [x] FRONT-C08 canvas resize/JPEG conversion; [x] FRONT-C09 mobile byte-budget reduction; [x] FRONT-C10 stable retrieval/display URLs; [x] FRONT-C11 expired/not-found/lightbox-ready states; [x] FRONT-C12 generic media example.
- [x] FRONT-D01 fetch instrumentation; [x] FRONT-D02 automatic request IDs; [x] FRONT-D03 network reporting; [x] FRONT-D04 HTTP 5xx reporting; [x] FRONT-D05 window errors; [x] FRONT-D06 unhandled rejections; [x] FRONT-D07 React boundary; [x] FRONT-D08 incident/release/route/browser context; [x] FRONT-D09 anonymized session context; [x] FRONT-D10 visible incident details; [x] FRONT-D11 non-recursive best-effort submission.

### Iteration 17 additions

- [x] API-C15 persisted generic notification repository, migration, and first-feed demonstration.
- [x] FRONT-B16 cache-first resource hook with stale/background refresh and deduplicated pending loads.
- [x] FRONT-B17 bounded retry helper for transient/network failures.
- [x] FRONT-B18 notification page uses the persisted API feed and retry/cache primitives.
- [x] FRONT-B19 generic admin media listing uses the admin endpoint.
- [x] FRONT-B20 durable offline mutation queue seam with bounded attempts and idempotency-key handoff.
- [x] FRONT-B21 full unit, build, E2E, screenshot, full-suite, and source-neutrality verification for this iteration.

### Iteration 18 additions

- [x] API-F01 generic profile/preferences persistence remains available for the profile surface.
- [x] FRONT-F01 profile and preferences route, navigation, locale/theme/push controls.
- [x] FRONT-F02 service-worker error and unhandled-rejection diagnostics.
- [x] API-F03 authenticated generic realtime event contract and container/build verification.
- [x] FRONT-F04 realtime client/server event demonstration and tests.
- [x] FRONT-F05 visible media expired/not-found states, preview cleanup, and tests.
- [x] API-F06 smoke/load script and documented execution path.
- [x] FRONT-F07 translations, unit tests, builds, E2E, screenshots, and final verification.

### Removal and replacement checks

- [x] REMOVE-01 source-specific challenge/invite/chat/display behavior removed; [x] REMOVE-02 source-specific hunt/QR/lobby/team/location behavior removed; [x] REMOVE-03 source migrations/seeds removed or replaced; [x] REMOVE-04 source branding/copy/translations removed; [x] REMOVE-05 source route/API terminology removed; [x] REMOVE-06 generic replacement boundaries documented; [x] REMOVE-07 `.agentic/`, skills, setup docs, and ignore rules preserved in both repositories.

## Screenshot review notes

- Current manifest: 30 screenshots in `front-vite-scaffolding-auth/e2e/artifacts/screenshots/scaffolding-extraction/`, covering mobile and desktop.
- Notification feed shows the persisted generic notification and push-blocked state without layout issues.
- Auth captures show sign-in, reset request, and reset completion journeys at both breakpoints.
- Admin, locale/theme, profile/preferences, realtime, media, diagnostics, and generic-example captures show responsive layouts with no clipping or source-specific terminology.
- Media captures show upload and retrieval examples; expired/not-found states are implemented as visible recoverable alerts when metadata or retrieval reports failure.

## Iteration closeout

Iteration 18 implementation and verification are complete. Iteration 19 completed the Node/Go/Rust API contract unification against the shared Vite client. Source-specific scanner, QR, hunt, lobby, team, leaderboard, location, scoring, and chat-image functionality remain intentionally excluded.

## Iteration 19 — cross-backend API contract unification

- [x] API-INTEROP-01 common OpenAPI operation set and authorization classifications match across Node, Go, and Rust (47 documented operations).
- [x] API-INTEROP-02 all 31 common protected operations reject anonymous requests with HTTP 401 on every backend.
- [x] API-INTEROP-03 all 11 common admin operations reject authenticated non-admin requests with HTTP 403 on every backend.
- [x] API-INTEROP-04 common health, settings defaults/envelopes, OAuth-unconfigured behavior, and snake_case wire payloads align.
- [x] API-INTEROP-05 notifications persist consistently, including generic welcome and example-created events.
- [x] API-INTEROP-06 media upload/retrieval, authorization, expiry/not-found behavior, and media-disabled auth-first behavior align.
- [x] API-INTEROP-07 client diagnostics redact credentials and image data URLs consistently; example audit and realtime flows are exercised.
- [x] API-INTEROP-08 shared Vite interoperability E2E passes against Node, Go, and Rust on mobile and desktop (6 runs).
- [x] API-INTEROP-09 final UI screenshots reviewed for 9 feature screens × 2 breakpoints × 3 APIs (54 screenshots); no layout breakage observed. The black media previews are the expected tiny test PNG assets, not failed retrievals; API tests also assert normalized bytes and content type.
- [x] API-INTEROP-10 common media-disabled contract suite passes for all three APIs.
- [x] API-INTEROP-11 API/frontend full tests, build/lint, and repository diff whitespace checks pass.

### Iteration 19 verification evidence

- Node API: `npm run build` and `npm test -- --runInBand` passed (42 suites, 330 tests).
- Go API: `go test ./...` passed.
- Rust API: `cargo test -p api` passed (unit and integration suites).
- Frontend: `npm test` passed (34 files, 192 tests); `npm run lint` and `npm run build` passed.
- Shared API contract: 47 operations matched; 31 protected-route anonymous checks and 11 admin forbidden checks passed across all three APIs.
- Shared Vite Playwright E2E: Node, Go, and Rust each passed mobile and desktop projects.
- Media-disabled contract: auth-first 401/403 and matching authenticated 503 response passed across all three APIs.
- `git diff --check` passed in all four repositories. Git printed only line-ending normalization warnings.
- All validation used local SQLite and local media storage; no Turso or remote storage was used.

Iteration 19 is complete. The canonical loop is COMPLETE; no planned parity iteration remains. Remaining differences are implementation-specific (language/framework, password hashing, persistence/DI internals), not a Vite HTTP-contract incompatibility.
