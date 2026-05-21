#!/usr/bin/env bash

set -euo pipefail

COMPOSE_CMD="docker compose"

wait_for_mysql() {
  local attempts=0
  local max_attempts=30

  echo "Waiting for MySQL to become healthy..."

  until $COMPOSE_CMD exec -T mysql sh -lc 'mysqladmin ping -h 127.0.0.1 -uroot -p"$MYSQL_ROOT_PASSWORD" --silent' >/dev/null 2>&1; do
    attempts=$((attempts + 1))
    if [ "$attempts" -ge "$max_attempts" ]; then
      echo "MySQL did not become ready in time."
      exit 1
    fi
    sleep 2
  done
}

echo "Stopping existing containers..."
$COMPOSE_CMD down --remove-orphans

echo "Building images..."
$COMPOSE_CMD build backend frontend

echo "Starting MySQL..."
$COMPOSE_CMD up -d mysql

wait_for_mysql

echo "Running Prisma migrations..."
$COMPOSE_CMD run --rm --no-deps backend npm run prisma:migrate:deploy

echo "Starting application services..."
$COMPOSE_CMD up -d backend frontend

echo "Deployment status:"
$COMPOSE_CMD ps