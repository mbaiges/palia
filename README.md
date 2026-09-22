# Medice

La guía operativa para configurar y probar el sistema está en [docs/OPERATIONS-TESTING-GUIDE.md](docs/OPERATIONS-TESTING-GUIDE.md).

Monorepo con dos aplicaciones independientes y un contrato de API compartido:

- `front/`: React + Vite. Usa un cliente HTTP centralizado, rutas relativas `/api`, cookie de sesión y CSRF.
- `api/`: Express + TypeScript. Contiene autenticación, autorización, dominio clínico y persistencia.

## Desarrollo local

Instalá dependencias y copiá `api/env.example` a `api/.env`. Configurá una clave de cifrado y un secreto JWT de desarrollo; no guardes credenciales productivas en el frontend. SQLite es la base local predeterminada.

```sh
npm install --prefix front
npm install --prefix api
npm run dev
```

El frontend queda en `http://localhost:5173` y Vite proxya `/api` a `http://localhost:3000`. También podés ejecutar `npm run front:dev` y `npm run api:dev` por separado.

## Pruebas y builds

```sh
npm test
npm run test:e2e:api-front-separation
npm run test:e2e
npm run front:build
npm run api:build
```

Playwright crea una base SQLite efímera; no necesita ni debe usar una base remota.

## Imagen de mismo origen

El `Dockerfile` raíz construye ambos proyectos y ejecuta el API sirviendo los assets del frontend; `/api/*` permanece en el mismo origen. `.dockerignore` excluye claves, bases locales, dependencias y artefactos de prueba.

```sh
docker build -t medice-app:local .
docker run --rm -p 3000:3000 \
  -e NODE_ENV=production \
  -e USE_LOCAL_DB=true \
  -e DB_CONNECTION_STR=/app/db/data/medice.db \
  -e FRONT_DIST_DIR=/app/front-dist \
  -e JWT_SECRET=<secreto-aleatorio> \
  -e ENCRYPTION_KEY=<clave-de-32-caracteres> \
  medice-app:local
```

Para persistir SQLite local, monta un volumen en `/app/db/data`. Configurá OAuth, lista inicial de admins, origen y claves push solo en el entorno del API. El frontend se sirve desde la misma imagen y no necesita una URL API pública separada. La configuración/validación de Turso está excluida de este trabajo y queda a cargo del operador.

## Seguridad de autenticación

El inicio con Google requiere `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` solo en el API. `VITE_GOOGLE_CLIENT_ID` es el ID público del cliente web. `VITE_API_BASE_URL` queda vacío para same-origin `/api`; usá el proxy Vite para desarrollo. El bypass de prueba se habilita solo con variables explícitas en entornos de desarrollo/E2E.
