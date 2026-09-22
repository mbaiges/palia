# Checklist de implementación: API conectada a `front/`

Esta lista define cuándo `api/` está terminada e integrada de forma comprobable con `front/`. Se ejecuta por cortes verticales y se mantiene junto con [loop-state.md](./loop-state.md). No incluye crear bases de datos ni validar credenciales, conexión, migraciones o despliegue contra Turso: esas tareas quedan a cargo del usuario. Todas las comprobaciones de desarrollo y prueba de esta lista deben usar SQLite local/test.

Las dos auditorías redundantes de cuatro agentes están resumidas en [gap-analysis.md](./gap-analysis.md). Los contratos y decisiones de producto están cerrados en los specs; no reabrirlos durante implementación.

## Estado de implementación (iteración 40)

Los recorridos de producto tienen evidencia local contra SQLite y el cotejo por criterio está en [acceptance-coverage.md](./acceptance-coverage.md). Continúan abiertos solo los puntos enumerados aquí; no se valida Turso.

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
- [x] Iteración 18: la baja push requiere propietario; el endpoint genérico rechaza eliminar Admin; alertas soportan `limit`/`cursor` con metadatos y E2E de contrato.
- [x] El Playwright usa puertos disponibles asignados por su runner, sin asumir 5173/3100; E2E de aceptación y responsive mobile/desktop pasan 3/3.
- [x] QA visual mobile (390/344 px): capturas de directorio, ajustes offline, login y estadísticas leídas; subtítulo de ajustes ahora ajusta línea y se valida que no quede recortado.
- [x] Iteración 19: E2E confirma que una outbox perteneciente a una cuenta revocada sobrevive a un intento de reautenticación fallido; no se borra ni se expone a otra cuenta. Capturas 14/15/16/35 se regeneraron y revisaron.
- [x] Iteración 20: E2E cubre permisos de archivo/restauración de hospitales por voluntario/coordinador/admin y visibilidad de archivo vs listado activo; smoke mobile prueba búsqueda por nombre, estado vacío y filtro de estabilidad.
- [x] Iteración 21: la aceptación confirma PATCH de ficha permitido al coordinador (200) y denegado al voluntario (403), conservando los datos de paciente/cuidador.
- [x] Iteración 22: todos los roles leen paciente archivado; solo coordinador restaura (200), admin y voluntario reciben 403.
- [x] Iteración 23: E2E mobile detectó y corrigió la acción para registrar seguimiento oculta; ficha y formulario quedaron capturados/revisados en las imágenes 39–40. Prueba unitaria verifica flags de cookie `__Host-` en producción.
- [x] Iteración 24: suite completa actualizada (API 46 suites/344 tests; front 19), E2E raíz 3/3, builds/lint y Docker SQLite smoke repetidos sin validar Turso.
- [x] Iteración 25: coordinador asignado crea y sincroniza seguimiento offline; voluntario no asignado no puede guardarlo offline ni genera outbox. Correo repetido en allow-list devuelve 409 en vez de 500.
- [x] Iteración 26: alta con DNI duplicado devuelve error 409 y conserva campos; hospital archivado no aparece en nuevas fichas; PATCH de ficha rechaza `updatedAt` obsoleto con 409 sin sobrescribir los datos recientes.
- [x] Iteración 27: E2E raíz 3/3, API 46 suites/344 tests, front 19 tests, ambos builds, lint y Docker SQLite smoke después de los últimos cambios.
- [x] Iteración 28: auditoría transaccional de ficha, asignaciones, seguimientos, alertas, roles y cambios de allow-list; E2E comprueba eventos sensibles sin diagnóstico, DNI ni observaciones clínicas. La vista imprimible se ajustó para móvil y E2E verifica que acciones, ficha y columnas no se superpongan ni recorten; capturas 45/46 revisadas.
- [x] Iteración 29: cobertura móvil adicional para comunidad, asignaciones/centros y lista autorizada a 390 px; capturas 47–49 inspeccionadas. El helper responsive ahora siembra por API su propio paciente si la prueba de aceptación no corrió antes.
- [x] Iteración 30: Configuración/perfil en móvil; el espacio desplazable inferior incluye la altura de navegación y safe area. E2E mueve el perfil al final y confirma que “Guardar perfil” queda completamente por encima de la barra inferior; capturas 50/51 inspeccionadas.
- [x] Iteración 31: E2E móvil verifica búsqueda de comunidad con resultado/sin resultados y desplazamiento al formulario de alta de centros; confirma que la acción queda por encima de la navegación inferior. Captura 52 inspeccionada.
- [x] Iteración 32: E2E comprueba el click push con sesión cerrada y el destino móvil; popovers esperan fin de animación y sus capturas 53–55 se revisaron. El E2E raíz encontró una verificación de scroll frágil; tras desplazar el botón mismo, suite responsive pasó 3/3 y la suite completa 4/4.
- [x] Gate final iteración 32: `npm test` (API 46 suites/346 tests, front 19), E2E feature 1/1, E2E raíz 4/4, build API/front, lint front y Docker + SQLite smoke completados. No hubo conexión a Turso.
- [x] Iteración 33: proxy confiable por conteo explícito de saltos, default `0`, límites/errores unitarios; shutdown SIGTERM/SIGINT para Socket.IO/HTTP, SQLite y job periódico. Docker SQLite smoke comprobó health/root/SPA, y `docker stop` activó cierre ordenado.
- [x] QA visual 33: el E2E espera que el tab allow-list termine su transición de color antes de capturar. Captura 49 y las imágenes móviles 39–55 fueron abiertas otra vez tras el último E2E raíz; pestaña activa, formularios, CTAs, popovers y barra inferior se ven correctamente.
- [x] Gate final iteración 33: API 47 suites/353 tests; front 19; acceptance E2E 1/1; E2E raíz 4/4; build API/front, lint front, Docker/SQLite y `git diff --check` verdes. Turso no se llamó.
- [x] Iteración 34: lecturas y presentación de pacientes separadas en servicio/repositorio con pruebas unitarias de DTO, filtro por acento/estado y paginación; 360×800 agregado como viewport móvil promedio y recorrido de directorio/ficha/seguimiento/estadísticas cubierto por Playwright.
- [x] Iteración 35: viewport 360×800 amplía el recorrido a notificaciones, comunidad, centros, allow-list y perfil; Playwright pasó 5/5 responsive. Capturas 59–63 fueron abiertas y revisadas; sin desbordamiento horizontal ni acciones primarias bajo la navegación fija.
- [x] Iteración 36: operaciones de centros (lista, alta/edición, archivo/restauración) y asignación de voluntarios pasan por `MediceOperationsService`/`MediceOperationsRepository` y adaptador SQLite; servicio valida datos, existencia de referencias, deduplica asignaciones y mantiene reemplazo transaccional con auditoría.
- [x] Gate local iteración 36: API 49 suites/357 tests; front 19 tests; Playwright raíz 6/6; acceptance aislado 1/1; builds API/front, lint front, Docker build + SQLite smoke (`/api/health/ready`, `/`, `/patients/123` todos 200) y `git diff --check` pasaron. Sin Turso.
- [x] Iteración 37: seguimientos (listado, validación, idempotencia, transacción con alerta, auditoría y notificación genérica) pasan por `MediceFollowUpService`/repositorio SQLite; el contrato y payload del front se conservan.
- [x] Gate local iteración 37: API 50 suites/359 tests; front 19; E2E raíz 6/6 y acceptance 1/1; builds API/front, lint y `git diff --check` verdes. No se validó Turso.
- [x] Iteración 40: voluntarios, allow-list y estadísticas pasan por `MediceDirectoryService`/repositorio SQLite; se preservan búsqueda, conteo de asignaciones, auditoría, conflictos de email y métricas personales/globales.
- [x] Iteración 38: alertas (listado paginado, alta, resolución con nota y auditoría) pasan por `MediceAlertService`/repositorio SQLite; se mantiene la notificación genérica al equipo asignado.
- [x] Iteración 39: lectura y edición del perfil propio pasan por `MediceProfileService`/repositorio SQLite; campos protegidos, límites, URL de avatar y conteo de asignaciones se mantienen en el servicio.
- [x] En iteración 5, `npm run test:e2e:api-front-separation` pasó y se revisó visualmente `28-volunteer-profile.png`.
- [x] En iteración 6, E2E aislado comprobó las validaciones server-side del perfil y se revisó visualmente `29-profile-validation.png`.
- [x] Los criterios de producto y privacidad de auditoría, aislamiento offline, push genérico y permisos tienen pruebas locales; los límites y la evidencia por criterio están detallados en `acceptance-coverage.md`. Los 13 specs antiguos usan personas/localStorage demo y se retiran del gate; la suite actual reemplaza los recorridos de API y mobile relevantes.
- [x] E2E migra una IndexedDB v1 real con operación pendiente a clave compuesta v2, preserva la entrada y sincroniza un seguimiento autorizado del mismo autor al reingresar; solo elimina la outbox tras ACK.
- [x] Se ejecutó `npm run format:check --prefix api`: el scaffold base falla por 160 ficheros sin formato uniforme. Prettier dirigido reporta 11 archivos modificados con estilo heredado/mixto; se conserva el formato existente para no crear una reescritura masiva ajena al cambio. `git diff --check` pasa.
- [x] Turso permanece fuera de alcance y no está validado; ningún gate lo contactó.

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
- [x] Definir e implementar OAuth browser end-to-end con GIS authorization-code popup (sin callback de redirect propio), protección `X-Requested-With`, intercambio server-side, verificación Google de claims/issuer/audience/expiración/email verificado, allow-list y cookie de sesión. State/nonce/PKCE quedan como requisito solo si se migra a redirect; credenciales productivas se configuran fuera de este gate.
- [x] Implementar protección local de outbox ligada al autor: al logout purgar fichas cacheadas y preservar seguimientos pendientes; otra cuenta no los lee/sincroniza. E2E inserta una operación pendiente, cierra sesión, entra con otra cuenta y confirma cola vacía para la cuenta nueva, item retenido con autor original, identidad anterior borrada y cache clínico anterior purgado.
- [x] Inventariar cada bloque visible de Dashboard, Stats, Volunteers, Administration, Settings, OfflineSync, Header, `front/public/sw.js` y PrintReportPreview; quitar agenda/citas, actividades, frases y logros fijos que no provienen de la base. Cotejo final registrado en `acceptance-coverage.md`.
- [x] Implementar “Invitaciones y Accesos” como lista autorizada; quitar enviar/reenviar y estados ficticios. Normalizar email case-insensitive, responder duplicados sin mutación, proteger bootstrap y evitar quitar/degradar el último admin. Coordinador solo agrega voluntario; solo admin cambia roles/revoca.
- [x] Instalar las dependencias de `api/` desde su lockfile y verificar configuración con entorno local; no usar comandos dirigidos a Turso.
- [x] Crear `.env.example` seguro para API y documentar arranque SQLite local, OAuth de desarrollo/test y claves de prueba sin secretos reales.
- [x] Añadir `e2e/artifacts/` a `.gitignore`; mantener allí las capturas obligatorias.
- [x] Acordar fixture/test bootstrap repetible con usuarios admin y voluntario, pacientes, asignaciones y alertas sintéticas; reiniciable solo sobre DB test/local. Playwright crea una SQLite aislada por ejecución.
- [x] Agregar scripts raíz consistentes para test unitario completo y E2E completo, y un comando E2E aislado de esta feature.
- [x] Crear una página OpenAPI/versionada del contrato con rutas Medice, sesión cookie y requisitos CSRF; queda pendiente automatizar detección de drift entre contrato y cliente.
- [x] Crear proveedor/verificador Google fake solo con `NODE_ENV=test` + `TEST_GOOGLE_AUTH=true`; E2E usa el botón de login, prueba allow-list/admin bootstrap y rechazo; prueba unitaria confirma que el código fake no se acepta en producción.

