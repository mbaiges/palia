# Functional Spec: Backend local intercambiable y seed reproducible

| Campo | Valor |
|---|---|
| Status | Draft de revisión redundante (agent-c) |
| Author | Codex agent-c |
| Created | 2026-09-21 |
| Updated | 2026-09-21 |
| Feature folder | `docs/features/local-backend-switch/` |
| Follow-up | [technical-spec.md](../technical-spec.md) (borrador de revisión) |
| Related | `docs/features/api-front-separation/functional-spec.md`, `docs/features/api-front-separation/technical-spec.md` |

## Summary

Medice contará con un dataset de demostración reproducible que cubra la interfaz clínica completa y pueda cargarse en el API local o en un repositorio local del navegador. El frontend podrá seleccionar, desde Configuración y únicamente cuando el build lo habilite, entre el backend HTTP de Medice y una implementación local basada en `localStorage` que respete el mismo contrato de aplicación.

La selección local sirve para desarrollo, demos y pruebas de UI sin levantar el API. El API sigue siendo la fuente de verdad para cualquier uso compartido o productivo. El seed contiene datos ficticios y nunca debe confundirse con pacientes reales ni importarse automáticamente.

## Goals

1. Mantener un único seed conceptual, determinista y completo para todas las pantallas actuales.
2. Permitir cargar ese seed en una instancia API local para probar la aplicación contra SQLite.
3. Permitir seleccionar un backend local del navegador para demos y pruebas rápidas del frontend.
4. Hacer que las pantallas conserven sus recorridos, campos, roles, estados, métricas y permisos cuando se cambia de backend.
5. Hacer explícita la fuente activa y evitar que los datos locales se mezclen con los datos de la API.
6. Mantener la posibilidad de agregar un adapter Firebase en el futuro sin modificar las pantallas.

## Non-goals (v1)

- Habilitar el backend local en producción.
- Migrar datos existentes de `localStorage` demo hacia la base API.
- Sincronizar automáticamente el repositorio local con la API.
- Resolver conflictos entre datos API y datos locales.
- Usar el seed como datos reales o como base inicial de Turso.
- Reemplazar la autenticación productiva Google por una identidad local fuera de entornos de desarrollo/demo.
- Implementar Firebase en esta feature.
- Simular entrega push real desde el adapter local.

## Background & Problem

La API ya es la fuente canónica y el frontend tiene un `DefaultHttpApiRepository`, pero levantar el API y preparar SQLite no siempre es práctico para una demo visual o una prueba aislada del frontend. Además, los datos iniciales están repartidos entre pruebas y configuración, por lo que no existe un recorrido reproducible que permita verificar todas las páginas con pacientes, hospitales, seguimientos, alertas, asignaciones, perfiles y estadísticas.

Se necesita una sola experiencia seed para que la versión API y la versión local representen los mismos estados del producto. La implementación local debe ser un backend de desarrollo con las mismas operaciones visibles, no una segunda experiencia de negocio con reglas diferentes.

## Terminology

| Term | Meaning |
|---|---|
| Backend API | Adapter HTTP que usa el servicio Express y SQLite local según la configuración vigente. |
| Backend local | Adapter que persiste el dataset en el navegador y ejecuta los flujos locales para desarrollo/demo. |
| Seed demo | Dataset ficticio, versionado y reproducible que cubre los recorridos de la interfaz. |
| Fuente activa | Backend elegido actualmente para la sesión del frontend. |
| Cargar seed | Reemplazar el dataset de demo de la fuente seleccionada por el estado inicial reproducible. |
| Datos de demo | Datos sintéticos sin valor clínico ni identidad real. |

## Actors

| Actor | Capabilities |
|---|---|
| Desarrollador | Habilita el modo local en un build de desarrollo, carga el seed, cambia de fuente y verifica los recorridos. |
| QA/demo operator | Usa la opción local si el build la habilita, recarga el seed y ejecuta los flujos de la UI. |
| Voluntario seed | Puede consultar el directorio y fichas, registrar seguimientos, resolver alertas y editar su perfil según las reglas existentes. |
| Coordinador seed | Puede usar sus flujos de voluntario cuando está asignado y administrar pacientes, centros, asignaciones y allow-list según las reglas existentes. |
| Administrador seed | Puede ver estadísticas globales y administrar accesos y roles según las reglas existentes. |
| Usuario productivo | No ve ni puede activar el backend local ni el seed demo. |

## Availability Rules

