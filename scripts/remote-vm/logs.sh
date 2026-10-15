#!/usr/bin/env bash
# ==============================================================================
# Mini Forum - Tail Container Logs on Remote VM
# Usage:
#   ./logs.sh [service_name] [-f]
# Examples:
#   ./logs.sh backend -f
#   ./logs.sh vibe-content
#   ./logs.sh postgres
#   ./logs.sh tunnel
# ==============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"

SERVICE="${1:-}"
EXTRA_ARGS="${@:2}"

if [ -n "$SERVICE" ] && [[ "$SERVICE" != -* ]]; then
  print_info "Fetching logs for service '$SERVICE' on $VM_IP..."
  ssh -t -i "$KEY_FILE" $SSH_OPTS "${VM_USER}@${VM_IP}" "cd $REMOTE_APP_DIR && docker compose logs $EXTRA_ARGS $SERVICE"
else
  print_info "Fetching logs for all services on $VM_IP..."
  ssh -t -i "$KEY_FILE" $SSH_OPTS "${VM_USER}@${VM_IP}" "cd $REMOTE_APP_DIR && docker compose logs $@"
fi
