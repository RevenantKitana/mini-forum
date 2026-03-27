#!/bin/sh
set -e

echo "🚀 Starting Vibe Content Service..."

# Run Prisma migrations if needed
if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "📦 Running database migrations..."
  npx prisma migrate deploy || true
fi

# Run with dumb-init for proper signal handling
exec "$@"
