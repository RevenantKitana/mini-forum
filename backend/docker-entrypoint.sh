#!/bin/sh

echo "🔄 Waiting for database..."
sleep 3

echo "🔄 Running Prisma migrations..."
MIGRATION_OUTPUT=$(npx prisma migrate deploy --schema=prisma/schema.prisma 2>&1)
MIGRATION_EXIT=$?

if [ $MIGRATION_EXIT -ne 0 ]; then
  if echo "$MIGRATION_OUTPUT" | grep -q "P3005"; then
    echo "⚠️  Database schema already exists. Baseling migrations..."
    npx prisma migrate resolve --applied 20260420000000_init
    npx prisma migrate resolve --applied 20260420042859_sfw_forum
    npx prisma migrate resolve --applied 20260423112433_add_imagekit_media
    npx prisma migrate resolve --applied 20260424000000_add_post_blocks
    echo "✅ Migrations baselined successfully"
  else
    echo "❌ Migration failed:"
    echo "$MIGRATION_OUTPUT"
    exit $MIGRATION_EXIT
  fi
else
  echo "✅ Migrations completed successfully"
fi

echo "🔄 Starting application as unprivileged user..."
exec su-exec appuser:appgroup node dist/index.js
