# Checklist de implementación: API conectada a `front/`

Esta lista define cuándo `api/` está terminada e integrada de forma comprobable con `front/`. Se ejecuta por cortes verticales y se mantiene junto con [loop-state.md](./loop-state.md). No incluye crear bases de datos ni validar credenciales, conexión, migraciones o despliegue contra Turso: esas tareas quedan a cargo del usuario. Todas las comprobaciones de desarrollo y prueba de esta lista deben usar SQLite local/test.

Las dos auditorías redundantes de cuatro agentes están resumidas en [gap-analysis.md](./gap-analysis.md). Los contratos y decisiones de producto están cerrados en los specs; no reabrirlos durante implementación.

## Decisiones funcionales fijadas

- [x] `localStorage` contiene solo datos demo/semilla; no se importan como datos de producción.
- [x] Autenticación Google y allow-list administrada; nuevos usuarios permitidos reciben rol voluntario.
- [x] Voluntarios consultan el directorio completo y pueden registrar seguimiento para cualquier paciente visible.
- [x] Cualquier voluntario autenticado puede resolver explícitamente una alerta activa; un seguimiento ordinario no la resuelve.
- [x] Estadísticas personales para voluntarios y globales para coordinadores y admins; eliminar cifras que no se calculen desde la base.
- [x] Sesión con cookie opaca `HttpOnly`, `Secure`, `SameSite=Lax`, prefijo `__Host-`; CSRF en mutaciones.
- [x] SQLite para desarrollo/test; Turso productivo, sin validación de Turso en esta lista.
- [x] Offline: solo cachear pacientes asignados que el usuario ya abrió; conservar seguimientos pendientes ligados a su autor hasta confirmación e idempotencia al sincronizar.
- [x] Push de alerta al equipo asignado, excluyendo autor; contenido genérico sin datos personales/clínicos.
- [x] Mismo origen público: frontend en `/` y API en `/api` por proxy inverso.
- [x] Preservar todos los campos actuales de paciente, cuidador, seguimiento, perfil, alertas, dashboard/reportes; los mocks sin fuente de base no se muestran como datos reales.
- [x] DNI normalizado a solo dígitos, único, almacenado como string para preservar ceros iniciales; archivar en lugar de borrar.
- [x] Seguimiento presencial 2 h, remoto 1 h, más opción personalizada.
- [x] Duración personalizada de 15 a 1440 minutos, en incrementos de 15.
- [x] Varias alertas activas por paciente; resolución explícita por cualquier voluntario, con nota opcional.
- [x] Coordinador distinto de voluntario: puede ver estadísticas globales, gestionar pacientes/hospitales/asignaciones y agregar voluntarios a allow-list; no asigna admin ni modifica roles existentes.
- [x] El usuario puede editar sus datos de perfil; todos los roles pueden ver los perfiles. Rol, autorización y conteos derivados no son editables en el perfil.
- [x] Admin inicial configurado por variable privada `INITIAL_ADMIN_EMAILS`; el acceso permitido recibe rol admin en su primer login.
- [x] Coordinador puede gestionar pacientes, hospitales y asignaciones; no gestiona roles ni admins.
- [x] Cada persona modifica sus datos de contacto/perfil propios; identidad y permisos están protegidos y las asignaciones se calculan.
- [x] Las ventanas de las estadísticas se interpretan con la zona local del dispositivo consultante.
- [x] Coordinadores pueden participar como voluntarios, recibir asignaciones y push.
- [x] Coordinador/admin asignado puede usar todos los flujos voluntarios para ese paciente, incluido seguimiento, resolución y offline.
- [x] Pacientes archivados son visibles para todos; coordinadores/admins archivan, solo coordinadores restauran.
- [x] Hospitales: coordinador/admin pueden archivar y restaurar; sin borrado físico; ocultos de nuevas altas y preservados en fichas existentes.
- [x] Edición de paciente/cuidador incluida para coordinador/admin, incluyendo relación; voluntario solo lectura.

