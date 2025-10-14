#!/usr/bin/env bash
set -e

echo "Waiting for DB to be ready..."
RETRIES=20
until npm run -s typeorm -- migration:run >/dev/null 2>&1 || [ $RETRIES -le 0 ]; do
  echo "Waiting for migrations to be runnable... attempts left: $RETRIES"
  RETRIES=$((RETRIES-1))
  sleep 2
done

echo "Running migrations (final attempt)"
npm run migration:run

echo "Starting application"
npm run start:prod
