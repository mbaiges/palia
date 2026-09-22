# Technical Spec: Seed completo y backend local seleccionable

| Campo | Valor |
|---|---|
| Estado | Draft — requiere confirmación de decisiones abiertas |
| Autor | Codex |
| Creada | 2026-09-21 |
| Producto | [functional-spec.md](./functional-spec.md) |
| Relacionado | [FRONT-BACKEND-ADAPTER-EVALUATION.md](../../FRONT-BACKEND-ADAPTER-EVALUATION.md) |

## Resumen y complejidad

Se agregará `IndexedDBApiRepository` como segunda implementación del port `ApiRepository`. `DefaultHttpApiRepository` seguirá siendo la implementación API. Un composition root seleccionará un solo backend activo y creará el `dbService` con esa dependencia.

El seed será una fixture versionada, determinista y neutral al transporte. Un runner para Node lo aplicará a SQLite local; el repository local lo cargará en un snapshot del navegador. Ambos adapters devolverán los mismos DTOs y errores de aplicación.

**Complejidad:** media/alta. La selección del adapter es acotada; la paridad requiere repetir permisos, mutaciones, derivaciones, idempotencia y estados del backend actual.

**Infraestructura v1:** SQLite local para API, IndexedDB para Local, feature gate explícito, sin validación de Turso.

## Principios

| Principio | Aplicación |
|---|---|
| Dependency inversion | `dbService`, offline y push reciben ports, nunca adapters concretos. |
| Una fuente por sesión | El container mantiene un único backend activo. |
| Contrato común | Ambos adapters devuelven DTOs sin envelopes HTTP. |
| Reproducibilidad | IDs estables, versión de seed y reset idempotente. |
| Fail closed | Configuración inválida vuelve a HTTP; API caída no activa Local. |
| Seguridad | Local está bloqueado en producción; no guarda tokens ni secretos. |

## Arquitectura

```text
React pages/components
        ↓
dbService / application facade
        ↓
ApiRepository
   ├── DefaultHttpApiRepository → apiClient → Express API → SQLite/Turso
   └── IndexedDBApiRepository → IndexedDBLocalStore → IndexedDB
```

Módulos propuestos:

```text
front/src/services/
├── container.js
├── db.js
├── repositories/
│   ├── apiRepository.js
│   ├── indexedDbApiRepository.js
│   └── repositoryErrors.js
├── localBackend/
│   ├── localDatabaseStore.js
│   ├── localIdentity.js
│   └── localPolicy.js
└── ...

api/src/infrastructure/seed/
└── runMediceSeed.ts

seed/
├── medice-seed.json
├── schema.json
└── README.md
```

El catálogo del seed vive en `seed/`, fuera de `api/` y `front/`, y es la fuente declarativa única. API y frontend agregan o transforman campos únicamente en el borde de cada adapter cuando sus modelos de ejecución lo necesitan. No se deben copiar fixtures divergentes manualmente.

## Port y errores

El port conserva las operaciones actuales:

```js
{
  auth: { me, google, devBypass, signOut },
  bootstrap,
  patients: { list, get, create, update, archive, restore, assign, followUps, createFollowUp, createAlert },
  alerts: { list, resolve },
  hospitals: { list, create, update, archive, restore },
  volunteers: { list, updateProfile },
  access: { list, addVolunteer, remove },
  stats: { mine, global },
  push: { vapidPublicKey, subscribe, unsubscribe },
}
```

El adapter Local no debe devolver `{ data }`, `Response`, URLs ni códigos HTTP. Se agrega un error común con `code`, `message`, `kind`, `retryable`, `unauthorized`, `conflict` y `details`. El adapter HTTP traduce `ApiError`; el local traduce validación, permisos, conflictos, cuota y estado corrupto.

## Composition root y selección

Variables propuestas:

```text
VITE_LOCAL_BACKEND_ENABLED=false
VITE_DEFAULT_BACKEND=http
VITE_LOCAL_SEED_VERSION=1
```

Reglas:

- `local` solo se acepta si `VITE_LOCAL_BACKEND_ENABLED=true` y el modo no es producción.
- Valores inválidos hacen fallback seguro a HTTP.
- Settings recibe capacidades resueltas; no lee variables directamente.
- La selección puede persistirse como preferencia local de desarrollo, nunca en cookie ni en la API.
- Al cambiar, se detienen acciones pendientes, se limpia el `dbService`, se crea el nuevo repository, se carga su identidad y se inicializa.
- Mientras cambia el backend, las mutaciones quedan deshabilitadas.
- Si falla la inicialización, no se mezclan snapshots y se conserva el backend anterior o se muestra estado bloqueado.

## Persistencia Local

Usar un driver `IndexedDBLocalStore` sobre IndexedDB:

```text
medice.local-backend.v1.<profile> = {
  schemaVersion,
  seedVersion,
  selectedUserId,
  updatedAt,
  users,
  allowedUsers,
  patients,
  caregivers,
  hospitals,
  assignments,
  followUps,
  alerts,
  profiles,
  auditEvents
}
```

Requisitos:

- namespace propio y detección de versiones incompatibles;
- JSON inválido o un error de IndexedDB conserva el snapshot anterior y muestra error;
- escritura consistente del snapshot completo;
- fechas ISO UTC, estadísticas calculadas con zona del dispositivo;
- sin cookies, JWT, tokens OAuth ni secretos;
- reset limpia solo las claves propias;
- el driver queda aislado para permitir migraciones futuras de esquema.

