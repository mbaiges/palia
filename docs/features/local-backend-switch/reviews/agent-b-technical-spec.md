# Borrador técnico: backend local y seed completo

> Revisión redundante del agente B. Parte del borrador funcional de este directorio y de la evaluación de adapters existente en `docs/FRONT-BACKEND-ADAPTER-EVALUATION.md`.

## Resumen

Agregar una implementación local del port del front (`LocalStorageApiRepository`) que devuelva los mismos DTOs que `HttpApiRepository`, persista un estado aislado por navegador y permita seleccionar el adapter desde un composition root controlado por configuración. El seed debe ser una fixture versionada, completa y determinista, reutilizable por el repositorio local y por pruebas de contrato.

El backend local es una herramienta de desarrollo/E2E y no debe estar disponible en producción.

## Arquitectura objetivo

```text
React pages
    ↓
dbService / application facade
    ↓
Backend port
    ├── HttpApiRepository → apiClient → Express API
    └── LocalStorageApiRepository → local storage driver → local state
```

El selector se resuelve una sola vez en `front/src/services/container.js` o módulo equivalente. Las páginas no deben importar `apiClient`, Firebase ni `LocalStorageApiRepository`.

## Port y contrato

El port debe conservar el contrato ya expuesto por `createDbService` y `ApiRepository`:

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
  push: { vapidPublicKey, subscribe, unsubscribe }
}
```

El repositorio local debe devolver DTOs sin `{ data }` HTTP, sin `Response`, URLs ni status codes. Debe usar errores normalizados con código, tipo, `retryable`, `unauthorized` y `conflict`, para que `dbService` y `offlineSync` no dependan de HTTP.

## Composición y selección

Usar una configuración de build/runtime explícita, por ejemplo:

```text
VITE_BACKEND_PROVIDER=http|local
VITE_LOCAL_BACKEND_ENABLED=false|true
VITE_LOCAL_SEED_VERSION=...
```

Reglas:

- `local` solo es válido si `VITE_LOCAL_BACKEND_ENABLED=true` y el build no es producción.
- Un valor inválido hace fallback seguro a HTTP y registra un diagnóstico no sensible.
- No se debe enviar el contenido de variables locales al backend API.
- Settings solo recibe una capability ya resuelta, no lee variables de entorno directamente.
- Cambiar de adapter invalida el `dbService`, el identity cache, el snapshot y la cola de sincronización asociada al proveedor.

## Almacenamiento local

Aunque el nombre solicitado es `LocalStorageApiRepository`, conviene encapsular `localStorage` detrás de un driver para poder migrar a IndexedDB si el seed crece. La forma inicial puede ser:

```text
localStorage[
  "medice.local-backend.v1.<profile>"
] = {
  schemaVersion,
  seedVersion,
  selectedUserId,
  users,
  allowedUsers,
  patients,
  caregivers,
  hospitals,
  assignments,
  followUps,
  alerts,
  profiles,
  auditEvents,
  updatedAt
}
```

El acceso debe ser serializado para evitar pérdida por escrituras concurrentes. Las operaciones mutables deben actualizar el estado de forma atómica desde la perspectiva del repositorio. IDs, DNI normalizado, timestamps y `clientMutationId` deben seguir las mismas reglas del API.

No guardar cookies, tokens ni credenciales en este estado. La identidad local de prueba es una fixture controlada, no una sesión productiva.

## Seed

Crear una fixture versionada fuera del código de UI, por ejemplo:

```text
front/src/services/localBackend/seed.js
front/src/services/localBackend/seed.test.js
```

La fixture debe ser una función que genere un objeto nuevo en cada llamada para evitar mutaciones compartidas:

```js
export function createLocalSeed({ now = FIXED_SEED_TIME } = {}) {
  return structuredClone({ ... });
}
```

El seed debe contener tres usuarios, allow-list, perfiles, pacientes activos/archivados, cuidadores, hospitales activos/archivados, asignaciones, seguimientos con cada duración, alertas activas/resueltas y estadísticas calculables. Los campos deben coincidir con los DTOs serializados por la API, usando los mismos nombres camelCase en el port.

El reset debe reemplazar todo el aggregate local, conservar `schemaVersion` y aumentar o registrar `seedVersion`. Debe ser idempotente: cargar dos veces no duplica nada.

## Identidad y permisos locales

Implementar un actor local seleccionado de la fixture. El repositorio debe aplicar una política equivalente a la API para cada operación. Como mínimo:

- volunteer: lectura del directorio y flujos de voluntario;
- coordinator: pacientes, cuidadores, hospitales, asignaciones, allow-list de voluntarios y stats globales;
- admin: lo anterior más roles y administración completa.

La política debe vivir en una función compartida o módulo de dominio del adapter local y tener pruebas por rol. No depender de controles visuales.

## Mutaciones y consistencia

- Paciente y cuidador se guardan como una unidad lógica.
- DNI se normaliza a dígitos y se rechaza duplicado.
- Archivo es soft-delete; no se borran pacientes ni hospitales.
- Restauración conserva historial y respeta rol.
- Asignaciones se reemplazan de forma atómica y sin duplicados.
- Seguimientos respetan `clientMutationId`; reintentos iguales son idempotentes y payloads distintos generan conflicto.
- Alertas soportan varias activas y resolución individual con nota opcional.
- Estadísticas se calculan desde los arrays de datos cada vez o se recalculan después de cada mutación; no se deben persistir números mockeados.

## Auth, push y offline

El adapter local debe implementar auth de prueba separado del adapter clínico. `devBypass` selecciona una identidad fixture solo en desarrollo/E2E. Google real, cookies HttpOnly y CSRF siguen siendo responsabilidad de `HttpApiRepository`/API.

Push local puede ser una capability no configurada que retorna un error de capacidad ausente, igual que el estado actual cuando VAPID no está configurado. No debe simular envío clínico silenciosamente.

La outbox de seguimientos debe seguir usando el port de follow-ups. Para Local, sincronizar significa aplicar la mutación al estado local; para HTTP, enviar a la API. La cola no debe conocer cuál provider está activo.

## Settings y ciclo de vida

Settings debe recibir:

```js
backendCapabilities = {
  canSwitchBackend,
  activeProvider,
  canSeed,
  canSelectLocalUser
}
```

Al confirmar cambio:

1. detener operaciones pendientes;
2. limpiar snapshot de `dbService`;
3. cambiar la selección persistida del provider;
4. crear o resolver el nuevo repository;
5. cargar la identidad/seed correspondiente;
6. publicar un evento de datos actualizado.

Una recarga debe reconstruir el mismo adapter desde la configuración persistida. El cambio no debe modificar la base API ni enviar requests clínicos.

## Testing

### Unitarios

- seed completo y determinismo;
- migración de `schemaVersion`;
- reset idempotente;
- aislamiento entre perfiles/usuarios;
- normalización y unicidad de DNI;
- permisos de volunteer/coordinator/admin;
- edición paciente/cuidador;
- archivo/restauración;
- asignaciones;
- idempotencia y conflictos de seguimientos;
- varias alertas y resolución con nota;
- estadísticas derivadas;
- errores normalizados;
- selección de adapter y bloqueo en producción.

### Contract tests

Extraer una suite parametrizable que ejecute los casos del `ApiRepository` contra `HttpApiRepository` y `LocalStorageApiRepository`. La suite debe verificar DTOs equivalentes, reglas de permisos y estados de error. Para HTTP se usa SQLite local; no se llama Turso.

### Playwright

- seleccionar Local desde Settings;
- cargar seed;
- recorrer dashboard, directorio, detalle, seguimiento, alertas, administración, perfil y stats;
- cambiar usuario local por rol;
- refrescar página y conservar el modo;
- crear/editar/archivar/restaurar datos;
- volver a API y comprobar separación;
- verificar 360x800 y 390x844, sin overflow horizontal y con CTA accesibles sobre la navegación mobile;
- capturar y revisar visualmente las pantallas de cada estado.

## Seguridad y límites

- No habilitar el provider local en producción.
- Fail closed ante una configuración inválida.
- No almacenar tokens ni credenciales reales.
- No mezclar el estado local con IndexedDB de la sesión API.
- Limpiar datos locales mediante una acción explícita y documentada.
- Mostrar una marca clara de modo local para evitar confundir datos ficticios con datos clínicos.
- No usar datos personales reales en el seed.

## Plan de implementación

1. Fijar las decisiones funcionales abiertas.
2. Formalizar el port/error contract y composition root.
3. Extraer `localStorage` driver y fixture seed.
4. Implementar `LocalStorageApiRepository` con permisos y mutaciones.
5. Adaptar auth/offline/push a capabilities separadas.
6. Incorporar selector y reset de seed en Settings.
7. Ejecutar contract tests API/local.
8. Ejecutar unit, build, E2E desktop/mobile y revisión visual.
9. Actualizar checklist y loop state.

## Mapeo funcional-técnico

| Criterio funcional | Diseño | Validación |
|---|---|---|
| Selección API/Local | Composition root + capability de Settings | Unit + Playwright |
| Seed completo | Fixture versionada y reset idempotente | Unit + bootstrap E2E |
| Paridad de datos | DTO port sin envelopes HTTP | Contract tests |
| Paridad de permisos | Política local equivalente | Unit por rol + E2E |
| CRUD clínico | Mutaciones atómicas del repositorio | Contract + Playwright |
| Offline | Outbox usa follow-up port | Unit + mobile E2E |
| Separación de fuentes | Estado/profile namespace por provider | E2E cambio API/Local |
| Seguridad de producción | Gate de build y fail closed | Unit config + build |
| Mobile | Settings, seed y recorridos sin overflow | Playwright 360x800/390x844 + screenshots |

## Pendientes de decisión

- habilitación exclusiva en `DEV/E2E` o también staging;
- selector de identidad local visible o usuario fijo;
- persistencia del seed después de reinicio;
- conveniencia de IndexedDB desde el comienzo por tamaño y sensibilidad del estado;
- si el backend local debe simular push o solamente marcarlo como no disponible.
