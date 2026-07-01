# Índice y Guía de Pantallas (Mocks)

Este documento sirve como referencia oficial para lograr paridad visual exacta entre la implementación real de **Palia** y los diseños y capturas de interfaz proporcionados por la organización.

Los archivos de mocks están ubicados en la carpeta [docs/mocks/](file:///e:/Documents/Proyectos/medice-app/docs/mocks).

---

## 💻 Diseños de Escritorio (Desktop)

A continuación se detallan las pantallas de escritorio con sus respectivos archivos de mock asociados.

| Pantalla | Archivo de Mock | Propósito / Elementos Clave |
| :--- | :--- | :--- |
| **Inicio (Dashboard)** | [inicio_desktop_corregido.png](file:///e:/Documents/Proyectos/medice-app/docs/mocks/inicio_desktop_corregido.png)<br>[inicio_desktop.png](file:///e:/Documents/Proyectos/medice-app/docs/mocks/inicio_desktop.png) | Resumen semanal con gráficos de barras, visitas pendientes, barra de alerta roja superior si hay pacientes en estado crítico, y grilla resumida de pacientes en estado alerta/estable. |
| **Directorio de Pacientes** | [directorio_de_pacientes_desktop_corregido.png](file:///e:/Documents/Proyectos/medice-app/docs/mocks/directorio_de_pacientes_desktop_corregido.png)<br>[directorio_de_pacientes_desktop.png](file:///e:/Documents/Proyectos/medice-app/docs/mocks/directorio_de_pacientes_desktop.png) | Tabla completa que lista pacientes con columnas de Avatar con iniciales, DNI/ID, Estado (chip coloreado), Cuidador/Familiar, Última Visita, y Acciones (Ver/Eliminar). En la parte superior, 4 tarjetas de estadísticas con filtros rápidos por estado de alerta. |
| **Ficha de Paciente (Detalle)** | [detalle_del_paciente_desktop.png](file:///e:/Documents/Proyectos/medice-app/docs/mocks/detalle_del_paciente_desktop.png) | Panel lateral e información bento del paciente. Historial cronológico tipo línea de tiempo para registrar seguimientos del paciente. |
| **Nuevo Seguimiento** | [nuevo_seguimiento_desktop_corregido.png](file:///e:/Documents/Proyectos/medice-app/docs/mocks/nuevo_seguimiento_desktop_corregido.png)<br>[nuevo_seguimiento_desktop.png](file:///e:/Documents/Proyectos/medice-app/docs/mocks/nuevo_seguimiento_desktop.png) | Formulario de registro clínico estructurado en bento grid: Sintomatología (Dolor 0-10, Náuseas, Disnea como desplegables de selección), Riesgo Social (apoyo familiar como radio buttons y notas), Necesidad de Equipamiento (tarjetas de checkboxes), e Intervenciones Realizadas (caja de texto). |
| **Nuevo Registro Paciente** | [registro_de_nuevo_paciente_desktop.png](file:///e:/Documents/Proyectos/medice-app/docs/mocks/registro_de_nuevo_paciente_desktop.png) | Formulario de ingreso: Datos personales, diagnóstico, cuidador principal, y el indicador de urgencia "Situación Compleja" con caja roja de advertencia. |
| **Comunidad (Voluntariado)** | [comunidad_medice_desktop.png](file:///e:/Documents/Proyectos/medice-app/docs/mocks/comunidad_medice_desktop.png) | Listado y perfiles públicos de voluntarios con especialidad, estado y asignaciones activas. |
| **Panel de Administración** | [panel_de_administraci_n_desktop.png](file:///e:/Documents/Proyectos/medice-app/docs/mocks/panel_de_administraci_n_desktop.png) | Panel de dos columnas: asignación rápida de voluntarios (con drag/drop o clicks) y gestión de centros médicos del mapa con buscador lateral. |
| **Centros de Salud** | [gesti_n_de_centros_desktop.png](file:///e:/Documents/Proyectos/medice-app/docs/mocks/gesti_n_de_centros_desktop.png) | Panel de edición de los centros asociados y hospitales. |
| **Estadísticas e Impacto** | [estad_sticas_e_impacto_desktop_corregido.png](file:///e:/Documents/Proyectos/medice-app/docs/mocks/estad_sticas_e_impacto_desktop_corregido.png)<br>[estad_sticas_e_impacto_desktop.png](file:///e:/Documents/Proyectos/medice-app/docs/mocks/estad_sticas_e_impacto_desktop.png) | Métricas agregadas (Horas, Visitas, Pacientes), gráfico de evolución de visitas mensuales, tarjeta de frase del día y galería de insignias de impacto del voluntario. |
| **Perfil del Voluntario** | [perfil_del_voluntario_desktop.png](file:///e:/Documents/Proyectos/medice-app/docs/mocks/perfil_del_voluntario_desktop.png) | Edición de datos personales, preferencias de notificaciones push, modo nocturno y estadísticas personales de impacto. |

---

## 📱 Diseños Móviles (Mobile)

A continuación se detallan las pantallas móviles correspondientes, adaptadas para visualización táctil rápida en territorio/hospitales.

| Pantalla | Archivo de Mock | Propósito / Elementos Clave |
| :--- | :--- | :--- |
| **Inicio (Mobile)** | [inicio_mobile_corregido.png](file:///e:/Documents/Proyectos/medice-app/docs/mocks/inicio_mobile_corregido.png)<br>[inicio_medice.png](file:///e:/Documents/Proyectos/medice-app/docs/mocks/inicio_medice.png) | Cabecera compacta con saludo "Hola, Carmen" y contador de visitas pendientes. Barra de alerta roja persistente arriba si hay pacientes críticos. Tarjetas compactas verticales de "Mis Pacientes Asignados". Barra de navegación inferior de 4 botones (Inicio, Directorio, Estadísticas, Perfil). |
| **Directorio de Pacientes** | [directorio_de_pacientes.png](file:///e:/Documents/Proyectos/medice-app/docs/mocks/directorio_de_pacientes.png) | Listado vertical de tarjetas de pacientes. Las tarjetas críticas tienen borde rojo grueso (`border-error`). Buscador de texto y píldoras horizontales de filtrado (Todos, Crítico, Alertas, Estables). FAB contextual inferior flotante ("Nuevo Paciente"). |
| **Ficha de Paciente (Detalle)** | [detalle_del_paciente_actualizado.png](file:///e:/Documents/Proyectos/medice-app/docs/mocks/detalle_del_paciente_actualizado.png)<br>[detalle_del_paciente.png](file:///e:/Documents/Proyectos/medice-app/docs/mocks/detalle_del_paciente.png) | Ficha con DNI y estado en la parte superior. Tarjeta de cuidador principal con botón de llamada rápido. Línea de tiempo vertical de seguimientos con marcadores circulares de color (rojo si es crítico). Botón flotante fixed para registrar seguimiento. |
| **Nuevo Seguimiento** | [nuevo_seguimiento.png](file:///e:/Documents/Proyectos/medice-app/docs/mocks/nuevo_seguimiento.png) | Selector de síntomas en formato de chips táctiles (Dolor, Náuseas, Disnea, Insomnio, Ansiedad, etc.), selector de equipamiento, control deslizante (slider) de distress 0-10, y campos para red familiar y notas. |
| **Voluntariado / Comunidad** | [comunidad_medice.png](file:///e:/Documents/Proyectos/medice-app/docs/mocks/comunidad_medice.png)<br>[comunidad_medice_actualizado.png](file:///e:/Documents/Proyectos/medice-app/docs/mocks/comunidad_medice_actualizado.png)<br>[comunidad_medice_filtros.png](file:///e:/Documents/Proyectos/medice-app/docs/mocks/comunidad_medice_filtros.png) | Tarjetas compactas de la comunidad. |
| **Estadísticas** | [estad_sticas_e_impacto.png](file:///e:/Documents/Proyectos/medice-app/docs/mocks/estad_sticas_e_impacto.png) | Versión móvil simplificada del panel de estadísticas. |
| **Administración / Centros** | [panel_de_administraci_n.png](file:///e:/Documents/Proyectos/medice-app/docs/mocks/panel_de_administraci_n.png)<br>[gesti_n_de_hospitales_y_centros.png](file:///e:/Documents/Proyectos/medice-app/docs/mocks/gesti_n_de_hospitales_y_centros.png) | Asignación y listados en modo vertical. |
| **Registro Paciente** | [registro_de_nuevo_paciente.png](file:///e:/Documents/Proyectos/medice-app/docs/mocks/registro_de_nuevo_paciente.png) | Formulario móvil vertical de ingreso. |
| **Perfil del Voluntario** | [perfil_del_voluntario.png](file:///e:/Documents/Proyectos/medice-app/docs/mocks/perfil_del_voluntario.png) | Configuración personal móvil. |

---

## 🎨 Reglas de Diseño Comunes
1. **Colores principales (Tailwind / CSS Variables):**
   - Primario: `#005a71` (Azul Medice)
   - Contenedor Primario: `#0e7490`
   - Secundario: `#4b6450` (Verde Estable)
   - Contenedor Secundario: `#cdead0`
   - Error / Alerta: `#ba1a1a` (Rojo Crítico)
   - Contenedor Error: `#ffdad6`
2. **Tipografía:** Utilizar `Inter` como fuente global.
3. **Responsive Grid:** Asegurar que todo elemento use el Bento Grid que pasa a ser vertical (`col-span-12` o `span 12`) en pantallas inferiores a `768px`.