## 1. Persistencia y dominio API

- [x] Definir migraciones Knex compatibles con SQLite local/test para usuarios/roles/sesiones, pacientes, cuidadores, hospitales, asignaciones, seguimientos, alertas, allow-list, auditoría y suscripciones push.
- [x] Añadir claves foráneas, índices, restricciones e invariantes: relación de cuidador vigente, DNI según política acordada, claves únicas de idempotencia, integridad de asignaciones y estados de alerta.
- [x] Revisar el agregador `bootstrap`: se mantiene como read-model de composición HTTP para hidratar la aplicación en una sola respuesta; las reglas y mutaciones de dominio ya están en servicios/repositorios.
- [x] Persistir cada seguimiento como historial append-only con autor, hora UTC y campos validados; no sobrescribir historial.
- [x] Crear alerta en la misma transacción que su seguimiento cuando el formulario incluye nivel/motivo/observaciones; resolver solo mediante operación explícita y conservar quién/cuándo/nota.
- [x] Implementar asignación/desasignación de pacientes y actualizar/invalidar el acceso offline correspondiente.
- [x] Implementar estadísticas personales y globales con la regla de horas definida en el technical spec.
- [x] Registrar auditoría de accesos/roles, cambios de paciente, asignaciones y resolución de alertas sin guardar texto clínico sensible en logs.
- [x] Verificar migraciones, relaciones, transacciones, índices e invariantes exclusivamente sobre SQLite local/test.

