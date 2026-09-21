# Especificación funcional: API compartida para Medice

| Campo | Valor |
|---|---|
| Estado | Decisiones de producto cerradas; contratos y criterios de aceptación consolidados |
| Autor | Codex, a partir de la exploración del repositorio y decisiones del usuario |
| Creada | 2026-09-20 |
| Actualizada | 2026-09-20 |
| Carpeta | `docs/features/api-front-separation/` |
| Siguiente documento | [technical-spec.md](./technical-spec.md) |
| Relacionados | `front/docs/functional_requirements_specification.md`, `front/docs/technical_specification.md`, `api/README.md` |

## Resumen

Medice tendrá una aplicación frontend y una API independientes dentro del mismo repositorio. La API será la fuente compartida de autenticación y datos del producto. La interfaz actual dejará de depender de `localStorage` para leer y guardar información operativa y usará la API para los recorridos acordados aquí.

El primer alcance lleva a la API los flujos y datos que la interfaz ya presenta: pacientes y cuidadores, seguimientos, alertas, hospitales, asignaciones, perfiles de voluntarios, dashboard, estadísticas y reporte imprimible. También incluye guardar seguimientos sin conexión y sincronizarlos después, y enviar push genérico al equipo asignado cuando se registra una alerta. Habrá tres roles (voluntario, coordinador y administrador) con alcances distintos. Los registros actuales de `localStorage` son demo/semilla y no se migran; sí se deben conservar los campos y recorridos que la interfaz ofrece.

El repositorio contiene documentos anteriores que describen Firebase, persistencia local, notificaciones y trabajo offline de formas que no coinciden con el código actual. Este documento recoge las decisiones actuales del producto para la separación; el diseño técnico determinará cómo aplicarlas sobre el scaffold Node.

## Objetivos

1. Permitir que voluntarios, coordinadores y administradores usen los mismos registros desde varios dispositivos, con la API como fuente compartida.
2. Autenticar con Google solo a personas cuyo correo esté autorizado; no permitir altas públicas.
3. Mantener el directorio completo de pacientes visible y permitir que cualquier voluntario registre seguimientos y resuelva alertas para cualquier paciente visible.
4. Conservar los recorridos de gestión de pacientes, cuidadores, seguimientos, hospitales y asignaciones en la interfaz actual.
5. Permitir registrar un seguimiento sin conexión para un paciente asignado cuya ficha ya se abrió en el dispositivo, y sincronizarlo al volver la conexión.
6. Hacer visible una alerta registrada y notificar al equipo asignado con una notificación push que no revele datos del paciente en la pantalla bloqueada.
7. Presentar métricas personales al voluntario y globales al coordinador y al administrador.
8. Conservar todos los campos del producto que hoy se muestran en ficha, seguimiento, alertas, perfil/comunidad, dashboard, estadísticas y vista imprimible, retirando valores y acciones ficticios.

## No objetivos de v1

- Importar o consolidar datos guardados en `localStorage`; los datos presentes son demostraciones/semillas.
- Alta con email y contraseña, registro público o invitaciones por email con enlace de aceptación. El ingreso acordado es Google más una lista de correos autorizados.
- Rehacer la interfaz, rediseñar sus páginas o cambiar sus flujos visuales, excepto los estados necesarios para carga, errores, sesión y sincronización.
- Añadir chat, mensajería clínica, telemedicina, archivos clínicos o nuevos módulos no presentes en los recorridos actuales.
- Usar la API genérica de ejemplo o los endpoints genéricos de media del scaffold como modelo del dominio clínico.

## Contexto y problema

La interfaz mantiene datos de pacientes, cuidadores, seguimientos, hospitales, voluntarios e invitaciones en `localStorage`. Las lecturas y escrituras son locales y síncronas, por lo que los cambios no se comparten entre usuarios. El login de Google es una simulación y el código actual no aplica de forma efectiva roles diferentes. El panel de sincronización, las invitaciones y parte de los avisos también presentan datos o acciones simuladas.

El scaffold API ya ofrece fundamentos genéricos de autenticación, permisos, configuración de usuarios, notificaciones, push y persistencia. No tiene todavía los registros ni las reglas propias de pacientes, cuidadores, asignaciones, hospitales y seguimientos de Medice. La necesidad del producto es completar esa capacidad y conectar la interfaz con ella, conservando el comportamiento acordado para los usuarios.

