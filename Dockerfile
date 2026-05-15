# syntax=docker/dockerfile:1.7

# ---------- prod deps (no devDeps, used in runtime image) ----------
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# ---------- builder (includes devDeps so esbuild is available) ----------
# Produces public/dist/<hashed assets> + manifest.json. Failure is
# non-fatal — the runtime app falls back to source files when the
# manifest is absent, so a broken build script never bricks deploys.
FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY scripts ./scripts
COPY public ./public
RUN npm run build || echo "[build] skipped or failed — runtime will serve source files"

# ---------- runtime ----------
FROM node:20-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    PGHOST=db \
    PGPORT=5432

# Drop privileges
RUN groupadd -r app && useradd -r -g app -d /app -s /usr/sbin/nologin app

COPY --chown=app:app --from=deps /app/node_modules ./node_modules
COPY --chown=app:app package.json package-lock.json ./
COPY --chown=app:app server ./server
COPY --chown=app:app --from=builder /app/public ./public
COPY --chown=app:app admin ./admin

RUN mkdir -p /app/uploads /app/data && chown -R app:app /app/uploads /app/data

USER app

EXPOSE 3000

# init.js is idempotent (schema IF NOT EXISTS, seed ON CONFLICT DO NOTHING).
# Re-running on every container start is safe and cheap.
CMD ["sh", "-c", "node server/db/init.js --seed && node server/index.js"]
