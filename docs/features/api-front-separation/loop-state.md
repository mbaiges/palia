# Loop state: api-front-separation

Updated: 2026-09-21
Iteration: 34 (lectura de pacientes por capas y cobertura de móvil promedio)
Status: IN PROGRESS

## Fuente de verdad

- Functional spec: `docs/features/api-front-separation/functional-spec.md`
- Technical spec: `docs/features/api-front-separation/technical-spec.md`
- Implementation checklist: `docs/features/api-front-separation/implementation-checklist.md`
- Gap analysis: `docs/features/api-front-separation/gap-analysis.md`
- Turso queda explícitamente fuera de los gates y no se debe validar.

## Estado de esta iteración

- Se extrajeron lectura de pacientes, filtros por texto/estado, paginación y armado del DTO a `MedicePatientService`, con el contrato `MedicePatientRepository` en dominio y adaptador `SqliteMedicePatientRepository`. El controlador conserva la escritura de fichas y el resto de áreas Medice aún deben extraerse en cortes posteriores.
- `MedicePatientService.test.ts` cubre el mapeo de relaciones/estado y filtro/paginación. API build y E2E de aceptación contra SQLite pasaron tras el cambio.
- Playwright agregó viewport 360×800 (teléfono promedio): directorio, ficha, CTAs de ficha dentro del viewport, formulario de seguimiento y estadísticas. Capturas 56–58 fueron abiertas: los botones de ficha apilan correctamente; encabezado/formulario de seguimiento caben al ancho y la gráfica semanal queda dentro de pantalla, sin overflow horizontal.
- Responsive E2E aislado pasó 4/4, incluida la matriz existente 390×844, 344 px/login y community/admin/profile. La suite E2E raíz pasó 5/5 (aceptación desktop/API + cuatro recorridos responsive). `npm test` pasó (API 48 suites/355 tests; front 19); `api:build`, `front:build`, lint front y `git diff --check` pasaron. Lint mantiene warnings previos.

- La vista previa imprimible ahora responde a viewport móvil: toolbar en dos filas, datos de paciente/cuidador en una columna, encabezado envuelto y tabla dentro de un scroller propio. Playwright comprueba que no haya solapamiento, recorte del contenido principal ni overflow de página.
- Capturas 45 (`45-mobile-alert-modal.png`) y 46 (`46-mobile-print-preview.png`) se generaron a 390 px y fueron abiertas/revisadas: el diálogo de alerta es legible, los botones de impresión no chocan y los datos de la ficha se apilan dentro del ancho.
- La API agrega eventos de auditoría para creación/edición/archivo/restauración de pacientes, cambios de asignación, seguimientos, alertas, allow-list y roles. Las mutaciones clínicas y de asignación escriben dentro de su transacción; identidad/roles y allow-list se auditan tras confirmar el cambio. No se incluyen nombre, DNI, domicilio, diagnóstico, observaciones clínicas o nota de resolución.
- E2E de aceptación verifica eventos de paciente, seguimiento, alerta, rol y allow-list, y confirma que el volcado de auditoría no contiene diagnóstico, DNI ni detalle clínico. Primera ejecución corrigió la expectativa del test para el contrato snake_case; ejecución enfocada posterior pasó.
- E2E responsive aislado pasó 2/2; E2E API/front aislado pasó 1/1. `npm test` pasó antes del último corte de auditoría; build API pasó y se repetirá la suite completa al cerrar.
- Se amplió el smoke a 390 px para comunidad de voluntarios, administración de asignaciones/centros y allow-list; la prueba semilla su propio paciente por API y corre sola sin depender del test de aceptación.
- E2E de la tercera pantalla pasó después de corregir el selector de navegación inferior `Admin`; las capturas 47–49 se abrieron y revisaron. El directorio de comunidad, selects/formularios y tarjetas de autorización caben horizontalmente; la allow-list se presenta en tarjetas apiladas.
- Configuración móvil encontró que “Guardar perfil” podía quedar debajo de la navegación inferior al final del formulario. Se aumentó el espacio de scroll al alto de barra/safe area; E2E desplaza el botón al viewport y verifica que su borde inferior quede arriba de la barra.
- Capturas 50/51 revisadas: el perfil no se corta horizontalmente y en la captura desplazada el botón Guardar queda libre, seguido por las secciones visuales/persistencia sin ocultarse por navegación.
- Smoke móvil ahora busca un miembro de comunidad y prueba resultado vacío; en administración desplaza hasta el formulario de centros y verifica que “Agregar Hospital” termina arriba de la barra inferior. E2E responsive aislado pasó 3/3; captura 52 revisada con la tarjeta de centros y la acción completa en pantalla.