## 2. Autenticación, sesión y autorización

- [x] Integrar OAuth Google server-side y comprobar la identidad/token en API; nunca confiar en el usuario/rol enviado por React.
- [x] La validación real exige `email_verified=true`, normaliza el correo y valida audience con el client ID de configuración; el popup exige `X-Requested-With: XmlHttpRequest` y el E2E comprueba que se rechaza si falta.
- [x] Aplicar allow-list antes de crear una sesión; rechazar usuario no autorizado sin filtrar detalles sensibles.
- [x] Emitir cookie opaca `__Host-medice_session` con `HttpOnly`, `Secure` en producción, `SameSite=Lax`, `Path=/` y sin `Domain`; test unitario inspecciona flags de producción.
- [x] Crear un identificador aleatorio opaco al autenticar; persistir hash, expiración, actividad y revocación server-side. No hay elevación de rol desde una sesión: el cambio administrativo revoca/revalida permisos.
- [x] Añadir CSRF token para operaciones mutables y validar `Origin`/origen esperado; proxy confiable queda deshabilitado por defecto y solo se habilita con `TRUST_PROXY_HOPS` explícito.
- [x] Implementar `GET /auth/me`, logout y revocación; comprobar expiración y revocación en peticiones posteriores.
- [x] Dar rol voluntario por defecto y reservar gestión de allow-list/roles a admin.
- [x] Probar autorización del servidor para cada clase de ruta: anónimo, voluntario, coordinador, admin, revocado y sesión vencida.
- [x] No guardar JWT, cookie ni secretos en `localStorage`/`sessionStorage`; el API rechaza JWT Bearer sin sesión cookie y el bypass de desarrollo no puede habilitarse en producción.

