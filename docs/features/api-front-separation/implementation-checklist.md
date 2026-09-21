# Checklist de implementación: API conectada a `front/`

Esta lista define cuándo `api/` está terminada e integrada de forma comprobable con `front/`. Se ejecuta por cortes verticales y se mantiene junto con [loop-state.md](./loop-state.md). No incluye crear bases de datos ni validar credenciales, conexión, migraciones o despliegue contra Turso: esas tareas quedan a cargo del usuario. Todas las comprobaciones de desarrollo y prueba de esta lista deben usar SQLite local/test.

Las dos auditorías redundantes de cuatro agentes están resumidas en [gap-analysis.md](./gap-analysis.md). Los contratos y decisiones de producto están cerrados en los specs; no reabrirlos durante implementación.

## Estado de implementación (iteración 16)

Este trabajo está **en curso**, no terminado. La siguiente lista resume lo que ya tiene evidencia en el código y en la suite ejecutada; los criterios detallados de abajo siguen siendo la fuente de verdad para el trabajo pendiente.

- [x] Aplicación separada en `front/` y `api/`, API scaffold con persistencia SQLite local y contrato `/api` de mismo origen.
- [x] Sesiones de navegador con cookie, flujo de login de desarrollo exclusivo del entorno de prueba y autorización del servidor para los flujos implementados.
- [x] Bootstrap admin `INITIAL_ADMIN_EMAILS`, allow-list/roles y presentación del rol inicial en administración.
- [x] Flujos API/front implementados para fichas, cuidadores, asignaciones, hospitales, seguimientos, alertas, estadísticas y administración; edición de paciente/cuidador incluida.
- [x] Seguimiento online/offline con outbox local, recarga y sincronización; pruebas unitarias y E2E base.
- [x] Duración de seguimiento: defaults 120 min presencial y 60 min remoto; personalizada entre 15 y 1440 min en múltiplos de 15, validada en UI/API e incluida en impresión.
- [x] Alertas múltiples, resolución explícita con nota opcional y formulario que muestra errores de persistencia.
- [x] Perfil propio editable desde Configuración: contacto, especialidad/disponibilidad, trayectoria e imagen; identidad/rol no editables y asignaciones calculadas. E2E valida persistencia del perfil.
- [x] API valida tipos, tamaños y esquema del perfil, restringe imagen a HTTP(S) y rechaza explícitamente intentos de cambiar identidad, rol, permisos o conteos derivados; E2E valida 422 y que no haya mutación.
- [x] Probes E2E para login, ficha, alta, seguimiento, alerta, edición, archivo, administración y layouts responsive. Se abrieron y revisaron visualmente las capturas 01–32.
- [x] `npm test`, builds de API/front y suite E2E configurada pasaron; lint front pasó con warnings.
- [x] Iteraciones 12–16: outbox usa clave compuesta por usuario+mutación; E2E prueba colisión entre cuentas, migración IndexedDB v1→v2 y reingreso/sincronización del autor; PATCH parcial conserva campos omitidos/estado; mutaciones autenticadas sin Origin reciben 403 y logout limpia cookie CSRF; bootstrap admin se asigna una vez y conserva roles persistidos; tests verifican revocación de sesión y privacidad del Service Worker.
- [x] En iteración 5, `npm run test:e2e:api-front-separation` pasó y se revisó visualmente `28-volunteer-profile.png`.
- [x] En iteración 6, E2E aislado comprobó las validaciones server-side del perfil y se revisó visualmente `29-profile-validation.png`.
- [ ] No se considera completo: OAuth con configuración Google real/callback; revisión exhaustiva de cookie/CSRF/RBAC; auditoría detallada; aislamiento offline ante revocación/desasignación y conflicto; proveedor/entrega push; migración de los 13 E2E legacy excluidos; cobertura de todos los AC. Logout/cambio de cuenta y protección de cache/outbox sí tienen E2E local.
- [x] E2E migra una IndexedDB v1 real con operación pendiente a clave compuesta v2, preserva la entrada y sincroniza un seguimiento autorizado del mismo autor al reingresar; solo elimina la outbox tras ACK.
- [ ] `npm run format:check --prefix api` conserva fallo de baseline por 160 ficheros de scaffold sin formato uniforme; los ficheros modificados de esta iteración requieren verificación de formato dirigida.
- [ ] Turso permanece fuera de alcance y no está validado.

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
- [x] Implementar las fórmulas/series derivables de los KPI descritos en functional-spec; eliminar agenda/citas, actividad, frases y logros fijos sin fuente persistida. Estadísticas agregan selector de año, actividad semanal de 7/14 días y reconocimientos personales con fecha de umbral basada en seguimientos confirmados.
- [x] Definir bootstrap de primer admin seguro y de una sola vez; rol inicial se persiste solo al crear la cuenta, bypass de desarrollo y verificador de identidad de test no pueden habilitarse en producción. Un test asegura que logins posteriores no reescriban el rol.
- [ ] Definir OAuth browser end-to-end: callback/retorno permitido, state/nonce (y PKCE si aplica), claims validados, correo verificado/normalizado, cookie única y revocación inmediata por baja/cambio de rol.
- [x] Implementar protección local de outbox ligada al autor: al logout purgar fichas cacheadas y preservar seguimientos pendientes; otra cuenta no los lee/sincroniza. E2E inserta una operación pendiente, cierra sesión, entra con otra cuenta y confirma cola vacía para la cuenta nueva, item retenido con autor original, identidad anterior borrada y cache clínico anterior purgado.
- [ ] Inventariar cada bloque visible de Dashboard, Stats, Volunteers, Administration, Settings, OfflineSync, Header, `front/public/sw.js` y PrintReportPreview; quitar agenda/citas, actividades, frases y logros fijos que no provienen de la base.
- [ ] Implementar “Invitaciones y Accesos” como lista autorizada; quitar enviar/reenviar y estados ficticios. Normalizar email case-insensitive, responder duplicados sin mutación, proteger bootstrap y evitar quitar/degradar el último admin. Coordinador solo agrega voluntario; solo admin cambia roles/revoca.
- [ ] Instalar las dependencias de `api/` desde su lockfile y verificar configuración con entorno local; no usar comandos dirigidos a Turso.
- [ ] Crear `.env.example` seguro para API y documentar arranque SQLite local, OAuth de desarrollo/test y claves de prueba sin secretos reales.
- [x] Añadir `e2e/artifacts/` a `.gitignore`; mantener allí las capturas obligatorias.
- [ ] Acordar fixture/test bootstrap repetible con usuarios admin y voluntario, pacientes, asignaciones y alertas sintéticas; reiniciable solo sobre DB test/local.
- [x] Agregar scripts raíz consistentes para test unitario completo y E2E completo, y un comando E2E aislado de esta feature.
- [x] Crear una página OpenAPI/versionada del contrato con rutas Medice, sesión cookie y requisitos CSRF; queda pendiente automatizar detección de drift entre contrato y cliente.
- [x] Crear proveedor/verificador Google fake solo con `NODE_ENV=test` + `TEST_GOOGLE_AUTH=true`; E2E usa el botón de login, prueba allow-list/admin bootstrap y rechazo; prueba unitaria confirma que el código fake no se acepta en producción.

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
- [x] La validación real exige `email_verified=true`, normaliza el correo y valida audience con el client ID de configuración; el popup exige `X-Requested-With: XmlHttpRequest` y el E2E comprueba que se rechaza si falta.
- [ ] Aplicar allow-list antes de crear una sesión; rechazar usuario no autorizado sin filtrar detalles sensibles.
- [ ] Emitir cookie opaca `__Host-medice_session` con `HttpOnly`, `Secure` fuera de HTTP localhost, `SameSite=Lax`, `Path=/` y sin `Domain`.
- [ ] Rotar identificador al autenticar y al elevar/renovar; persistir hash de sesión, expiración, actividad y revocación server-side.
- [ ] Añadir CSRF token para operaciones mutables, validar `Origin`/origen esperado y configurar proxy TLS de forma segura.
- [ ] Implementar `GET /auth/me`, logout y revocación; comprobar expiración y revocación en peticiones posteriores.
- [ ] Dar rol voluntario por defecto y reservar gestión de allow-list/roles a admin.
- [ ] Probar autorización del servidor para cada clase de ruta: anónimo, voluntario, admin, revocado y sesión vencida.
- [x] No guardar JWT, cookie ni secretos en `localStorage`/`sessionStorage`; el API rechaza JWT Bearer sin sesión cookie y el bypass de desarrollo no puede habilitarse en producción.