- Iteración 32: la auditoría de cambios API se amplió a mutaciones de usuarios (roles/bajas) y allow-list genérica; pruebas de notificación push cubren endpoint expirado (410, baja automática) y error transitorio (notificación in-app conservada).
- El E2E de aceptación incluye el destino del click push después de cerrar sesión: abre `/?alertId=...`, exige volver a autenticarse, navega a la ficha y limpia el query. La captura 53 revisada a 390 px confirma acciones de ficha a ancho completo y navegación visible.
- La primera revisión visual de capturas 54–55 mostró el estado intermedio de la animación de popover. Se añadió espera E2E por opacidad completa, se regeneraron y abrieron ambas: menú de alertas y menú de perfil opacos, legibles y dentro de los límites del móvil.
- El E2E raíz detectó una aserción frágil: desplazaba el encabezado de hospitales, pero no el botón sujeto a la verificación. Ahora desplaza el propio botón “Agregar Hospital”; E2E responsive pasó 3/3 y la captura 52 regenerada se revisó visualmente.
- Gate final repetido: `npm test` pasó (API 46 suites/346 tests y front 19 tests), `npm run api:build`, `npm run front:build`, `npm run lint --prefix front` y `git diff --check` pasaron. El lint conserva warnings de hooks/imports/variables sin uso ya presentes; el check Prettier dirigido aún reporta formato heredado en 11 archivos modificados, por lo que no se aplicó reformat masivo.
- E2E feature `npm run test:e2e:api-front-separation` pasó 1/1; suite completa `npm run test:e2e` pasó 4/4 (aceptación desktop/API + tres escenarios responsive 390/344 px). No se llamó Turso.
- Docker `medice-app:local` se reconstruyó; el smoke con SQLite efímera devolvió 200 para readiness, `/` y ruta SPA `/patients/123`; la ruta de login email permanece ausente en producción. El contenedor temporal se retiró.

- Iteración 33: `TRUST_PROXY_HOPS` queda sin confianza por defecto (`0`), acepta solo enteros explícitos de 0–10 y rechaza `true`/valores malformados; se documenta no exponer el puerto de la API cuando se habilitan saltos confiables. Tests unitarios 7/7.
- API captura SIGTERM/SIGINT para parar el job periódico, cerrar Socket.IO/HTTP y cerrar conexiones SQLite/Knex. Se probó el apagado en contenedor con `docker stop`: log de SIGTERM presente y salida limpia; readiness, `/` y ruta SPA devolvieron 200.
- La revisión visual de captura 49 había detectado transición incompleta del color activo de pestaña: el contenido ya mostraba allow-list, pero el screenshot se tomó durante los 200 ms de cambio. El E2E ahora espera el color final derivado de los tokens; en captura 49 actual “Invitaciones y Accesos” aparece activa. Capturas 49 y 52–55 se reabrieron tras el gate raíz; también se releen 39–40, 43–48 y 50–51. Todas muestran controles/contenido íntegros y navegación móvil sin tapar acciones.
- `npm test` tras el cambio de proxy/apagado pasó: API 47 suites/353 tests y front 19 tests. API build, test E2E enfocado 1/1, suite E2E completa 4/4, build front, lint y `git diff --check` verdes; Docker + SQLite local smoke y parada ordenada verdes. No se probó Turso.

