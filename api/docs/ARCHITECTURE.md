# Backend architecture and preservation rules

The API follows a pragmatic hexagonal structure. Domain code depends on interfaces, infrastructure implements them, and `src/infrastructure/config/container.ts` is the composition root. Express routes should only perform transport concerns and delegate to controllers; controllers validate/map requests and responses; services enforce business rules; repositories and adapters perform I/O.

## Directory map

The following tree shows the architectural source directories (not generated output such as `dist/`, local databases, or `node_modules/`):

```text
src/
├── domain/
│   ├── errors/       # Domain/application errors and stable error codes
│   ├── models/       # Framework-independent entities and value-shaped models
│   ├── repositories/ # Outbound ports: persistence/provider contracts
│   ├── services/     # Core business rules and domain-level service operations
│   ├── usecases/     # Focused reusable policies/use-case helpers
│   └── utils/        # Framework-independent helpers and configuration policies
├── application/
│   ├── handlers/     # Orchestration for application flows (e.g. auth/admin)
│   └── services/     # Application-level service boundary; add orchestration here
├── infrastructure/
│   ├── adapters/
│   │   ├── auth/          # Password hashing, JWT and identity-provider adapters
│   │   ├── email/         # Console/Resend email implementations
│   │   ├── realtime/      # Socket.IO gateway implementation
│   │   ├── repositories/  # SQLite/libSQL-backed repository implementations
│   │   └── storage/       # Local, S3-compatible and R2 blob storage
│   ├── config/       # Environment, database, server, DI container and factories
│   ├── controllers/  # HTTP-to-application and application-to-HTTP mapping
│   ├── db/           # Database setup and runtime persistence support
│   ├── emails/       # Email rendering/templates
│   ├── jobs/         # Scheduled/background work (e.g. media cleanup)
│   ├── mappers/      # Boundary and persistence mapping
│   ├── middleware/   # Express cross-cutting HTTP concerns and authorization
│   ├── migrations/   # Ordered schema migrations
│   ├── realtime/     # Realtime transport setup and event wiring
│   ├── routes/       # Express route registration and middleware composition
│   ├── services/     # Infrastructure-facing services, such as audit/dispatch
│   ├── types/        # Express and infrastructure type extensions
│   └── utils/        # Infrastructure-specific helpers
└── locales/          # API translation resources
```

`domain/services` is intentionally used for much of the current core business behavior; this scaffold is pragmatic rather than a strict rule that every use case must be a class under `application/`. Keep transport orchestration at the application boundary and keep HTTP, database, and provider details out of domain models and contracts. The `application/services/` directory is currently a reserved extension point and can remain empty until application orchestration belongs there.

## Dependency direction and request flow

```text
Express route / middleware
          ↓
      controller
          ↓
 application handler / domain service
          ↓ depends on
    domain port (interface)
          ↑ implemented by
 infrastructure adapter ──→ SQLite / email / blob storage / realtime provider
```

The arrow from core code to an interface is a source-level dependency on an abstraction; the adapter implements that abstraction. Infrastructure is allowed to depend on the core contracts, not the reverse. For a media upload, for example, the controller passes the authenticated request and file into the media service; the service enforces media rules and calls `MediaAssetRepository` and `BlobStorage`; the container has already selected concrete adapters. Controllers should not query Knex or write blobs directly.

## Ports, adapters, and dependency injection

- Define outbound contracts in `domain/repositories/` (including storage, email, and token abstractions where appropriate). These are ports expressed as TypeScript interfaces.
- Implement them under `infrastructure/adapters/`. SQLite repositories, `LocalBlobStorage`, `S3BlobStorage`, and `R2BlobStorage` are concrete adapters.
- `infrastructure/config/container.ts` is the composition root: it registers implementations and constructor dependencies with `tsyringe`. Routes resolve controllers from this container; controllers receive services/handlers through constructor injection.
- `infrastructure/routes/` is the inbound HTTP adapter. It composes route handlers with authentication, named permission checks, upload parsing, and transport-specific limits.
- Replace a provider by changing its registration/factory/configuration, not by embedding provider conditionals in domain rules. Tests can inject mocks implementing the same port.

This is hexagonal architecture because HTTP is an inbound adapter and persistence/providers are outbound adapters around ports. It is Clean Architecture in the practical sense that dependencies point toward core policy. It is not a rigid, one-folder-per-layer implementation: the current code keeps core services in `domain/services` and application orchestration in `application/handlers`.

Persistence uses Knex migrations with libSQL/Turso-compatible execution and a local SQLite file for development/tests. Authentication, RBAC, user settings, example items, media metadata, push subscriptions, audit events, and diagnostics are separate concerns. Blob storage is selected behind `BlobStorage`: local filesystem by default, S3-compatible/Filebase or Cloudflare R2 when configured.

Cross-cutting guarantees are centralized: request IDs and structured errors in middleware, permissions in `PermissionMiddleware`, email provider selection in email adapters, locale resolution in i18n helpers, media cleanup in a scheduled job, and push/realtime providers in infrastructure adapters. Keep provider secrets in environment variables and keep `env.example` safe.

Any change to a preserved capability must update its tests and the canonical loop state. A feature is not complete until its service/controller tests, production build, relevant mobile/desktop E2E, and screenshot review pass.

## Mandatory architecture regression guard

`src/infrastructure/architecture/layeredHexArchitecture.test.ts` is a required architectural safety check, not an optional convenience test. It statically scans production TypeScript imports (including relative and `@/` aliases) and enforces the inward dependency rule: domain may import only domain, application may import application/domain, and infrastructure may import infrastructure/application/domain. Test files are excluded because test fixtures may intentionally assemble concrete adapters; the composition root is outside these three layer directories.

Every change that adds or moves dependencies between layers must keep this guard passing as part of the normal Jest suite. Do not bypass, skip, or weaken the assertions just to accommodate an implementation; correct the dependency direction instead. Change the guard only when an intentional architecture decision is documented here and reviewed alongside it. To run it directly: `npm test -- --runInBand src/infrastructure/architecture/layeredHexArchitecture.test.ts`.
