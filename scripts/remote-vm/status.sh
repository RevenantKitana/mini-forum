#!/usr/bin/env bash
# ==============================================================================
# Mini Forum - Check VM Health & Container Status
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"

print_info "Checking status on $VM_USER@$VM_IP..."

ssh -i "$KEY_FILE" $SSH_OPTS "${VM_USER}@${VM_IP}" "bash -s" << 'EOF'
echo "==================== [ SYSTEM RESOURCES ] ===================="
echo "--- UPTIME & LOAD ---"
uptime

echo ""
echo "--- MEMORY & SWAP ---"
free -h

echo ""
echo "--- DISK USAGE ---"
df -h / /var/lib/docker 2>/dev/null || df -h /

echo ""
echo "==================== [ CONTAINERS STATUS ] ===================="
cd /home/ubuntu/mini-forum 2>/dev/null || true
if command -v docker &>/dev/null; then
    docker compose ps 2>/dev/null || docker ps
    echo ""
    echo "--- RESOURCE USAGE PER CONTAINER ---"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
else
    echo "Docker is not yet installed on this machine."
fi
echo "==============================================================="
EOF