- El endpoint de baja push ahora elimina por `user_id + endpoint`; evita que un usuario autenticado pueda dar de baja una suscripción ajena. Repositorio y controlador tienen pruebas de aislamiento.
- Alertas ahora aceptan `limit` y `cursor`, devuelven metadatos de página y conservan filtros por estado/paciente. El E2E verifica el contrato snake_case directamente.
- El cliente HTTP compartido tiene pruebas unitarias de misma origen/credenciales, JSON, CSRF cacheado, camelización, errores estables y evento de sesión expirada.
- La baja de suscripciones push quedó limitada al dueño de la suscripción; usuarios sin permiso no pueden eliminar cuentas administradoras. La paginación de alertas tiene contrato con límite, cursor y conteo, cubierto por el E2E HTTP.
- El runner Playwright reserva puertos libres por proceso y mantiene los mismos valores en config, worker y proxy; se quitaron las últimas URLs E2E hardcodeadas que fallaban si otro proyecto ocupaba 5173.
- Responsive E2E mobile (390 px y 344 px) y flujo API/desktop pasaron 3/3. Al leer `15-mobile-offline-settings.png` detecté el subtítulo recortado; el texto ahora ajusta a 14 px y la prueba comprueba que su ancho interno no se recorte. La captura actualizada fue abierta e inspeccionada, con el texto completo en dos líneas.
- `38-offline-account-isolation.png` se revisó otra vez: la cuenta activa solo presenta su seguimiento pendiente. Las capturas 14, 15, 16 y 35 se leyeron visualmente; el directorio, ajustes offline, login compacto y tarjetas de estadísticas caben en móvil.
- `npm test` pasó tras los cambios; API 45 suites y front 19 tests. Builds de ambas apps, lint front y `git diff --check` pasan; lint sigue mostrando warnings preexistentes.
- E2E enfocado y raíz pasaron (1 caso de aceptación; 3/3 en raíz). Docker build pasó y el smoke SQLite devolvió `/` 200, `/patients/123` 200, readiness 200; login de email y bypass dev dieron 404 en producción.
- La prueba no llamó a Turso. Se preservó el estilo preexistente en `Settings.jsx` y `UserController.test.ts` para evitar diffs masivos causados por Prettier.
- Iteración 19: el E2E crea una operación de outbox ligada al usuario antes de reintentar con su sesión revocada. La UI no abre una sesión no autorizada y la operación se conserva bajo el ID del autor; no se elimina ni se reasigna. El E2E de aceptación pasó.
- La suite raíz pasó 3/3 tras ese caso, incluyendo desktop/API y mobile 390/344 px. Se releen las capturas 14 (directorio), 15 (ajustes offline), 16 (login angosto) y 35 (stats): el texto y controles entran en el viewport móvil.
- Iteración 20: la suite E2E prueba el archivado de hospital por coordinador/admin, rechazo 403 para voluntario, presencia en el histórico durante archivo, exclusión del listado activo y restauración. El flujo de coordinador retorna todos los estados esperados.
- El smoke mobile del directorio ahora busca por nombre, confirma que la búsqueda sin resultados no muestra el paciente, limpia el query, filtra “Estables” y verifica el resultado. `npm run test:e2e` pasó 3/3 incluyendo ese flujo y los screenshots mobile.
- La suite de aceptación verifica que un voluntario no edita pacientes (403) y un coordinador sí (200); el PATCH usa los datos actuales de paciente/cuidador y mantiene los valores. Prueba enfocada pasó.
- Iteración 22: durante el archivado, E2E consulta la ficha como admin, voluntario y coordinador; todos la ven. Admin y voluntario reciben 403 al restaurar y el coordinador restaura con 200. El caso pasa en `test:e2e:api-front-separation`.
- Iteración 23: el recorrido E2E móvil encontró que `PatientDetail` ocultaba Registrar Seguimiento en viewport móvil. La acción ahora aparece a ancho completo para pacientes activos y no en archivados. E2E raíz pasa 3/3 sin overflow; las capturas 39/40 de ficha y formulario se abrieron y leyeron.
- `BrowserSession.test.ts` carga el módulo con `NODE_ENV=production` y comprueba cookies `__Host-`, `Secure`, `HttpOnly` para sesión, `SameSite=Lax`, `Path=/` y CSRF accesible al frontend. La prueba focal pasó sin requerir HTTPS/Turso.
- La suite unitaria completa pasó: API 46 suites/344 tests; front 19 tests. Build API/front y lint front terminan con código 0; permanecen warnings de lint ya existentes.
- `docker build -t medice-app:local .` y smoke con SQLite pasaron: `/`, ruta profunda SPA y `/api/health/ready` devuelven 200; email auth y bypass dev devuelven 404 en producción. Turso sigue sin tocarse.
- La revisión visual de las nuevas imágenes 39–40 confirmó ficha clínica legible y CTA visible a ancho completo, además del formulario con alerta, tipo de visita y duración personalizada en 390 px.
- Iteración 25: E2E comprueba seguimiento offline para coordinador asignado, incluyendo sincronización/ACK; otro voluntario no asignado no puede encolarlo y no deja outbox. `41-coordinator-offline-queued.png` y `42-coordinator-offline-synced.png` se abrieron y leyeron.
- El mismo correo autorizado agregado dos veces ahora devuelve 409, no 500: la respuesta SQLite de restricción UNIQUE usa `SQLITE_CONSTRAINT` con mensaje de índice, que no coincidía con la detección previa. E2E cubre la inserción inicial y el duplicado.
- El E2E de alta repite un DNI ya existente y comprueba 409 legible sin perder nombre, domicilio ni cuidador; `43-patient-duplicate-dni.png` muestra mensaje y formulario conservado.
- El flujo hospital archivado confirma que desaparece del selector de nuevas fichas mientras permanece en el histórico; al restaurarlo regresa al flujo activo. `44-archived-hospital-excluded-from-new-patient.png` se inspeccionó.
- La edición de ficha usa control optimista por `updatedAt`: PATCH coordinador guarda dirección/relación de cuidador, un segundo PATCH con valor obsoleto recibe 409 y no pisa lo último. Voluntario recibe 403. El front envía el token de versión y conserva contenido ante errores.
- Iteración 27: la prueba focused y la raíz E2E pasan después de incluir el control optimista; la suite completa pasó (API 46 suites/344 tests; front 19), builds API/front y lint exit 0.
- El contenedor combinado volvió a construirse y el smoke SQLite devuelve 200 para `/`, `/patients/123` y readiness; endpoints de email auth y bypass dev dan 404 en producción.
- `front/README.md` y `api/README.md` describen el runtime Medice actual (API canónica, SQLite local, cliente centralizado, sesión cookie y pruebas locales); se quitaron indicaciones obsoletas de Firebase/LocalStorage como backend.
- Último `npm test`: API 45 suites/342 tests y front 19 tests; builds API/front pasaron; lint front terminó con warnings existentes. Docker build y smoke SQLite: `/`, ruta profunda y readiness devolvieron 200. El E2E enfocado sigue en ejecución al comenzar la documentación de esta iteración.

