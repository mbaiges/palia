# Loop state: api-front-separation

Updated: 2026-09-21
Iteration: 16 (revocación de sesión en escritura y privacy push)
Status: IN PROGRESS

## Fuente de verdad

- Functional spec: `docs/features/api-front-separation/functional-spec.md`
- Technical spec: `docs/features/api-front-separation/technical-spec.md`
- Implementation checklist: `docs/features/api-front-separation/implementation-checklist.md`
- Gap analysis: `docs/features/api-front-separation/gap-analysis.md`
- Turso queda explícitamente fuera de los gates y no se debe validar.

## Estado de esta iteración

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

1. Repetir unitarias, builds, lint/format dirigido y raíz E2E tras el test del Service Worker; smoke Docker pasó con el último código de API.
2. Probar el ciclo UI completo de reautenticación/reintento de outbox y el caso de asignación retirada durante un seguimiento offline; el acceso revocado ya responde 401 en lectura/escritura.
3. Completar callback/expiración OAuth y matriz de sesión vencida/roles; verificar flags `__Host-` con smoke HTTPS local si se automatiza sin Turso.
4. Cerrar auditoría de dominio, errores/paginación, historial de hospitales archivados, matriz completa de roles y concurrencia/idempotencia.
5. Validar push mediante proveedor fake, click/session expiry y fallback in-app; confirmar cobertura real de métricas.
6. Migrar o reemplazar con cobertura equivalente los 13 specs Playwright legacy excluidos; el conjunto raíz actual son 3 pruebas.
7. Mantener Turso explícitamente fuera de pruebas; no marcar COMPLETE hasta cerrar los AC y gates pendientes.

No marcar COMPLETE mientras queden criterios relevantes o gates sin evidencia.
