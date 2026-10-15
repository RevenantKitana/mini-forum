#!/usr/bin/env bash
# ==============================================================================
# Mini Forum - Backup Database from Remote VM to Local Machine
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"

LOCAL_BACKUP_DIR="$REPO_ROOT/backend/backups"
mkdir -p "$LOCAL_BACKUP_DIR"

TIMESTAMP=$(date -u +"%Y-%m-%dT%H-%M-%S-000Z")
DUMP_NAME="vm-postgres-${TIMESTAMP}.dump"

print_info "Triggering pg_dump on remote VM ($VM_IP)..."

ssh -i "$KEY_FILE" $SSH_OPTS "${VM_USER}@${VM_IP}" "bash -s" << EOF
set -e
cd $REMOTE_APP_DIR

DB_USER=\$(grep '^POSTGRES_USER=' .env | cut -d '=' -f2- | tr -d '\r\n')
DB_NAME=\$(grep '^POSTGRES_DB=' .env | cut -d '=' -f2- | tr -d '\r\n')

DB_USER=\${DB_USER:-forum_user}
DB_NAME=\${DB_NAME:-mini_forum}

mkdir -p backups
echo "[*] Creating dump file: backups/${DUMP_NAME}..."
docker exec -i mini-forum-db pg_dump \
    -U "\$DB_USER" \
    -d "\$DB_NAME" \
    --format=custom \
    --no-owner \
    --no-privileges > "backups/${DUMP_NAME}"

echo "[*] Remote dump generated: \$(ls -lh backups/${DUMP_NAME})"
EOF

print_info "Downloading backup to local: $LOCAL_BACKUP_DIR/${DUMP_NAME}..."
scp -i "$KEY_FILE" $SSH_OPTS "${VM_USER}@${VM_IP}:${REMOTE_APP_DIR}/backups/${DUMP_NAME}" "$LOCAL_BACKUP_DIR/${DUMP_NAME}"

print_success "Backup completed! File saved at: backend/backups/${DUMP_NAME}"
