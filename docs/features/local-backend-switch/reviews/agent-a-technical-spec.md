# Technical Spec: Seed completo y backend local seleccionable

| Campo | Valor |
|---|---|
| Estado | Borrador de revisión independiente (agente A) |
| Autor | Codex / revisión redundante |
| Creada | 2026-09-21 |
| Especificación funcional | [agent-a-functional-spec.md](./agent-a-functional-spec.md) |
| Especificación canónica relacionada | `../api-front-separation/functional-spec.md`, `../api-front-separation/technical-spec.md` |

## Resumen

Se agregará un segundo adapter para el `ApiRepository` existente: `LocalStorageApiRepository`. El `DefaultHttpApiRepository` seguirá siendo el adapter por defecto del frontend. Un composition root seleccionará exactamente un repositorio activo por sesión de aplicación; `dbService`, offline y las pantallas recibirán el port, no inspeccionarán el proveedor.

El mismo catálogo de seed funcional se expresará en una forma neutral al transporte. Un runner de API lo aplicará a SQLite local mediante servicios/repositorios de dominio. El repositorio local lo cargará en un snapshot versionado dentro de `localStorage` y ejecutará operaciones sobre ese snapshot. No habrá sincronización entre ambos backends.

**Complejidad:** media/alta. La selección del adapter es acotada, pero el repositorio local debe respetar todas las mutaciones, permisos de demostración, derivaciones y contratos que hoy garantiza la API.

**Infraestructura v1:** SQLite local para el seed de API; `localStorage` del navegador para el backend local; sin Turso en validaciones; feature gate de desarrollo para exponer selector y seed.

## Principios de ingeniería

| Principio | Aplicación |
|---|---|
| Dependency inversion | `dbService` depende de `ApiRepository`; los adapters dependen de sus transportes. |
| Una fuente por sesión | El container posee el backend activo; no se mezclan respuestas API y local en el mismo estado. |
| Contrato común | HTTP y local devuelven los mismos DTOs, errores normalizados y operaciones. |
| Fuente de verdad del backend | El seed y las mutaciones se aplican al backend elegido; las métricas se derivan de sus registros. |
| Reproducibilidad | Seed versionado, IDs estables y reset idempotente. |
| Fail closed | Un fallo de API no cambia automáticamente a local ni permite acciones sin identidad válida. |
| Privacidad | Datos demo ficticios, feature flag de desarrollo y ningún secreto en seed. |

## Arquitectura

```text
React pages/components
        |
        v
application services / dbService
        |
        v
ApiRepository (port)
   |                    |
   v                    v
DefaultHttpApiRepository   LocalStorageApiRepository
   |                    |
apiClient              localStorage snapshot
   |
Express API
   |
SQLite local
```

El container tendrá un `activeBackend` con operaciones `get`, `select`, `reset` e `initialize`. La selección ocurre una vez en el composition root y produce una nueva instancia de `dbService` o cambia su dependencia mediante una operación explícita de reinitialization. No se debe crear un repository distinto dentro de cada página.

### Módulos propuestos

```text
front/src/services/
├── container.js
├── db.js
├── repositories/
│   ├── apiRepository.js
│   ├── localStorageApiRepository.js
│   ├── repositoryErrors.js
│   └── contractTests.js
├── localBackend/
│   ├── localDatabase.js
│   ├── localSeed.js
│   └── localIdentity.js
└── seed/
    ├── mediceSeed.js
    └── seedSchema.js

api/src/
├── infrastructure/seed/
│   ├── mediceSeed.ts
│   └── runMediceSeed.ts
└── ...
```

El catálogo neutral del seed puede vivir en una representación JSON/TS compartida si los límites de build lo permiten. Si no se comparte código entre Node y Vite, se mantiene una fuente declarativa neutral y cada runner la valida contra un esquema común. No se deben copiar manualmente fixtures divergentes.

## Port `ApiRepository`

El port actual debe mantenerse estable y completarse donde sea necesario. Ambas implementaciones exponen operaciones equivalentes:

- `auth.me`, `auth.google`, `auth.devBypass`, `auth.signOut`;
- `bootstrap`;
- `patients.list/get/create/update/archive/restore/assign/followUps/createFollowUp/createAlert`;
- `alerts.list/resolve`;
- `hospitals.list/create/update/archive/restore`;
- `volunteers.list/updateProfile`;
- `access.list/addVolunteer/remove`;
- `stats.mine/global`;
- `push.vapidPublicKey/subscribe/unsubscribe`.

El adapter local no debe simular HTTP ni devolver `{ data }`; devuelve directamente los DTO canónicos. Los errores se representan con un error de dominio común (`code`, `message`, `status` opcional, `details` opcional), sin exponer códigos HTTP internos.

Las capacidades que no aplican al modo local, como Web Push real, deben responder con una capacidad explícita o un resultado `unsupported` documentado. No se deben registrar suscripciones locales como si fueran push entregados.

## Selección e inyección

