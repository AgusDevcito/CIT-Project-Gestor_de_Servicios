#!/usr/bin/env bash
# Simple backup script for PostgreSQL database used by the project.
# Requires pg_dump installed and DATABASE_URL env variable.

set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Error: DATABASE_URL not set" >&2
  exit 1
fi

# Parse connection details
export PGPASSWORD=$(echo "$DATABASE_URL" | sed -n 's|.*:\([^:]*\)@.*|\1|p')
HOST=$(echo "$DATABASE_URL" | sed -n 's|postgresql://[^:]*:[^@]*@\([^:/]*\).*|\1|p')
PORT=$(echo "$DATABASE_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
USER=$(echo "$DATABASE_URL" | sed -n 's|postgresql://\([^:]*\):.*|\1|p')
DB=$(echo "$DATABASE_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')

BACKUP_DIR="backup"
mkdir -p "$BACKUP_DIR"
FILE="$BACKUP_DIR/${DB}_$(date +%Y%m%d_%H%M%S).sql"

pg_dump -h "$HOST" -p "${PORT:-5432}" -U "$USER" -d "$DB" -F c -b -v -f "$FILE"

echo "Backup saved to $FILE"