## 0. Preparar el ciclo de implementación

- [x] Cerrar participación voluntaria del coordinador y permisos de visibilidad/archivo/restauración de pacientes.
- [x] Congelar contrato funcional/técnico tras completar las aclaraciones de producto; no reabrir las decisiones confirmadas.
- [ ] Implementar las fórmulas y series de KPI de functional-spec; eliminar agenda/citas, actividad, frases y logros fijos sin fuente persistida.
- [ ] Definir bootstrap de primer admin seguro y de una sola vez; asegurar que bypass de desarrollo y verificador de identidad de test no pueden habilitarse en producción.
- [ ] Definir OAuth browser end-to-end: callback/retorno permitido, state/nonce (y PKCE si aplica), claims validados, correo verificado/normalizado, cookie única y revocación inmediata por baja/cambio de rol.
- [ ] Implementar protección local de outbox ligada al autor: al logout purgar fichas cacheadas y preservar seguimientos pendientes; otra cuenta no los lee/sincroniza. Si el autor pierde autorización, el API rechaza la sincronización y el elemento queda retenido como conflicto; no cambiar autor ni descartar en silencio.
- [ ] Inventariar cada bloque visible de Dashboard, Stats, Volunteers, Administration, Settings, OfflineSync, Header, `front/public/sw.js` y PrintReportPreview; quitar agenda/citas, actividades, frases y logros fijos que no provienen de la base.
- [ ] Implementar “Invitaciones y Accesos” como lista autorizada; quitar enviar/reenviar y estados ficticios. Normalizar email case-insensitive, responder duplicados sin mutación, proteger bootstrap y evitar quitar/degradar el último admin. Coordinador solo agrega voluntario; solo admin cambia roles/revoca.
- [ ] Instalar las dependencias de `api/` desde su lockfile y verificar configuración con entorno local; no usar comandos dirigidos a Turso.
- [ ] Crear `.env.example` seguro para API y documentar arranque SQLite local, OAuth de desarrollo/test y claves de prueba sin secretos reales.
- [ ] Añadir `e2e/artifacts/` a `.gitignore`; mantener allí las capturas obligatorias.
- [ ] Acordar fixture/test bootstrap repetible con usuarios admin y voluntario, pacientes, asignaciones y alertas sintéticas; reiniciable solo sobre DB test/local.
- [ ] Agregar scripts raíz consistentes para test unitario completo y E2E completo, y un comando E2E aislado de esta feature. Hoy existen scripts por app, pero no están definidos todos esos gates raíz.
- [ ] Crear una página OpenAPI/versionada del contrato y estrategia para detectar diferencias entre contrato, API y cliente.
- [ ] Crear proveedor/verificador OIDC falso solo para `NODE_ENV=test`, con fixture claims positivos/negativos y fallo de arranque/build si ese modo se activa en producción.

## 1. Persistencia y dominio API

- [ ] Definir migraciones Knex compatibles con SQLite local/test para usuarios/roles/sesiones, pacientes, cuidadores, hospitales, asignaciones, seguimientos, alertas, allow-list, auditoría y suscripciones push.
- [ ] Añadir claves foráneas, índices, restricciones e invariantes: relación de cuidador vigente, DNI según política acordada, claves únicas de idempotencia, integridad de asignaciones y estados de alerta.
- [ ] Implementar repositorios y servicios de dominio separados de HTTP para CRUD, filtros/paginación y transacciones.
- [ ] Persistir cada seguimiento como historial append-only con autor, hora UTC y campos validados; no sobrescribir historial.
- [ ] Crear alerta en la misma transacción que su seguimiento cuando el formulario incluye nivel/motivo/observaciones; resolver solo mediante operación explícita y conservar quién/cuándo/nota.
- [ ] Implementar asignación/desasignación de pacientes y actualizar/invalidar el acceso offline correspondiente.
- [ ] Implementar estadísticas personales y globales con la regla de horas definida en el technical spec.
- [ ] Registrar auditoría de accesos/roles, cambios de paciente, asignaciones y resolución de alertas sin guardar texto clínico sensible en logs.
- [ ] Verificar migraciones, relaciones, transacciones, índices e invariantes exclusivamente sobre SQLite local/test.

