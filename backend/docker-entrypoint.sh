#!/bin/sh
set -e

echo "🔄 Waiting for database..."
sleep 2

echo "🔄 Running Prisma migrations..."
npx prisma migrate deploy || true

echo "✅ Migrations complete. Starting application as unprivileged user..."
exec su-exec appuser:appgroup node dist/index.js
