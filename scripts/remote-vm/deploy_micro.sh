#!/usr/bin/env bash
# ==============================================================================
# Mini Forum - Deploy to Micro VM (VM.Standard.E2.1.Micro)
# Sequential building + RAM-restricted containers
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"

cd "$REPO_ROOT"

print_info "================================================================="
print_info "Preparing Micro VM Deployment for: $VM_USER@$VM_IP"
print_info "Compose Profile: docker-compose.micro.yml (Tuned for 1GB RAM)"
print_info "================================================================="

# Ensure remote directory exists
print_info "Ensuring remote directory: $REMOTE_APP_DIR..."
ssh -i "$KEY_FILE" $SSH_OPTS "${VM_USER}@${VM_IP}" "mkdir -p $REMOTE_APP_DIR"

# Transfer files using tar pipe over SSH (skipping heavy folders)
print_info "Streaming project files to VM..."
tar --exclude='node_modules' \
    --exclude='dist' \
    --exclude='.git' \
    --exclude='coverage' \
    --exclude='*.dump' \
    --exclude='backups' \
    --exclude='logs' \
    --exclude='*.log' \
    -czf - \
    backend vibe-content docker-compose.micro.yml docker-compose.yml .env.production.example | \
    ssh -i "$KEY_FILE" $SSH_OPTS "${VM_USER}@${VM_IP}" "tar -xzf - -C $REMOTE_APP_DIR"

# Sync local .env if it exists
if [ -f "$REPO_ROOT/.env" ]; then
  print_info "Syncing local root .env to remote..."
  scp -i "$KEY_FILE" $SSH_OPTS "$REPO_ROOT/.env" "${VM_USER}@${VM_IP}:${REMOTE_APP_DIR}/.env"
fi

print_info "Building and launching containers sequentially on Micro VM..."
ssh -i "$KEY_FILE" $SSH_OPTS "${VM_USER}@${VM_IP}" "bash -s" << 'EOF'
set -e
cd /home/ubuntu/mini-forum

# Create .env from template if missing
if [ ! -f .env ]; then
    if [ -f .env.production.example ]; then
        cp .env.production.example .env
        echo "[WARN] Created .env from .env.production.example. Please update credentials in .env"
    fi
fi

echo "[*] Normalizing line endings on entrypoint scripts..."
sed -i 's/\r$//' backend/docker-entrypoint.sh vibe-content/docker-entrypoint.sh 2>/dev/null || true

# Check Swap before building
SWAP_TOTAL=$(free -m | awk '/Swap:/ {print $2}')
if [ "$SWAP_TOTAL" -lt 1000 ]; then
    echo "[WARN] Swap is less than 1GB ($SWAP_TOTAL MB)! Builds may run out of memory."
    echo "[TIP] Run scripts/remote-vm/setup_micro_vm.sh first to configure 4GB Swap."
fi

echo "[*] Step 1/3: Building Backend container sequentially (prevents CPU freeze)..."
docker compose -f docker-compose.micro.yml build backend

echo "[*] Step 2/3: Building Vibe-Content container sequentially..."
docker compose -f docker-compose.micro.yml build vibe-content

echo "[*] Step 3/3: Starting containers with Micro configuration..."
docker compose -f docker-compose.micro.yml up -d

echo "[*] Cleaning up dangling build images to preserve disk space..."
docker image prune -f >/dev/null 2>&1 || true

echo "[*] Waiting for services to stabilize (12s)..."
sleep 12

echo ""
echo "==================== [ CONTAINER STATUS ] ===================="
docker compose -f docker-compose.micro.yml ps

echo ""
echo "==================== [ RAM USAGE PER CONTAINER ] ===================="
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"

echo ""
echo "==================== [ SYSTEM MEMORY (RAM + SWAP) ] ===================="
free -h
EOF

print_success "Micro VM Deployment finished successfully on $VM_IP!"