## Terminología

| Término | Significado |
|---|---|
| Paciente | Persona acompañada por Medice, con ficha clínica y estado de acompañamiento. |
| Cuidador / referente | Persona de contacto vinculada a la ficha del paciente. |
| Seguimiento | Registro cronológico de contacto, síntomas, contexto familiar, necesidades e intervenciones. |
| Alerta | Señal prioritaria asociada a una situación que requiere atención del equipo. |
| Voluntario asignado | Voluntario asociado por un administrador a un paciente para acompañarlo. |
| Lista autorizada | Correos aprobados por un administrador para que puedan iniciar sesión con Google. |
| Sincronización pendiente | Seguimiento guardado en el dispositivo mientras no hay conexión y aún no confirmado por la API. |

## Actores

| Actor | Capacidades |
|---|---|
| Voluntario | Inicia sesión con Google autorizado; ve todos los campos del directorio/ficha y comunidad; registra seguimientos y resuelve alertas para cualquier paciente visible; consulta sus métricas personales y recibe push si está asignado al paciente. Ve y edita su propio perfil. |
| Coordinador | Puede consultar métricas globales, gestionar pacientes/hospitales/asignaciones y agregar correos con rol voluntario a la lista autorizada; no puede conceder rol administrador ni cambiar roles existentes. Puede tener pacientes asignados y recibir push como voluntario. También ve y edita su propio perfil. |
| Administrador | Todas las capacidades operativas; consulta todos los agregados y administra roles/lista autorizada. Puede tener además perfil voluntario y ser asignado a pacientes. |
| API | Autentica, aplica permisos, conserva los datos compartidos, entrega información para las pantallas, registra los seguimientos y alertas, y coordina la confirmación de sincronización y las notificaciones acordadas. |

## Disponibilidad y acceso

- El producto no permite registro público. Una cuenta Google debe corresponder a un correo autorizado; los correos de bootstrap inicial se autorizan con el rol configurado al iniciar sesión por primera vez.
- Los voluntarios pueden consultar todos los pacientes y los campos actuales de paciente y cuidador tanto en el directorio como en la ficha. Los campos actuales de comunidad/perfil también son visibles a voluntarios, coordinadores y administradores.
- Para redactar un seguimiento offline, la persona debe estar autenticada y participar como voluntario (voluntario, coordinador o administrador con perfil voluntario), tener asignado al paciente y haber abierto su ficha previamente mientras tenía conexión. Solo las fichas de pacientes asignados y abiertos antes quedan disponibles en el dispositivo.
- Los seguimientos offline quedan pendientes hasta que la conexión vuelva y la API los confirme. La interfaz debe mostrar que siguen pendientes y no presentarlos como ya compartidos con el equipo.
- Una alerta genera una notificación push genérica a quienes participan como voluntarios y están asignados, excepto quien la registró; no se incluye identidad ni motivo en la pantalla bloqueada.
- Cualquier voluntario puede registrar un seguimiento para cualquier paciente visible.
- Una alerta permanece activa hasta que un voluntario la resuelve explícitamente.
- El voluntario ve sus propias métricas; el coordinador y el administrador consultan métricas globales. El administrador además tiene todas las capacidades de gestión y puede participar como voluntario.
- Cada usuario ve y edita sus propios datos de contacto/perfil; la comunidad permite que todos los roles consulten los perfiles. La identidad Google y los permisos no se editan desde el perfil; el total de pacientes asignados se deriva de las asignaciones.
- Los pacientes se archivan en vez de borrarse y el DNI se almacena como una cadena de dígitos normalizados, única aunque la entrada incluya puntos u otros separadores. Todos los roles pueden consultar pacientes archivados; solo coordinadores pueden restaurarlos. La operación de archivar corresponde a coordinadores y administradores.
- Coordinadores y administradores pueden editar las fichas maestras de pacientes y cuidadores, incluida la relación; voluntarios solo consultan esos datos.
- Hospitales/centros se archivan y restauran (sin borrado físico) por coordinadores o administradores. Los archivados no están disponibles para nuevas altas; su referencia y nombre histórico se preservan en pacientes existentes.

## Recorridos de usuario

### Voluntario — ingreso y acceso compartido