## 2. Autenticación, sesión y autorización

- [ ] Integrar OAuth Google server-side y comprobar la identidad/token en API; nunca confiar en el usuario/rol enviado por React.
- [ ] Aplicar allow-list antes de crear una sesión; rechazar usuario no autorizado sin filtrar detalles sensibles.
- [ ] Emitir cookie opaca `__Host-medice_session` con `HttpOnly`, `Secure` fuera de HTTP localhost, `SameSite=Lax`, `Path=/` y sin `Domain`.
- [ ] Rotar identificador al autenticar y al elevar/renovar; persistir hash de sesión, expiración, actividad y revocación server-side.
- [ ] Añadir CSRF token para operaciones mutables, validar `Origin`/origen esperado y configurar proxy TLS de forma segura.
- [ ] Implementar `GET /auth/me`, logout y revocación; comprobar expiración y revocación en peticiones posteriores.
- [ ] Dar rol voluntario por defecto y reservar gestión de allow-list/roles a admin.
- [ ] Probar autorización del servidor para cada clase de ruta: anónimo, voluntario, admin, revocado y sesión vencida.
- [ ] No guardar JWT, cookie ni secretos en `localStorage`/`sessionStorage`; eliminar el bypass de rol/login demo en el front.

## 3. Contrato HTTP y rutas

- [ ] Publicar health/readiness que distingan servicio vivo de DB local disponible sin exponer configuración/secrets.
- [ ] Definir setup/teardown de DB SQLite efímera para E2E y fixtures deterministas; comprobar que los comandos locales de test no pueden seleccionar Turso.
- [ ] Implementar rutas de auth, pacientes/fichas, cuidadores, hospitales, asignaciones, seguimientos, alertas/resolución, estadísticas, allow-list y push subscriptions.
- [ ] Implementar el mapping exacto de claves `NewFollowUp` -> DTO canónico -> historial/impresión, incluida modalidad/duración, autor desde sesión y timestamps `occurredAt`/`recordedAt`; roundtrip create → read → print sin pérdida.
- [ ] Aplicar validación de entrada/salida, límites de tamaño, paginación, normalización y errores estables (`401`, `403`, `404`, `409`, `422`, `5xx`).
- [ ] Aplicar permisos en todos los endpoints: voluntario ve directorio completo, crea seguimientos para cualquier paciente y resuelve alertas; coordinador además gestiona pacientes/hospitales/asignaciones, restaura pacientes archivados y ve métricas globales; solo admin gestiona roles/admins.
- [ ] Implementar lista paginada de alertas individuales y resolución de una alerta concreta; el detalle muestra activas/resueltas, solicita nota opcional, y refresca estado/conteos sin cerrar las otras alertas.
- [ ] Asegurar invariantes de estado: “Situación Compleja” crea En Observación (nunca Alerta por sí sola); seguimiento estándar no baja a Estable mientras exista alerta activa.
- [ ] Exigir `clientMutationId` en seguimientos encolados; mismo autor/ID/payload devuelve resultado original, payload distinto produce conflicto.
- [ ] Generar/actualizar OpenAPI desde las rutas y documentar auth cookie, CSRF, errores e idempotencia.

## 4. Cliente y pantallas `front/`

