# Revisión de faltantes: migración front/API

## Cierre de aclaraciones de producto (2026-09-20)

Las preguntas surgidas de las dos auditorías quedaron respondidas. La duración personalizada es 15–1440 minutos en múltiplos de 15; un coordinador asignado tiene todas las capacidades de voluntario para esa asignación, incluido offline; coordinador y admin pueden archivar/restaurar hospitales mediante archivo suave; y la edición de paciente/cuidador, incluida la relación, se incorpora para coordinador/admin. Estas reglas están consolidadas en los specs y la checklist. No quedan decisiones de producto abiertas en esta revisión.

Fecha: 2026-09-20. Se hicieron cuatro análisis independientes con la misma consigna, contrastando los specs, checklist y estado de loop con `front/` y el scaffold `api/`. No se modificó código ni se ejecutaron pruebas. No se inspeccionó ni validó Turso.

## Estado después de las decisiones del usuario

El análisis original identificó brechas que se cerraron al actualizar los specs: campos completos visibles para voluntarios; alta de seguimiento para cualquier paciente; Google + allow-list y admin inicial; roles diferenciados; coordinador con gestión de pacientes/hospitales/asignaciones, métricas globales, alta de voluntarios y posibilidad de participar como voluntario si está asignado, sin administrar roles; DNI normalizado único y archivo sin borrado (visible para todos, restaurable solo por coordinador); alertas múltiples y resolución explícita con nota opcional; métricas derivadas de base por rol; mismo origen público; preservar búsqueda, filtros e impresión; duración presencial/remota más opción personalizada; y seguimiento offline con outbox.

La zona para los cortes temporales se definió como la zona local del dispositivo que consulta. El detalle de expiración y protección local de outbox queda como definición técnica de implementación, no como una decisión de alcance funcional.

## Segunda auditoría redundante: cuatro revisiones independientes

Fecha: 2026-09-20. Cuatro agentes hicieron de nuevo la misma tarea de lectura cruzada de `front/`, scaffold `api/`, specs y checklist. No modificaron código ni ejecutaron pruebas ni validaron Turso. Los hallazgos coincidentes se consolidan abajo; la frecuencia indica cuántos informes independientes señalaron la brecha.

| Frecuencia | Hallazgo | Evidencia y consecuencia | Estado |
|---:|---|---|---|
| 4/4 | Contrato exacto de estadísticas incompleto | `HomeDashboard.jsx`, `Stats.jsx` y `chartData.js` muestran conteos, horas, ventanas semanales, gráficos mensuales/anuales y badges. Los docs exigen que salgan de datos persistidos, pero no especifican una fórmula/ventana/unidad para cada widget ni cuáles badges y series se conservan. Definir el catálogo métrico antes de cerrar `/stats/me` y `/stats/global`; retirar agenda/valores fijos sin entidad en DB. | Falta de definición; zona local ya acordada. |
| 4/4 | Perfil/comunidad con diccionario parcial | `Volunteers.jsx` muestra email, teléfono, estado y asignaciones; semillas también incluyen especialidad, antigüedad y avatar. Los docs preservan esos campos y edición propia, pero no fijan tipos, fuente, semántica (p. ej. antigüedad manual/calculada, perfil activo/inactivo), imagen/avatar ni matriz campo-editable/campo-calculado. | Falta de contrato de datos; reglas generales de visibilidad/edición ya acordadas. |
| 4/4 | Documentación con bloques desactualizados o contradictorios | Hay secciones “abiertas” que listan permisos coordinador/outbox ya decididos, checklist que pide volver a cerrar decisiones y estados que hablan de decisiones pendientes. Las instrucciones pueden hacer que una iteración futura reabra asuntos cerrados. | Requiere limpieza editorial; no es nueva decisión de producto. |
| 3/4 | Búsqueda, filtros y orden sin contrato completo | `Patients.jsx`, `Header.jsx`, `Volunteers.jsx` admiten búsquedas/filtros distintos; `/patients` solo promete búsqueda/filtros. Faltan campos indexados/buscables, parcialidad, mayúsculas/acentos, estados, orden, paginación y búsqueda global en comunidad. | Falta de contrato HTTP/UI. |
| 3/4 | Múltiples alertas no tienen respuesta/UI completamente descrita | El modelo admite varias alertas; `GET /alerts?status=active` no define si devuelve cada alerta o pacientes agrupados, ni cómo consultar resueltas. Header/dashboard resumen por paciente y la ficha hoy representa alertas como eventos de seguimiento. Falta definir lista/DTO, vínculo con legado, selección de una alerta, nota opcional, refresco de estado y navegación desde push. | Falta de contrato de lectura e interacción; la regla de negocio ya está acordada. |
| 3/4 | Duración personalizada sin límites concretos y aún ausente del formulario | `NewFollowUp.jsx` solo recoge presencial/remoto; falta el control de duración personalizado que el usuario pidió. Los docs indican horas/decimal, pero no fijan rango, step, precisión ni validación. | La decisión de incluirla y defaults (2 h/1 h) está tomada; faltan detalles de producto/UI. |
| 3/4 | Offline/outbox requiere conciliar política aprobada y casos límite | La outbox ligada al autor sobrevive logout, pero varios docs/checks siguen dejando abierta su “política”. Faltan TTL/protección local y comportamiento concreto si durante la cola se revoca al usuario o se retira la asignación, incluida resolución visible del conflicto/descarte explícito. | Retención tras logout está decidida; falta contrato técnico/UX para revocación y desasignación. |
| 2/4 | Seguimiento no tiene todavía un DTO canónico explícito | `NewFollowUp.jsx` emite claves como `dolor`, `nauseas`, `disnea`, `symptomObs`, `equipment`; seeds/detalle/reportes leen otros nombres (`pain`, `nausea`, `dyspnea`, `symptomObservations`, `equipmentNeeds`). | Falta mapping request/response y criterios de roundtrip; el formato UI/negocio ya está acordado. |
| 2/4 | Hospital archivado/eliminado y asignación a fichas no están cerrados | La UI actual ofrece `deleteHospital`; el modelo propone activo/archivado y preservar referencias, pero faltan permisos, regla para hospital referenciado, disponibilidad al crear paciente e impresión/historial. | Decidir/definir antes del contrato del catálogo. |
| 2/4 | Formulario de cuidador y edición de paciente no coinciden con el modelo/API propuestos | `NewPatient.jsx` fija relación `Familiar/Otro`; la API propone PATCH/edición aunque el front actual principalmente ofrece alta y detalle de lectura. Confirmar si se agregan controles para cubrir todos los campos/editabilidad o se limita contrato a los flujos que existen. | Alinear alcance y UX antes de implementar. |