1. La persona elige iniciar sesión con Google.
2. Si el proveedor confirma la identidad y el correo figura en la lista autorizada, entra a la aplicación con su rol.
3. Si el correo no está autorizado, el acceso se rechaza con un mensaje que indica que debe contactar a un administrador; no se crea una sesión con datos del producto.
4. Al cerrar sesión, el acceso a pantallas y datos protegidos termina. Los seguimientos aún pendientes de sincronizar se conservan localmente y vuelven a sincronizarse solo después de una nueva autenticación autorizada.

### Voluntario — consultar directorio y ficha

1. Abre el directorio y busca o filtra pacientes por los criterios ya disponibles en la interfaz.
2. Ve el estado de cada paciente y una señal clara para las alertas activas.
3. Abre una ficha para consultar los datos del paciente, su cuidador/referente y el historial cronológico.
4. Puede abrir la ficha online de cualquier paciente visible. Para el trabajo offline, la aplicación conserva únicamente la ficha de pacientes que tiene asignados y que abrió previamente.

### Voluntario — registrar seguimiento con conexión

1. Desde una ficha disponible, abre el formulario de seguimiento.
2. Registra tipo de contacto, síntomas y observaciones, soporte familiar, necesidades de equipamiento e intervenciones.
3. Confirma el envío; la aplicación indica si la API guardó el seguimiento o si debe corregir campos/reintentar.
4. Cuando el registro activa una alerta, la ficha refleja el estado prioritario y el equipo asignado recibe un push genérico.

### Voluntario — registrar seguimiento sin conexión

1. Abre una ficha de un paciente asignado mientras tiene conexión.
2. Si pierde conexión, puede completar y guardar un seguimiento para esa ficha.
3. La aplicación confirma que el registro quedó pendiente en ese dispositivo y mantiene la ficha/cola disponible después de cerrar y volver a abrir la app.
4. Al recuperar conexión y una sesión válida, la aplicación envía los pendientes automáticamente.
5. La aplicación quita un pendiente de la cola solo al recibir confirmación de la API; si falla la red o la sesión expiró, conserva el registro y comunica que la sincronización sigue pendiente.
6. Al confirmarse un seguimiento que activa una alerta, el equipo asignado recibe la notificación genérica. No se envían notificaciones por registros todavía locales.

### Administrador — habilitar acceso

1. Abre la administración de usuarios/accesos.
2. Añade un correo a la lista autorizada y asigna o confirma su rol. Un coordinador puede agregar únicamente un correo nuevo como voluntario.
3. La persona inicia sesión con la cuenta Google correspondiente y recibe los permisos asociados a su rol.
4. El administrador puede retirar el correo autorizado o cambiar el rol; el usuario no autorizado deja de obtener acceso protegido. La interfaz es una lista de accesos, no un envío de invitaciones.

### Administrador — administrar pacientes, hospitales y asignaciones

1. Crea o actualiza la ficha maestra del paciente y los datos del cuidador/referente.
2. Selecciona pacientes y voluntarios para crear o cambiar asignaciones.
3. Crea, actualiza o quita opciones del catálogo de hospitales/centros.
4. La información nueva aparece al volver a consultar las vistas relevantes; los datos no dependen del navegador que hizo el cambio.

### Voluntario — activar y resolver una alerta

1. Desde la ficha o el formulario de seguimiento, el voluntario inicia explícitamente la activación de alerta.
2. Completa nivel (Seguimiento Estándar o Crisis Compleja), motivo y observaciones; se conserva ese contenido como un registro de alerta propio, no como valores clínicos inventados en un seguimiento.
3. Si activa alerta desde un seguimiento, la alerta y el seguimiento se guardan juntos y quedan vinculados. El modal de alerta de ficha crea una alerta sin fabricar un seguimiento.
4. Puede haber varias alertas activas por paciente. Un seguimiento ordinario no cierra ninguna. Cualquier voluntario puede resolver una alerta concreta, con una nota opcional.
5. El estado visible del paciente indica Alerta mientras tenga una o más alertas activas. Al resolver la última, vuelve a Estable o En Observación según la marca “Situación Compleja”.

La regla funcional propuesta para evitar que “Situación Compleja” se confunda con urgencia es mantenerla como condición de observación del paciente, sin crear alerta activa ni push por sí sola. La alerta activa requiere motivo y observaciones mediante el flujo de alerta.

### Error, rechazo o desconexión

