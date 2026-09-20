# Cross-backend API compatibility contract

This contract is shared by the Node, Go, and Rust API scaffolds. The Vite scaffold is the consumer. Compatibility means the same HTTP methods and paths, payloads, response envelopes/casing, status codes, authorization decisions, and observable side effects; matching route names alone is insufficient.

## Normative behavior

- All backends expose the same health probes: `GET /ping`, `/health`, `/health/live`, `/health/ready`, and `/health/config`.
- All backends expose authenticated `GET|PATCH /users/me/settings`. GET returns `{ success: true, data: { locale, theme } }` with fresh-account defaults `en` and `light`; supported themes are `light`, `dark`, and `system`. PATCH returns `{ success: true, settings: { locale, theme } }` and preserves partial-update and empty-locale clearing behavior.
- All media routes remain registered when `MEDIA_ENABLED=false`, but an authenticated/authorized request returns HTTP `503` and `{ success: false, error: "Media feature is disabled", error_code: "SERVICE_UNAVAILABLE" }`. Auth and permission checks run before the feature check.
- Media retrieval returns `410` for expired assets, `404` for missing assets, `403` for another user's asset, and `200` with the normalized image bytes for an authorized active asset. Cleanup removes expired metadata and blobs.
- A user's notification feed is persisted. A generic welcome notification is created once for each account; creating an `ExampleItem` persists an `example` notification. Push delivery is best-effort after persistence and must not fail the originating operation.
- Missing/unconfigured Google OAuth provider configuration returns `503`; invalid provider credentials return `401`; authenticated-but-forbidden authorization returns `403`. Missing provider configuration is not treated as invalid credentials or an internal `500`.
- Client diagnostics use the same body/field limits and per-IP rate limit, redact credentials and image data URLs before either retention or logging, correlate request and incident IDs, and never recursively report their own submission failures. Admin inspection is bounded in-memory state unless a future contract explicitly changes persistence.
- The `openapi.json` and interactive docs paths are available in each API and describe the common routes. Additive backend-specific probes may be documented, but must not change common route behavior. OpenAPI must merge methods when multiple operations share one path (for example, GET/PATCH preferences and POST/DELETE push subscription).

## Intentional implementation differences

- Password hashing is backend-local (bcrypt in Node/Go, Argon2 in Rust). Hashes, databases, and JWT secrets are not portable between installations; only the HTTP contract is interchangeable.
- Storage, database, and DI implementations follow each language scaffold's architecture. Local SQLite/filesystem is the validation baseline; remote Turso/S3-compatible services are not part of local parity validation.
- Framework-default behavior for undeclared HTTP methods (for example, 404 vs 405) is not part of the declared method/path contract.

## Verification rule

Run the same contract suite and the shared Vite interoperability E2E against each API using isolated local SQLite and media directories. The suite must cover success, unauthenticated, forbidden, invalid input, provider unavailable, media disabled, expired/missing media, notification persistence, and diagnostics redaction. Route-surface checks and screenshot/UI checks supplement but do not replace behavioral contract tests.
