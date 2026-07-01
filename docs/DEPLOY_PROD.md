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
