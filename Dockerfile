FROM node:20-alpine AS front-build
WORKDIR /workspace/front
COPY front/package.json front/package-lock.json ./
RUN npm ci
COPY front/ ./
RUN npm run build

FROM node:20-alpine AS api-build
WORKDIR /workspace/api
COPY api/package.json api/package-lock.json ./
RUN npm ci
COPY api/ ./
RUN npm run build

FROM node:20-alpine AS release
ENV NODE_ENV=production
ENV FRONT_DIST_DIR=/app/front-dist
WORKDIR /app
RUN mkdir -p /app/db/data
COPY api/package.json api/package-lock.json ./
RUN npm ci --omit=dev
COPY --from=api-build /workspace/api/dist ./dist
COPY --from=api-build /workspace/api/knexfile.js ./knexfile.js
COPY --from=api-build /workspace/api/src/config.yml ./dist/config.yml
COPY --from=front-build /workspace/front/dist ./front-dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
