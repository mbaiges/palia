# Loop state: api-front-separation

Updated: 2026-09-20
Iteration: 4 (API/front verticales, alertas y edición; suite E2E configurada y revisión visual)
Status: IN PROGRESS

## Fuente de verdad

- Functional spec: `docs/features/api-front-separation/functional-spec.md`
- Technical spec: `docs/features/api-front-separation/technical-spec.md`
- Implementation checklist: `docs/features/api-front-separation/implementation-checklist.md`
- Gap analysis: `docs/features/api-front-separation/gap-analysis.md`
- Turso queda explícitamente fuera de los gates y no se debe validar.

## Estado de esta iteración

- Añadida la proyección del correo bootstrap en allow-list como Admin antes de su primer inicio de sesión; E2E afirma ese rol.
- E2E endurecido para esperar la respuesta de archivo y comprobar el estado persistido antes de capturar.
- Añadidos recorridos E2E de edición de paciente/cuidador y creación/resolución de alertas con nota.
- Mejorada la accesibilidad/error de `AlertModal`; si la persistencia falla, el modal conserva el contenido y explica el error.
- Filtros de directorio móvil envuelven a varias líneas y no se recortan.
- Capturas E2E 01–27 generadas y abiertas/revisadas visualmente. Las pantallas de login, dashboard, ficha, edición, directorio responsive, administración, offline y alertas muestran datos legibles y los estados esperados.
- Sincronización offline local funciona en el flujo E2E; captura 11 muestra el seguimiento sincronizado en historial y la 15 muestra outbox vacía. La cobertura de aislamiento, revocación/desasignación y conflictos sigue pendiente.
- Push server-side no está configurado; la pantalla lo indica explícitamente. No se ha probado entrega real ni proveedor.

## Capturas revisadas

Todas están en `e2e/artifacts/screenshots/api-front-separation/` (artefactos ignorados por Git):

| # | Archivo | Revisión |
|---|---|---|
| 01 | `01-login.png` | Login y estados de acceso legibles. |
| 02 | `02-dashboard-api.png` | Dashboard/API sin datos de demostración. |
| 03 | `03-patient-directory-empty.png` | Estado vacío coherente. |
| 04 | `04-patient-create-form.png` | Formulario de alta legible. |
| 05 | `05-patient-created-detail.png` | Ficha creada y datos visibles. |
| 06 | `06-follow-up-form.png` | Modal/formulario de seguimiento legible. |
| 07 | `07-follow-up-confirmed.png` | Registro confirmado e historial legible. |
| 08 | `08-stats-api.png` | Estadísticas presentadas desde API. |
| 09 | `09-offline-queued.png` | Seguimiento pendiente identificado. |
| 10 | `10-offline-restored.png` | Cola recuperada tras recarga. |
| 11 | `11-offline-synced.png` | Registro aparece sincronizado en historial. |
| 12 | `12-archived-patient.png` | Pestaña archivados y paciente archivado seleccionados. |
| 13 | `13-push-unconfigured.png` | Estado de push sin configuración informado claramente. |
| 14 | `14-mobile-directory.png` | Filtros móviles envueltos; tarjeta y navegación legibles. |
| 15 | `15-mobile-offline-settings.png` | Centro offline legible en viewport móvil. |
| 16 | `16-narrow-mobile-login.png` | Login en viewport estrecho sin desbordamiento visible. |
| 17 | `17-narrow-mobile-shell.png` | Navegación inferior legible en viewport estrecho. |
| 18 | `18-admin-hospitals.png` | Administración de asignaciones/hospitales legible. |
| 19 | `19-admin-allowlist.png` | Bootstrap visible como Admin; tabla legible. |
| 20 | `20-admin-allowlist-revoked.png` | Confirmación de revocación legible. |
| 21 | `21-alert-active.png` | Alerta activa y acción resolver visibles. |
| 22 | `22-alert-resolved.png` | Resolución y nota visibles; alerta sin acción activa. |
| 23 | `23-patient-edit-form.png` | Campos del paciente/cuidador precargados. |
| 24 | `24-patient-edited-detail.png` | Cambios reflejados en ficha. |
| 25 | `25-alert-form.png` | Modal de creación de alerta legible. |
| 26 | `26-alert-created-from-form.png` | Modal muestra estado guardando; captura intermedia intencional del flujo. |
| 27 | `27-alert-form-resolved.png` | Ficha refleja alerta creada/resuelta y nota. |

## Verificación más reciente

- `npm test`: passed (API unit + front unit; salida final de herramienta exit 0).
- `npm run api:build`: passed.
- `npm run front:build`: passed.
- `npm run lint --prefix front`: passed con warnings preexistentes/de hooks y variables sin uso.
- `npm run test:e2e`: passed, 3 specs del conjunto actualmente configurado.
- `git diff --check`: passed; solo avisos de conversión CRLF/LF.
- `npm run format:check --prefix api`: falla en 160 ficheros del scaffold existentes; los archivos API nuevos/modificados en esta iteración se formatearon puntualmente. No masificar cambios de formato ajenos.
- El testMatch E2E raíz excluye 13 specs legacy que esperan OAuth real/datos `localStorage` demo; están obsoletos frente al contrato API. No contar esos casos como verdes: requieren migración a harness local API/SQLite.
- Turso: excluido, sin conexión, migraciones ni validación.

## Siguiente iteración

1. Continuar cerrando AC pendientes de `implementation-checklist.md`; primero revisar seguridad de auth/cookies/CSRF/OAuth y cobertura RBAC, que todavía no tiene un proveedor OAuth real configurado en este entorno.
2. Migrar specs Playwright legacy relevantes al harness local SQLite y añadir cobertura de roles/rutas, límites de duración, concurrencia/idempotencia, y aislamiento offline/logout/desasignación.
3. Cerrar entrega push end-to-end solo con proveedor/config local de prueba y payload genérico; no validar credenciales/DB Turso.
4. Completar gates de impresión, hospitales, búsqueda/paginación, perfil/comunidad, estados de error y empaquetado mismo-origen.
5. Al completar cada flujo, ejecutar los tests/build pertinentes, inspeccionar las nuevas capturas y actualizar checklist/estado.

No marcar COMPLETE mientras queden criterios relevantes o gates sin evidencia.