## 3. Contrato HTTP y rutas

- [ ] Publicar health/readiness que distingan servicio vivo de DB local disponible sin exponer configuración/secrets.
- [ ] Definir setup/teardown de DB SQLite efímera para E2E y fixtures deterministas; comprobar que los comandos locales de test no pueden seleccionar Turso.
- [ ] Implementar rutas de auth, pacientes/fichas, cuidadores, hospitales, asignaciones, seguimientos, alertas/resolución, estadísticas, allow-list y push subscriptions.
- [x] Implementar el mapping de seguimiento -> DTO canónico -> historial/impresión para todos los campos renderizados, autor desde sesión y fecha de registro; E2E crea y relee el seguimiento y afirma su impresión sin pérdida.
- [ ] Aplicar validación de entrada/salida, límites de tamaño, paginación, normalización y errores estables (`401`, `403`, `404`, `409`, `422`, `5xx`); revisar aún paginación/error uniforme en todos los recursos.
- [ ] Aplicar permisos en todos los endpoints: voluntario ve directorio completo, crea seguimientos para cualquier paciente y resuelve alertas; coordinador además gestiona pacientes/hospitales/asignaciones, restaura pacientes archivados y ve métricas globales; solo admin gestiona roles/admins.
- [ ] Implementar lista paginada de alertas individuales y resolución de una alerta concreta; el detalle muestra activas/resueltas, solicita nota opcional, y refresca estado/conteos sin cerrar las otras alertas.
- [ ] Asegurar invariantes de estado: “Situación Compleja” crea En Observación (nunca Alerta por sí sola); seguimiento estándar no baja a Estable mientras exista alerta activa.
- [ ] Exigir `clientMutationId` en seguimientos encolados; mismo autor/ID/payload devuelve resultado original, payload distinto produce conflicto.
- [x] Actualizar OpenAPI con rutas Medice y auth cookie + CSRF; la generación automática desde rutas y los esquemas detallados de errores/idempotencia quedan pendientes.

