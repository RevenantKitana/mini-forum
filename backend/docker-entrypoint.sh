#!/bin/sh
set -e

echo "🔄 Waiting for database..."
sleep 3

echo "🔄 Running Prisma migrations..."
npx prisma migrate deploy --schema=prisma/schema.prisma

echo "✅ Migrations complete. Starting application as unprivileged user..."
exec su-exec appuser:appgroup node dist/index.js
