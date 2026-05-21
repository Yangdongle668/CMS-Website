#!/bin/sh
# Container entrypoint — runs briefly as root so it can:
#   1. Fix ownership on bind-mounted persistent volumes (handles the
#      case where an older image first created the volume as root, so
#      the unprivileged `app` user could not write to it).
#   2. Drop privileges via `gosu` and exec the main process as `app`.
#
# Node itself was already given CAP_NET_BIND_SERVICE via `setcap` at
# image build time, so binding ports 80 / 443 from the `app` user works.
set -e

# Best-effort chown of any mounted volumes. Silently ignored if a
# directory does not exist (e.g. user removed a volume from compose).
for dir in /app/certs /app/uploads /app/data; do
  if [ -d "$dir" ]; then
    chown -R app:app "$dir" 2>/dev/null || true
  fi
done

# If we somehow got launched as the `app` user already (e.g. an
# upstream image kept the USER directive), just exec the command —
# gosu would no-op anyway but errors if not present.
if [ "$(id -u)" = "0" ]; then
  exec gosu app "$@"
else
  exec "$@"
fi
