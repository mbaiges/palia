# Loop state: local-backend-switch

Updated: 2026-09-22
Iteration: 3
Status: COMPLETE

## Source of truth

- Functional spec: `docs/features/local-backend-switch/functional-spec.md`
- Technical spec: `docs/features/local-backend-switch/technical-spec.md`
- Checklist: `docs/features/local-backend-switch/implementation-checklist.md`
- Turso validation remains out of scope.

## Locked decisions

- Local mode is available in DEV, E2E and staging, never production.
- Local always starts as a fixed admin demo identity.
- Local persistence uses IndexedDB through `IndexedDBApiRepository`.
- The canonical seed is shared from root `seed/`, outside `api/` and `front/`.
- API seed uses stable-ID upsert by default; destructive reset is local/test-only.
- Pending outbox items must be synchronized or explicitly discarded before switching backend.
- There is no automatic API ↔ Local synchronization.

## Iteration 1 — discovery and implementation

- Existing `ApiRepository` and `DefaultHttpApiRepository` are in `front/src/services/repositories/`.
- Existing `dbService` and offline queue are injectable but the container currently exposes one static repository.
- Existing API uses SQLite migrations and has all domain tables needed by the seed.
- Existing loop-build screenshot artifacts live under `e2e/artifacts/`; this feature uses `e2e/artifacts/screenshots/local-backend-switch/`.
- Implemented the shared seed, API runner, IndexedDB adapter, runtime composition root, provider-specific offline stores, Settings controls, outbox guard and mobile/desktop E2E journey.
- Added persisted backend preference, deep shared-seed validation, safe reset policy for API seeds, recent seed dates for rolling metrics, reload coverage and resilient mobile scroll verification.

## Screenshot manifest

| File | Journey | Viewport | Review |
|---|---|---|---|
| `01-settings-api.png` | API backend active | desktop preview | reviewed: clear API status, settings controls and profile form |
| `02-settings-local.png` | Local backend active/admin demo | desktop preview | reviewed: Local (IndexedDB) badge, demo identity, seed action |
| `03-local-seed-dashboard.png` | Local seeded dashboard | desktop preview | reviewed: seeded patients, two active alerts and follow-up rows |
| `04-local-patient-detail.png` | Local patient detail | desktop preview | reviewed: caregiver, alert history and follow-up details |
| `05-local-mobile-settings.png` | Mobile backend controls | 360×800 | reviewed: no horizontal overflow, readable cards, fixed bottom nav |
| `06-desktop-switch.png` | Desktop backend switch | 1280×800 | reviewed: full settings layout and backend indicator |

## Last verification

- Feature unit tests: `front npm run test:unit` — 23 passing.
- Full root test: API 359 tests and frontend 23 tests — all passing.
- Feature E2E: `npm run test:e2e:local-backend-switch` — 1 passing, including reload persistence.
- Full E2E: `npm run test:e2e` — passing, including mobile smoke tests.
- Builds: `front npm run build`, `api npm run build` — passing.
- Lint: frontend `oxlint` and API `eslint` both pass without warnings.
- Seed runner: local SQLite `seed:medice -- --reset` — applied successfully; reset policy unit tests pass.
- `git diff --check` — no whitespace errors.
- Screenshot review: all six manifest images opened and visually checked for content, responsive layout and backend labels.

## Next iteration focus

COMPLETE. No implementation work remains in this feature scope. Turso provisioning and validation remain intentionally external.
