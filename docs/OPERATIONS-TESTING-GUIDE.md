# Guía para configurar y probar Medice

Esta guía describe cómo probar el sistema desde cero. Los pasos locales usan SQLite y no requieren Turso. Las credenciales productivas deben configurarse únicamente en el proceso de `api`; nunca en `front/.env`.

## 1. Qué significa `TRUST_PROXY_HOPS`

Express necesita saber si la petición llegó directamente al servidor o atravesó proxies inversos. `TRUST_PROXY_HOPS` indica cuántos saltos de proxy se consideran confiables para calcular `req.ip`, HTTPS y cookies seguras.

Ejemplos:

- Desarrollo directo: `TRUST_PROXY_HOPS=0`.
- Un balanceador o CDN delante del contenedor: `TRUST_PROXY_HOPS=1` si existe exactamente un salto.
- CDN + ingress + contenedor: usar `2` solo si esa es la topología real.

No se debe adivinar el valor ni poner `true`. El API acepta únicamente enteros entre 0 y 10. Cuando se usa un valor mayor que cero, el puerto directo del API debe estar bloqueado para Internet; de lo contrario, un cliente podría falsificar cabeceras de proxy.

## 2. Preparar el entorno local

1. Instalar Node.js 20+, npm y Docker Desktop si se probará la imagen combinada.
2. Desde la raíz instalar dependencias:

   ```powershell
   npm install --prefix api
   npm install --prefix front
   ```

3. Copiar la configuración del API:

   ```powershell
   Copy-Item api/env.example api/.env
   ```

4. Editar `api/.env` para desarrollo:

   ```dotenv
   NODE_ENV=development
   PORT=3000
   CLIENT_URL=http://localhost:5173
   USE_LOCAL_DB=true
   DB_CONNECTION_STR=./db/data/medice-local.db
   JWT_SECRET=un-secreto-local-largo
   ENCRYPTION_KEY=una-clave-local-larga
   INITIAL_ADMIN_EMAILS=tu-correo@gmail.com
   TRUST_PROXY_HOPS=0
   PUSH_ENABLED=false
   ```

5. Copiar las variables públicas del front si hace falta:

   ```powershell
   Copy-Item front/.env.example front/.env
   ```

   Mantener `VITE_API_BASE_URL=` vacío para probar el mismo origen mediante `/api`. `VITE_*` nunca debe contener secretos.

## 3. Levantar las dos aplicaciones

Desde la raíz:

```powershell
npm run dev
```

Comprobar:

- Front: <http://localhost:5173>
- API: <http://localhost:3000/api/health>
- Readiness con SQLite: <http://localhost:3000/api/health/ready>

Si se levantan por separado:

```powershell
npm run api:dev
npm run front:dev
```

El proxy de Vite debe enviar `/api/*` a `http://localhost:3000`.

## 4. Probar autenticación local

Para una prueba local rápida se puede habilitar solo en desarrollo:

```dotenv
DEV_AUTH_BYPASS=true
DEV_ADMIN_EMAIL=admin@test.com
TEST_GOOGLE_AUTH=true
```

Luego:

1. Abrir el front.
2. Usar el acceso de prueba admin.
3. Confirmar en `/api/auth/me` que la sesión se representa con cookie HttpOnly.
4. Confirmar que no aparecen JWT ni datos clínicos en `localStorage` o `sessionStorage`.
5. Cerrar sesión y comprobar que una ruta protegida vuelve a pedir autenticación.

Para Google real:

1. Crear un OAuth Client de tipo Web.
2. Agregar el origen autorizado exacto, por ejemplo `http://localhost:5173`.
3. Configurar `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` solo en `api/.env`.
4. Configurar el mismo ID público en `VITE_GOOGLE_CLIENT_ID`.
5. Agregar el correo a `INITIAL_ADMIN_EMAILS` para el primer alta administrativa.
6. Reiniciar el API y probar login con un correo autorizado y otro no autorizado.

## 5. Recorrido funcional manual

Con una sesión admin:

1. Crear un hospital.
2. Crear un paciente con DNI formateado y cuidador.
3. Confirmar que el DNI se normaliza a solo dígitos.
4. Intentar duplicar el DNI y verificar `409` sin perder el formulario.
5. Editar paciente y cuidador.
6. Asignar voluntarios y confirmar que el conteo aparece en comunidad/perfil.
7. Crear un seguimiento presencial, remoto y personalizado.
8. Crear una alerta independiente y otra desde un seguimiento.
9. Confirmar que pueden coexistir varias alertas activas.
10. Resolver una alerta con y sin nota.
11. Archivar y restaurar paciente/hospital según el rol.
12. Revisar estadísticas personales y globales con admin/coordinador.
13. Agregar un correo a la allow-list y verificar el conflicto al repetirlo.
14. Editar el perfil sin poder modificar rol, email ni permisos.
15. Abrir la vista imprimible y comprobar todos los campos del historial.

Repetir las operaciones de lectura en un voluntario y verificar que ve el directorio, pero no puede administrar pacientes, hospitales, asignaciones, allow-list ni estadísticas globales.

## 6. Probar mobile

Usar Chrome DevTools con estos viewports:

- 360×800: teléfono promedio compacto.
- 390×844: teléfono moderno habitual.
- 344×882: ancho estrecho.

En cada tamaño comprobar directorio, ficha, seguimiento, alerta, impresión, estadísticas, comunidad, administración, allow-list, perfil, popovers y navegación inferior. Confirmar que no exista overflow horizontal y que los botones finales queden por encima de la barra fija.

La suite automatizada equivalente es:

```powershell
npm run test:e2e
```

Las capturas se generan en `e2e/artifacts/screenshots/api-front-separation/`.

## 7. Validación automatizada

```powershell
npm test
npm run api:build
npm run front:build
npm run lint --prefix front
npm run test:e2e:api-front-separation
npm run test:e2e
git diff --check
```

Los E2E crean SQLite efímera. No deben leer variables Turso.

## 8. Probar Docker con SQLite local

```powershell
docker build -t medice-app:local .
docker run --rm -p 3000:3000 `
  -e NODE_ENV=production `
  -e USE_LOCAL_DB=true `
  -e DB_CONNECTION_STR=/app/db/data/medice.db `
  -e ENCRYPTION_KEY=clave-local-de-prueba `
  -e JWT_SECRET=secreto-local-de-prueba `
  -e CLIENT_URL=http://localhost:3000 `
  -e TRUST_PROXY_HOPS=0 `
  -e PUSH_ENABLED=false `
  medice-app:local
```

En otra terminal comprobar `/api/health/ready`, `/` y una ruta SPA profunda como `/patients/123`. Luego detener el contenedor y confirmar que el proceso registra un cierre ordenado.

## 9. Push real

1. Generar claves con `npx web-push generate-vapid-keys`.
2. Configurar `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` en el API.
3. Configurar solo `VITE_VAPID_PUBLIC_KEY` en el front.
4. Usar HTTPS; los Service Workers y Push no funcionan de forma completa en un origen HTTP remoto.
5. Suscribir dos usuarios asignados a un paciente.
6. Activar una alerta y verificar que reciben un mensaje genérico sin PII.
7. Revocar una suscripción y comprobar que un endpoint inválido se elimina sin borrar suscripciones de otro usuario.

## 10. Configuración productiva

Antes de exponer el sistema:

1. Crear secretos nuevos para `JWT_SECRET` y `ENCRYPTION_KEY`.
2. Configurar Google OAuth con los dominios productivos exactos.
3. Configurar `INITIAL_ADMIN_EMAILS` y revisar la allow-list.
4. Terminar TLS en el proxy o CDN.
5. Establecer `TRUST_PROXY_HOPS` según la topología real.
6. Bloquear acceso directo al puerto interno del API.
7. Configurar `CLIENT_URL` con HTTPS.
8. Configurar VAPID si se usará push.
9. Configurar almacenamiento de media si se usa avatar remoto.
10. Repetir health, login, permisos, CRUD, push y rutas SPA desde el dominio público.

La conexión a Turso y sus credenciales deben configurarse y validarse por separado cuando la base esté creada. Nunca colocar `TURSO_AUTH_TOKEN`, `GOOGLE_CLIENT_SECRET`, VAPID privada o claves de cifrado en `front/.env`.
