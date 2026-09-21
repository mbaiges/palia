# Palia frontend

Aplicación web React + Vite para acompañamiento de pacientes de Medice. La API es la fuente canónica de datos y se consume desde `src/services/apiClient.js`; en desarrollo se usa la ruta relativa `/api` con el proxy Vite.

## Desarrollo

Desde la raíz del repositorio:

```sh
npm install --prefix api
npm install --prefix front
npm run dev
```

Vite escucha en `http://localhost:5173` y proxya `/api` a `http://localhost:3000`. Para ejecutar el front por separado, usá `npm run front:dev`. `front/.env.example` documenta las variables de cliente; `VITE_GOOGLE_CLIENT_ID` es un identificador público, nunca pongas secretos en variables `VITE_*`. Dejá `VITE_API_BASE_URL` vacío para usar `/api` en el mismo origen.

## Datos y sesión

La sesión se mantiene en una cookie HttpOnly emitida por el API; el cliente central agrega CSRF a mutaciones. Los datos clínicos se leen y escriben en el servidor. IndexedDB solo conserva la identidad mínima necesaria para reanudar la UI offline, las fichas asignadas abiertas previamente y seguimientos pendientes asociados a su autor. La sincronización reintenta con la misma clave de mutación para evitar duplicados.

## Validación

```sh
npm run front:test:unit
npm run test:e2e:api-front-separation
npm run front:build
npm run lint --prefix front
```

Las pruebas E2E arrancan el API con SQLite local efímera. El Service Worker deja `/api/*` en red y las notificaciones push usan texto genérico. Para alcance, contratos y limitaciones actuales, consultá [functional spec](../docs/features/api-front-separation/functional-spec.md), [technical spec](../docs/features/api-front-separation/technical-spec.md) e [implementation checklist](../docs/features/api-front-separation/implementation-checklist.md).