## 3. Contrato HTTP y rutas

- [x] Publicar health/readiness que distingan servicio vivo de DB local disponible sin exponer configuración/secrets.
- [x] Definir setup/teardown de DB SQLite efímera para E2E y fixtures deterministas; los scripts Playwright fuerzan DB local/test y no leen variables Turso.
- [x] Implementar rutas de auth, pacientes/fichas, cuidadores, hospitales, asignaciones, seguimientos, alertas/resolución, estadísticas, allow-list y push subscriptions.
- [x] Implementar el mapping de seguimiento -> DTO canónico -> historial/impresión para todos los campos renderizados, autor desde sesión y fecha de registro; E2E crea y relee el seguimiento y afirma su impresión sin pérdida.
- [x] Aplicar validación de entrada/salida, límites de tamaño, paginación en colecciones de dominio, normalización y errores estables (`401`, `403`, `404`, `409`, `422`, `5xx`). Catálogos de hospitales/allow-list se entregan completos por su tamaño acotado; las rutas paginadas tienen orden estable.
- [x] Aplicar permisos en todos los endpoints: voluntario ve directorio completo, crea seguimientos para cualquier paciente y resuelve alertas; coordinador además gestiona pacientes/hospitales/asignaciones, restaura pacientes archivados y ve métricas globales; solo admin gestiona roles/admins.
- [x] Implementar lista paginada de alertas individuales y resolución de una alerta concreta; el detalle muestra activas/resueltas, solicita nota opcional, y refresca estado/conteos sin cerrar las otras alertas.
- [x] Asegurar invariantes de estado: “Situación Compleja” crea En Observación (nunca Alerta por sí sola); seguimiento estándar no baja a Estable mientras exista alerta activa.
- [x] Exigir `clientMutationId` en seguimientos encolados; mismo autor/ID/payload devuelve resultado original, payload distinto produce conflicto.
- [x] Actualizar OpenAPI con rutas Medice y auth cookie + CSRF; la generación automática desde rutas y los esquemas detallados de errores/idempotencia quedan pendientes.