- Un usuario no autenticado o sin permiso recibe una respuesta de acceso denegado y no ve datos protegidos ni puede ejecutar cambios.
- Un error de validación identifica los datos que deben corregirse y no deja una ficha o seguimiento parcial.
- Un fallo del servicio o de red no se presenta como guardado exitoso.
- Las acciones de sincronización pendientes permanecen en el dispositivo hasta que la API las confirme.
- Los seguimientos son eventos cronológicos: un reintento de sincronización no debe crear un duplicado.
- Una alerta permanece activa hasta una resolución explícita por un voluntario; un seguimiento estándar no la cierra.

## Pantallas y arquitectura de información

Se conservan las áreas y páginas existentes: inicio/resumen, directorio y ficha de pacientes, nuevo paciente, nuevo seguimiento, comunidad de voluntarios, estadísticas, administración (asignaciones, accesos/lista autorizada) y configuración, además del reporte imprimible del historial. Se mantienen búsqueda global, filtros del directorio y campos visibles actuales. El panel de invitaciones se convierte en lista autorizada sin envío/reenvío de email ni estados ficticios.

Los datos operativos que hoy aparecen como valores estáticos, logros no trazables, agenda de ejemplo, citas pendientes ficticias, actividades simuladas, frases editoriales mostradas como dato y simulaciones de red/sincronización se quitan. Una métrica o logro se mantiene solo cuando su valor, condición y fecha se calculan con registros de la API. Las preferencias visuales (por ejemplo, tema oscuro) pueden seguir siendo locales. Las vistas muestran estados de carga, error, acceso denegado, desconexión y sincronización pendiente; los cambios se reflejan tras confirmación de la API.

## Datos funcionales

Los registros compartidos del producto son:

- Persona con perfil voluntario: identidad Google/email, nombre visible, teléfono, texto libre de especialidad/disponibilidad (un único campo como hoy), antigüedad presentada como texto, URL de avatar, estado de participación y rol. Email/identidad y rol son protegidos; la persona edita sus datos propios de perfil. El conteo de pacientes activos es calculado desde asignaciones. Admins y coordinadores pueden participar cuando tienen perfil voluntario y están asignados.
- Paciente: nombre, DNI (solo dígitos, normalizado y único), fecha de nacimiento, domicilio, diagnóstico, centro habitual, marca de “Situación Compleja”, estado derivado (Alerta si tiene alguna alerta activa; si no, En Observación si la marca de complejidad está activa; en otro caso Estable), asignaciones y timestamps.
- Cuidador/referente: paciente, nombre, vínculo, teléfono, convivencia y nivel de sobrecarga.
- Hospital/centro: nombre, domicilio, zona y estado; el archivo preserva su nombre en fichas e historial previos.
- Seguimiento: paciente, autor, fecha/hora de contacto, fecha/hora de recepción/confirmación cuando se sincroniza offline, tipo de contacto (presencial/remoto), duración, síntomas, observaciones, riesgo/red familiar, equipamiento y otros, intervenciones y relación opcional con una alerta.
- En el formulario actual de seguimiento, `symptomObservations` e `interventions` son obligatorios; síntomas individuales y equipamiento son opcionales. Se mantienen los valores por defecto/selección de apoyo familiar, contacto y equipamiento que muestra hoy la interfaz.
- En el alta actual de paciente se requieren nombre, DNI, nacimiento, domicilio, diagnóstico y nombre/teléfono de cuidador. El ID de hospital puede ser vacío; “Situación Compleja” es un booleano. La relación del cuidador se muestra en ficha/reporte pero hoy se rellena con un texto fijo al crear; se agregará como entrada elegible para conservar el vínculo real sin asumirlo.
- Síntomas visibles en el formulario: dolor (ausente, 1–3 leve, 4–6 moderado, 7–9 severo, 10 insoportable), náuseas (ninguna, ocasional, frecuente, persistente) y disnea (grados 0–3).
- Apoyo social visible: nivel de apoyo familiar (sólido y constante, intermitente/fragilidad, ausente/riesgo crítico) y notas del entorno.
- Equipamiento visible: concentrador de oxígeno, cama articulada, colchón antiescaras, aspirador de secreciones y texto de otro equipamiento.
- Duración: presencial estima 2 horas y remoto 1 hora; duración personalizada de 15 a 1440 minutos, en incrementos de 15.
- Alerta: paciente, autor, fecha, nivel, motivo, observaciones, estado activa/resuelta, autor/fecha de resolución y nota opcional; puede estar vinculada al seguimiento que la activó.
- Acceso autorizado: correo Google aprobado, rol permitido y estado derivado de si ya ingresó; coordinadores solo agregan voluntarios y no editan roles existentes.
- Suscripción de notificaciones: dispositivo de una persona autorizada que participa como voluntaria, con posibilidad de retirar la suscripción desde ese dispositivo.

