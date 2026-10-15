#!/usr/bin/env bash
# ==============================================================================
# Mini Forum - Restore Database to Remote PostgreSQL Container
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"

BACKUP_DIR="$REPO_ROOT/backend/backups"

# Allow passing a specific dump file as argument, otherwise pick the newest .dump
if [ -n "$1" ]; then
  DUMP_FILE="$1"
else
  DUMP_FILE=$(ls -t "$BACKUP_DIR"/*.dump 2>/dev/null | head -n 1)
fi

if [ -z "$DUMP_FILE" ] || [ ! -f "$DUMP_FILE" ]; then
  print_error "No dump file found in $BACKUP_DIR! Please specify one or run 'npm run db:backup' first."
  exit 1
fi

DUMP_BASENAME=$(basename "$DUMP_FILE")

print_info "Selected dump file: $DUMP_BASENAME"
print_info "Uploading $DUMP_BASENAME to VM ($VM_IP)..."

scp -i "$KEY_FILE" $SSH_OPTS "$DUMP_FILE" "${VM_USER}@${VM_IP}:${REMOTE_APP_DIR}/backups/${DUMP_BASENAME}"

print_info "Restoring into 'mini-forum-db' container on VM..."
ssh -i "$KEY_FILE" $SSH_OPTS "${VM_USER}@${VM_IP}" "bash -s" << EOF
set -e
cd $REMOTE_APP_DIR

if [ ! -f .env ]; then
    echo "Error: .env not found in $REMOTE_APP_DIR"
    exit 1
fi

# Read DB credentials from .env
DB_USER=\$(grep '^POSTGRES_USER=' .env | cut -d '=' -f2- | tr -d '\r\n')
DB_NAME=\$(grep '^POSTGRES_DB=' .env | cut -d '=' -f2- | tr -d '\r\n')

DB_USER=\${DB_USER:-forum_user}
DB_NAME=\${DB_NAME:-mini_forum}

echo "[*] Copying dump into database container..."
docker cp "backups/${DUMP_BASENAME}" mini-forum-db:/tmp/restore.dump

echo "[*] Executing pg_restore (clean, if-exists, no-owner)..."
docker exec -i mini-forum-db pg_restore \
    -U "\$DB_USER" \
    -d "\$DB_NAME" \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    /tmp/restore.dump || true

echo "[*] Cleaning up temporary dump in container..."
docker exec -i mini-forum-db rm -f /tmp/restore.dump

echo "[*] Restarting backend & vibe-content to reconnect fresh schema..."
docker compose restart backend vibe-content

echo "Database restoration completed successfully!"
EOF

print_success "Database restore finished!"
