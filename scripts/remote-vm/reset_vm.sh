#!/usr/bin/env bash
# ==============================================================================
# Mini Forum - Reset / Clean Remote VM Containers
# Usage:
#   ./reset_vm.sh           (Stops containers and prunes builder cache)
#   ./reset_vm.sh --wipe-db (Stops containers and WIPES the PostgreSQL database volume)
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"

WIPE_DB=false
if [ "$1" == "--wipe-db" ] || [ "$1" == "--full" ]; then
  WIPE_DB=true
fi

if [ "$WIPE_DB" = true ]; then
  print_warn "=================================================="
  print_warn "WARNING: You selected --wipe-db!"
  print_warn "This will DELETE ALL FORUM DATA in PostgreSQL!"
  print_warn "=================================================="
  read -p "Are you sure you want to proceed? (yes/no): " CONFIRM
  if [ "$CONFIRM" != "yes" ]; then
    print_info "Aborted by user."
    exit 0
  fi
fi

print_info "Resetting containers on $VM_USER@$VM_IP..."

ssh -i "$KEY_FILE" $SSH_OPTS "${VM_USER}@${VM_IP}" "bash -s" << EOF
set -e
cd $REMOTE_APP_DIR 2>/dev/null || true

if command -v docker &>/dev/null; then
    echo "[*] Stopping and removing containers..."
    if [ "$WIPE_DB" = true ]; then
        docker compose down -v --remove-orphans || true
        echo "[*] Database volume removed."
    else
        docker compose down --remove-orphans || true
    fi

    echo "[*] Pruning unused docker resources..."
    docker system prune -f

    echo "[*] Reset completed."
fi
EOF

print_success "VM reset routine completed."
