# Functional Spec: Generic App Scaffolding Extraction

| Field | Value |
|-------|-------|
| Status | Approved — cross-backend compatibility addendum |
| Author | Codex |
| Created | 2026-09-18 |
| Updated | 2026-09-18 |
| Feature folder | `docs/features/scaffolding-extraction/` |
| Follow-up | [technical-spec.md](./technical-spec.md) |
| Related | `FEATURE_INVENTORY.md`, reference frontend/backend patterns |

## Summary

Turn the copied application API and frontend into reusable Node/React scaffolding. The scaffolding must retain and demonstrate the cross-cutting capabilities identified in the inventories while removing application-specific concepts, copy, seed data, branding, and workflows from the source applications.

The scaffold is not an empty starter. It is a small, working reference application whose domain is intentionally generic and replaceable.

## Goals

1. Preserve complete email/password and Google authentication, email verification, password reset, JWT refresh/sign-out, current-user state, and development auth support.
2. Preserve roles, permissions, protected routes, admin settings, allowed-user management, user search, and role-management examples.
3. Preserve localized API/frontend behavior, locale persistence, themes, design tokens, responsive layout, PWA behavior, and push/in-app notification examples.
4. Preserve a reusable image/media capability with both a larger multipart/blob path and a small compressed JSON/data-URL path suitable for admin/mobile workflows.
5. Preserve client diagnostics that report browser failures to the API with request correlation, redaction, rate limiting, and structured server logs.
6. Preserve a generic authenticated example domain and minimal admin/example screens so future applications have a working place to replace domain code.
7. Preserve representative realtime, background-job, email, storage, migration, testing, notification, push/PWA, audit, and deployment patterns without retaining source-app terminology.
8. Provide responsive mobile/phone and desktop frontend layouts with the same core capabilities available in both modes.
9. Make the boundary between scaffold-owned capabilities and replaceable domain code obvious in both repositories.

## Non-goals (v1)

- Reproducing source-specific challenge, invitation, display, game, hunt, QR, lobby, team, scanner, or location semantics.
- Carrying over source-app branding, logos, seed content, marketing copy, or domain-specific translations.
- Supporting every source-app screen or endpoint under its original name.
- Rebuilding a general-purpose CMS, file manager, or analytics platform.
- Adding production observability infrastructure beyond structured application/client diagnostics.
- Committing or pushing repository changes as part of the planning phase.

## Background & Problem

The copied applications contain valuable mature foundations, but their current domain models and routes are tightly coupled to source-specific products. Removing those features carelessly would also remove the auth, admin, media, localization, observability, and deployment patterns that make the projects useful as scaffolds.

Chat is explicitly out of scope for the scaffold. The image capability is standalone and generic: users and administrators upload, retrieve, preview, and authorize media assets without chat threads, messages, participants, showcase displays, QR flows, or game terminology.

The desired result keeps those foundations executable and visible through generic examples, so a new application can replace the example domain without reconstructing the infrastructure.

## Terminology

| Term | Meaning |
|------|---------|
| Scaffold capability | A reusable cross-cutting feature that must remain implemented and demonstrated. |
| Example domain | Small replaceable entities and screens used to prove auth, permissions, CRUD, media, notifications, and realtime. |
| Media asset | An uploaded image and its metadata/reference, independent of a source-app concept. |
| Client diagnostic | A browser error/network report forwarded to the API and emitted as structured server logging. |
| Admin | An authenticated actor with explicit management permissions. |

## Actors

| Actor | Capabilities |
|-------|--------------|
| Anonymous visitor | View health/public landing/auth pages; start sign-up, sign-in, verification, and password-reset flows. |
| Authenticated user | Manage own session/settings; use the protected example feature; upload/view permitted media; receive notifications; use the realtime example on mobile or desktop. |
| Administrator | All user capabilities plus allowed-user management, user search, role management, example administration, media administration, and audit/diagnostic visibility where provided. |
| Development operator | Use explicitly enabled local auth bypass and local email/storage implementations. |

## Availability Rules

- Server-side authorization is authoritative for every protected API and media operation.
- Admin operations require the relevant permission, not merely a frontend admin route.
- Email verification remains required before normal email/password sign-in when that behavior is enabled.
- Development bypass is unavailable unless an explicit environment flag enables it.
- Image features may be feature-flagged, but the scaffold must ship with a working local configuration.
- Client diagnostics are best-effort and must not block user recovery.

## User Journeys

### Journey A — Email account lifecycle

1. A visitor submits email/password sign-up.
2. The API creates an unverified account, sends a localized verification code, and the frontend shows the verification step.
3. The visitor verifies the code or requests a resend.
4. The visitor signs in and receives authenticated user/permission state.
5. The user refreshes or signs out; the frontend restores or clears the session correctly.

Blocked paths include duplicate email, invalid/expired code, unverified sign-in, invalid credentials, expired access token, and unavailable email delivery.

### Journey B — Password recovery

