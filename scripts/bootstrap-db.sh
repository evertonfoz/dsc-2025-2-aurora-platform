#!/usr/bin/env bash
set -euo pipefail

# Bootstrap script for dev: wait for postgres, create DB/schemas if missing and run package migrations.
# Usage: ./scripts/bootstrap-db.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

DB_CONTAINER="aurora_db"
DB_NAME="aurora_db"
DB_USER="postgres"
MAX_RETRIES=60
SLEEP_SECONDS=2

echo "[bootstrap] waiting for Postgres container to be ready..."
retries=0
until docker compose exec -T db pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; do
  ((retries++))
  if [ "$retries" -ge "$MAX_RETRIES" ]; then
    echo "[bootstrap] timeout waiting for Postgres (retries=$retries)"
    exit 1
  fi
  sleep "$SLEEP_SECONDS"
done

echo "[bootstrap] Postgres appears ready"

# create database if not exists
exists=$(docker compose exec -T db psql -U "$DB_USER" -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'") || exists=""
if [[ "$exists" != "1" ]]; then
  echo "[bootstrap] creating database ${DB_NAME}"
  docker compose exec -T db psql -U "$DB_USER" -c "CREATE DATABASE ${DB_NAME};"
else
  echo "[bootstrap] database ${DB_NAME} already exists"
fi

# create schemas (idempotent)
for schema in events users auth; do
  echo "[bootstrap] creating schema ${schema} if not exists"
  docker compose exec -T db psql -U "$DB_USER" -d "$DB_NAME" -c "CREATE SCHEMA IF NOT EXISTS ${schema} AUTHORIZATION ${DB_USER};"
done

# Run migrations for each package that exposes a data-source at packages/<pkg>/src/data-source.ts
# This will execute migrations per-package, keeping them isolated.
for pkg_dir in packages/*; do
  data_source_path="$pkg_dir/src/data-source.ts"
  if [ -f "$data_source_path" ]; then
    echo "[bootstrap] running migrations for $(basename "$pkg_dir") using $data_source_path"
    # prefer running from repo root so dotenv loads root .env; allow the commands to fail fast if something's wrong
    npx typeorm-ts-node-commonjs -d "$data_source_path" migration:run || {
      echo "[bootstrap] migrations for $(basename "$pkg_dir") failed"
      exit 1
    }
  else
    echo "[bootstrap] skipping $(basename "$pkg_dir") (no data-source found)"
  fi
done

# Optionally run monolith migrations if AppDataSource exists
if [ -f "scripts/run-migrations.ts" ]; then
  echo "[bootstrap] running monolith migrations via scripts/run-migrations.ts"
  node -e "require('./scripts/run-migrations').main && process.exit(0)" 2>/dev/null || {
    # fallback: run the ts script with ts-node if available
    if command -v ts-node >/dev/null 2>&1; then
      ts-node scripts/run-migrations.ts || true
    else
      echo "[bootstrap] note: could not run scripts/run-migrations.ts (ts-node not available). Skipping."
    fi
  }
fi

echo "[bootstrap] done"