## 4. Cliente y pantallas `front/`

- [x] Crear un cliente HTTP común con base relativa `/api`, credenciales incluidas, JSON, CSRF, cancelación vía `RequestInit.signal` y normalización de errores. Pruebas unitarias verifican el contrato, CSRF cacheado, camelización, 422 y evento de 401.
- [x] Configurar proxy Vite `/api` hacia API local y verificar mismo origen y mutaciones autenticadas desde Playwright.
- [x] Sustituir `dbService`/`localStorage` como fuente canónica por llamadas async a API; `localStorage` conserva solo preferencia visual de tema, no datos operativos.
- [x] Conectar alertas individuales activas/resueltas, resumen agrupado por paciente y resolución individual con confirmación/nota; refrescar detalle/directorio/header/dashboard sin cerrar las alertas restantes.
- [x] Conectar login/logout/identidad a auth API y proteger rutas por identidad/rol cargados desde `/auth/me`.
- [x] Conectar directorio, detalle, alta/edición de pacientes y cuidadores, hospitales, voluntarios/asignaciones, seguimientos, alertas, administración y estadísticas. Edición de paciente/cuidador incluye la relación.
- [x] Agregar opción personalizada al formulario de seguimiento (15–1440 minutos, step 15); validar en front y API y conservar valor en historial/impresión.
- [x] Conectar o retirar/reemplazar cada bloque del inventario por pantalla; cubrir búsqueda global, filtros/paginación, perfil/comunidad, resumen por rol, click push con sesión vencida y vista imprimible.
- [x] Añadir estados de carga, vacío, error, reintento, acceso denegado y éxito a los recorridos conectados.
- [x] Enviar CSRF en las mutaciones centralizadas y tratar `401` como sesión vencida; formularios offline válidos permanecen en IndexedDB hasta respuesta/revisión.
- [x] Verificar que coordinador/admin vean estadísticas agregadas y voluntario solo sus cifras; el servidor autoriza cada endpoint además del control de interfaz.
- [x] Eliminar semillas de producción; conservar fixtures solo en entorno de desarrollo/prueba.

## 5. Offline, outbox e idempotencia