- [ ] Crear un cliente HTTP común con base relativa `/api`, `credentials: same-origin`, JSON, CSRF, cancelación y normalización de errores.
- [ ] Configurar proxy Vite `/api` hacia API local y verificar que el navegador conserve mismo origen en desarrollo.
- [ ] Sustituir `dbService`/`localStorage` como fuente canónica por llamadas async a API; `localStorage` no debe sostener datos operativos.
- [ ] Conectar alertas individuales activas/resueltas, resumen agrupado por paciente y resolución individual con confirmación/nota; refrescar detalle/directorio/header/dashboard sin cerrar alertas restantes.
- [ ] Conectar login/logout/identidad a auth API y proteger rutas por identidad/rol cargados desde `/auth/me`.
- [ ] Conectar directorio, detalle, alta/edición de pacientes y cuidadores, hospitales, voluntarios/asignaciones, seguimientos, alertas, administración y estadísticas. Edición de paciente/cuidador es requisito para coordinador/admin e incluye la relación.
- [ ] Agregar opción personalizada al formulario de seguimiento (15–1440 minutos, step 15); validar en front y API y conservar valor en historial/impresión.
- [ ] Conectar o retirar/reemplazar cada bloque del inventario por pantalla; cubrir búsqueda global, filtros/paginación, perfil/comunidad, resumen por rol, click push con sesión vencida y vista imprimible.
- [ ] Añadir estados consistentes de carga, vacío, error, reintento, acceso denegado y éxito en cada flujo.
- [ ] Enviar CSRF en todas las mutaciones y tratar `401` como sesión vencida sin perder formularios locales útiles.
- [ ] Verificar que coordinador/admin vean estadísticas agregadas y voluntario solo sus cifras; no confiar en ocultar controles UI como autorización.
- [ ] Eliminar semillas de producción; conservar fixtures solo en entorno de desarrollo/prueba.

## 5. Offline, outbox e idempotencia

- [ ] Implementar IndexedDB con caché explícita de fichas asignadas y abiertas previamente, separada de la sesión.
- [ ] No cachear todo el directorio ni respuestas autenticadas en Cache Storage/service worker; invalidar ficha al perder asignación y eliminar datos cacheados de ficha al cerrar sesión.
- [ ] Mantener la outbox offline separada de la caché de fichas y asociada a su autor original; nunca borrar pendientes por logout ni hacer que otra cuenta los pueda ver/enviar.
- [ ] Permitir crear seguimiento offline solo si hay ficha permitida en caché; voluntarios, coordinadores y admins asignados con perfil voluntario comparten el flujo; mostrar estado pendiente/no sincronizado.
- [ ] Generar UUID `clientMutationId` antes de guardar en outbox y conservar payload mínimo necesario.
- [ ] Sincronizar en orden al volver conexión/reautenticarse; backoff en errores transitorios; pausar en `401`; conservar fallos permanentes para revisión.
- [ ] Borrar de outbox solo tras ACK de API; presentar conflicto de idempotencia sin descartar datos.
- [ ] Probar reinicio de navegador, desconexión/reconexión, reintento duplicado, asignación retirada y sesión revocada con datos de prueba locales.
- [ ] Probar logout y reingreso con misma cuenta, otra cuenta y autor revocado; cache clínico no visible tras logout y outbox nunca cambia de autor ni desaparece sin confirmación/acción explícita.

## 6. Alertas, push y fallback

- [ ] Crear alerta independiente o ligada al seguimiento con el nivel/motivo/observaciones actuales; persistir seguimiento+alerta en una transacción cuando corresponda.
- [ ] Permitir resolución explícita por cualquier voluntario autenticado y dejar rastro de autor/hora.
- [ ] Implementar registro/actualización/baja de push subscription y dispatch solo después de confirmar la transacción.
- [ ] Enviar al equipo asignado excepto autor, incluyendo coordinadores/admins asignados como voluntarios; fallback in-app si push está deshabilitado o sin permiso.
- [ ] Mantener título/cuerpo push genéricos: ninguna PII ni dato clínico en payload, logs o lock screen.
- [ ] Verificar click en notificación, sesión requerida para abrir detalle, suscripciones inválidas y errores del proveedor simulados; no enviar push real en pruebas.
- [ ] Verificar que el Service Worker genera contenido genérico y no confía en `title/body` clínicos arbitrarios del payload recibido.

## 7. Integración de mismo origen y empaquetado

