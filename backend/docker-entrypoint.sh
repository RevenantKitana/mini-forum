#!/bin/sh

echo "🔄 Waiting for database..."
sleep 3

echo "🔄 Running Prisma migrations..."
MIGRATION_OUTPUT=$(npx prisma migrate deploy --schema=prisma/schema.prisma 2>&1)
MIGRATION_EXIT=$?

if [ $MIGRATION_EXIT -ne 0 ]; then
  if echo "$MIGRATION_OUTPUT" | grep -q "P3005"; then
    echo "⚠️  Database schema already exists. Baseling migrations..."
    npx prisma migrate resolve --applied 20260210050735_init
    npx prisma migrate resolve --applied 20260304043512_
    npx prisma migrate resolve --applied 20260326052535_add_bot_role
    npx prisma migrate resolve --applied 20260326095131_add_user_content_context
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