- [x] Implementar IndexedDB con caché explícita de fichas asignadas y abiertas previamente, separada de la sesión.
- [x] No cachear todo el directorio ni respuestas autenticadas en Cache Storage/service worker; invalidar ficha al perder asignación y eliminar datos cacheados de ficha al cerrar sesión.
- [x] Mantener la outbox offline separada de la caché de fichas y asociada a su autor original; IndexedDB usa clave compuesta usuario+mutación y migra el esquema anterior preservando pendientes. E2E fuerza el mismo ID para dos cuentas y valida aislamiento tras logout/cambio.
- [x] Permitir crear seguimiento offline solo si hay ficha permitida en caché; voluntarios, coordinadores y admins asignados con perfil voluntario comparten el flujo; mostrar estado pendiente/no sincronizado.
- [x] Generar UUID `clientMutationId` antes de guardar en outbox y conservar payload mínimo necesario.
- [x] Sincronizar en orden al volver conexión/reautenticarse; backoff en errores transitorios; pausar en `401`; conservar fallos permanentes para revisión.
- [x] Borrar de outbox solo tras ACK de API; E2E confirma eliminación del envío aceptado y retención para revisión de rechazos permanentes.
- [x] Probar recarga/cierre de sesión, desconexión/reconexión, reintento duplicado y sesión revocada con datos de prueba locales. La desasignación por sí sola no impide sincronizar: el permiso online de seguimiento autoriza a cualquier paciente visible.
- [x] E2E de logout/cambio a otra cuenta: cache clínica anterior se purga; identidad anterior desaparece; outbox no desaparece y solo queda visible con su usuario dueño.
- [x] E2E de reingreso con el mismo autor sincroniza un pendiente asignado y verifica registro confirmado más eliminación tras ACK.
- [x] E2E de revocación de acceso: la sesión existente no puede consultar identidad ni crear seguimientos (401); prueba unitaria confirma que 401 conserva el pendiente `pending` para reintento tras reautenticación.

## 6. Alertas, push y fallback

- [x] Crear alerta independiente o ligada al seguimiento con el nivel/motivo/observaciones actuales; persistir seguimiento+alerta en una transacción cuando corresponda.
- [x] Permitir resolución explícita por cualquier voluntario autenticado y dejar rastro de autor/hora.
- [x] Implementar registro/actualización/baja de push subscription y dispatch solo después de confirmar la transacción.
- [x] Enviar al equipo asignado excepto autor, incluyendo coordinadores/admins asignados como voluntarios; fallback in-app si push está deshabilitado o sin permiso.
- [x] Mantener título/cuerpo push genéricos: ninguna PII ni dato clínico en el payload visible o lock screen; API y Service Worker reemplazan contenido y solo conservan IDs de navegación.
- [x] Verificar click en notificación, sesión requerida para abrir detalle, suscripciones inválidas y errores del proveedor simulados; no enviar push real en pruebas.
- [x] Verificar que el Service Worker genera contenido genérico y no confía en `title/body` clínicos arbitrarios del payload recibido.

## 7. Integración de mismo origen y empaquetado

- [x] Añadir imagen/build del API y servidor de estáticos del front con ruta `/api/*` en el mismo origen.
- [x] La API confía por defecto en cero proxies; `TRUST_PROXY_HOPS` solo acepta de 0 a 10 saltos explícitos. Cookies, healthchecks y cierre ordenado están cubiertos y smokeados en Docker/SQLite.
- [ ] Configurar HTTPS y el valor/topología de `TRUST_PROXY_HOPS` en el host productivo; depende de infraestructura del usuario.
- [x] Documentar variables y comandos locales; secretos solo del lado API. La UI usa rutas relativas.
- [x] Probar build y arranque local de la imagen combinada con SQLite local, navegación directa a una ruta SPA y readiness `/api`; el E2E por procesos separados también valida peticiones autenticadas.
- [x] Verificar que el service worker deja `/api/*` directo a red y no añade esos recursos a su precache estático; prueba Node ejecuta el handler con un request API.
- [x] No ejecutar ni considerar como gate ningún test que requiera URL, token, creación de DB, migración, seed o conexión de Turso. Todo el gate usó SQLite local/efímera.

