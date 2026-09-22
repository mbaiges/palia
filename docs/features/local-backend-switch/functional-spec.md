# Functional Spec: Seed completo y backend local seleccionable

| Campo | Valor |
|---|---|
| Estado | Draft — requiere confirmación de decisiones abiertas |
| Autor | Codex |
| Creada | 2026-09-21 |
| Actualizada | 2026-09-21 |
| Carpeta | `docs/features/local-backend-switch/` |
| Follow-up | [technical-spec.md](./technical-spec.md) |
| Relacionado | [api-front-separation/functional-spec.md](../api-front-separation/functional-spec.md) |

## Resumen

Medice tendrá dos modos explícitos para probar la aplicación desde el mismo frontend:

1. **API**: usa el backend real y permite probar persistencia compartida, autenticación y permisos.
2. **Local**: reemplaza temporalmente el backend por datos ficticios persistidos en el navegador, sin enviar operaciones clínicas a la API.

Ambos modos deben exponer los mismos recorridos visibles. El modo local es una herramienta de desarrollo, QA y demostración; no es una fuente productiva ni sincroniza datos con la API.

## Objetivos

1. Ofrecer un seed completo, reproducible y ficticio para probar la API local.
2. Permitir que el frontend se ejecute sin API mediante un backend local del navegador.
3. Permitir cargar el mismo seed funcional en API y Local.
4. Mantener los mismos campos, flujos, permisos y métricas calculables en ambos modos.
5. Hacer visible el backend activo y evitar mezclar sus estados.
6. Permitir volver de Local a API sin transmitir ni modificar datos locales.

## No objetivos (v1)

- Crear `FirebaseApiRepository`.
- Sincronizar o importar datos entre API y Local.
- Usar Local en producción o como modo multiusuario.
- Ejecutar o validar el seed contra Turso.
- Importar los datos demo históricos del `localStorage` anterior.
- Simular OAuth Google real, envío de email o push real en Local.
- Crear un panel público para administrar seeds.

## Terminología

| Término | Significado |
|---|---|
| Modo API | El frontend usa el backend HTTP configurado. |
| Modo Local | El frontend usa un backend aislado persistido en el navegador. |
| Seed completo | Conjunto versionado de datos ficticios que cubre todos los flujos visibles. |
| Reset del seed | Reemplazo explícito del estado del backend elegido por el conjunto conocido. |
| Backend activo | Fuente seleccionada para el estado actual del frontend. |

## Actores

| Actor | Capacidades |
|---|---|
| Desarrollador/QA | Cambia backend, carga/reset del seed y prueba todos los recorridos. |
| Usuario API | Usa autenticación, roles y permisos reales contra la API. |
| Usuario Local | Usa identidades demo con roles equivalentes, sin sesión compartida. |

## Reglas de disponibilidad y privacidad

- El selector y las acciones de seed solo aparecen cuando el entorno habilita explícitamente esta herramienta. Se permite en DEV, E2E y staging; producción siempre queda bloqueada.
- En producción deben estar deshabilitados y no debe existir una ruta accidental para activarlos.
- Al cambiar de backend, se limpia el estado visible y se vuelve a inicializar desde la fuente elegida.
- Un error de API no cambia automáticamente a Local.
- El modo Local no envía pacientes, seguimientos, alertas, identidades ni suscripciones push a la API.
- Los datos del seed son ficticios y no contienen personas reales, secretos ni credenciales.
- La UI muestra una marca clara cuando Local está activo.
- Las operaciones locales respetan la matriz de roles; ocultar botones no es suficiente.

## Cobertura del seed

El seed debe incluir datos suficientes para probar:

- identidades demo voluntario, coordinador y admin;
- allow-list y rechazo de una identidad no autorizada;
- perfiles con todos los campos editables;
- pacientes activos y archivados, con todos los campos actuales;
- cuidadores completos y relaciones paciente-cuidador;
- hospitales activos y archivados;
- asignaciones para voluntarios y coordinadores;
- seguimientos presenciales, remotos y personalizados entre 15 minutos y 24 horas;
- síntomas, observaciones, riesgo social, equipamiento e intervenciones;
- varias alertas activas para un paciente;
- alertas resueltas con nota opcional;
- estadísticas personales y globales derivables de los registros;
- estados suficientes para búsqueda, filtros, edición, impresión y offline.

No debe haber contadores mockeados: toda métrica debe poder rastrearse a registros del seed o a mutaciones posteriores.

## Recorridos

### Probar la API con seed

