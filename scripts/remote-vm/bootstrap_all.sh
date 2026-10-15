#!/usr/bin/env bash
# ==============================================================================
# Mini Forum - Master Zero-to-Production Bootstrap Script
# Runs the entire pipeline from fresh VM to fully operational production.
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"

print_info "================================================================="
print_info "   MINI FORUM: ZERO TO PRODUCTION MASTER DEPLOYMENT"
print_info "   Target VM: $VM_USER@$VM_IP"
print_info "================================================================="

# Step 1: Provision System (Swap, Docker, Dirs)
print_info ">>> STEP 1/4: Provisioning VM Environment..."
bash "$SCRIPT_DIR/setup_vm.sh"

# Step 2: Deploy & Build Containers
print_info ">>> STEP 2/4: Deploying Source Code & Building Containers..."
bash "$SCRIPT_DIR/deploy.sh"

# Step 3: Restore Database if dump exists
print_info ">>> STEP 3/4: Database Initialization..."
if ls "$REPO_ROOT/backend/backups"/*.dump 1> /dev/null 2>&1; then
  print_info "Found existing backup dump, restoring to PostgreSQL..."
  bash "$SCRIPT_DIR/restore_db.sh"
else
  print_info "No .dump file found in backend/backups. Prisma migrations already created initial schema."
fi

# Step 4: Setup Cloudflare Tunnel if token is provided
print_info ">>> STEP 4/4: Cloudflare Tunnel Verification..."
TUNNEL_TOKEN="${TUNNEL_TOKEN:-}"
if [ -n "$TUNNEL_TOKEN" ]; then
  print_info "Configuring Cloudflare Tunnel with provided token..."
  bash "$SCRIPT_DIR/install_tunnel.sh" "$TUNNEL_TOKEN"
else
  print_info "Cloudflare Tunnel service already installed or run ./install_tunnel.sh <TOKEN> later."
fi

# Final Health Check
print_info "================================================================="
print_success "ALL SYSTEMS OPERATIONAL! Final VM Status:"
print_info "================================================================="
bash "$SCRIPT_DIR/status.sh"
