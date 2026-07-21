# Tina dos desejos — build/runtime em Node 22 (better-sqlite3 precisa de toolchain no stage de build).
# Uso na VPS:
#   docker build -t tinadosdesejos:latest .
#   docker run --rm -p 3000:3000 \
#     -v /opt/tina/data:/app/data \
#     --env-file /opt/tina/.env.production \
#     tinadosdesejos:latest

FROM node:22.14.0-bookworm-slim AS build

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
# postinstall chama scripts/ensure-better-sqlite3-… — precisa existir antes do npm ci
COPY scripts ./scripts
RUN npm ci

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
# Garante native rebuild no contexto final do build (Node 22 da imagem)
RUN npm run ensure:sqlite \
  && npm run build \
  && npm prune --omit=dev

FROM node:22.14.0-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN mkdir -p /app/data

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.ts ./

EXPOSE 3000

# Persistência: triage.db + gitlab-description-uploaded-assets-v1/
VOLUME ["/app/data"]

CMD ["npm", "run", "start"]