1. Iniciar la API con SQLite local.
2. Ejecutar la acción documentada de seed.
3. Abrir el frontend en modo API.
4. Iniciar sesión con una identidad autorizada.
5. Recorrer dashboard, directorio, detalle, edición, seguimientos, alertas, hospitales, asignaciones, administración, estadísticas e impresión.
6. Comprobar otro rol y que los datos persisten de forma compartida.
7. Repetir el seed y verificar que no hay duplicados.

### Cambiar a Local

1. Abrir Configuración.
2. Ver el backend activo y seleccionar Local.
3. Confirmar que los datos locales no se sincronizarán con la API.
4. Cargar el seed local o continuar con el estado local existente.
5. Verificar el indicador de modo Local.
6. Crear, editar, archivar, restaurar y consultar datos.
7. Recargar la página y verificar la persistencia local.

### Volver a API

1. Seleccionar API.
2. Confirmar que las mutaciones locales no se transmitirán.
3. Revalidar la sesión API.
4. Comprobar que aparecen los datos de la API sin contaminación local.

### Resetear Local

1. Elegir “Cargar/restaurar seed”.
2. Mostrar que el estado local será reemplazado.
3. Confirmar la acción.
4. Cargar el seed versionado y actualizar todas las pantallas.
5. Cancelar debe dejar los datos sin cambios.

## Estados y errores visibles

- API conectada o no disponible.
- Local activo.
- Cambio de backend en progreso.
- Seed cargado, cancelado o fallido.
- Datos locales existentes antes de un reset.
- Sesión API requerida al regresar desde Local.
- Operación rechazada por permisos.
- Almacenamiento local corrupto o sin cuota.
- Aviso de que Local no sincroniza con API.

## Outbox y cambio de backend

La **outbox** es la cola que conserva un seguimiento guardado sin conexión hasta que pueda enviarse al backend correspondiente. Si existe una cola pendiente al intentar cambiar de backend, la aplicación muestra cuántos registros están pendientes y exige sincronizarlos o descartarlos explícitamente. Un registro pendiente nunca se copia automáticamente de API a Local ni de Local a API.

## Decisiones propuestas pendientes de confirmar

| # | Tema | Propuesta |
|---|---|---|
| 1 | Entornos habilitados | DEV, E2E y staging; producción siempre bloqueada. |
| 2 | Identidad Local | Local inicia siempre como admin demo; no requiere selector de roles. |
| 3 | Persistencia | Mantener Local y su selección después de recargar; el reset siempre es explícito. |
| 4 | Seed API | Comando de desarrollo sobre SQLite local, con reset/upsert seguro y documentado. |
| 5 | Outbox al cambiar | No mezclar ni transferir colas entre backends; informar y dejar cada estado aislado. |
| 6 | Push Local | Mostrar capacidad no disponible; no simular entregas clínicas silenciosamente. |
| 7 | Almacenamiento | Usar IndexedDB desde el inicio mediante `IndexedDBApiRepository`. |

## Criterios de aceptación

1. Existe una acción documentada para cargar el seed completo en SQLite local.
2. Repetir el seed API produce el mismo estado lógico sin duplicados.
3. El seed cubre todos los campos y flujos actuales, incluidos archivos, alertas múltiples, notas de resolución y duraciones personalizadas.
4. En un entorno habilitado, Configuración permite seleccionar API o Local y muestra el backend activo.
5. Cambiar a Local deja de usar el repositorio HTTP para las operaciones clínicas posteriores.
6. Local permite recorrer los flujos completos con la identidad admin demo fija; el seed API conserva voluntario, coordinador y admin para probar la matriz de permisos compartida.
7. Los cambios Local sobreviven a una recarga y no aparecen en la API.
8. Los cambios API siguen siendo compartidos y no son afectados por Local.
9. Cambiar de backend no mezcla pacientes, alertas, estadísticas, identidades ni outbox.
10. Resetear Local requiere confirmación cuando hay datos y devuelve un estado reproducible.
11. La UI comunica claramente el modo Local y su falta de sincronización.
12. En producción no aparecen selector, seed ni identidades demo.
13. Un fallo de API no activa Local automáticamente.
14. Todas las estadísticas visibles se derivan de registros.
15. El selector, seed y recorridos principales funcionan en 360×800 y 390×844 sin overflow horizontal.

## Fuera de alcance posterior

- Firebase.
- Sincronización API ↔ Local.
- Exportación/importación de snapshots.
- Multiusuario Local entre dispositivos.
- Seed productivo contra Turso.
