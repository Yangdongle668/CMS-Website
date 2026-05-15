#!/bin/sh
# =============================================================================
#  Restore the CMS database from a pg_dump produced by scripts/backup.sh.
#
#  Usage from host:
#    ./scripts/restore.sh                       # restore the newest dump
#    ./scripts/restore.sh 20260515-030001       # restore a specific timestamp
#
#  The script copies the dump file into the running `db` container and pipes
#  it back through psql. The app container is paused while the restore runs
#  so half-finished writes can't sneak in.
# =============================================================================

set -eu

DUMP_KEY="${1:-}"
COMPOSE="${COMPOSE:-docker compose}"

# Resolve which dump file to restore.
list_dumps() {
  $COMPOSE run --rm --no-deps -T backup sh -c \
    'ls -1 /backups/'"${PGDATABASE:-battery_cms}"'-*.sql.gz 2>/dev/null | sort'
}

if [ -z "$DUMP_KEY" ]; then
  DUMP_FILE=$(list_dumps | tail -1)
  if [ -z "$DUMP_FILE" ]; then
    echo "No backups found in the 'backups' volume." >&2
    exit 1
  fi
  echo "Using newest backup: $DUMP_FILE"
else
  DUMP_FILE=$(list_dumps | grep "$DUMP_KEY" | tail -1)
  if [ -z "$DUMP_FILE" ]; then
    echo "No backup file matching '$DUMP_KEY' under /backups." >&2
    echo "Available:" >&2
    list_dumps | sed 's/^/  /' >&2
    exit 1
  fi
fi

cat <<EOM

================================================================================
  ABOUT TO RESTORE  $DUMP_FILE
  This will OVERWRITE the current database.
  Press Ctrl-C in the next 5 seconds to cancel.
================================================================================
EOM
sleep 5

echo "[restore] stopping app container to prevent writes during restore"
$COMPOSE stop app || true

echo "[restore] streaming $DUMP_FILE through psql"
$COMPOSE exec -T backup sh -c "gunzip -c '$DUMP_FILE'" | \
  $COMPOSE exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1'

echo "[restore] restarting app"
$COMPOSE start app

echo "[restore] done. Verify with: $COMPOSE logs -f app"
