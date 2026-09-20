# API scaffold working agreement

This repository is the canonical backend scaffold and owns the preservation loop at `docs/features/scaffolding-extraction/loop-state.md`.

## Purpose and preserved capabilities

Keep the reusable foundations from the reference applications: email/password and Google authentication, verification and password reset, JWT refresh/sign-out, optional development bypass, RBAC and admin settings, user search and role management, locale persistence, a replaceable authenticated example domain, notifications and Web Push, authenticated Socket.IO realtime, standalone image/media upload and retrieval, local/S3/R2 storage, expiry cleanup, client diagnostics, request/incident correlation, structured logging, persisted audit events, SQLite/Knex and libSQL/Turso persistence, migrations, seeds, CORS, rate limits, Docker deployment, and safe structured errors.

Domain-specific chat, challenge, invite, game, display, and image semantics are deliberately out of scope. Images are generic `media_assets`; never reintroduce domain-specific ACLs.

## Architecture and patterns

Before changing architecture or adding a preserved capability, read [README.md](README.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Treat those documents as the required pattern guide: extend the existing boundaries and interfaces instead of bypassing them.

- `src/domain/`: framework-independent models, repository contracts, services, errors, and events.
- `src/application/`: orchestration handlers and use-case boundaries.
- `src/infrastructure/`: Express controllers/routes, tsyringe composition, libSQL/Knex adapters, email, storage, jobs, realtime, and configuration.
- Routes authenticate first, then apply named permission middleware for admin operations. Controllers map HTTP shapes; services own rules; repositories own persistence.
- Use dependency injection for services and adapters. Keep external providers behind interfaces (`BlobStorage`, email, repositories, realtime).
- Use snake_case at the HTTP boundary where the existing API contract requires it, and stable IDs for media/audit records.
- Diagnostics are public, bounded, rate-limited, sanitized, redacted, and best-effort. Never allow diagnostics submission to recurse through diagnostics.
- Media upload must validate MIME and binary signatures, normalize with Sharp, persist metadata separately, enforce ACL/expiry, and delete both metadata and blobs during cleanup.
- Every admin/example mutation that matters operationally should create a generic audit event.

## Verification rules

Run `npm run build` and `npm test -- --runInBand` before merging backend changes. For scaffold features, also run the frontend Playwright scaffold suite and review every generated screenshot. Update the canonical loop state with implementation, unit, E2E, and visual evidence. Add tests beside controllers/services/adapters when changing behavior.

## Configuration

Start from `env.example`. Use `MEDIA_*`, `VAPID_*`, `TURSO_*`, `R2_*`, and `FILEBASE_*` variables; do not add source-application or chat-specific names. Never commit `.env`, database files, blobs, or build output.
