# syntax=docker/dockerfile:1.7

# ---------- deps ----------
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

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
COPY --chown=app:app public ./public
COPY --chown=app:app admin ./admin

RUN mkdir -p /app/uploads && chown -R app:app /app/uploads

USER app

EXPOSE 3000

# init.js is idempotent (schema IF NOT EXISTS, seed ON CONFLICT DO NOTHING).
# Re-running on every container start is safe and cheap.
CMD ["sh", "-c", "node server/db/init.js --seed && node server/index.js"]
