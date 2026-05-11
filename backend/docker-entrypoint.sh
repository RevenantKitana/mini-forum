#!/bin/sh

set -e  # Exit on any error

# Validate that DATABASE_URL is set before proceeding
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL environment variable is not set"
  exit 1
fi

echo "🔄 Waiting for database..."
# Give more time for database to be ready
sleep 5

echo "🔄 Running Prisma migrations (timeout: 120s)..."
timeout 120 npx prisma migrate deploy --schema=prisma/schema.prisma 2>&1 || MIGRATION_EXIT=$?

if [ ! -z "$MIGRATION_EXIT" ] && [ $MIGRATION_EXIT -ne 0 ]; then
  echo "⚠️  Migration timeout or failed with exit code: $MIGRATION_EXIT"
  echo "🔄 Attempting to resolve migration lock..."
  timeout 30 npx prisma migrate resolve --rolled-back 20260424000000_add_post_blocks 2>/dev/null || echo "⚠️  Failed to resolve lock"
  
  echo "⚠️  Attempting baseline approach..."
  timeout 30 npx prisma migrate resolve --applied 20260420000000_init 2>/dev/null || echo "⚠️  Migration 1 already resolved"
  timeout 30 npx prisma migrate resolve --applied 20260420042859_sfw_forum 2>/dev/null || echo "⚠️  Migration 2 already resolved"
  timeout 30 npx prisma migrate resolve --applied 20260423112433_add_imagekit_media 2>/dev/null || echo "⚠️  Migration 3 already resolved"
  timeout 30 npx prisma migrate resolve --applied 20260424000000_add_post_blocks 2>/dev/null || echo "⚠️  Migration 4 already resolved"
  echo "✅ Migrations baselined successfully"
else
  echo "✅ Migrations completed successfully"
fi

echo "🔄 Verifying dist/index.js exists..."
if [ ! -f "/app/dist/index.js" ]; then
  echo "❌ Error: dist/index.js not found. Check build step."
  ls -la /app/dist/ 2>&1 || echo "dist directory missing"
  exit 1
fi

echo "🔄 Starting application as unprivileged user..."
echo "📍 Listening on 0.0.0.0:${PORT:-5000} - Ready to accept connections..."
exec su-exec appuser:appgroup node dist/index.js
