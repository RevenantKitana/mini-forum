#!/usr/bin/env bash
# ==============================================================================
# Mini Forum - Remote VM Configuration
# ==============================================================================

# Determine base paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Optional local override file (ignored by git if needed)
if [ -f "$SCRIPT_DIR/.vm_config" ]; then
  source "$SCRIPT_DIR/.vm_config"
fi

# VM Connection Info (can be overridden via environment variables or .vm_config)
VM_IP="${VM_IP:-134.185.83.12}"
VM_USER="${VM_USER:-ubuntu}"
KEY_FILE="${KEY_FILE:-$REPO_ROOT/134.185.83.12.key}"
REMOTE_APP_DIR="${REMOTE_APP_DIR:-/home/ubuntu/mini-forum}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"

# Standard SSH & SCP command wrappers
SSH_OPTS="-o StrictHostKeyChecking=accept-new -o ConnectTimeout=10"
SSH_EXEC="ssh -i \"$KEY_FILE\" $SSH_OPTS ${VM_USER}@${VM_IP}"
SCP_EXEC="scp -i \"$KEY_FILE\" $SSH_OPTS"

# Helper print functions
print_info() {
  printf "\033[1;34m[INFO]\033[0m %s\n" "$1"
}

print_success() {
  printf "\033[1;32m[SUCCESS]\033[0m %s\n" "$1"
}

print_warn() {
  printf "\033[1;33m[WARN]\033[0m %s\n" "$1"
}

print_error() {
  printf "\033[1;31m[ERROR]\033[0m %s\n" "$1"
}