- El backend API permanece seleccionado por defecto.
- La opción de backend local solo aparece cuando el build tiene habilitado un modo explícito de desarrollo/demo y no está en producción.
- La API local puede recibir el seed únicamente mediante el mecanismo de desarrollo/operación definido para SQLite local; no debe existir una carga pública sin protección.
- Cambiar de fuente requiere una confirmación clara porque cada fuente tiene datos independientes.
- La fuente seleccionada queda asociada a este navegador/build, no a la cuenta productiva.
- Si la fuente local no está habilitada o su configuración es inválida, el producto falla cerrado y conserva la API como única opción.

## Dataset seed requerido

El seed debe incluir datos sintéticos para comprobar:

- Un administrador, un coordinador y al menos dos voluntarios.
- Perfiles con teléfono, especialidad/disponibilidad, trayectoria, avatar y contadores derivados.
- Correos autorizados registrados y uno pendiente/no registrado para probar la allow-list.
- Hospitales activos y archivados.
- Pacientes con todos los campos actuales de la ficha y cuidador completo.
- Pacientes estables, en observación, con alerta activa y archivados.
- Un paciente con más de una alerta activa y otro con una alerta resuelta con nota.
- Asignaciones que incluyan un coordinador como participante voluntario.
- Seguimientos presenciales y remotos, duraciones de 60 y 120 minutos y una duración personalizada válida.
- Síntomas, observaciones, riesgo social, equipamiento e intervenciones con contenido sintético.
- Actividad suficiente para dashboard, estadísticas personales/globales, comunidad, búsqueda, filtros y reporte imprimible.
- IDs y fechas deterministas, DNI solo numérico y valores que no parezcan datos de una persona real.

El seed no debe incluir tokens, suscripciones push reales, contraseñas reales, secretos ni datos copiados de `localStorage` del usuario.

## User Journeys

### Journey A — Seleccionar el backend local

1. El desarrollador abre Configuración en un build habilitado.
2. Ve la fuente actual, el alcance de la fuente y la fecha/versión del dataset si existe.
3. Elige Backend local.
4. El producto explica que cambiar de fuente no copia datos ni modifica la API.
5. Tras confirmar, el frontend reinicia el estado de aplicación con el repositorio local.
6. La fuente activa queda visible en Configuración.

**Error:** si el modo local no está habilitado, la opción no aparece; si falla la inicialización, se muestra un error recuperable y la API permanece activa.

### Journey B — Cargar el seed local

1. Con Backend local seleccionado, el usuario elige `Cargar datos de demostración`.
2. La UI advierte que reemplazará los datos locales de demo y que no afecta a la API.
3. Tras confirmar, el frontend carga el mismo dataset conceptual que usa el seed API.
4. El usuario puede ingresar con una de las identidades ficticias disponibles para probar los permisos.
5. Dashboard, directorio, detalle, seguimiento, alertas, comunidad, administración, configuración, estadísticas y reporte muestran datos del seed.
6. Las estadísticas se calculan desde los registros del seed, no desde cifras fijas.

### Journey C — Cambiar del backend local a la API

1. El usuario guarda o descarta cambios locales pendientes.
2. Selecciona Backend API y confirma.
3. El frontend descarta el estado en memoria del adapter local, sin subirlo a la API.
4. La sesión API se vuelve a resolver y se muestra el dataset API correspondiente.
5. Los datos locales siguen aislados para una futura demo local, salvo que el usuario elija reiniciarlos.

### Journey D — Probar la funcionalidad con el seed

Con cualquiera de las fuentes compatibles, el usuario puede recorrer:

- Ingreso y cierre de sesión del entorno elegido.
- Directorio, búsqueda, filtros y pacientes archivados.
- Detalle con cuidador, historial, asignaciones y múltiples alertas.
- Alta/edición de paciente y cuidador según el rol.
- Registro de seguimiento con modalidades y duraciones existentes.
- Resolución de alerta con nota opcional.
- Comunidad y perfil propio.
- Administración de hospitales, asignaciones y allow-list según el rol.
- Estadísticas personales o globales según el rol.
- Reporte imprimible.
- Caché/outbox offline cuando el backend y el navegador lo soporten.

## Source switching behavior

- Nunca se mezclan respuestas, sesiones, pacientes ni outbox entre fuentes.
- El cambio de fuente invalida el estado en memoria y vuelve a cargar bootstrap.
- Las operaciones que no tienen significado local, como push real, muestran una capacidad no disponible y no inventan éxito.
- Los cambios locales no se envían automáticamente a la API.
- Los datos seed de demo se pueden volver a cargar de forma idempotente en la fuente local.

## Edge Cases