1. A visitor requests a reset link.
2. The API sends a localized reset email without revealing whether an account exists.
3. The visitor opens the reset flow and submits a new password.
4. Expired, reused, malformed, or mismatched tokens are rejected safely.

### Journey C — Admin management

1. An authenticated administrator opens the admin area.
2. The frontend loads allowed users and searchable users.
3. The administrator adds/removes an allowed email or changes a user role.
4. A non-admin receives an unauthorized result and cannot perform the mutation even if calling the API directly.

### Journey D — Generic authenticated example

1. A user opens a protected example page.
2. The frontend loads a small domain collection from the API.
3. The user performs at least one authenticated read and one write.
4. The UI demonstrates loading, empty, validation, unauthorized, and API-error states.

### Journey E — Media upload

1. A user selects an image and sees a local preview.
2. The client validates/normalizes the image according to the selected upload path.
3. The API validates the content, stores metadata and bytes/reference, and returns a stable media ID.
4. The user can retrieve the image only when authorized.
5. Admin/mobile examples may use compressed JSON/data-URL uploads; larger or expiring media may use multipart/blob uploads.
6. Temporary previews are revoked and expired media is cleaned up.

### Journey F — Client failure diagnostics

1. The frontend adds request IDs to API calls and tracks global/browser failures.
2. A failure produces an incident ID and user-facing recovery details.
3. The frontend sends a bounded best-effort report to the diagnostics endpoint.
4. The API rate-limits, sanitizes, redacts, and writes a structured server log correlated by request/incident ID.

### Journey G — Localization, theme, notifications, and realtime examples

1. A visitor selects or is assigned a supported locale.
2. The frontend changes language and persists it for authenticated users.
3. The user switches theme and sees the tokenized design system remain consistent on mobile and desktop layouts.
4. The user receives an in-app/push notification from the generic example flow.
5. The user opens a minimal realtime example and sees reconnect/error behavior without source-product terminology.

## Product Decisions (locked)

| # | Topic | Decision |
|---|-------|----------|
| 1 | Domain | Replace source domains with a minimal generic example domain. |
| 2 | Auth | Keep the current mature auth lifecycle fully implemented. |
| 3 | Admin | Keep RBAC and admin management fully implemented and demonstrable. |
| 4 | Media | Preserve both multipart/blob and compressed JSON/data-URL patterns as reusable options. |
| 5 | Diagnostics | Preserve frontend-to-API client diagnostics and structured server logging. |
| 6 | Source branding | Remove source-product branding and domain terminology from scaffold-facing UI/docs/translations. |

## Open product decisions

These need confirmation before the functional spec is locked:

- Whether Google OAuth is enabled by default in the example environment or remains configuration-only.
- Whether the generic example domain should be a single `ExampleItem` resource or a slightly richer parent/child pair.
- Whether push notifications use a local/mock provider by default or require external VAPID configuration; the capability itself remains required.
- Whether the generic example domain should use one table or a parent/child pair; the protected example feature remains required.

## Acceptance Criteria

1. A fresh local setup can complete email sign-up, verification, sign-in, refresh, sign-out, forgot-password, and reset-password journeys.
2. Google auth and development bypass remain available through explicit configuration.
3. Protected API routes and frontend routes enforce authentication and permissions server-side and client-side.
4. Admin users can manage allowed users, search users, and update roles; unauthorized actors cannot mutate admin resources.
5. API and frontend support the configured locales, locale persistence, theme switching, and centralized design tokens.
6. A protected generic example feature has working read/write behavior and mocked/seedable data without source-app domain nouns.
7. Image upload is demonstrable through a protected UI and API, including preview, validation, stable IDs, authorized retrieval, and cleanup/storage behavior.
8. The media layer supports a local development implementation and production-oriented object-storage configuration.
9. The frontend can report global/browser/network/5xx failures to the API with bounded, redacted, correlated diagnostics.
10. The scaffold demonstrates in-app notifications, push subscription behavior, PWA/service-worker behavior, a generic realtime/reconnect example, and admin-visible generic audit events.
11. The frontend provides verified mobile and desktop layouts for auth, dashboard/example, admin, media, notifications, and error states.
12. Unit, API, frontend, and feature-focused E2E tests cover every acceptance criterion.
13. No source-specific challenge/chat/display/invite/hunt/QR/lobby terminology is required to understand or use the scaffold.
14. Node, Go, and Rust expose the same shared route set, observable payload/response casing, status behavior, authorization, and side effects documented in [API-COMPATIBILITY.md](../../API-COMPATIBILITY.md).
15. Each backend persists the generic welcome and example-created notification; push delivery is best-effort and cannot fail the originating operation.
16. Media-disable, media-expiry, OAuth-provider-unavailable, and diagnostics-redaction behavior is consistent across backends and covered by contract tests.

## Out-of-Scope Follow-ups (post-v1)

- Additional storage providers beyond local/S3/R2.
- Full audit-event analytics UI.
- Multi-tenant organization management.
- Advanced media transformations, video, or document uploads.
- Production error aggregation SaaS integration.
- Reusable generator/CLI that creates new apps from the scaffold.
