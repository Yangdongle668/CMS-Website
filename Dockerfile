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

# System packages:
#   • libcap2-bin — provides `setcap`, used below to let Node bind :80/:443
#   • gosu        — entrypoint drops privileges from root → app cleanly
RUN apt-get update \
 && apt-get install -y --no-install-recommends libcap2-bin gosu \
 && rm -rf /var/lib/apt/lists/*

# Grant the Node binary CAP_NET_BIND_SERVICE so it can listen on the
# privileged ports 80 (ACME HTTP-01) and 443 (HTTPS) without running as
# root. Without this, the auto-SSL HTTP/HTTPS servers fail with EACCES.
RUN setcap 'cap_net_bind_service=+ep' "$(readlink -f "$(which node)")"

# Create the unprivileged runtime user.
RUN groupadd -r app && useradd -r -g app -d /app -s /usr/sbin/nologin app

COPY --chown=app:app --from=deps /app/node_modules ./node_modules
COPY --chown=app:app package.json package-lock.json ./
COPY --chown=app:app server ./server
COPY --chown=app:app --from=builder /app/public ./public
COPY --chown=app:app admin ./admin

# Pre-create persistent directories with `app` ownership BEFORE the
# named volumes are attached. When Docker provisions a fresh volume it
# inherits the mount-target ownership, so the app user can write to it
# from first boot. The docker-entrypoint.sh re-asserts the chown each
# start to repair pre-existing volumes that were created as root by an
# older image.
RUN mkdir -p /app/uploads /app/data /app/certs && \
    chown -R app:app /app/uploads /app/data /app/certs

COPY --chmod=755 docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000 80 443

# init.js is idempotent (schema IF NOT EXISTS, seed ON CONFLICT DO NOTHING).
# Re-running on every container start is safe and cheap. The entrypoint
# script runs as root to fix volume ownership, then drops to `app`.
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["sh", "-c", "node server/db/init.js --seed && node server/index.js"]
