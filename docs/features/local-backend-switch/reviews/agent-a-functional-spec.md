# Functional Spec: Seed completo y backend local seleccionable

| Campo | Valor |
|---|---|
| Estado | Borrador de revisión independiente (agente A) |
| Autor | Codex / revisión redundante |
| Creada | 2026-09-21 |
| Carpeta | `docs/features/local-backend-switch/` |
| Siguiente documento | [technical-spec.md](./technical-spec.md) |
| Relacionado | `docs/features/api-front-separation/functional-spec.md`, `docs/FRONT-BACKEND-ADAPTER-EVALUATION.md` |

## Resumen

Medice debe poder probarse de dos maneras desde el mismo frontend. En el modo API, el frontend usa el backend real y permite llenar la base persistente con datos de prueba. En el modo local, el frontend reemplaza temporalmente el backend real por una base de datos local del navegador, sin llamadas clínicas a la API, y permite cargar el mismo conjunto completo de datos de prueba.

La selección debe ser explícita, visible y reversible desde Configuración. El modo local es una herramienta de desarrollo y demostración, no una alternativa de producción ni un mecanismo para migrar datos entre la API y el navegador.

## Objetivos

1. Ofrecer un seed completo y repetible para poblar la API local con datos que cubran todos los recorridos visibles.
2. Permitir ejecutar la aplicación contra el seed de la API y comprobar autenticación, permisos, persistencia y datos compartidos.
3. Permitir cambiar el frontend a un repositorio local persistido en el navegador para probar la UI sin API.
4. Permitir cargar en el repositorio local el mismo seed funcional, con pacientes, cuidadores, seguimientos, alertas, hospitales, asignaciones, perfiles, accesos y estadísticas derivadas.
5. Mantener la misma interfaz de dominio para ambos backends, de modo que las pantallas no conozcan el proveedor seleccionado.
6. Evitar que activar el modo local borre o modifique datos de la API.

## No objetivos (v1)

- Crear `FirebaseApiRepository`.
- Sincronizar o importar datos entre la API y el repositorio local.
- Usar el repositorio local como almacenamiento de producción o multiusuario.
- Hacer que el seed represente datos clínicos reales.
- Crear una herramienta pública de administración de seeds para usuarios finales.
- Validar Turso o ejecutar seeds contra Turso como parte de esta funcionalidad.
- Reemplazar el offline clínico de la API; el repositorio local es un modo de backend completo para pruebas.

## Terminología

| Término | Significado |
|---|---|
| Modo API | El frontend usa `DefaultHttpApiRepository` y la API configurada. |
| Modo local | El frontend usa `LocalStorageApiRepository` y persiste datos en el navegador. |
| Seed completo | Conjunto fijo, documentado y no real de registros que cubre los recorridos de la aplicación. |
| Reset seed | Reemplazo intencional de los datos del backend seleccionado por el conjunto seed. |
| Backend activo | Repositorio seleccionado actualmente por el frontend. |

## Actores

| Actor | Capacidades |
|---|---|
| Desarrollador/QA | Cambia el backend desde Configuración, carga o reinicia el seed y prueba los recorridos. |
| Usuario autenticado en API | Usa los roles y permisos definidos por el producto sobre la base compartida. |
| Usuario del modo local | Usa una identidad y roles de demostración definidos por el entorno local; no produce datos compartidos con la API. |

## Reglas de disponibilidad y seguridad

- El selector de backend y las acciones de seed solo están disponibles cuando la aplicación está habilitada para desarrollo/pruebas. No deben aparecer para usuarios finales en producción.
- Activar el modo local requiere confirmación si ya existen datos locales, porque el reset puede reemplazarlos.
- Al cambiar de modo, la aplicación debe cerrar el estado cargado y volver a inicializar desde el backend elegido.
- El modo local no debe enviar datos clínicos, sesiones, suscripciones push ni seguimientos a la API.
- El modo API conserva sus reglas normales de autenticación y autorización.
- El seed usa identificadores estables y datos claramente ficticios; no contiene datos de personas reales ni secretos.
- El estado del backend activo debe ser claramente visible en Configuración y durante el arranque para evitar confundir datos locales con datos compartidos.
- El seed local debe poder reiniciarse sin acumular registros duplicados.
- El seed de API debe poder ejecutarse de forma repetible con una política explícita de reset o de upsert; no debe duplicar datos por ejecuciones repetidas.

## Cobertura funcional del seed

El seed completo debe tener suficientes datos ficticios para ejercitar:

- usuarios de demostración con rol voluntario, coordinador y administrador;
- perfiles con todos los campos visibles de comunidad;
- pacientes activos y archivados, con todos los campos de ficha;
- DNIs normalizados y relaciones con cuidadores;
- hospitales activos y archivados, incluyendo referencias históricas;
- asignaciones a voluntarios, coordinadores y administradores participantes;
- seguimientos presenciales, remotos y con duración personalizada;
- síntomas, observaciones, riesgo social, equipamiento e intervenciones;
- alertas activas múltiples para un paciente y alertas resueltas con nota;
- accesos autorizados y casos representativos de roles;
- datos suficientes para estadísticas personales y globales;
- registros que permitan probar búsqueda, filtros, archivo, restauración, edición, impresión y offline cuando corresponda.

El seed no debe presentarse como actividad real, ni generar métricas cuyo origen no pueda rastrearse a registros sembrados.

## Recorridos de usuario

### Journey A — Probar la API con datos precargados