### Contrato canónico de seguimiento

El API y el frontend usarán un DTO canónico; la respuesta del API se reutiliza en detalle, historial, estadísticas e impresión. Los nombres locales actuales (`dolor`, `nauseas`, `disnea`, `symptomObs`, `equipment`, `equipOther`) se mapean antes de enviarse y nunca se guardan en paralelo con alias divergentes.

| Campo API | Contenido y regla |
|---|---|
| `patientId` | Paciente destino. |
| `authorId`, `authorDisplayName` | Determinados por la sesión; el API ignora cualquier autor enviado por el cliente. |
| `occurredAt` | Fecha/hora del contacto capturada por el dispositivo al crear el seguimiento; se conserva al sincronizar offline. |
| `recordedAt` | Fecha/hora UTC asignada por el API al confirmar la persistencia. |
| `contactType` | `in_person` o `remote`; el cliente muestra las etiquetas actuales en español. |
| `durationMinutes` | Duración entera en minutos. Si no se captura una duración explícita, presencial = 120 y remoto = 60. La opción personalizada acepta de 15 a 1440 minutos, en incrementos de 15. |
| `symptoms.pain`, `symptoms.nausea`, `symptoms.dyspnea` | Se conservan las opciones y etiquetas actuales de la interfaz; opcionales si no fueron evaluados. |
| `symptomObservations` | Texto de observación de síntomas. |
| `socialRisk.familySupport`, `socialRisk.environmentNotes` | Nivel seleccionado y notas del entorno tal como los presenta el formulario. |
| `equipmentNeeds`, `equipmentOther` | Lista de equipos seleccionados y texto libre de otros equipos. |
| `interventions` | Texto de intervención registrada. |
| `alert` | Opcional; cuando se activa desde este formulario debe incluir los mismos `level`, `motive` y `observations` de una alerta independiente. Alta del seguimiento y alerta vinculada es atómica. |
| `clientMutationId` | UUID estable requerido al sincronizar desde outbox; asegura idempotencia. |

Las opciones canónicas de síntomas reflejan el formulario: dolor `0`, `1-3`, `4-6`, `7-9`, `10`; náuseas `none`, `occasional`, `frequent`, `persistent`; disnea `0`–`3`. La UI conserva sus descripciones completas en español.

### Contrato de alertas y lista de pacientes

- Una alerta es un recurso individual con `id`, `patientId`, `createdAt`, autor, nivel (`standard`/`complex`), motivo (dolor no controlado, disnea, insomnio refractario, crisis de pánico/agitación u otro), observaciones, estado y datos de resolución.
- Las etiquetas actuales del nivel se preservan: `Seguimiento Estándar` y `Crisis Compleja`. Los motivos son `Dolor No Controlado`, `Disnea (Dificultad Respiratoria)`, `Insomnio Refractario`, `Crisis de Pánico / Agitación` y `Otros (Especificar abajo)`. “Otro” requiere observaciones con detalle.
- `GET /alerts` pagina alertas individuales, con filtro `status=active|resolved|all` y opcional `patientId`; las vistas pueden agrupar el resumen por paciente pero el detalle siempre permite abrir y resolver una alerta concreta.
- La ficha muestra alertas activas y resueltas por fecha. Resolver una alerta requiere confirmación; permite nota opcional y actualiza la lista, el conteo activo y el estado derivado del paciente. No afecta otras alertas.
- En directorio y dashboard las alertas se resumen por paciente con cantidad activa; seleccionar el resumen lleva a la ficha. El header no debe presentar varias alertas como un solo registro resoluble.
- La búsqueda del directorio contempla nombre, DNI (comparación también normalizada a dígitos) y diagnóstico, sin distinguir mayúsculas ni acentos. Los filtros de estado son `critical` (alerta activa), `observation` (complejidad sin alerta activa), `stable` y `all`; archivados se consultan con un filtro separado.
- La búsqueda de comunidad contempla nombre, email y especialidad/disponibilidad, sin distinguir mayúsculas ni acentos. El API pagina listas con orden estable por nombre e identificador; límite por defecto 50 y máximo 100.

