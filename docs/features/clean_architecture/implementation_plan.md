# Plan de Implementación: Arquitectura Hexagonal y DI

Este plan describe el procedimiento controlado por iteraciones para refactorizar los servicios de **Palia** hacia una arquitectura desacoplada basada en Puertos y Adaptadores.

---

## Plan de Trabajo por Iteraciones

### Iteración 1: Estructuración de Puertos y Adaptador LocalStorage
1. **Crear Interfaces/Contratos (Puertos):**
   * Crear `src/core/ports/DatabasePort.js`.
   * Crear `src/core/ports/AuthPort.js`.
   * Crear `src/core/ports/NotificationPort.js`.
2. **Refactorizar Base de Datos Local a Adaptador:**
   * Mudar las operaciones CRUD de local storage de `db.js` a `src/infrastructure/adapters/LocalStorageDatabaseAdapter.js`.
3. **Mudar Autenticación a Adaptador:**
   * Crear `src/infrastructure/adapters/MockAuthAdapter.js` que gestione las sesiones simuladas de Google.

### Iteración 2: Inyector de Dependencias (DI Container)
1. **Crear Contenedor de Servicios (`container.js`):**
   * Programar `src/core/container.js` que resuelva las dependencias en tiempo de ejecución leyendo las variables de entorno (ej: `VITE_USE_FIREBASE`).
   * Exportar una instancia singleton del contenedor conteniendo: `dbService`, `authService`, `notificationService`.

### Iteración 3: Refactorización en Vistas de React
1. **Actualizar Componentes:**
   * Cambiar las importaciones directas de `db.js` en `App.jsx`, `Header.jsx`, `Patients.jsx`, `Volunteers.jsx`, `Administration.jsx`, `Stats.jsx`, `PatientDetail.jsx` para que consuman los servicios resueltos por el `container.js`.
2. **Eliminar `db.js` antiguo** una vez que toda la lógica haya sido trasladada y probada.

### Iteración 4: Implementación de Adaptadores Firebase y Notificaciones
1. **Escribir Adaptadores Reales:**
   * Crear `src/infrastructure/adapters/FirebaseDatabaseAdapter.js` and `src/infrastructure/adapters/FirebaseAuthAdapter.js`.
   * Crear `src/infrastructure/adapters/WebNotificationAdapter.js` unificando la lógica de permisos push de la cabecera.

### Iteración 5: Validación y Regression Suite
1. **Verificar Tests E2E:**
   * Ejecutar la suite completa de Playwright `tests/regression.spec.js` para asegurar que el comportamiento y la persistencia local de la refactorización funcionan de manera idéntica.
   * Tomar nuevas capturas y consolidar la entrega.