## Seed y runner API

La fixture debe generar un objeto nuevo en cada llamada, con IDs estables, tiempos fijos y versión declarada. Debe contener tres roles, allow-list, perfiles, pacientes/cuidadores, hospitales, asignaciones, seguimientos con duraciones requeridas, alertas activas/resueltas y datos para estadísticas.

El runner API debe:

1. exigir entorno local/test y `USE_LOCAL_DB=true`;
2. rechazar explícitamente producción;
3. ejecutar migraciones necesarias;
4. usar upsert por IDs estables como operación segura por defecto; permitir `--reset` únicamente en entornos local/test para reemplazar el estado de seed;
5. informar versión y resultado;
6. no aceptar Turso como destino de las pruebas de esta feature.

## Identidad y política Local

El repository Local simula `auth.me`, `devBypass` y logout con una identidad admin demo fija. La identidad no es una sesión Google y nunca se envía a la API.

El seed compartido conserva los tres roles para probar la API. Local inicia únicamente como admin demo, por lo que puede ejecutar todos los flujos; la política de roles completa se valida contra `DefaultHttpApiRepository` y sus pruebas de contrato.

La política API debe aplicar las mismas reglas:

- voluntario: directorio, perfil propio y flujos de voluntario;
- coordinador: operaciones de dominio, asignaciones, allow-list de voluntarios y estadísticas globales;
- admin: administración completa y roles.

Las pruebas deben verificar permisos en el repository, no solo en la UI.

## Mutaciones y derivaciones

- Paciente y cuidador se actualizan como unidad lógica.
- DNI se normaliza a dígitos y es único.
- Archivo es soft-delete; restauración respeta rol.
- Asignaciones se reemplazan atómicamente sin duplicados.
- Seguimientos respetan `clientMutationId`; repetición igual es idempotente y payload distinto es conflicto.
- Alertas admiten varias activas y resolución individual con nota opcional.
- Estadísticas se calculan desde los registros, nunca desde contadores ficticios.

## Auth, push y offline

- Auth HTTP conserva Google, cookie HttpOnly y CSRF.
- Auth Local usa una identidad admin demo aislada.
- Push Local declara capability no disponible; no simula entrega clínica.
- La outbox es la cola persistente de seguimientos guardados sin conexión que esperan sincronizarse al recuperar conectividad.
- Al cambiar de backend, si hay elementos pendientes se muestra su cantidad y se exige sincronizarlos o descartarlos explícitamente antes de continuar. Nunca se transfieren automáticamente entre API y Local.
- La outbox queda aislada por `provider`, `userId` e identidad de mutación para evitar enviar un seguimiento local a la API equivocada.

## Settings y ciclo de vida

Settings recibe:

```js
{
  canSwitchBackend,
  activeProvider,
  canSeed,
  canSelectLocalUser: false,
  seedVersion,
}
```

Debe ofrecer selector, indicador visible, cargar/reset seed, identidad Local y estados de carga/error. El cambio debe ser confirmado si hay datos, especialmente antes de resetear.

## Testing

| Capa | Cobertura |
|---|---|
| Unit | fixture, determinismo, reset, migración, cuota, errores, permisos, DNI, CRUD, archivo, alertas, idempotencia y estadísticas. |
| Contract | misma suite parametrizada para `DefaultHttpApiRepository` sobre SQLite y `IndexedDBApiRepository`. |
| API | runner seed, bootstrap y recorridos con DB local; no Turso. |
| Playwright | selección, seed, todos los flujos, cambio de fuente, reload, separación y mobile. |
| Visual | screenshots explícitas en 360×800, 390×844 y desktop; revisar cada imagen. |

## Mapeo de aceptación

| Criterios funcionales | Diseño | Validación |
|---|---|---|
| 1–3 | fixture versionada + runner SQLite | unit + API E2E |
| 4–6 | container, capacidades y selector | unit + Playwright |
| 7–10 | namespaces y reinitialization | contract + Playwright |
| 11–12 | indicador, confirmación y reset | Playwright + screenshots |
| 13–14 | feature gate y estadísticas derivadas | config unit + contract |
| 15 | responsive Settings y flujos | Playwright mobile |

## Fases de implementación

1. Confirmar decisiones abiertas y actualizar specs.
2. Completar contrato de errores/capabilities.
3. Extraer fixture y driver Local.
4. Implementar `IndexedDBApiRepository` y política de permisos.
5. Implementar runner seed API sobre SQLite.
6. Integrar selección y reset en Settings.
7. Crear contract tests.
8. Ejecutar unit, builds, E2E desktop/mobile y revisión visual.
9. Actualizar checklist y loop state.

## Abierto para confirmación

- Staging queda habilitado para Local.
- La identidad Local queda fijada en admin demo.
- El runner API usa upsert por defecto y `--reset` queda restringido a local/test.
- La outbox pendiente requiere sincronización o descarte explícito antes de cambiar de backend.
- Confirmar métricas de tamaño y migración de esquema de IndexedDB durante las pruebas.

## Fuera de alcance técnico

- `FirebaseApiRepository`.
- Sincronización API/Local.
- Validación de Turso.
- Exportación/importación.
- Locking multi-tab avanzado.