### Fórmulas para métricas actuales

Solo cuentan seguimientos confirmados por el API. Todos los cortes se calculan usando `timeZone` local IANA enviado por el dispositivo; los rangos son inclusivos por fecha local y se convierten a UTC para consultar.

| Widget actual | Alcance voluntario | Alcance coordinador/admin |
|---|---|---|
| Seguimientos registrados | Cantidad total de seguimientos confirmados cuyo autor es el usuario. | Cantidad total de seguimientos confirmados de todos los autores. |
| Horas de apoyo | Suma de duración de seguimientos propios en el año seleccionado. | Suma global de duración en el año seleccionado. |
| Pacientes atendidos | Cantidad distinta de pacientes con al menos un seguimiento propio confirmado. | Cantidad de pacientes no archivados, presentada como “Pacientes activos”. |
| Actividad mensual | Doce totales mensuales de horas para el año seleccionado. | Doce totales mensuales globales de horas para el año seleccionado. |
| Actividad semanal | Seguimientos propios de últimos 7 o 14 días; el gráfico conserva los siete buckets Lun–Dom y suma ambas semanas por día de semana cuando se eligen 14 días. | Igual, para todos los autores. |
| Voluntarios activos | No se muestra como indicador personal. | Personas con perfil de participación `active`, incluyendo coordinadores/admins solo si tienen perfil voluntario activo. |
| Alertas activas | No se muestra como estadística personal en v1. | Conteo de alertas en estado activo, independiente del número de pacientes alertados. |
| Insignias calculables | Primer Paso: alcanzar 5 horas acumuladas; Compañero Fiel: seguimientos confirmados en 2 pacientes distintos; Especialista: un seguimiento propio vinculado a alerta; Guía Senior: 6 seguimientos propios confirmados. La fecha se calcula al cruzar el umbral. | Solo se muestran reconocimientos globales si existe una fórmula equivalente documentada; no reutilizar insignias personales como métricas globales. |

El selector de año de `Stats` debe controlar tanto las horas totales como el gráfico. Se eliminan la cifra fija de 1000 horas, actividades de ejemplo y agenda/citas sin registros. Un seguimiento offline pendiente no incrementa métricas hasta que el API lo confirme.

## Sincronización, alertas y privacidad

- Solo se cachean fichas de pacientes asignados que el voluntario haya abierto previamente; no se guarda offline el directorio completo.
- Un seguimiento offline se mantiene privado en el dispositivo y claramente marcado como no sincronizado hasta su confirmación por la API.
- Un seguimiento se sincroniza automáticamente al recuperar conectividad y autenticación válida.
- Los push de alerta se envían a los demás voluntarios asignados, una vez que el evento está confirmado por la API.
- El texto visible en una notificación push no incluye datos que identifiquen al paciente ni el motivo clínico. Al abrirla, el usuario debe autenticarse y consultar el detalle en la aplicación.
- El producto no migra los datos sembrados/locales existentes.

## Métricas de éxito

| Señal | Qué permite observar |
|---|---|
| Porcentaje de lecturas/escrituras operativas realizadas con respuesta confirmada de la API | Que la aplicación ya no depende de datos solo locales para el uso normal. |
| Seguimientos confirmados y visibles desde otra sesión autorizada | Que el dato se comparte entre dispositivos/usuarios. |
| Seguimientos offline pendientes que se confirman después de recuperar conexión | Que el flujo offline no pierde trabajo. |
| Tasa de alertas confirmadas con push aceptado por el servicio de notificaciones | Que el equipo puede ser notificado; la entrega final al dispositivo depende de su plataforma/red. |
| Rechazos de acceso a correos no autorizados y operaciones no permitidas | Que el acceso cerrado se respeta en el servidor. |

## Decisiones de producto confirmadas

