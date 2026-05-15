#!/bin/sh
# =============================================================================
#  Daily Postgres backup loop.
#
#  Runs inside the `backup` compose service. Every 24 hours it pg_dumps the
#  configured database to /backups/, naming the file by date. Old files past
#  BACKUP_RETAIN_DAYS are pruned.
#
#  Why a sleep loop instead of cron: zero extra image deps (cron in alpine
#  has known quirks with env vars + PID 1), trivial to inspect with
#  `docker compose logs -f backup`, and survives container restart cleanly.
# =============================================================================

set -eu

BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETAIN_DAYS="${BACKUP_RETAIN_DAYS:-14}"
INTERVAL_SECONDS="${BACKUP_INTERVAL_SECONDS:-86400}"   # 24h

mkdir -p "$BACKUP_DIR"

run_dump() {
  TS=$(date -u +%Y%m%d-%H%M%S)
  OUT="$BACKUP_DIR/${PGDATABASE}-${TS}.sql.gz"
  echo "[backup] $(date -u +%FT%TZ)  dumping $PGDATABASE to $OUT"
  # PGPASSWORD is read by pg_dump from env. --no-owner / --no-privileges keep
  # the dump portable across users; -Fp uses plain SQL so the gzipped file is
  # human-readable in an emergency `zcat | psql`.
  if PGPASSWORD="$PGPASSWORD" pg_dump \
        -h "$PGHOST" -p "${PGPORT:-5432}" \
        -U "$PGUSER" -d "$PGDATABASE" \
        --no-owner --no-privileges -Fp \
        | gzip -9 > "$OUT.tmp"; then
    mv "$OUT.tmp" "$OUT"
    BYTES=$(wc -c < "$OUT")
    echo "[backup] ok ${BYTES} bytes"
  else
    echo "[backup] FAILED" >&2
    rm -f "$OUT.tmp"
    return 1
  fi

  # Prune anything older than retention. -mtime is in days.
  find "$BACKUP_DIR" -maxdepth 1 -type f -name "${PGDATABASE}-*.sql.gz" \
       -mtime +"$RETAIN_DAYS" -print -delete | sed 's/^/[backup] prune /'
}

# One sweep at boot so a fresh stack has a snapshot within seconds, then
# the configured interval after.
while true; do
  run_dump || true
  sleep "$INTERVAL_SECONDS"
done