### Otros hallazgos únicos a verificar

- `HomeDashboard.jsx` presenta una agenda y botón “Agenda Completa” con citas hard-coded, sin entidad ni flujo de gestión. Dado que se acordó quitar valores no respaldados por DB, la recomendación es retirar ese bloque/CTA en vez de introducir agenda en API sin pantalla CRUD.
- `NewPatient.jsx` guarda “Situación Compleja” como estado `Alerta`, aunque la regla aprobada es `En Observación`; `db.js` puede cambiar el paciente a `Estable` al guardar un seguimiento normal pese a que existan alertas activas. Añadir AC/tests de regresión para ambos invariantes.
- La allow-list necesita normalización/deduplicación de email, respuestas a duplicado y protección contra quitar/degradar al último admin o alterar el bootstrap inicial. Coordinador debe tener permiso de alta volunteer sin recibir por herencia el permiso global `admin:manage_settings` que hoy protege las rutas scaffold.
- El Service Worker (`front/public/sw.js`) y el click de push necesitan figurar explícitamente en el inventario y contrato: apertura de paciente/alerta destino con sesión vigente o vencida, siempre sin contenido clínico en el payload.
- El scaffold sigue sin rutas de dominio Medice y su auth actual aún emite Bearer; ambos están incluidos como trabajo en checklist, no son faltantes de decisión.

### Priorización sugerida antes de congelar endpoints

1. Resolver el contrato de datos del seguimiento, el detalle/listado de alertas y el conjunto de estadísticas, porque pueden causar pérdida o discrepancia de campos actualmente mostrados.
2. Definir queries de búsqueda y DTOs de perfil/cuidadores/hospitales, además de la política de centros archivados.
3. Alinear UI requerida versus actual para edición de pacientes, duración personalizada y resolución de alertas múltiples.
4. Cerrar revocación/desasignación y caducidad/protección del outbox; limpiar estados contradictorios en la checklist/spec para que `loop-state.md` no reabra decisiones.
5. Mantener separado el trabajo de implementación ya decidido: auth-cookie, rutas de dominio, push, offline, permisos y regresiones de estado clínico.

## Comparación de resultados