| # | Tema | Decisión |
|---|---|---|
| 1 | Fuente y datos actuales | La API es fuente de verdad; `localStorage` actual contiene demo/semilla y no se importa. Se preservan los campos/recorridos visibles, no los registros semilla. |
| 2 | Autenticación | Google + lista autorizada, sin registro público ni login email/password; cuenta inicial de admin definida por configuración privada, con rol admin al primer ingreso. |
| 3 | Roles | Voluntario, coordinador y admin. Voluntarios ven todos los campos actuales de paciente/ficha y pueden registrar seguimientos y resolver alertas para cualquier paciente visible. Coordinador gestiona pacientes/hospitales/asignaciones, ve estadísticas globales y autoriza voluntarios, sin conceder admins ni cambiar roles existentes. Admin administra roles y puede participar como voluntario. |
| 4 | Perfil | Se conservan los campos actuales de perfil/comunidad; cada usuario ve y edita el propio, todos los roles pueden ver perfiles, y pacientes activos asignados se calculan desde asignaciones. |
| 5 | Seguimientos | Se preservan los campos y opciones actuales; presencial estima 2 h, remoto 1 h, y se agrega duración personalizada. |
| 6 | Alertas | Puede haber varias activas por paciente; cualquier voluntario resuelve una alerta específica y puede agregar nota opcional; un seguimiento estándar no resuelve alertas. “Situación Compleja” se mantiene como observación, no alerta urgente. |
| 7 | Offline | Solo pacientes asignados y abiertos antes se cachean; los seguimientos pendientes sobreviven al cierre/logout y se sincronizan luego con identidad autorizada, sin migrar seeds. |
| 8 | Push | Push genérico al equipo asignado que participa como voluntario, incluyendo coordinadores y administradores que tengan asignación, excluyendo al autor; sin identidad ni motivo clínico. |
| 9 | Estadísticas | Voluntarios ven métricas personales; coordinadores y admins, globales. Se conservan métricas calculables; se quitan mocks. |
| 10 | Archivo e identidad de paciente | Archivar, no borrar. DNI único, guardado como string compuesto solo por dígitos, normalizado ignorando puntos/formato y preservando ceros iniciales. |
| 11 | Hosting y recorridos | Mismo origen público con `/` y `/api`; se mantienen búsqueda/filtros y reporte imprimible del historial. |
| 12 | Alertas | Varias alertas activas por paciente; cualquier voluntario puede resolver una concreta y dejar una nota opcional. |
| 13 | Métricas | Conservar los indicadores que se calculen desde datos de base; quitar mocks y valores sin origen persistido. |
| 14 | Contenido de alertas | No inventar datos clínicos: si el seguimiento activa alerta, solicitar nivel, motivo y observaciones. “Situación Compleja” sola no dispara alerta/push. |
| 15 | Configuración inicial | La lista de emails administradores iniciales se configura en el entorno privado de API y obtiene rol admin en el primer ingreso. |
| 16 | Duraciones | Presencial 2 h, remoto 1 h y opción personalizada de 15 a 1440 minutos, en incrementos de 15. |
| 17 | Acciones de coordinador | Gestiona pacientes, hospitales y asignaciones; no administra roles ni admins. |
| 18 | Edición de perfil | Cada persona edita datos de contacto/perfil propios; identidad/permisos están protegidos y asignaciones son calculadas. |
| 19 | Zona de estadísticas | Se interpreta en la zona local del dispositivo consultante. |
| 20 | Coordinador como voluntario | Si está asignado, usa los mismos flujos de voluntario: seguimiento, resolución de alertas, acceso offline y push. |
| 21 | Pacientes archivados | Visibles para todos; solo coordinadores pueden restaurarlos. Coordinadores y admins pueden archivarlos. |
| 22 | Hospitales archivados | Coordinadores y admins pueden archivar/restaurar; sin borrado físico, ocultos en nuevas altas y preservados en referencias históricas. |
| 23 | Edición de ficha | Coordinadores y admins pueden editar paciente y cuidador, incluida la relación; voluntarios solo consultan. |

## Decisiones confirmadas

Las reglas de producto para duración personalizada, archivo/restauración de hospitales, participación voluntaria de coordinadores asignados y edición de pacientes/cuidadores están cerradas en las decisiones 16–23. La implementación debe cumplirlas sin volver a abrirlas.


## Criterios de aceptación