- La outbox IndexedDB ahora usa clave compuesta `[userId, id]`; el upgrade desde el esquema anterior preserva operaciones. E2E crea deliberadamente la misma mutación para dos cuentas, cambia de cuenta y verifica que ambas colas quedan aisladas.
- `38-offline-account-isolation.png` se regeneró tras esa prueba y fue leída visualmente: la cuenta activa muestra una única operación local y no presenta la cola de la otra cuenta.
- PATCH del perfil conserva valores no enviados y el estado administrado por servidor; E2E envía una actualización parcial y verifica los campos y rol rehidratados.
- Mutaciones autenticadas ahora requieren `Origin` coincidente además de CSRF; el logout borra cookie de sesión y cookie CSRF. E2E confirma 403 sin Origin y que el logout limpia CSRF.
- `npm test` pasó (API 45 suites/340 tests; front 12 tests), builds API/front pasaron y lint front exit 0 con warnings preexistentes.
- `npm run test:e2e:api-front-separation` y `npm run test:e2e` raíz pasaron después de cambios de IndexedDB, perfil parcial y CSRF/Origin; suite raíz 3/3.
- E2E crea una base IndexedDB de versión 1 antes de cargar la app, inserta una outbox pendiente y confirma la migración a v2/claves compuestas sin pérdida.
- E2E vuelve a autenticar al autor original, sincroniza un pendiente válido asignado, confirma que la API lo devuelve en el historial y comprueba que la outbox se elimina solo después del ACK. El primer intento excedió el timeout/aserción de pantalla (la app conserva Configuración); se corrigió y el segundo pasó.
- La captura 38 se volvió a leer tras el aislamiento deliberado por clave repetida: lista una sola operación de la cuenta activa, con texto visible y layout completo.
- La lista `INITIAL_ADMIN_EMAILS` ahora asigna Admin solo durante la creación inicial; logins posteriores respetan cualquier rol persistido. Prueba unitaria cubre el contrato sin reescribir permisos.
- `npm test` pasó después de este cambio: API 45 suites/341 tests; front 12 tests.
- Se agregó prueba Node VM del Service Worker: `/api/bootstrap` no llama `respondWith`, un payload push clínico se reemplaza por título/cuerpo genéricos, y el click abre solo `/?alertId=...` sin campos PII.
- `npm run front:test:unit` pasó tras esas pruebas (15 tests front, 3 del Service Worker incluidos).
- E2E de revocación ahora prueba además que una cookie de voluntario ya revocada recibe 401 al intentar escribir un seguimiento. `classifySyncFailure` conserva esos pendientes como `pending` para reintento tras reautenticación; E2E feature pasó.

