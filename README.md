# Palia - Sistema de Gestión de Acompañamiento en Cuidados Paliativos

**Palia** es una plataforma centralizada y progresiva (PWA) diseñada para la ONG **Medice** (Buenos Aires, Argentina) con el fin de optimizar el acompañamiento clínico y voluntario de pacientes en cuidados paliativos.

La aplicación reemplaza los flujos de trabajo manuales tradicionales por un sistema relacional de alta accesibilidad, facilitando el registro de seguimientos cronológicos en territorio (domicilio u hospital) y proveyendo un sistema inmediato de alertas críticas ante situaciones clínicas o sociales complejas.

---

## 📋 Características Principales

### 👨‍👩‍👧‍👦 Gestión de Pacientes y Cuidadores
- Registro de ficha clínica de pacientes, incluyendo diagnóstico principal, hospital de derivación y estado clínico general.
- Registro detallado de datos del referente o cuidador principal, evaluando su nivel de sobrecarga y datos de contacto rápido para emergencias.

### ✍️ Registro de Seguimientos (*Seguimientos*)
- Formulario adaptado para registrar la evolución de síntomas clave (Dolor, Náuseas, Disnea).
- Evaluación de la red de contención familiar (Riesgo Social).
- Registro de necesidades de equipamiento (Cama articulada, concentrador de oxígeno, colchón antiescaras, aspirador).
- Registro descriptivo de las intervenciones de apoyo y contención emocional brindadas.

### 🚨 Sistema de Alerta Inmediata
- Capacidad de activar una alerta crítica ("Situación compleja") desde el formulario de seguimiento.
- Visualización de alertas de forma prioritaria en los paneles de control de los voluntarios y administradores.
- Envío inmediato de notificaciones push a todos los voluntarios asignados al mismo paciente.

### 📊 Estadísticas de Impacto
- Métricas personales e institucionales para medir el impacto de la labor voluntaria (horas dedicadas, visitas completadas, pacientes atendidos).
- Gráficos mensuales de actividad y visualización de logros.

---

## 👤 Roles de Usuario

1. **Voluntario (Usuario Estándar):**
   - Acceso al directorio de pacientes.
   - Vista de pacientes asignados a su equipo de acompañamiento.
   - Registro de nuevos seguimientos y activación de alertas urgentes.
   - Visualización de estadísticas personales y perfil público.

2. **Administrador (Superusuario):**
   - Todos los permisos del Voluntario.
   - Creación y edición de fichas maestras de pacientes y cuidadores.
   - Gestión del catálogo maestro de hospitales y centros médicos de referencia.
   - Asignación cruzada de voluntarios a pacientes.

---

## 🛠️ Stack Tecnológico

- **Frontend:** React + Vite
- **Estilos:** Tailwind CSS + Vanilla CSS Variables (arquitectura adaptable bento-grid y modo claro/oscuro)
- **Persistencia:** Capa de almacenamiento desacoplada (`dbService`) con soporte para:
  - **Local Storage:** Simulación local relacional completa offline-first.
  - **Firebase (Nube):** Integración cloud para producción (Firestore para base de datos y Firebase Auth para autenticación/Google Sign-In).
- **Instalabilidad:** Configurado como PWA (Progressive Web App) para instalación en dispositivos móviles y ordenadores con Service Workers.

---

## 🚀 Inicio Rápido (Desarrollo Local)

El proyecto incluye scripts en PowerShell para facilitar la gestión del entorno de desarrollo.

### 1. Iniciar el Servidor de Desarrollo
Para detener cualquier proceso previo que use los puertos del proyecto, verificar dependencias (ejecutar `npm install`) y arrancar el servidor en caliente:

```powershell
.\scripts\start_app.ps1
```

### 2. Detener el Servidor
Para liberar puertos de desarrollo cuando finalice el trabajo:

```powershell
.\scripts\kill_dev_server.ps1
```

La aplicación estará disponible localmente en `http://localhost:5173`.

---

## 📄 Documentación del Proyecto
Para más detalles arquitectónicos y de despliegue, revise la carpeta `docs/`:

- [Especificación de Requerimientos Funcionales](file:///e:/Documents/Proyectos/medice-app/docs/functional_requirements_specification.md)
- [Especificación Técnica de Puertos y Adaptadores](file:///e:/Documents/Proyectos/medice-app/docs/technical_specification.md)
- [Guía de Despliegue en Producción (Cloudflare Pages + Firebase)](file:///e:/Documents/Proyectos/medice-app/docs/DEPLOY_PROD.md)
- [Índice de Mocks de Interfaz de Referencia](file:///e:/Documents/Proyectos/medice-app/docs/mocks/README.md)