- `VITE_ENABLE_LOCAL_BACKEND` controla si aparece el selector.
- `VITE_DEFAULT_BACKEND` acepta `http` o `local`, con `http` como valor seguro por defecto.
- El container crea `DefaultHttpApiRepository` o `LocalStorageApiRepository`.
- `dbService` recibe el repository activo y el `offlineStore` mediante dependencias.
- Al cambiar de backend, el container destruye/limpia el servicio anterior, crea el nuevo servicio, revalida o selecciona la identidad correspondiente y dispara una inicialización completa.
- La selección no debe persistirse en una cookie ni enviarse al servidor. Puede persistirse como preferencia local de desarrollo, con validación del feature flag al arrancar.
- Las páginas deben recibir `dbService`/callbacks existentes o usar el container; no deben importar los adapters concretos.

La operación de cambio debe protegerse contra carreras: mientras se reinicializa, las acciones clínicas se deshabilitan y las vistas muestran estado de carga. Si falla la inicialización, se conserva el backend anterior o se muestra estado bloqueado, pero nunca se mezclan snapshots.

## Backend local y persistencia

`LocalStorageApiRepository` mantiene un documento versionado, por ejemplo:

```text
medice.localBackend.v1 = {
  schemaVersion,
  seedVersion,
  updatedAt,
  identityId,
  records: {
    users, access, patients, caregivers, hospitals,
    assignments, followUps, alerts, pushSubscriptions
  }
}
```

Requisitos:

- usar un namespace único y detectar versiones incompatibles;
- escribir snapshots completos de forma consistente, con serialización protegida ante JSON inválido;
- mantener IDs y timestamps estables del seed;
- almacenar fechas en ISO UTC y calcular estadísticas con la zona local del dispositivo;
- normalizar DNI, email, alertas, archivo y permisos igual que el backend API;
- derivar estado de paciente, asignaciones y estadísticas desde registros, no desde contadores persistidos ficticios;
- no guardar secretos, cookies ni tokens de API en el snapshot;
- manejar `QuotaExceededError` con un error visible y conservar el snapshot anterior;
- limpiar solamente las claves propias del backend local al resetear.

Aunque el almacenamiento solicitado es `localStorage`, el código debe encapsularlo detrás de una interfaz `LocalDatabaseStore` para permitir migrar a IndexedDB si el volumen del seed crece. No se requiere implementar IndexedDB en v1.

## Identidad y autorización local

El modo local necesita una identidad de demostración para que las pantallas puedan probar roles. La identidad local no equivale a una sesión Google y nunca se envía a la API.

Opciones técnicas a decidir:

- una identidad demo seleccionable desde Configuración;
- una identidad fija por defecto y un selector de rol solo en builds de desarrollo;
- simulación de `auth.me`/`devBypass` dentro del adapter local.

La autorización local debe aplicar las mismas reglas funcionales: voluntario ve directorio y puede registrar/resolver; coordinador gestiona pacientes/hospitales/asignaciones y métricas globales; admin gestiona accesos y roles. El adapter no debe permitir que un selector de UI bypassée reglas sin que esa capacidad esté explícitamente limitada al modo desarrollo.

## Seed neutral

El seed debe ser una especificación de datos versionada, no una serie de llamadas UI. Debe incluir:

- tres identidades mínimas: volunteer, coordinator y admin;
- allow-list coherente con esas identidades;
- perfiles completos y asignaciones donde coordinador/admin puedan operar como voluntarios;
- pacientes activos y archivados con DNI normalizado;
- cuidadores con campos completos y relación;
- hospitales activos y archivados, con referencias históricas;
- seguimientos para presencial, remoto y duración personalizada de 15, 60, 120 y 1440 minutos;
- síntomas, apoyo social, equipamiento, observaciones e intervenciones;
- al menos un paciente con dos alertas activas y otro con una alerta resuelta con nota;
- fechas suficientes para año actual, meses y actividad semanal;
- datos para filtros por nombre, DNI y diagnóstico;
- uno o más pacientes asignados previamente para probar cache/offline.

Los identificadores deben ser deterministas. Las fechas deben estar fijadas en el catálogo y el runner puede aplicar una fecha base configurable solo si se conserva la reproducibilidad. El seed debe declarar una versión (`seedVersion`) y un namespace.

## Runner del seed de API

El runner se ejecuta contra SQLite local mediante el container de API y servicios de dominio. Debe:

1. comprobar entorno y base destino;
2. rechazar por defecto bases no locales o producción;
3. ejecutar migraciones pendientes;
4. aplicar reset/upsert dentro de una transacción cuando sea posible;
5. respetar constraints y reglas de normalización;
6. registrar versión del seed y resumen de filas;
7. fallar sin dejar una carga parcial;
8. ofrecer modo explícito `reset` y modo `upsert` si se decide conservar datos manuales.

No se valida Turso, no se incluyen credenciales y no se llama al runner contra la base productiva en los gates de este feature.

## Seed del backend local

El botón “Cargar seed completo” llama a una operación del backend local, no a un endpoint API. El flujo:

1. valida que el feature gate esté activo;
2. muestra versión y alcance;
3. pide confirmación si ya existe snapshot o datos modificados;
4. crea un snapshot nuevo a partir del catálogo neutral;
5. valida referencias, IDs y roles;
6. persiste atómicamente;
7. reinicializa `dbService` y muestra resumen.

El reset no debe conservar mutaciones locales salvo que se agregue explícitamente un modo exportación, que queda fuera de v1.

## Configuración y experiencia en Settings

Agregar una sección de desarrollo solo si `VITE_ENABLE_LOCAL_BACKEND=true`:

- backend activo: API o Local;
- botón para cambiar backend;
- versión/estado del seed local;
- acción “Cargar seed completo local”;
- acción “Resetear seed local”;
- identidad demo activa, si se adopta selector;
- advertencia visible: “Los datos locales no se sincronizan con la API”.

Al activar API desde local, la pantalla debe mostrar que los cambios locales quedan aislados y requerir sesión API para datos protegidos. Si el backend elegido no está listo, se presenta error con reintento.

## HTTP/API y seguridad

No se requiere una nueva ruta clínica para el frontend local. El seed de API es una herramienta de ejecución/operación local. Si se expone una ruta de seed, debe ser exclusiva de desarrollo, protegida por una bandera de entorno y nunca montarse en producción.

El adapter HTTP mantiene cookies HttpOnly, CSRF, CORS, `TRUST_PROXY_HOPS` y autorización existentes. El modo local no debe intentar leer ni escribir esas cookies. El feature flag debe compilarse o evaluarse de forma que no habilite accidentalmente el selector en producción.

## Pruebas

| Capa | Cobertura |
|---|---|
| Unitarias port | Cada método del port devuelve DTO canónico y errores equivalentes en ambos adapters. |
| Local store | Serialización, migración de versión, reset, quota/error, snapshot corrupto y aislamiento de namespace. |
| Seed | Conteos mínimos, referencias, IDs estables, idempotencia y cobertura de cada entidad/caso. |
| API runner | SQLite limpio, reset repetido, constraints, transacción y rechazo de destino inseguro. |
| Contract tests | Suite compartida para `DefaultHttpApiRepository` y `LocalStorageApiRepository`. |
| Integración frontend | Cambio API/local, reinitialization de `dbService`, sin mezcla de estados, persistencia tras reload. |
| E2E mobile | Settings, cambio de backend, seed local, CRUD, alertas múltiples, estadísticas y regreso a API en 390×844 y 360×800. |
| E2E desktop | Seed API, segundo rol/sesión, operaciones administrativas y aislamiento de datos. |
| Seguridad | Selector oculto con flag apagado; local no realiza requests clínicos; seed no contiene secretos. |

## Fases de implementación

| Fase | Entregable |
|---|---|
| 1 | Cerrar decisiones funcionales sobre feature gate, identidad local y política API seed. |
| 2 | Extraer catálogo neutral de seed y validación de esquema. |
| 3 | Implementar runner seguro de seed SQLite y comandos/documentación. |
| 4 | Implementar almacenamiento local versionado y `LocalStorageApiRepository`. |
| 5 | Integrar container, selección, reinitialization y Settings. |
| 6 | Completar permisos locales, capacidades push/offline y errores normalizados. |
| 7 | Ejecutar contract tests, pruebas de seed, E2E mobile/desktop y documentación de operación. |

## Mapeo de criterios de aceptación

| AC funcional | Diseño / prueba |
|---|---|
| 1–3 | Runner API, catálogo versionado, test de reset/upsert e idempotencia. |
| 4–5 | Fixtures deterministas y tests de cobertura de entidades, alertas y duraciones. |
| 6–8 | Feature gate, container, Settings, adapter local y contract tests. |
| 9–11 | Snapshot persistente, aislamiento de namespaces, cambio con reinitialization y E2E de reload. |
| 12–13 | Confirmación UI, reset atómico local y runner seguro de API. |
| 14–16 | Indicador visible, errores explícitos, flags y pruebas de no fallback silencioso. |
| 17 | Identidades demo y suite de autorización local. |
| 18 | Contract tests y prueba de que las páginas no importan adapters concretos. |

## Ítems abiertos

- Definir el nombre final de variables de entorno y si el modo local se permite en builds de staging.
- Decidir si el seed de API será un comando CLI, una tarea npm o ambos.
- Confirmar si el reset API es destructivo sobre toda la base SQLite o usa un namespace de seed.
- Confirmar identidad demo por defecto y si habrá selector de identidad.
- Confirmar si push y OAuth quedan deshabilitados explícitamente en modo local o se simulan.
- Determinar si `localStorage` es suficiente para el tamaño final del seed; migración a IndexedDB queda disponible como evolución.

## Fuera de alcance técnico

- Implementar `FirebaseApiRepository`.
- Persistencia local multi-tab con locking avanzado.
- Sincronización o reconciliación API/local.
- Validación o despliegue contra Turso.
- Exportación/importación de snapshots.
