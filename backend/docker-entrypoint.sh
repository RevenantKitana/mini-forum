#!/bin/sh

set -e  # Exit on any error

# Validate that DATABASE_URL is set before proceeding
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL environment variable is not set"
  exit 1
fi

echo "🔄 Waiting for database..."
sleep 3

echo "🔄 Running Prisma migrations..."
MIGRATION_OUTPUT=$(npx prisma migrate deploy --schema=prisma/schema.prisma 2>&1)
MIGRATION_EXIT=$?

if [ $MIGRATION_EXIT -ne 0 ]; then
  if echo "$MIGRATION_OUTPUT" | grep -q "P3005"; then
    echo "⚠️  Database schema already exists. Baseling migrations..."
    npx prisma migrate resolve --applied 20260420000000_init || echo "⚠️  Migration 1 already resolved"
    npx prisma migrate resolve --applied 20260420042859_sfw_forum || echo "⚠️  Migration 2 already resolved"
    npx prisma migrate resolve --applied 20260423112433_add_imagekit_media || echo "⚠️  Migration 3 already resolved"
    npx prisma migrate resolve --applied 20260424000000_add_post_blocks || echo "⚠️  Migration 4 already resolved"
    echo "✅ Migrations baselined successfully"
  else
    echo "❌ Migration failed:"
    echo "$MIGRATION_OUTPUT"
    exit $MIGRATION_EXIT
  fi
else
  echo "✅ Migrations completed successfully"
fi

echo "🔄 Verifying dist/index.js exists..."
if [ ! -f "/app/dist/index.js" ]; then
  echo "❌ Error: dist/index.js not found. Check build step."
  ls -la /app/dist/
  exit 1
fi

echo "🔄 Starting application as unprivileged user..."
echo "📍 Listening on 0.0.0.0 - Port will be bound shortly..."
exec su-exec appuser:appgroup node dist/index.js
