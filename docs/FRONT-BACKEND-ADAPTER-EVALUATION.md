# Evaluación de port y adapters para el backend del front

## Resumen

La conexión del front con la API es intercambiable en potencia, pero todavía no está expresada como un port formal. La situación actual es intermedia: las pantallas pasan principalmente por `dbService`, mientras que `dbService`, autenticación, offline y push todavía importan implementaciones HTTP concretas.

La viabilidad estimada para agregar un segundo backend sin reescribir las pantallas es **alta, alrededor de 7/10**, si el nuevo backend implementa los mismos contratos de dominio. La opción recomendada es conservar una API/BFF como frontera de seguridad y hacer intercambiable la persistencia detrás de ella. Un adapter Firebase directo desde React también es posible, pero obliga a recrear autenticación, permisos, auditoría, idempotencia, estadísticas, offline y notificaciones.

## Revisión redundante

Cuatro revisiones independientes inspeccionaron la estructura del front, sus imports y los flujos clínicos. Las cuatro coincidieron en estos puntos:

| Área | Estado actual | Impacto para cambiar de backend |
|---|---|---|
| Pantallas | Usan mayormente `dbService` | Bajo |
| Cliente HTTP | Centralizado en `apiClient` | Bajo para Express; requiere adapter formal |
| `dbService` | Fachada útil, pero importa `api` directamente | Medio |
| Auth | Cookie HttpOnly, CSRF, allow-list y roles de API | Alto si se pasa a Firebase directo |
| Offline | Outbox propia, pero llama a `api` | Medio/alto |
| Push | VAPID/Web Push específico | Medio/alto; Firebase usaría FCM |
| Bootstrap | Read model agregado dependiente del contrato actual | Medio |
| Reglas clínicas | Servidor relacional y transaccional | Alto en Firestore directo |
| Realtime | La UI no depende actualmente de listeners | Bajo |

La conclusión común es que la fachada existente es una base sólida, pero debe depender de una interfaz de dominio inyectada en vez de importar `apiClient`.

## Arquitectura objetivo

```text
React pages/components
        ↓
  application services / dbService
        ↓
       ports
        ├── Express HTTP adapter → API Express → SQLite/Turso
        └── Firebase adapter     → Firebase Functions/Firestore
```

La selección del proveedor debe ocurrir una sola vez al iniciar la aplicación. Las pantallas no deben contener condicionales `if (firebase)` ni conocer URLs, códigos HTTP o tipos de token.

## Ports recomendados

### Backend clínico

El port debe describir casos de uso y no métodos genéricos de base de datos:

```js
{
  loadInitialState(),
  patients: { list, get, create, update, archive, restore, assign },
  followUps: { list, create },
  alerts: { list, create, resolve },
  hospitals: { list, create, update, archive, restore },
  volunteers: { list, updateOwnProfile },
  access: { list, addVolunteer, remove },
  stats: { mine, global },
}
```

El adapter Express implementaría estas operaciones usando el cliente HTTP existente. Un adapter Firebase implementaría el mismo contrato y devolvería los mismos DTO normalizados.

### AuthPort

```js
{
  getCurrentSession(),
  signInWithGoogle(),
  signOut(),
  subscribe(listener),
}
```

El resultado debe ser una identidad estable del dominio (`id`, `email`, `name`, `photoUrl`, `role`) y no el objeto nativo de Google o Firebase.

### NotificationPort

```js
{
  getPermission(),
  enable(),
  disable(),
  syncExistingDevice(),
}
```

El adapter actual usaría VAPID/Web Push. Un futuro adapter Firebase usaría FCM. La UI no debe conocer `PushSubscription` ni tokens FCM.

### OfflinePort

La outbox y el almacenamiento local deben conservar `clientMutationId`, reintentos, conflictos, autor y estado de sincronización, pero no deben inspeccionar HTTP ni códigos Firebase. El backend inyectado solo debe recibir operaciones de dominio, por ejemplo `followUps.create`.

### Errores

Conviene normalizar errores a una forma independiente del proveedor:

```js
{
  code,
  kind,
  retryable,
  unauthorized,
  conflict,
  details,
}
```

El adapter Express convierte HTTP y el adapter Firebase convierte códigos como `permission-denied`, `unavailable` o `already-exists`.

## Acoplamientos actuales a eliminar

- `dbService` importa directamente `apiClient`.
- `App.jsx` conoce auth, sesión, offline y push concretos.
- `Login.jsx` llama directamente al cliente HTTP.
- `offlineSync.js` llama directamente a `api.patients.createFollowUp`.
- `pushNotifications.js` conoce el contrato VAPID de la API.
- `dbService.isCloudBackend()` siempre devuelve `true`; debe convertirse en una capacidad explícita o desaparecer.

## Firebase: qué se conserva y qué hay que recrear

Firebase es razonable como segundo adapter, pero Firestore no ofrece de forma automática las garantías que hoy da el backend relacional:

- DNI único: requiere un índice determinista y una transacción.
- Asignaciones muchos a muchos: requiere documentos e índices auxiliares.
- Idempotencia offline: requiere IDs deterministas o una tabla de deduplicación.
- Estadísticas: requiere agregados mantenidos por transacciones o funciones.
- Roles y allow-list: requiere claims y funciones confiables, además de reglas.
- Auditoría clínica: las mutaciones sensibles deben pasar por una función confiable.
- Alertas y push: hay que reconstruir la selección por equipo asignado y cambiar VAPID por FCM.
- Costos: listeners de directorios y dashboards pueden producir muchas lecturas.

Por eso se recomienda **Firebase detrás de la API/BFF** si el objetivo es cambiar la persistencia. En ese diseño, Express sigue concentrando cookies, CSRF, roles, auditoría, idempotencia y políticas clínicas; solo se cambia el adapter de repositorio. Firebase directo desde React queda como una opción posterior, con un alcance de ingeniería significativamente mayor.

## Plan de implementación recomendado

1. Definir `BackendPort`, DTO canónicos, `BackendError` y capacidades.
2. Crear `HttpMediceAdapter` con el `apiClient` actual.
3. Hacer que `dbService` reciba el port por inyección.
4. Extraer `AuthPort`, `NotificationPort` y `OfflineStorePort`.
5. Quitar imports directos de `apiClient` de `App`, `Login`, offline y push.
6. Mantener Express como adapter de referencia y ejecutar la suite E2E existente.
7. Crear tests de contrato que ejecuten los mismos casos contra cada adapter.
8. Si se necesita Firebase, implementarlo primero detrás de la API; recién después evaluar acceso directo desde el navegador.

## Criterio de aceptación de la abstracción

El cambio estará listo cuando se pueda seleccionar el adapter desde la composición de infraestructura, sin modificar páginas ni casos de uso, y ambos adapters puedan pasar los casos de login, roles, directorio, alta/edición, seguimiento, alertas, archivo/restauración, estadísticas, offline y push. La validación de Turso queda fuera de este criterio.