1. Dado un correo autorizado, la persona puede iniciar sesión con Google y recibe el rol habilitado; la cuenta inicial admin configurada obtiene admin al primer ingreso.
2. Dado un correo no autorizado, el acceso se rechaza y no se crea una sesión ni se revelan datos de pacientes.
3. Un cambio confirmado en pacientes, cuidadores, hospitales, asignaciones o seguimientos queda disponible al consultar desde otra sesión autorizada.
4. El directorio muestra a voluntarios todos los pacientes y todos los campos que hoy se ven en directorio y ficha; cada alerta activa se reconoce incluso si el seguimiento se registró desde otra sesión.
5. El registro conserva nombre, DNI normalizado, nacimiento, domicilio, diagnóstico, hospital, condición de observación y todos los campos actuales del cuidador; validación recuperable ante faltantes y conflicto de DNI duplicado.
6. Los seguimientos confirmados conservan autor, hora del contacto, hora de confirmación, paciente y todos los campos/opciones actuales en orden cronológico. Duración personalizada (15–1440 minutos, múltiplo de 15) prevalece; si no se ingresa, presencial cuenta 2 h y remoto 1 h.
7. Un seguimiento offline para un paciente asignado cuya ficha se abrió anteriormente queda identificado como pendiente y sobrevive al cierre/reapertura y logout; solo el autor autenticado puede verlo/sincronizarlo, y otra cuenta no lo puede atribuirse.
8. La cola no elimina un seguimiento hasta recibir confirmación; una pérdida de red o sesión no causa que se presente como sincronizado.
9. Al recuperar conexión y autenticación válida, los seguimientos pendientes se sincronizan sin intervención manual y no se duplican ante reintentos.
10. Crear alerta desde modal o seguimiento persiste nivel, motivo, observaciones, autor y hora, sin fabricar síntomas/datos de seguimiento; push genérico se envía tras commit a participantes asignados distintos del autor.
11. Se permiten varias alertas activas por paciente; resolver una alerta no cierra las otras. El estado visible permanece Alerta mientras haya al menos una; al resolver la última refleja Estable o En Observación.
12. Cualquier voluntario puede resolver una alerta individual y guardar nota opcional; un seguimiento estándar no la cierra.
13. Voluntario consulta métricas personales; coordinador y admin consultan estadísticas globales. Los widgets/logros sin dato calculable no se presentan como reales; la ventana se interpreta en la zona local del dispositivo consultante.
14. Coordinador puede agregar correos con rol voluntario y gestionar pacientes/hospitales/asignaciones; no puede cambiar roles existentes ni asignar admin. Solo admin administra cambios de rol.
15. Los campos visibles de perfil voluntario se conservan; usuarios ven todos los perfiles y editan sus propios datos de contacto/perfil, sin editar identidad/permisos ni cantidad calculada de asignaciones.
16. Dashboard, directorio, comunidad, filtros y reporte impreso muestran datos actuales de API o cálculos con reglas documentadas; no muestran semillas/mocks como datos operativos.
17. Pacientes se archivan sin eliminar historial ni romper referencias; DNI normalizado queda único. Todos pueden consultar pacientes archivados y solo coordinadores pueden restaurarlos.
18. Un coordinador asignado puede usar todos los flujos de voluntario para esos pacientes (seguimientos, resolver alertas, fichas offline y push genérico).
19. La ficha lista cada alerta individual activa/resuelta; al resolver una alerta no se cierran las otras, y el directorio/header agrupan el conteo por paciente con navegación al detalle.
20. La búsqueda por pacientes encuentra por nombre, DNI y diagnóstico ignorando mayúsculas/acentos; la búsqueda de comunidad encuentra por nombre/email/especialidad. Filtros por estado y paginación conservan un orden estable.
21. Las tarjetas, ventanas y gráficos de estadísticas usan las fórmulas de este spec, el año y período seleccionados y zona local del dispositivo; seguimientos no confirmados no se cuentan.
22. El historial e informe imprimible conservan cada campo del DTO canónico de seguimiento sin pérdida ni sustitución por alias legacy.
23. Coordinadores y admins pueden archivar y restaurar hospitales; los archivados no aparecen en nuevas altas y las referencias existentes conservan nombre e historial.
24. Coordinadores y admins pueden editar la ficha del paciente y todos los datos del cuidador, incluida su relación; los cambios se validan y se reflejan al volver a consultar.
23. Agenda/citas de ejemplo, actividad ficticia, frase editorial presentada como dato y cifra fija de 1000 horas no aparecen como datos del producto.

## Seguimientos fuera de v1

- Envío de correo de invitación o enlace de alta; la autorización se gestiona mediante la lista de correos y el inicio de sesión Google.
- Importación de registros previos de `localStorage`.
- Funciones no presentadas en los flujos actuales y no descritas en los documentos funcionales existentes.