## 4. Cliente y pantallas `front/`

- [ ] Crear un cliente HTTP común con base relativa `/api`, `credentials: same-origin`, JSON, CSRF, cancelación y normalización de errores.
- [ ] Configurar proxy Vite `/api` hacia API local y verificar que el navegador conserve mismo origen en desarrollo.
- [ ] Sustituir `dbService`/`localStorage` como fuente canónica por llamadas async a API; `localStorage` no debe sostener datos operativos.
- [ ] Conectar alertas individuales activas/resueltas, resumen agrupado por paciente y resolución individual con confirmación/nota; refrescar detalle/directorio/header/dashboard sin cerrar alertas restantes.
- [ ] Conectar login/logout/identidad a auth API y proteger rutas por identidad/rol cargados desde `/auth/me`.
- [ ] Conectar directorio, detalle, alta/edición de pacientes y cuidadores, hospitales, voluntarios/asignaciones, seguimientos, alertas, administración y estadísticas. Edición de paciente/cuidador es requisito para coordinador/admin e incluye la relación.
- [x] Agregar opción personalizada al formulario de seguimiento (15–1440 minutos, step 15); validar en front y API y conservar valor en historial/impresión.
- [ ] Conectar o retirar/reemplazar cada bloque del inventario por pantalla; cubrir búsqueda global, filtros/paginación, perfil/comunidad, resumen por rol, click push con sesión vencida y vista imprimible.
- [ ] Añadir estados consistentes de carga, vacío, error, reintento, acceso denegado y éxito en cada flujo.
- [ ] Enviar CSRF en todas las mutaciones y tratar `401` como sesión vencida sin perder formularios locales útiles.
- [ ] Verificar que coordinador/admin vean estadísticas agregadas y voluntario solo sus cifras; no confiar en ocultar controles UI como autorización.
- [ ] Eliminar semillas de producción; conservar fixtures solo en entorno de desarrollo/prueba.

## 5. Offline, outbox e idempotencia

- [ ] Implementar IndexedDB con caché explícita de fichas asignadas y abiertas previamente, separada de la sesión.
- [ ] No cachear todo el directorio ni respuestas autenticadas en Cache Storage/service worker; invalidar ficha al perder asignación y eliminar datos cacheados de ficha al cerrar sesión.
- [x] Mantener la outbox offline separada de la caché de fichas y asociada a su autor original; IndexedDB usa clave compuesta usuario+mutación y migra el esquema anterior preservando pendientes. E2E fuerza el mismo ID para dos cuentas y valida aislamiento tras logout/cambio.
- [ ] Permitir crear seguimiento offline solo si hay ficha permitida en caché; voluntarios, coordinadores y admins asignados con perfil voluntario comparten el flujo; mostrar estado pendiente/no sincronizado.
- [x] Generar UUID `clientMutationId` antes de guardar en outbox y conservar payload mínimo necesario.
- [ ] Sincronizar en orden al volver conexión/reautenticarse; backoff en errores transitorios; pausar en `401`; conservar fallos permanentes para revisión.
- [x] Borrar de outbox solo tras ACK de API; E2E confirma eliminación del envío aceptado y retención para revisión de rechazos permanentes.
- [ ] Probar reinicio de navegador, desconexión/reconexión, reintento duplicado, asignación retirada y sesión revocada con datos de prueba locales.
- [x] E2E de logout/cambio a otra cuenta: cache clínica anterior se purga; identidad anterior desaparece; outbox no desaparece y solo queda visible con su usuario dueño.
- [x] E2E de reingreso con el mismo autor sincroniza un pendiente asignado y verifica registro confirmado más eliminación tras ACK.
- [x] E2E de revocación de acceso: la sesión existente no puede consultar identidad ni crear seguimientos (401); prueba unitaria confirma que 401 conserva el pendiente `pending` para reintento tras reautenticación.

