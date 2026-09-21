# Loop state: api-front-separation

Updated: 2026-09-20
Iteration: 1 (segunda auditoría y aclaraciones de producto incorporadas; implementación no iniciada)

Specs:
- `docs/features/api-front-separation/functional-spec.md` (contratos, duración personalizada, edición, archivo de hospitales y permisos de coordinación cerrados)
- `docs/features/api-front-separation/technical-spec.md` (rutas/DTOs de búsqueda, métricas, edición y archivo de hospitales alineados)
- Checklist: `docs/features/api-front-separation/implementation-checklist.md`
- Revisión independiente: `docs/features/api-front-separation/gap-analysis.md` (dos auditorías, cuatro agentes en cada una)

E2E screenshot dir (gitignored): `e2e/artifacts/screenshots/api-front-separation/`

## Verification commands

- Feature E2E (in-loop): pendiente; crear script runnable `npm run test:e2e:api-front-separation` y spec aislado.
- Feature unit (in-loop): `npm run api:test` para API; añadir/identificar pruebas unitarias front enfocadas.
- Front unit disponible: `npm run front:test:unit`.
- Builds disponibles: `npm run api:build` y `npm run front:build`.
- Full unit (final gate): pendiente; agregar script raíz `npm test` que ejecute suites de ambas apps.
- Full E2E (final gate): pendiente; agregar `npm run test:e2e` raíz.
- Condición para todos los comandos: usar SQLite local/test; nunca validar Turso en este ciclo.

## Acceptance checklist

- [ ] AC1–2: acceso Google permitido por allow-list y rechazo de no autorizado.
- [ ] AC3: datos persistidos y compartidos entre sesiones/dispositivos.
- [ ] AC4: directorio y alertas visibles según permisos acordados.
- [ ] AC5: paciente/cuidador persisten con validación correcta.
- [ ] AC6: seguimiento append-only con autor y fecha.
- [ ] AC7: seguimiento offline permitido solo con ficha asignada y previamente abierta, sobrevive a reinicio.
- [ ] AC6: duración personalizada de 15 a 1440 minutos en incrementos de 15, con valores válidos persistidos e inválidos rechazados.
- [ ] AC8–9: outbox reintenta y sincroniza idempotentemente, conservando errores hasta ACK.
- [ ] AC10: alerta y push genérico al equipo asignado, sin información privada.
- [ ] AC11: allow-list, roles y acciones admin protegidas en servidor.
- [ ] AC12: cualquier voluntario resuelve explícitamente alerta activa.
- [ ] AC13: estadísticas personales de voluntario y globales de coordinador/admin, con zona local del dispositivo consultante.
- [ ] AC18: coordinador puede participar como voluntario y recibir push por pacientes asignados.
- [ ] AC19: pacientes archivados visibles para todos; solo coordinador puede restaurarlos.
- [ ] AC23: coordinadores/admins archivan y restauran hospitales; los archivados no se ofrecen para nuevas altas y conservan referencias históricas.
- [ ] AC24: coordinadores/admins pueden editar paciente y cuidador, incluida la relación; voluntarios solo consultan.
- [ ] AC20: búsqueda, filtros/paginación de pacientes y voluntarios según FRS.
- [ ] AC21: métricas/series/badges derivadas de fuente DB, año/periodo/zona correctos; no fixtures.
- [ ] AC22–23: DTO sin pérdida en impresión; retirar citas y actividad ficticias.
- [ ] Integración: todas las pantallas operativas consumen la API bajo `/api` en mismo origen.
- [ ] Gates completos: unit, feature E2E + inspección de imágenes, full E2E y builds; sin pruebas de Turso.

## Unit test plan

- API servicios/repositorios/migraciones SQLite → relaciones, transacciones, validación, append-only e invariantes.
- API auth/session → allow-list, roles, cookie flags, rotación, revocación, expiración y CSRF/Origin.
- API permisos HTTP → 401/403 por rol/ruta y directorio completo del voluntario.
- API follow-up/alerts → cualquier paciente visible, alerta en transacción, resolución explícita e historial.
- API idempotencia → mismo usuario + UUID + payload no duplica; mismo UUID con payload distinto devuelve conflicto.
- API stats → cifras propias voluntario vs agregados admin.
- API push → destinatarios asignados excepto autor; payload no contiene PII ni contenido clínico.
- Front API client → credenciales same-origin, CSRF, errores/401 y respuestas JSON.
- Front IndexedDB/outbox → límite de cache, reintentos, reinicio, ACK/conflicto, limpieza de sesión/asignación.
- Front componentes/páginas → estados loading/empty/error y flujos admin/voluntario sin fuente local canónica.