- Añadida la proyección del correo bootstrap en allow-list como Admin antes de su primer inicio de sesión; E2E afirma ese rol.
- E2E endurecido para esperar la respuesta de archivo y comprobar el estado persistido antes de capturar.
- Añadidos recorridos E2E de edición de paciente/cuidador y creación/resolución de alertas con nota.
- Mejorada la accesibilidad/error de `AlertModal`; si la persistencia falla, el modal conserva el contenido y explica el error.
- Filtros de directorio móvil envuelven a varias líneas y no se recortan.
- Capturas E2E 01–27 generadas y abiertas/revisadas visualmente. Las pantallas de login, dashboard, ficha, edición, directorio responsive, administración, offline y alertas muestran datos legibles y los estados esperados.
- Sincronización offline local funciona en el flujo E2E; captura 11 muestra el seguimiento sincronizado en historial y la 15 muestra outbox vacía. La cobertura de aislamiento, revocación/desasignación y conflictos sigue pendiente.
- Push server-side no está configurado; la pantalla lo indica explícitamente. No se ha probado entrega real ni proveedor.
- Añadido formulario para que cada persona edite sus datos de contacto/perfil; rol e identidad quedan no editables y pacientes asignados se muestran calculados.
- E2E detectó y se corrigió un mapeo incorrecto de `specialtyAvailability`; se confirma el valor tras volver a cargar el estado de API.
- Validación server-side del perfil limita tipos/tamaños, admite solo URL HTTP(S) para avatar y rechaza campos protegidos (identidad, rol, permisos, estado y asignaciones calculadas).
- El E2E comprueba que esos errores regresan 422, que el rol sigue admin y que los datos válidos previos permanecen persistidos; la API serializa camelCase a snake_case y el test compara el contrato HTTP directo.
- Se amplió el informe de impresión para incluir ficha y cuidador, todos los campos del seguimiento, historial de alertas, nota de resolución y nombre del voluntario que la resolvió.
- Se detectó que la salida de alertas no entregaba el nombre del resolutor; los endpoints de bootstrap y lista ahora incluyen ese dato mediante LEFT JOIN a usuarios.
- El E2E recorre el informe con dos alertas resueltas, verifica notas/autores/detalle y captura el documento completo. `32-print-alert-history.png` se abrió y revisó: historial legible, valores completos y botones de previsualización visibles.
- El test de integración aislado pasó tras añadir el historial imprimible de alertas.
- El contrato de duración quedó afirmado en API: presencial/remoto sin duración explícita producen 120/60 minutos, y 15–1440 en múltiplos de 15 se acepta; el E2E verifica también rechazos de 14/16/1441/17. La respuesta HTTP sigue la convención snake_case del API.
- Se revisó `34-custom-followup-duration.png`: el control personalizado 135 min queda visible, legible y asociado al seguimiento.
- Se revisó de nuevo `33-print-document-with-alerts.png`: las siete entradas de seguimiento y las dos alertas resueltas aparecen completas, con autores/notas y sin controles de navegación.
- Login Google: el adaptador valida `email_verified`, normaliza email y usa el client ID de configuración al verificar token. El popup manda y exige `X-Requested-With: XmlHttpRequest`, conforme a la protección CSRF recomendada por Google.
- Se añadió un proveedor Google simulado disponible exclusivamente con `NODE_ENV=test` y `TEST_GOOGLE_AUTH=true`; el E2E inicia por el botón de Google, comprueba rol admin bootstrap y rechazo de identidad fuera de allow-list. Una prueba confirma que el código fake no se acepta con `NODE_ENV=production`.
- API build y E2E feature pasaron tras estos cambios. Debe repetirse el conjunto unitario completo, E2E raíz y Docker después del último cambio de fake OAuth.
- El primer E2E raíz halló que el smoke responsive esperaba solo `Buenas` aunque el dashboard real saluda `Buenos días`; se amplió la aserción a las variantes de saludo y el E2E raíz volvió a pasar.
- La inspección visual móvil detectó texto del título/subtítulo de Configuración fuera del viewport. Se ajustaron el título con tipografía fluida y las tabs para que envuelvan texto; la captura 15 revisada ahora queda dentro del ancho del dispositivo.
- La outbox clasifica `403` (pérdida de autorización/desasignación) junto con `404/409/422` como `needs-review`. Se añadieron unit tests: API 43 suites/333 tests y front 11 tests verdes.
- Se agregó `Dockerfile` multi-etapa para compilar ambas apps, servir la SPA desde el API en same-origin, y `.dockerignore` para excluir node_modules, `.env`, DB y artefactos. `docker build -t medice-app:local .` pasó.
- Smoke de la imagen con SQLite local: `/` y ruta directa `/patients/123` devolvieron SPA HTML 200; `/api/health/ready` devolvió 200. Contenedor temporal retirado.
- Builds de front/API y suites unitarias volvieron a pasar; E2E raíz pasó 3/3. No hubo acceso ni validación de Turso.