| Tema | Consenso | Conclusión |
|---|---:|---|
| Semántica y ciclo de alertas | 4/4 | Contrato incompleto: varias entradas de UI, alta compleja sin registro de alerta, múltiples alertas/estado derivado y resolución UI aún no definida. |
| Logout, caché y outbox offline | 4/4 | Separar explícitamente la ficha cacheada de los seguimientos pendientes; preservar/atribuir la outbox sin exponerla a otra cuenta y definir desasignación/revocación. |
| OAuth/cookie y revocación de acceso | 4/4 | Concretar protocolo de login compatible con cookie frente al scaffold Bearer, claims y efecto de cambios de acceso/rol. |
| Bootstrap del primer admin | 2/4 | No está descrito cómo entrar a una base vacía sin depender de un bypass inseguro. |
| Mock/local y cobertura de pantallas | 4/4 | Inventariar por pantalla contenido operativo, calculado, local y simulado; algunos dashboards, stats y sincronización hoy muestran datos hardcoded. |
| Perfil, allow-list e invitaciones | 4/4 | Aterrizar campos/roles y transformar acciones de invitación simulada a gestión real de allow-list, sin estados ni “reenviar” ficticios. |
| Privacidad de listados | 3/4 | “Directorio completo” no determina proyección por campo; faltan reglas para cuidador y perfil/comunidad de voluntarios. |
| Métricas y dashboard por rol | 3/4 | Personal/global debe cubrir dashboard además de Stats; acordar métricas, periodos, zona horaria y duración. |
| Campos de seguimiento | 2/4 explícito | Hay divergencias entre nombres/forma del formulario, semillas e historial; falta DTO canónico campo por campo. |
| Alta de alerta desde varios flujos | 3/4 explícito | `AlertModal`, toggle del seguimiento y “Situación Compleja” no convergen en una regla de dominio persistida. |
| Archivo/borrado referencial | 2/4 | DNI, baja/archivo de paciente y hospital/cuidador referenciados afectan integridad e historial; identificados como abiertos, pero no bloquean todavía los gates de manera explícita. |
| Pruebas automatizadas de Google | 3/4 explícito | Los E2E deberían usar proveedor/verificador de identidad de test aislado, nunca depender de una cuenta Google real y nunca habilitar ese modo en producción. |

## Hallazgos concretos a resolver antes de congelar contrato/DDL

### 1. Alertas, urgencia y estado del paciente

- `front/src/components/AlertModal.jsx` captura nivel, motivo y observaciones. `front/src/pages/PatientDetail.jsx` hoy los convierte en texto de seguimiento y descarta nivel/motivo estructurados.
- `front/src/pages/NewFollowUp.jsx` también activa alerta desde el formulario. `front/src/pages/NewPatient.jsx` tiene “Situación Compleja” y puede poner `currentStatus: Alerta` al alta sin crear una alerta auditable.
- `front/src/services/db.js` puede volver a marcar estable al guardar seguimiento ordinario. Esto contradice alertas activas hasta resolución explícita.
- `PatientDetail` muestra activación pero no ofrece acción UI de resolver. El endpoint técnico propuesto no basta para que el flujo esté completo.

**Cerrar:** decidir si son una o varias vías/eventos de alerta; campos obligatorios, relación opcional/obligatoria con seguimiento, destinatarios y push; qué hace “Situación Compleja”; si hay múltiples alertas activas; si estado clínico del paciente se separa del indicador derivado de alertas; cómo resuelve una alerta individual y qué ofrece la UI para confirmar/mostrar éxito/conflicto. Añadir AC y casos de persistencia/API/E2E para cada camino.

### 2. Sesión Google, bootstrap y cambios de acceso

- El scaffold usa Bearer JWT; el diseño elegido requiere cookie opaca server-side y logout revocable. No está detallado el flujo browser OAuth completo/callback frente al contrato scaffold.
- Admin gestiona allow-list, pero no hay procedimiento para el primer admin en una DB vacía. Un bootstrap abierto o `DEV_AUTH_BYPASS` en producción sería una vulnerabilidad.
- Hace falta cubrir issuer/audience/expiración, `email_verified`, `state`/nonce o equivalente anti-login-CSRF, retorno permitido, normalización de email y prueba sin proveedor real.
- No se fija si quitar de allow-list, desactivar cuenta o cambiar rol invalida todas las sesiones activas inmediatamente.

**Cerrar:** flujo cookie único (sin aceptar JWT alternativo en rutas protegidas), proceso one-time/configurado de primer admin, roles válidos y transiciones, revocación en servidor y tests negativos locales aislados de Google.

### 3. Outbox offline, logout y privacidad por cuenta

