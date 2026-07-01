# Guía de Despliegue en Producción (Gratis)

Para llevar **Palia** a producción sin costes, siga esta guía paso a paso:

---

## 1. Configuración de Hosting Gratis en Cloudflare Pages

1. Ingrese a su panel de **Cloudflare** y vaya a **Workers & Pages** -> **Create Application** -> **Pages** -> **Connect to Git**.
2. Seleccione su repositorio de GitHub `mbaiges/palia`.
3. Configure los parámetros de compilación:
   - **Framework Preset:** `Vite` (o seleccione `None`).
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Presione **Save and Deploy**. 

> [!NOTE]
> Cada vez que haga `git push` a `main`, Cloudflare compilará y actualizará el sitio automáticamente.

---

## 2. Enlazar Dominio Gratuito `.org.ar` (Argentina)

1. Registre gratis el nombre de su ONG en **NIC Argentina** (los dominios `.org.ar` son gratuitos para entidades sin fines de lucro acreditadas).
2. En Cloudflare Pages, vaya a la pestaña **Custom Domains** y escriba su dominio registrado (ej: `palia.org.ar`).
3. Cloudflare le proporcionará los servidores DNS (ej: `ns1.cloudflare.com`). Cópielos y configúrelos en su panel de NIC Argentina para delegar el dominio.

---

## 3. Conectar Firebase Real (Autenticación y Base de Datos)

Cuando decida migrar del simulador local a la nube de Firebase:

1. Cree un proyecto en **Firebase Console** (utilice la capa gratuita Spark).
2. Vaya a **Authentication** y habilite el proveedor **Google** (configure la pantalla de consentimiento de OAuth de Google Cloud).
3. Cree una base de datos de **Cloud Firestore** en modo de producción.
4. Cree las siguientes variables de entorno en el panel de configuración de su aplicación en Cloudflare Pages:

```bash
VITE_USE_FIREBASE=true
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_auth_domain
VITE_FIREBASE_PROJECT_ID=tu_project_id
VITE_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
```

5. Descomente las librerías oficiales de Firebase en `db.js` para conectar las llamadas directas de lectura/escritura en la base de datos cloud.

---

## 4. Configurar Google OAuth (Sign-In con Google)

> [!IMPORTANT]
> Necesitará un proyecto en Google Cloud Console y credenciales OAuth 2.0 para habilitar el inicio de sesión con Google.

### Pasos para obtener las credenciales OAuth:

1. Ingrese a [Google Cloud Console](https://console.cloud.google.com/).
2. Cree un nuevo proyecto (o use el mismo proyecto de Firebase).
3. Vaya a **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**.
4. Seleccione **Web Application** como tipo.
5. Configure los **Authorized JavaScript origins**:
   - Para desarrollo local: `http://localhost:5173`
   - Para producción: `https://tu-dominio.org.ar`
6. Configure los **Authorized redirect URIs**:
   - Para producción: `https://tu-dominio.org.ar`
7. Copie el **Client ID** generado.

### Integrar en la app:

1. Agregue la variable de entorno en Cloudflare Pages:
   ```bash
   VITE_GOOGLE_CLIENT_ID=tu_client_id_aqui.apps.googleusercontent.com
   ```
2. En `src/pages/Login.jsx`, reemplace el simulador de login con la integración real de Google:
   ```javascript
   import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
   // ... usar auth de Firebase
   ```

> [!NOTE]
> Para desarrollo local, cree un archivo `.env.local` en la raíz del proyecto con las variables de entorno. Este archivo **no debe commitearse** al repositorio (ya está en `.gitignore`).

---

## 5. Desarrollo Local

### Iniciar el servidor de desarrollo

Ejecute desde la raíz del proyecto:

```powershell
# Una sola línea: matar servidor anterior + instalar dependencias + iniciar
.\scripts\start_app.ps1
```

**Flags opcionales:**
```powershell
.\scripts\start_app.ps1 -NoKill      # No mata procesos existentes
.\scripts\start_app.ps1 -SkipInstall # Salta npm install
```

### Detener el servidor

```powershell
.\scripts\kill_dev_server.ps1
```

O simplemente presione `Ctrl+C` en la terminal donde está corriendo `npm run dev`.

### Acceder a la aplicación

- **Desarrollo:** http://localhost:5173
- **Red local (teléfono):** http://[su-ip-local]:5173

---

## 6. Publicar Actualizaciones

```bash
# 1. Hacer los cambios en el código
# 2. Hacer commit y push
git add .
git commit -m "feat: descripción de los cambios"
git push origin main
# Cloudflare Pages detectará el push y desplegará automáticamente (≈ 60 segundos)
```