- [ ] Añadir imagen/build del API y servidor/proxy de estáticos del front con ruta `/api/*` hacia API.
- [ ] Configurar mismo origen HTTPS, `trust proxy` solo para proxy controlado, flags cookie seguras, healthchecks y cierre ordenado.
- [ ] Documentar variables y comandos locales; secretos solo del lado API. La UI usa rutas relativas.
- [ ] Probar build y arranque local de ambos procesos/contendedor(es) contra SQLite, incluyendo navegación directa/refresh SPA y llamadas autenticadas `/api`.
- [ ] Verificar que service worker no intercepte ni almacene `/api/*`.
- [ ] No ejecutar ni considerar como gate ningún test que requiera URL, token, creación de DB, migración, seed o conexión de Turso.

## 8. Verificación final y Definition of Done

- [ ] Unit API: servicios, validadores, repositorios, permisos, sesiones/CSRF, idempotencia, alertas, estadísticas y notificaciones sin PII.
- [ ] Unit front: API client, estados async, IndexedDB/outbox, reintentos y comportamiento ante respuestas/errores.
- [ ] E2E feature aislado contra API real local + SQLite test/local: login permitido/rechazado; admin CRUD/allow-list/asignación; voluntario directorio/seguimiento/alerta/resolución; estadísticas; offline/reconexión; push simulado.
- [ ] En la cobertura E2E incluir también gestión de hospitales, búsqueda/filtros, acceso revocado con cookie existente, resumen por rol, comunidad/perfil, reporte imprimible y contenido no-demo con DB vacía; probar errores recuperables y conflictos relevantes.
- [ ] E2E de archivado: todos los roles autorizados consultan un paciente archivado; coordinador puede restaurarlo y voluntario/admin reciben 403 al intentar restaurarlo.
- [ ] E2E de hospitales: coordinador y admin archivan/restauran; voluntario recibe 403; hospital archivado no se ofrece para nuevas altas y sigue visible como referencia histórica.
- [ ] E2E de edición de paciente/cuidador: coordinador/admin editan todos los campos y relación; voluntario recibe 403; validar errores y conflicto de concurrencia.
- [ ] E2E de duración: defaults presencial/remoto; personalizados 15 y 1440 aceptados; 14, 16, 1441 y valores no múltiplos de 15 rechazados.
- [ ] E2E offline: coordinador/admin asignado con perfil voluntario puede cachear ficha, encolar y sincronizar seguimiento; no asignado no puede usar offline.
- [ ] Hacer que los E2E de OAuth usen proveedor/verificador fake en modo test. No usar una cuenta Google real ni habilitar bypass/fixtures de auth en ejecución de producción.
- [ ] Capturar explícitamente todas las capturas de la manifest en `e2e/artifacts/screenshots/api-front-separation/`; abrir/revisar cada PNG y anotar el resultado en `loop-state.md`.
- [ ] Ejecutar el conjunto completo unitario de ambas apps y el conjunto completo E2E; guardar comandos/resultados en `loop-state.md`.
- [ ] Ejecutar builds de `api/` y `front/`, lint/format disponibles y comprobar que no hay secretos, archivos DB locales ni artefactos de prueba staged.
- [ ] Validar las reglas del Service Worker con `/api` network-only, sin respuestas clínicas en Cache Storage, y navegación offline que no aparente una API disponible.
- [ ] Comprobar contractualmente roles/CSRF/cookies, ausencia de PII en push/logs y ausencia de datos operativos en `localStorage`.
- [ ] Mapear cada criterio de aceptación funcional a implementación y test con resultado verde.
- [ ] Actualizar README de raíz y ambos proyectos con arranque local y flujo de pruebas SQLite.
- [ ] Marcar checklist/AC completos y `Next iteration focus: COMPLETE` solo después de todos los gates anteriores.

### Excluido explícitamente

No validar conexión o credenciales Turso, crear/restaurar DB Turso, ejecutar migraciones/seeds contra Turso, ni comprobar despliegue conectado a Turso. La configuración de esa base y sus credenciales la realizará el usuario.