| Case | Expected behavior |
|---|---|
| Usuario intenta activar local en producción | La opción no aparece y el adapter local no se puede inicializar. |
| Seed local ya cargado | Se solicita confirmación y se reemplaza solo el namespace local de demo. |
| API tiene cambios propios y se carga el seed API | Se advierte que la operación reemplaza solo el dataset local permitido por el entorno; no es una migración productiva. |
| Usuario cambia fuente con outbox pendiente | Debe ver la cantidad pendiente y confirmar descarte/retención aislada antes de continuar. |
| Seed contiene una alerta activa | Debe ser visible en ficha/dashboard y no incluir información clínica en el texto de push. |
| Push local solicitado | Se muestra capacidad no disponible o simulación explícita; no se afirma entrega real. |
| Dos pestañas usan backend local | Ambas identifican el mismo namespace local y reflejan el cambio de versión de datos o informan que deben recargar. |
| Error al leer/escribir `localStorage` | Se muestra un error recuperable y se ofrece volver al backend API. |
| Datos locales corruptos o seed incompatible | Se rechaza el dataset, se conserva una copia aislada si es posible y se ofrece recargar el seed. |
| Usuario productivo ve una URL/flag de local | El servidor y el frontend siguen usando API; ninguna bandera cliente concede permisos productivos. |

## Success Metrics (lightweight)

| Signal | Why |
|---|---|
| El seed reproduce todos los estados visibles del producto | Permite demos y QA repetibles. |
| La misma suite de contrato pasa contra API y adapter local | Mide paridad funcional. |
| Cambio de fuente no cruza datos | Protege contra contaminación accidental. |
| Build productivo no contiene selector ni carga local | Evita bypass de seguridad. |
| El seed se puede restablecer con resultado determinista | Reduce tiempo de pruebas y debugging. |

## Product Decisions (locked / proposed)

| # | Topic | Decision |
|---|---|---|
| 1 | Propósito | Backend local solo para desarrollo, demos y pruebas de UI. |
| 2 | Fuente productiva | API; la selección local no se habilita en producción. |
| 3 | Seed | Un dataset conceptual único, determinista y ficticio para API y adapter local. |
| 4 | Importación de localStorage existente | No importar automáticamente datos demo existentes. |
| 5 | Sincronización | No sincronizar automáticamente local y API en v1. |
| 6 | Seguridad | Un flag de build/desarrollo no puede otorgar acceso productivo ni reemplazar autorización del API. |
| 7 | Cambio de fuente | Requiere confirmación y reinicializa estado; las fuentes quedan aisladas. |
| 8 | Push local | No se promete entrega push real desde el backend local. |
| 9 | Identidad local | **Pendiente de confirmar:** selector de identidades seed en login o identidad fija de demo al activar el backend local. |
| 10 | Carga del seed API | **Pendiente de confirmar:** comando local protegido, endpoint de desarrollo protegido o ambos. |
| 11 | Persistencia local | **Pendiente de confirmar:** `localStorage` como requisito estricto o IndexedDB para soportar payloads grandes manteniendo la misma interfaz. |
| 12 | Cambio con outbox | **Pendiente de confirmar:** bloquear hasta resolver la outbox o conservarla aislada por backend. |

## Acceptance Criteria

1. En un build habilitado, Configuración muestra el backend activo y permite seleccionar API o local.
2. En un build productivo, el selector y la carga local no están disponibles y el adapter local no puede inicializarse.
3. El usuario puede cargar el seed local con confirmación y obtener un estado determinista.
4. El seed incluye las entidades y estados necesarios para probar todas las pantallas visibles actuales.
5. El seed contiene roles y permisos suficientes para probar voluntario, coordinador y administrador.
6. La misma definición de seed puede cargar datos equivalentes en SQLite local y en el adapter local del navegador.
7. Con el backend local, las operaciones compatibles del producto respetan los permisos funcionales existentes.
8. Con el backend local, crear/editar pacientes, seguimientos, alertas, hospitales, asignaciones, perfiles y allow-list actualiza la UI y las estadísticas correspondientes.
9. Las métricas visibles se calculan desde el dataset y cambian después de una mutación.
10. Las alertas múltiples, resolución con nota y estados archivados se conservan tras recargar el backend local.
11. Cambiar de fuente no mezcla datos ni sube cambios locales a la API.
12. Los errores de capacidad no soportada se muestran de forma clara y no generan falsos positivos.
13. La carga repetida del seed produce el mismo resultado y no duplica registros.
14. La suite de contrato de dominio puede ejecutar el mismo comportamiento contra API y adapter local.
15. Los recorridos principales se validan en viewport móvil promedio y desktop, con evidencia visual de las pantallas afectadas.

## Out-of-Scope Follow-ups (post-v1)

- Sincronización bidireccional o migración local→API.
- Firebase directo desde el navegador.
- Importación de datos productivos.
- Push real desde el adapter local.
- Compartir el backend local entre dispositivos.
- Editor visual de datasets.
