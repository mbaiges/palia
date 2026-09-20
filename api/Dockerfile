# ---- Base ----
FROM node:20-alpine AS base
WORKDIR /usr/src/app
COPY package.json package-lock.json* ./

# ---- Dependencies (production only, for release image) ----
FROM base AS dependencies
RUN npm install --omit=dev

# ---- Build dependencies (includes @types/* for tsc) ----
FROM base AS build-deps
RUN npm install

# ---- Build ----
FROM base AS build
COPY --from=build-deps /usr/src/app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- Release ----
FROM node:20-alpine AS release
WORKDIR /usr/src/app
COPY --from=dependencies /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY package.json .
COPY src/config.yml ./dist/config.yml
COPY --from=build /usr/src/app/knexfile.js ./knexfile.js

EXPOSE 3000
CMD [ "node", "dist/index.js" ]