El functional spec requiere conservar pendientes tras logout y sincronizarlos luego de autenticación válida. La checklist decía “limpieza al cerrar sesión” sin distinguir outbox de fichas. Son dos almacenes y necesitan políticas distintas.

**Regla propuesta para el diseño:** purgar fichas/caché clínica al logout; conservar la outbox pendiente asociada al identificador del autor original, fuera del alcance de cualquier otra cuenta; permitir enviar solo al autenticarse como ese mismo usuario, sujeto a revalidación de autorización por servidor. Definir protección local, caducidad y acción de descarte/exportación antes de implementar. Si al reconectar perdió asignación o autorización, conservar como conflicto no sincronizado, nunca cambiar autor ni descartar silenciosamente. Casos: logout-login misma cuenta, login de otra cuenta, revocación y asignación retirada. Esta regla es recomendación técnica a confirmar en el spec, no una nueva decisión de producto.

### 4. Contrato de datos y alcance que realmente ve el usuario

- `NewFollowUp` escribe claves como `dolor/nauseas/disnea`, `symptomObs`, `equipment/equipOther`; datos iniciales y `PatientDetail` consumen `pain/nausea/dyspnea`, `symptomObservations`, `equipmentNeeds/equipmentOther`. `durationHours` alimenta estadísticas pero no se ve en el formulario actual.
- `Volunteers.jsx` muestra especialidad, teléfono, email, estado, antigüedad, avatar y asignaciones; el modelo/rutas no deciden fuente ni quién puede editar/ver esos campos. El rol actual de UI incluye “Coordinador”, mientras el modelo nuevo solo enumera volunteer/admin.
- La comunidad muestra pacientes asignados y datos de contacto; “directorio completo” no fija qué datos de paciente/cuidador devuelve la tabla versus ficha.
- Las invitaciones locales tienen reenviar/revocar/borrar y estados, pero no habrá email; debe definirse la correspondencia con allow-list real y evitar feedback de envío falso.
- Dashboard/Stats/OfflineSync contienen agregados, logros, historial o estado de red hardcoded. El resumen por rol, los campos de perfil/preferencias locales y los reportes de impresión no están trazados con suficiente precisión.
- Búsqueda global/directorio, filtros por estado, orden, paginación y vista/impresión del historial requieren contrato y pruebas. La impresión puede materializar datos clínicos/identificatorios y debe usar respuesta autorizada actual.

**Cerrar:** tabla de DTO por recurso/campo y rol; mapa exacto de campos de seguimiento/alerta; inventario por widget marcado API, cálculo frontend, preferencia local o eliminar/reemplazar; reglas de búsqueda/filtro; métricas por rol/periodo/horario; tratamiento de print y pruebas que detecten contenido demo con DB vacía.

### 5. Integridad, archivo y resolución de conflictos

Política DNI, archivo/borrado de paciente, hospital referenciado y vigencia de cuidador están abiertas. La checklist exige decidir antes de DDL, pero debería prohibir explícitamente cerrar DDL y DoD mientras falten. Para datos append-only, edición/borrado, resolución simultánea de alertas y desasignación durante outbox requieren conflicto definido; no asumir “sobrescribir local” para seguimientos aceptados.

### 6. Infraestructura y E2E

- El usuario confirmó “mismo host”; el diseño asume mismo origen público `/` y `/api`. Mantener ese supuesto claramente pendiente de confirmación si “mismo host” podía permitir origen/puerto distinto.
- La suite actual de Playwright prueba el front con almacenamiento local; falta ambiente E2E que levante front y API reales con SQLite efímero/reiniciable.
- El E2E Google debe simular/verificar proveedor solo bajo `NODE_ENV=test`; definir setup, teardown/aislamiento, evitar scripts remotos y comprobar que `/api` es network-only en Service Worker/Cache Storage.
- La manifest debe cubrir los flujos funcionales nuevos y al menos estados de error/reintento, allow-list/asignación, búsqueda/filtros, hospital, resolución, print y roles/dashboard; los gates completos mantienen captura y revisión visual.

## No son gaps de esta migración

No importar semillas/localStorage, no enviar email de invitación, no agregar realtime y no validar/crear/conectar/migrar/sembrar Turso: son límites deliberados. Retención regulatoria requiere gate organizacional antes de uso de datos reales, pero no implica probar Turso.

## Estado

Estos gaps se añadieron como precondiciones y tareas de la checklist. Las decisiones con efecto de producto/datos deben confirmarse antes de congelar contrato o DDL; las recomendaciones no reemplazan respuestas del usuario. No se implementó API ni se ejecutaron pruebas.
