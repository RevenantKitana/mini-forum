#!/usr/bin/env bash
# ==============================================================================
# Mini Forum - Quick SSH into VM
# ==============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"

if [ $# -eq 0 ]; then
  print_info "Connecting to $VM_USER@$VM_IP..."
  ssh -i "$KEY_FILE" $SSH_OPTS "${VM_USER}@${VM_IP}"
else
  ssh -i "$KEY_FILE" $SSH_OPTS "${VM_USER}@${VM_IP}" "$@"
fi
