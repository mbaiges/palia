# Medice

Repositorio con dos aplicaciones independientes:

- `front/`: la aplicación React + Vite existente, trasladada completa con sus páginas, recursos, documentación y pruebas.
- `api/`: copia inicial del scaffold `api-node-scaffolding-auth`, basada en Express y TypeScript.

## Desarrollo

Instalá dependencias en cada aplicación:

```sh
npm install --prefix front
npm install --prefix api
```

Copiá `api/env.example` a `api/.env` y configurá sus valores. Luego ejecutá ambas aplicaciones con:

```sh
npm run dev
```

También pueden iniciarse por separado con `npm run front:dev` y `npm run api:dev`. Los comandos de build y pruebas están disponibles en el `package.json` raíz; cada aplicación mantiene su propio `package.json` y lockfile.

## Estado de la separación

Este cambio establece la estructura del monorepo y deja el scaffold API como punto de partida. La interfaz todavía usa sus servicios y configuración actuales; no se migraron Firebase, el almacenamiento local ni los flujos de pacientes y seguimientos a endpoints. Esa integración requiere definir y portar el contrato de datos, autenticación y persistencia del dominio Medice.