## E2E scenarios + screenshot manifest

Paths under `e2e/artifacts/screenshots/api-front-separation/`. Las filas están planeadas, todavía no hay spec/capturas.

| # | Step | File | Status |
|---|---|---|---|
| 1 | Login permitido e identidad cargada | `01-volunteer-home.png` | pending |
| 2 | Admin abre directorio y ficha | `02-admin-patient-directory.png` | pending |
| 3 | Admin crea/actualiza paciente, cuidador y asignación | `03-admin-patient-saved.png` | pending |
| 4 | Voluntario registra seguimiento confirmado | `04-follow-up-confirmed.png` | pending |
| 5 | Alerta activa y resolución explícita | `05-alert-resolved.png` | pending |
| 6 | Sin conexión, seguimiento en outbox | `06-offline-queued.png` | pending |
| 7 | Reconexión con seguimiento sincronizado una vez | `07-offline-synced.png` | pending |
| 8 | Estadísticas personal vs admin | `08-role-specific-stats.png` | pending |
| 9 | Usuario no autorizado rechazado | `09-access-denied.png` | pending |
| 10 | Admin gestiona allow-list sin envío simulado | `10-admin-access-list.png` | pending |
| 11 | Búsqueda y filtros del directorio devuelven datos API | `11-patient-search-filter.png` | pending |
| 12 | Voluntario activa alerta desde modal con datos confirmados | `12-alert-created.png` | pending |
| 13 | Formulario de alta compleja y estado coherente | `13-complex-patient.png` | pending |
| 14 | Historial clínico en vista de impresión | `14-print-report.png` | pending |
| 15 | Error/conflicto de sincronización con outbox preservada | `15-sync-conflict.png` | pending |
| 16 | Perfil/comunidad sin contenido de demostración | `16-volunteer-community.png` | pending |

## Last verification

- Estado inicial consultado: branch `feature/api-front-separation`; los commits de separación y skill setup ya existen.
- Front build: se informó verde en iteración previa; no representa validación actual de integración API/front.
- API unit/build: no verificados en esta tarea.
- Feature E2E: aún no existe el comando/spec; no ejecutado.
- Full unit/E2E: comandos raíz todavía no están configurados; no ejecutados.
- Screenshot review: no hay capturas aún.
- Final full-suite gate: pending.
- Turso: no validado ni se debe validar como parte de este checklist.

## Screenshot review notes

Sin capturas. Cuando se ejecute E2E, abrir cada PNG y anotar pass/fail, UI visible, layout, copy, estados y relación con sus AC; no cerrar iteración basándose solo en el código de salida de Playwright.

## Open issues

- Producto: decisiones funcionales cerradas; aclaraciones duplicadas consolidadas en edición (coordinador/admin) y archivo/restauración de hospitales (coordinador/admin).
- Pendiente técnico para la implementación: definir expiración de sesión/caché y tratamiento del outbox ante revocación/desasignación.
- Infraestructura de usuario: creación/configuración de Turso queda fuera de la validación de esta tarea y del gate local descrito aquí.
- Test harness: faltan script feature E2E y agregadores raíz para los gates completos.

## Next iteration focus

1. Leer este archivo primero, luego functional spec, technical spec, checklist y gap-analysis.
2. Las preguntas de producto ya están resueltas. Congelar DTO/OpenAPI, modelo SQLite y matriz de permisos a partir de ambos specs; no reabrir decisiones confirmadas.
3. Revisar `api/AGENTS.md`, scripts y lockfiles; preparar SQLite local/test, fixtures seguros y comandos unit/feature E2E, sin comandos Turso.
4. Implementar verticales API + front según checklist; capturar/revisar imágenes E2E por iteración y mantener este estado actualizado.
