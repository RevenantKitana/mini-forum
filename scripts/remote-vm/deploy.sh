#!/usr/bin/env bash
# ==============================================================================
# Mini Forum - Sync Code & Deploy to Remote VM
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"

cd "$REPO_ROOT"

print_info "=================================================="
print_info "Preparing deployment package for $VM_IP..."
print_info "=================================================="

# Check if .env exists locally, if so, ask or sync it
if [ ! -f "$REPO_ROOT/.env" ] && [ -f "$REPO_ROOT/backend/.env" ]; then
  print_warn "No root .env found, but backend/.env exists. Please make sure remote .env is configured."
fi

# Ensure remote directory exists
print_info "Ensuring remote directory: $REMOTE_APP_DIR..."
ssh -i "$KEY_FILE" $SSH_OPTS "${VM_USER}@${VM_IP}" "mkdir -p $REMOTE_APP_DIR"

# Check if remote .env exists, if not, copy .env.production.example as template
ssh -i "$KEY_FILE" $SSH_OPTS "${VM_USER}@${VM_IP}" "bash -s" << EOF
if [ ! -f "$REMOTE_APP_DIR/.env" ]; then
    echo "[!] Remote .env not found. Creating placeholder from template..."
fi
EOF

# Transfer files using tar pipe over SSH (skipping heavy folders)
print_info "Streaming project files to VM (backend, vibe-content, docker-compose.yml)..."
tar --exclude='node_modules' \
    --exclude='dist' \
    --exclude='.git' \
    --exclude='coverage' \
    --exclude='*.dump' \
    --exclude='backups' \
    --exclude='logs' \
    --exclude='*.log' \
    -czf - \
    backend vibe-content docker-compose.yml .env.production.example | \
    ssh -i "$KEY_FILE" $SSH_OPTS "${VM_USER}@${VM_IP}" "tar -xzf - -C $REMOTE_APP_DIR"

# Sync .env if user has a root .env file
if [ -f "$REPO_ROOT/.env" ]; then
  print_info "Syncing local root .env to remote..."
  scp -i "$KEY_FILE" $SSH_OPTS "$REPO_ROOT/.env" "${VM_USER}@${VM_IP}:${REMOTE_APP_DIR}/.env"
fi

print_info "Building and launching containers on VM..."
ssh -i "$KEY_FILE" $SSH_OPTS "${VM_USER}@${VM_IP}" "bash -s" << 'EOF'
set -e
cd /home/ubuntu/mini-forum

if [ ! -f .env ]; then
    if [ -f .env.production.example ]; then
        cp .env.production.example .env
        echo "[WARN] Created .env from .env.production.example. Please update credentials in /home/ubuntu/mini-forum/.env"
    fi
fi

echo "[*] Normalizing line endings on entrypoint scripts..."
sed -i 's/\r$//' backend/docker-entrypoint.sh vibe-content/docker-entrypoint.sh 2>/dev/null || true

echo "[*] Triggering docker compose build and up..."
docker compose up --build -d

echo "[*] Waiting for services to stabilize (10s)..."
sleep 10

echo "[*] Current Container Status:"
docker compose ps
EOF

print_success "Deployment completed successfully on $VM_IP!"