## Capturas revisadas

Todas están en `e2e/artifacts/screenshots/api-front-separation/` (artefactos ignorados por Git):

| #   | Archivo                             | Revisión                                                                                                                                                          |
| --- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | `01-login.png`                      | Login y estados de acceso legibles.                                                                                                                               |
| 02  | `02-dashboard-api.png`              | Dashboard/API sin datos de demostración.                                                                                                                          |
| 03  | `03-patient-directory-empty.png`    | Estado vacío coherente.                                                                                                                                           |
| 04  | `04-patient-create-form.png`        | Formulario de alta legible.                                                                                                                                       |
| 05  | `05-patient-created-detail.png`     | Ficha creada y datos visibles.                                                                                                                                    |
| 06  | `06-follow-up-form.png`             | Modal/formulario de seguimiento legible.                                                                                                                          |
| 07  | `07-follow-up-confirmed.png`        | Registro confirmado e historial legible.                                                                                                                          |
| 08  | `08-stats-api.png`                  | Estadísticas presentadas desde API.                                                                                                                               |
| 09  | `09-offline-queued.png`             | Seguimiento pendiente identificado.                                                                                                                               |
| 10  | `10-offline-restored.png`           | Cola recuperada tras recarga.                                                                                                                                     |
| 11  | `11-offline-synced.png`             | Registro aparece sincronizado en historial.                                                                                                                       |
| 12  | `12-archived-patient.png`           | Pestaña archivados y paciente archivado seleccionados.                                                                                                            |
| 13  | `13-push-unconfigured.png`          | Estado de push sin configuración informado claramente.                                                                                                            |
| 14  | `14-mobile-directory.png`           | Directorio, tarjeta, filtros envueltos y navegación dentro del viewport; inspeccionada.                                                                           |
| 15  | `15-mobile-offline-settings.png`    | Título/subtítulo, tabs y centro offline legibles dentro del viewport tras ajuste responsive; inspeccionada.                                                       |
| 16  | `16-narrow-mobile-login.png`        | Login en viewport estrecho dentro del ancho; inspeccionada.                                                                                                       |
| 17  | `17-narrow-mobile-shell.png`        | Dashboard y navegación inferior legibles en viewport estrecho; inspeccionada.                                                                                     |
| 18  | `18-admin-hospitals.png`            | Administración de asignaciones/hospitales legible.                                                                                                                |
| 19  | `19-admin-allowlist.png`            | Bootstrap visible como Admin; tabla legible.                                                                                                                      |
| 20  | `20-admin-allowlist-revoked.png`    | Confirmación de revocación legible.                                                                                                                               |
| 21  | `21-alert-active.png`               | Alerta activa y acción resolver visibles.                                                                                                                         |
| 22  | `22-alert-resolved.png`             | Resolución y nota visibles; alerta sin acción activa.                                                                                                             |
| 23  | `23-patient-edit-form.png`          | Campos del paciente/cuidador precargados.                                                                                                                         |
| 24  | `24-patient-edited-detail.png`      | Cambios reflejados en ficha.                                                                                                                                      |
| 25  | `25-alert-form.png`                 | Modal de creación de alerta legible.                                                                                                                              |
| 26  | `26-alert-created-from-form.png`    | Modal muestra estado guardando; captura intermedia intencional del flujo.                                                                                         |
| 27  | `27-alert-form-resolved.png`        | Ficha refleja alerta creada/resuelta y nota.                                                                                                                      |
| 28  | `28-volunteer-profile.png`          | Campos de perfil guardados y rehidratados desde API; rol/asignaciones se muestran como solo lectura. Formulario alineado con estilos existentes.                  |
| 29  | `29-profile-validation.png`         | Tras rechazos 422 el perfil no pierde valores ni cambia el rol; recorte `29-profile-validation-review.png` inspeccionado para validar la presentación.            |
| 30  | `30-print-report-full-fields.png`   | Vista de informe con campos de seguimiento y paciente completos; legibilidad verificada previamente.                                                              |
| 31  | `31-print-document.png`             | Simulación de medio print: documento visible y acciones ocultas; verificada previamente.                                                                          |
| 32  | `32-print-alert-history.png`        | Alertas activas/resueltas, autor, observación clínica y notas; abierta e inspeccionada visualmente en esta iteración.                                             |
| 33  | `33-print-document-with-alerts.png` | Informe impreso completo con datos del paciente/cuidador, siete seguimientos (incluida duración personalizada) y dos resoluciones; inspeccionada en iteración 10. |
| 34  | `34-custom-followup-duration.png`   | Formulario con duración personalizada de 135 minutos; inspeccionada en iteración 10.                                                                              |
| 35  | `35-mobile-stats.png`               | Estadísticas y métricas visibles en pantalla móvil; inspeccionada.                                                                                                |
| 36  | `36-mobile-stats-charts.png`        | Serie mensual visible y encabezado/control de la serie semanal legibles en móvil; inspeccionada.                                                                  |
| 37  | `37-mobile-weekly-chart.png`        | Gráfica semanal móvil y control de ventana completamente visibles; inspeccionada.                                                                                 |
| 38  | `38-offline-account-isolation.png`  | Tras logout/login, UI presenta solo la operación de la cuenta activa; dos cuentas con el mismo ID conservan entradas aisladas. Inspeccionada.                     |
| 39  | `39-mobile-patient-detail.png`      | Ficha médica móvil con CTA de seguimiento presente, detalle legible y navegación sin overflow; inspeccionada en iteración 24.                                    |
| 40  | `40-mobile-follow-up-form.png`      | Formulario clínico móvil con título, alerta, tipo/duración y campos visibles; sin overflow; inspeccionada en iteración 24.                                         |
| 41  | `41-coordinator-offline-queued.png` | Seguimiento pendiente creado offline por una coordinadora asignada; historial conserva texto y muestra estado pendiente. Inspeccionada en iteración 25.             |
| 42  | `42-coordinator-offline-synced.png` | Cola de coordinación vacía después del ACK; estado de sincronización legible. Inspeccionada en iteración 25.                                                       |
| 43  | `43-patient-duplicate-dni.png`      | Error 409 de DNI duplicado; formulario mantiene nombre, domicilio y cuidador introducidos. Inspeccionada en iteración 26.                                            |
| 44  | `44-archived-hospital-excluded-from-new-patient.png` | Formulario de alta sin opciones de hospital archivado y con controles legibles. Inspeccionada en iteración 26.                                                |
| 45  | `45-mobile-alert-modal.png` | Modal de alerta clínica en 390 px, campos y acciones completos sin overflow. Inspeccionada en iteración 28. |
| 46  | `46-mobile-print-preview.png` | Vista imprimible en 390 px: acciones separadas, información del paciente en una columna y documento sin recorte horizontal. Inspeccionada en iteración 28. |
| 47  | `47-mobile-volunteer-community.png` | Comunidad de voluntariado, búsqueda y perfil visible dentro de 390 px. Inspeccionada en iteración 29. |
| 48  | `48-mobile-administration-assignments.png` | Asignación, centros y listado en viewport móvil; el listado continúa desplazable verticalmente. Inspeccionada en iteración 29. |
| 49  | `49-mobile-administration-access.png` | Formulario de allow-list y tarjetas de correos autorizados en mobile. Inspeccionada en iteración 29. |
| 50  | `50-mobile-volunteer-profile.png` | Perfil de voluntariado y formulario en mobile 390 px; ancho de controles y encabezados legible. Inspeccionada en iteración 30. |
| 51  | `51-mobile-profile-save.png` | Final del perfil desplazado: botón Guardar queda por encima de la navegación inferior. Inspeccionada en iteración 30. |
| 52  | `52-mobile-administration-hospitals.png` | Formulario para agregar centro en el panel de administración; botón visible arriba de la navegación inferior. Inspeccionada en iteración 31. |
| 53  | `53-mobile-push-alert-destination.png` | Click push tras reautenticar abre la ficha objetivo; botones de acción apilados a ancho completo y navegación inferior visible a 390 px. Inspeccionada en iteración 32. |
| 54  | `54-mobile-notification-popover.png` | Popover de alertas vacío; panel opaco, texto centrado y contenido dentro del viewport móvil. Inspeccionada tras esperar el final de la animación en iteración 32. |
| 55  | `55-mobile-profile-popover.png` | Popover con identidad, configuración y cierre de sesión; panel opaco, acciones legibles y dentro del viewport móvil. Inspeccionada en iteración 32. |