1. El desarrollador inicia la API con la base local configurada.
2. Ejecuta el seed completo con una acción documentada.
3. Abre el frontend en modo API.
4. Inicia sesión con una identidad de prueba autorizada.
5. Comprueba el directorio, ficha, estadísticas, administración, alertas, impresión y edición.
6. Abre otra sesión o usa otro rol para comprobar que los datos confirmados son compartidos.
7. Reinicia el seed y verifica que el estado vuelve al conjunto conocido sin duplicados.

### Journey B — Cambiar al backend local

1. El desarrollador abre Configuración y ve el backend activo.
2. Selecciona “Modo local” y confirma el cambio.
3. La aplicación limpia el estado en memoria y carga los datos locales existentes o un estado vacío.
4. El desarrollador puede cargar el seed completo local.
5. La aplicación muestra un indicador visible de que está en modo local.
6. El desarrollador modifica pacientes, seguimientos, alertas, asignaciones y perfiles.
7. Recarga la página y comprueba que los cambios locales persisten.
8. Comprueba que la API no recibió esas modificaciones.

### Journey C — Cambiar nuevamente a API

1. El desarrollador selecciona “Modo API” desde Configuración.
2. Si hay cambios locales, la aplicación informa que no se sincronizarán.
3. La aplicación revalida la sesión API e inicializa el estado desde la API.
4. Los datos de la API aparecen sin alteraciones causadas por la sesión local.

### Journey D — Resetear el seed local

1. El desarrollador abre la acción de seed local.
2. La aplicación explica que reemplazará los datos locales actuales.
3. Tras confirmar, carga el conjunto completo y muestra fecha/versión del seed.
4. La aplicación recarga las pantallas y las métricas derivadas.
5. Cancelar no modifica los datos.

## Estados y errores visibles

- Backend API conectado.
- Backend API no disponible.
- Backend local activo.
- Seed cargado correctamente.
- Seed en progreso.
- Seed cancelado.
- Seed fallido con causa accionable.
- Datos locales existentes antes de cambiar o resetear.
- Sesión API requerida al volver desde modo local.
- Aviso explícito de que los datos locales no se sincronizan.

## Decisiones de producto propuestas

| # | Tema | Decisión propuesta |
|---|---|---|
| 1 | Uso | Funcionalidad orientada a desarrollo, QA y demostraciones; no visible en producción. |
| 2 | Alcance del seed | Un único seed funcional compartido conceptualmente por API y frontend local. |
| 3 | Persistencia local | Los datos locales sobreviven a reload y reinicio del navegador dentro del mismo perfil. |
| 4 | Cambio de backend | Es explícito, reversible y no sincroniza automáticamente. |
| 5 | Identidad local | El entorno local ofrece identidades/roles de demostración para probar permisos sin depender de Google. |
| 6 | Reset | El reset reemplaza solo el backend elegido y requiere confirmación cuando hay datos existentes. |
| 7 | API seed | Se ejecuta sobre SQLite local y puede usarse para probar la API; la validación de Turso queda fuera. |

## Criterios de aceptación

1. El proyecto ofrece una acción documentada para cargar el seed completo en la base local de la API.
2. El seed de API crea registros suficientes para recorrer pacientes, cuidadores, hospitales, asignaciones, seguimientos, alertas, perfiles, accesos y estadísticas.
3. Ejecutar el seed de API más de una vez produce el mismo estado lógico y no duplica registros.
4. El seed contiene pacientes activos y archivados, hospitales activos y archivados, varias alertas activas para un paciente y alertas resueltas con nota opcional.
5. El seed contiene seguimientos presenciales, remotos y personalizados, y sus métricas se calculan desde esos registros.
6. En entorno habilitado, Configuración permite seleccionar modo API o modo local y muestra cuál está activo.
7. Cambiar a modo local deja de usar el repositorio HTTP para las operaciones clínicas posteriores.
8. El modo local puede cargar el seed completo y expone los mismos recorridos de dominio que el modo API.
9. Los cambios realizados en modo local sobreviven a una recarga y no aparecen en la API.
10. Los cambios realizados en modo API siguen siendo compartidos y no son afectados por las operaciones locales.
11. Cambiar de backend reinicializa el estado visible y no mezcla pacientes, alertas, estadísticas o identidades entre backends.
12. Resetear el seed local requiere confirmación cuando existen datos y devuelve el estado conocido sin duplicados.
13. Resetear el seed API tiene una política segura y documentada, no borra datos fuera de su alcance y deja un estado reproducible.
14. La UI comunica claramente cuándo un registro pertenece al modo local y que no se sincronizará con la API.
15. El selector, las acciones de seed y las identidades demo no están disponibles en builds de producción salvo habilitación explícita.
16. Si el API no está disponible, el error se muestra sin cambiar silenciosamente al modo local.
17. La aplicación permite probar permisos de voluntario, coordinador y administrador en el backend local mediante identidades demo.
18. El repositorio local mantiene el contrato del port actual para que las pantallas y servicios no requieran ramas específicas por backend.

## Preguntas abiertas

- ¿El selector debe habilitarse solo por `import.meta.env` o también por un permiso de usuario administrador?
- ¿El seed de API debe resetear todas las tablas de dominio o usar una clave de namespace para preservar datos manuales?
- ¿Qué identidad demo debe quedar seleccionada por defecto en modo local?
- ¿Debe el modo local simular login/logout o permitir cambiar de rol con un selector de identidad?
- ¿Debe el usuario poder exportar/importar el estado local o queda fuera de v1?

## Fuera de alcance posterior

- `FirebaseApiRepository`.
- Sincronización API ↔ local.
- Seed productivo contra Turso.
- Exportación/importación de snapshots.
- Multiusuario local entre perfiles o dispositivos.