## 8. Verificación final y Definition of Done

- [x] Unit API: suites existentes cubren servicios, validadores, repositorios, permisos, sesiones/CSRF, idempotencia, alertas, estadísticas y notificaciones sin PII (47 suites; iteración 33: 353 tests).
- [x] Unit front: cliente API, IndexedDB/outbox, reintentos, Service Worker, errores y datos derivados (19 tests).
- [x] E2E feature aislado contra API real local + SQLite efímera: login permitido/rechazado; CRUD de paciente/cuidador, allow-list/asignación; directorio/seguimiento/alerta/resolución; estadísticas; offline/reconexión; push genérico simulado.
- [x] En la cobertura E2E incluir resumen por rol, comunidad/perfil con rol voluntario/coordinador, reporte imprimible y contenido no-demo con DB vacía; probar errores recuperables y conflictos relevantes. Gestión de hospitales, búsqueda/filtros y acceso revocado con cookie/outbox también tienen evidencia.
- [x] E2E de archivado: todos los roles autorizados consultan un paciente archivado; coordinador puede restaurarlo y voluntario/admin reciben 403 al intentar restaurarlo.
- [x] E2E de hospitales: coordinador y admin archivan/restauran; voluntario recibe 403; hospital archivado no se ofrece para nuevas altas y sigue visible como referencia histórica (captura 44).
- [x] E2E de edición de paciente/cuidador: coordinador/admin editan la ficha completa y relación; voluntario recibe 403; cambios obsoletos reciben 409 y no sobrescriben el estado nuevo.
- [x] E2E de duración: defaults presencial/remoto; personalizados 15 y 1440 aceptados; 14, 16, 1441 y valores no múltiplos de 15 rechazados.
- [x] E2E offline: admin y coordinador asignados pueden cachear ficha, encolar y sincronizar seguimiento; voluntario no asignado no puede usar offline.
- [x] Hacer que el E2E API/front use el Google fake en modo test para probar UI popup, rol bootstrap, allow-list y rechazo. No usar cuenta Google real ni habilitar fake fuera de test.
- [x] Capturar explícitamente las imágenes 01–55 del manifiesto; abrir/revisar visualmente los recorridos mobile (390/344 px: directorio/búsqueda, ficha, formulario, settings/login, perfil, comunidad, administración, popovers y estadísticas) y desktop (flujo API/offline/impresión), y registrar resultados en `loop-state.md`.
- [x] Ejecutar unitarias completas (API 47 suites/353 tests; front 19 tests), E2E aceptación 1/1 y raíz 4/4, builds API/front, lint y Docker/SQLite. Suite Playwright confirma desktop y móvil.
- [x] Ejecutar builds de `api/` y `front/`, lint/format dirigidos y smoke del contenedor SQLite; comprobar que no se versionan secretos, DB locales ni artefactos de prueba. Lint reporta warnings preexistentes documentados.
- [x] Validar Service Worker: `/api` queda network-only, no almacena respuestas clínicas en Cache Storage y navegación offline solo devuelve el shell estático; pruebas Node VM cubren estas reglas.
- [x] Comprobar contractualmente roles/CSRF/cookies, ausencia de PII en push/logs y ausencia de datos operativos en `localStorage`.
- [x] Mapear cada criterio de aceptación funcional a implementación y test con resultado verde en [acceptance-coverage.md](./acceptance-coverage.md).
- [x] Actualizar README de raíz y ambos proyectos con arranque local y flujo de pruebas SQLite.
- [x] Marcar los criterios locales completos después de los gates unitarios, E2E, builds, lint, Docker/SQLite y revisión visual. Quedan fuera únicamente infraestructura productiva y Turso.

### Excluido explícitamente

No validar conexión o credenciales Turso, crear/restaurar DB Turso, ejecutar migraciones/seeds contra Turso, ni comprobar despliegue conectado a Turso. La configuración de esa base y sus credenciales la realizará el usuario.