## Verificación más reciente

- Iteración 10: `npm test` pasó (API 45 suites/340 tests; front 11 tests) tras agregar las pruebas de identidad Google verificada/fake y la frontera de entorno.
- Iteración 10: `npm run api:build` y `npm run front:build` pasaron; formato Prettier dirigido y `git diff --check` pasaron. Lint front exit 0 con warnings preexistentes.
- Iteración 10: `npm run test:e2e:api-front-separation` y `npm run test:e2e` pasaron (1 caso de integración y 2 smokes responsive); se revisaron otra vez 01 login, 02 dashboard con identidad Google, 19 allow-list/admin, 33 impresión completa y 34 duración personalizada.
- Iteración 10: `docker build -t medice-app:local .` pasó. SQLite smoke del contenedor: `/` 200, ruta SPA `/patients/123` 200, readiness 200, email auth 404; bypass true en producción impidió el arranque como se esperaba.
- `npm audit --omit=dev` reporta 10 vulnerabilidades transitivas (2 low, 2 moderate, 5 high, 1 critical) en el árbol heredado de `@libsql/knex-libsql`/`sqlite3` y `uuid`; `npm audit fix` no tiene solución no-breaking para el resto. No se usó `--force`. No se conectó Turso.
- Iteración 11: Stats permite seleccionar año para total/serie mensual y elegir ventana semanal de 7/14 días; añade Primer Paso, Compañero Fiel, Especialista y Guía Senior personales con fechas derivadas de seguimientos confirmados. Los roles globales no muestran insignias personales.
- `front/src/utils/chartData.test.js` verifica reglas y fechas de cruce; E2E comprueba selector anual y ventanas 7/14. `08-stats-api.png` se abrió: KPI, serie anual, semana y seguimiento aparecen con datos persistidos y legibles.
- Responsive E2E móvil para Stats pasó; `35-mobile-stats.png`, `36-mobile-stats-charts.png` y `37-mobile-weekly-chart.png` fueron inspeccionadas.
- Iteración 12: E2E feature pasó con PATCH parcial, rechazo de mutación sin Origin y limpieza de CSRF al logout. Repetir raíz 3/3 tras el endurecimiento CSRF final.