## 6. Alertas, push y fallback

- [ ] Crear alerta independiente o ligada al seguimiento con el nivel/motivo/observaciones actuales; persistir seguimiento+alerta en una transacción cuando corresponda.
- [ ] Permitir resolución explícita por cualquier voluntario autenticado y dejar rastro de autor/hora.
- [ ] Implementar registro/actualización/baja de push subscription y dispatch solo después de confirmar la transacción.
- [ ] Enviar al equipo asignado excepto autor, incluyendo coordinadores/admins asignados como voluntarios; fallback in-app si push está deshabilitado o sin permiso.
- [x] Mantener título/cuerpo push genéricos: ninguna PII ni dato clínico en el payload visible o lock screen; API y Service Worker reemplazan contenido y solo conservan IDs de navegación.
- [ ] Verificar click en notificación, sesión requerida para abrir detalle, suscripciones inválidas y errores del proveedor simulados; no enviar push real en pruebas.
- [ ] Verificar que el Service Worker genera contenido genérico y no confía en `title/body` clínicos arbitrarios del payload recibido.

## 7. Integración de mismo origen y empaquetado

- [x] Añadir imagen/build del API y servidor de estáticos del front con ruta `/api/*` en el mismo origen.
- [ ] Configurar mismo origen HTTPS, `trust proxy` solo para proxy controlado, flags cookie seguras, healthchecks y cierre ordenado. Imagen local y smoke HTTP validados; TLS/proxy de producción pendiente.
- [ ] Documentar variables y comandos locales; secretos solo del lado API. La UI usa rutas relativas.
- [x] Probar build y arranque local de la imagen combinada con SQLite local, navegación directa a una ruta SPA y readiness `/api`; el E2E por procesos separados también valida peticiones autenticadas.
- [x] Verificar que el service worker deja `/api/*` directo a red y no añade esos recursos a su precache estático; prueba Node ejecuta el handler con un request API.
- [ ] No ejecutar ni considerar como gate ningún test que requiera URL, token, creación de DB, migración, seed o conexión de Turso.

## 8. Verificación final y Definition of Done

- [ ] Unit API: servicios, validadores, repositorios, permisos, sesiones/CSRF, idempotencia, alertas, estadísticas y notificaciones sin PII.
- [ ] Unit front: API client, estados async, IndexedDB/outbox, reintentos y comportamiento ante respuestas/errores.
- [ ] E2E feature aislado contra API real local + SQLite test/local: login permitido/rechazado; admin CRUD/allow-list/asignación; voluntario directorio/seguimiento/alerta/resolución; estadísticas; offline/reconexión; push simulado.
- [ ] En la cobertura E2E incluir también gestión de hospitales, búsqueda/filtros, acceso revocado con cookie existente, resumen por rol, comunidad/perfil, reporte imprimible y contenido no-demo con DB vacía; probar errores recuperables y conflictos relevantes.
- [ ] E2E de archivado: todos los roles autorizados consultan un paciente archivado; coordinador puede restaurarlo y voluntario/admin reciben 403 al intentar restaurarlo.
- [ ] E2E de hospitales: coordinador y admin archivan/restauran; voluntario recibe 403; hospital archivado no se ofrece para nuevas altas y sigue visible como referencia histórica.
- [ ] E2E de edición de paciente/cuidador: coordinador/admin editan todos los campos y relación; voluntario recibe 403; validar errores y conflicto de concurrencia.
- [x] E2E de duración: defaults presencial/remoto; personalizados 15 y 1440 aceptados; 14, 16, 1441 y valores no múltiplos de 15 rechazados.
- [ ] E2E offline: coordinador/admin asignado con perfil voluntario puede cachear ficha, encolar y sincronizar seguimiento; no asignado no puede usar offline.
- [x] Hacer que el E2E API/front use el Google fake en modo test para probar UI popup, rol bootstrap, allow-list y rechazo. No usar cuenta Google real ni habilitar fake fuera de test.
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
