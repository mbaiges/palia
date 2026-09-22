# Borrador funcional: backend local y seed completo

> Revisión redundante del agente B. Este documento describe comportamiento de producto; los detalles de almacenamiento y composición quedan en el borrador técnico.

## Metadata

- Feature: `local-backend-switch`
- Estado: borrador para revisión
- Relacionado: `docs/features/api-front-separation/functional-spec.md`
- Siguiente documento: `agent-b-technical-spec.md`

## Problema

La aplicación necesita una forma reproducible de probar el front sin depender de una API levantada, credenciales OAuth ni una base remota. La prueba local debe mostrar los mismos flujos y campos que la aplicación conectada a la API, para detectar diferencias antes de usar datos reales.

## Objetivos

1. Permitir seleccionar un backend local de demostración desde Configuración cuando la aplicación esté en un entorno habilitado para pruebas.
2. Permitir volver al backend API sin cambiar el código ni perder la configuración de la sesión actual.
3. Cargar un seed completo y determinista que cubra los estados visibles del front: directorio, fichas, cuidadores, hospitales, asignaciones, seguimientos, alertas, voluntarios, perfiles, allow-list y estadísticas.
4. Mantener las mismas operaciones y resultados funcionales para la UI con ambos backends.
5. Hacer que la opción de resetear o recargar el seed sea explícita y reversible para poder repetir pruebas.
6. Evitar que el backend local se use accidentalmente como fuente de datos productiva.

## Fuera de alcance para v1

- Reemplazar la API productiva o Turso.
- Migrar datos reales desde la API al almacenamiento local.
- Compartir datos del backend local entre navegadores o dispositivos.
- Simular OAuth real, envío de emails o push reales desde el backend local.
- Crear un editor genérico de datos fuera de los flujos que ya presenta el front.

## Terminología y actores

- **Backend API**: fuente compartida actual de Medice.
- **Backend local**: fuente aislada del navegador usada para pruebas y demostración.
- **Seed**: conjunto inicial de datos ficticios, coherentes y reproducibles.
- **Usuario de prueba**: identidad local con rol voluntario, coordinador o admin.
- **Modo local**: estado visible de la aplicación cuando el backend local está seleccionado.

## Permisos funcionales

Los usuarios locales de prueba deben conservar la misma matriz funcional del API:

| Actor | Puede ver | Puede modificar |
|---|---|---|
| Voluntario | Directorio, detalles, perfiles, sus estadísticas y flujos de voluntario | Sus datos de perfil, seguimientos y alertas según las reglas del producto |
| Coordinador | Todo el directorio, datos de voluntarios y estadísticas globales | Pacientes, cuidadores, hospitales, asignaciones, allow-list de voluntarios y sus propios flujos |
| Admin | Todo lo anterior y administración | Roles, configuración administrativa y todas las operaciones permitidas al coordinador |

El backend local no debe convertir al usuario en admin por ocultar o mostrar botones. Las operaciones deben conservar sus permisos en la misma capa de backend local.

## Selección desde Configuración

Cuando el entorno permite backend local, Configuración muestra:

- backend activo: API o Local;
- una explicación de que Local es aislado al navegador y sirve para pruebas;
- selector para cambiar backend;
- acción para cargar o restaurar el seed local;
- confirmación antes de reemplazar los datos locales;
- estado de carga, éxito y error.

El selector no se muestra en producción ni en entornos donde la capacidad local esté deshabilitada. Cambiar de backend requiere cerrar o reinicializar la sesión de datos para no mezclar pacientes, perfiles, alertas o colas entre fuentes.

## Seed funcional mínimo

El seed debe contener datos ficticios suficientes para recorrer todos los estados del front:

- tres identidades, una por rol;
- allow-list con entradas autorizadas y al menos un correo no autorizado para probar rechazo;
- voluntarios con todos los campos editables y conteos derivados;
- pacientes activos y archivados, con todos los campos actuales del formulario;
- cuidadores completos y relaciones paciente-cuidador;
- hospitales activos y archivados;
- asignaciones para voluntarios y coordinador;
- seguimientos presenciales, remotos, de una hora, de dos horas y con duración personalizada;
- seguimientos con síntomas, riesgo social, equipamiento, intervenciones y autoría;
- varias alertas activas para un paciente y alertas resueltas con nota opcional;
- estadísticas derivables de los seguimientos y alertas del seed;
- datos que hagan visibles los estados estable, observación y alerta.

El seed no debe contener nombres, DNIs, diagnósticos, teléfonos o correos de personas reales.

## Recorridos de usuario

### Elegir backend local

1. El usuario inicia sesión en un entorno de prueba.
2. Abre Configuración.
3. Selecciona Local.
4. La aplicación explica que los datos locales están aislados.
5. El usuario confirma.
6. La sesión muestra el seed local o una pantalla vacía si aún no fue cargado.

### Cargar o restaurar seed

1. El usuario pulsa Cargar seed.
2. La aplicación muestra qué datos se reemplazarán.
3. El usuario confirma.
4. Se carga el conjunto completo de datos.
5. El dashboard, directorio y estadísticas reflejan únicamente esos datos.
6. Repetir la acción produce el mismo resultado, sin duplicados.

### Probar una operación local

El usuario debe poder crear o editar paciente, registrar seguimiento, crear/resolver alerta, archivar/restaurar hospital, actualizar perfil, modificar asignaciones y consultar estadísticas. La UI debe mostrar el mismo resultado y estados de error esperados que con el backend API.

### Volver al API

1. El usuario selecciona API en Configuración.
2. La aplicación confirma el cambio.
3. El estado local deja de mostrarse.
4. La aplicación vuelve a cargar la sesión y datos desde la API.
5. Ninguna mutación hecha en Local aparece en la API.

## Estados y errores

- Si el seed no pudo cargarse, se informa el motivo y se conservan los datos anteriores.
- Si el usuario intenta cambiar de backend mientras hay una operación pendiente, se informa que debe esperar o cancelar.
- Si una operación viola permisos, la UI muestra el mismo tipo de error funcional que con la API.
- Si se cambia de usuario local, se limpia el estado visible y la cola pertenece únicamente al usuario seleccionado.
- Si se recarga la página, el backend seleccionado y los datos locales permanecen disponibles mientras el modo local siga habilitado.

## Criterios de aceptación

- [ ] En entorno habilitado, Configuración permite seleccionar API o Local y muestra el backend activo.
- [ ] En producción, no aparece la selección ni existe una ruta accidental para activar Local.
- [ ] Cargar el seed es explícito, confirmable y repetible sin duplicar registros.
- [ ] El seed cubre todos los campos actuales de paciente, cuidador, seguimiento, alerta, hospital y perfil.
- [ ] El seed incluye datos activos y archivados, varias alertas activas y los tres roles.
- [ ] Las estadísticas locales solo usan datos seed o mutaciones locales y no contienen números inventados.
- [ ] Los permisos locales coinciden con los permisos definidos para la API.
- [ ] CRUD, archivo/restauración, asignaciones, alertas y seguimientos funcionan en Local.
- [ ] El cambio de backend no mezcla estados, sesiones, outbox ni datos entre API y Local.
- [ ] Recargar el navegador conserva el modo local y el seed sin depender de la API.
- [ ] Volver a API restaura la fuente API y no transmite datos locales.
- [ ] La selección y los estados principales funcionan en mobile 360x800 y 390x844.

## Decisiones que deben confirmarse antes de cerrar

1. Si el modo Local se habilita solamente mediante una variable de build de desarrollo/E2E o también en una instancia de staging.
2. Si los usuarios locales se eligen desde una lista visible o se inicia siempre con el usuario admin del seed.
3. Si el seed debe preservar cambios entre reinicios por defecto o si cada carga debe restaurarlo desde cero.
4. Si el almacenamiento local puede contener datos clínicos ficticios persistentes en el dispositivo de un desarrollador.