- `npm test`: passed (API 43 suites/333 tests + front 11 tests).
- `npm run api:build`: passed, incluyendo el servidor de estáticos configurable.
- `npm run front:build`: passed.
- `npm run lint --prefix front`: passed con warnings preexistentes/de hooks y variables sin uso.
- `npm run test:e2e`: passed, 3 tests del conjunto actualmente configurado.
- `git diff --check`: passed; solo avisos de conversión CRLF/LF.
- `npm run test:e2e:api-front-separation`: pasó tras ampliar el informe imprimible y añadir historial de alertas resueltas (`32-print-alert-history.png`).
- `npm run test:e2e:api-front-separation`: pasó tras validar límites/permisos del perfil; `29-profile-validation.png` fue abierta y revisada visualmente.
- `npm test`: pasó después de la validación server-side: API 43 suites/333 tests y front 9 tests.
- `npm run api:build`: passed.
- `npm run front:build`: passed.
- `npm run lint --prefix front`: exit 0 con 13 warnings existentes (hooks, variables sin uso y escape innecesario).
- `npm run format:check --prefix api`: falla en 160 ficheros del scaffold existentes; los archivos API nuevos/modificados en esta iteración se formatearon puntualmente. No masificar cambios de formato ajenos.
- El testMatch E2E raíz excluye 13 specs legacy que esperan OAuth real/datos `localStorage` demo; están obsoletos frente al contrato API. No contar esos casos como verdes: requieren migración a harness local API/SQLite.
- Turso: excluido, sin conexión, migraciones ni validación.

## Siguiente iteración

1. Completar la separación de capas Medice: mover escrituras y lectura/actualización de seguimientos, alertas, hospitales, asignaciones, perfiles, allow-list, bootstrap y estadísticas desde `MediceController.ts` a servicios/repositorios por dominio, preservando permisos, transacciones y contrato; añadir pruebas unitarias por servicio/repositorio y repetir acceptance/responsive E2E con capturas revisadas.
2. Revisar la suite E2E raíz que está en curso y registrar su resultado; si falla, arreglar y repetir hasta verde.
3. Antes de declarar la operación productiva lista, configurar credenciales OAuth reales y proxy/HTTPS del host; dependen de infraestructura externa. No validar Turso.
4. Solo después de completar la separación arquitectónica y los gates, actualizar checklist/AC y cambiar `Next iteration focus` a `COMPLETE`.

No marcar COMPLETE mientras queden criterios relevantes o gates sin evidencia.
