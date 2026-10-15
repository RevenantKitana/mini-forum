#!/usr/bin/env bash
# ==============================================================================
# Mini Forum - One-Click Remote VM Provisioning
# Sets up Swap, Docker Engine, Docker Compose, and directory structures.
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"

print_info "=================================================="
print_info "Starting Initial Setup on OCI VM: $VM_IP"
print_info "=================================================="

ssh -i "$KEY_FILE" $SSH_OPTS "${VM_USER}@${VM_IP}" "bash -s" << 'EOF'
set -e

echo "[1/5] Checking and creating 2GB Swap file..."
if [ ! -f /swapfile ]; then
    sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    if ! grep -q '/swapfile' /etc/fstab; then
        echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    fi
    echo "vm.swappiness=10" | sudo tee -a /etc/sysctl.d/99-swap.conf
    sudo sysctl -p /etc/sysctl.d/99-swap.conf
    echo "Swap 2GB successfully created."
else
    echo "Swapfile already exists, skipping creation."
fi

echo "[2/5] Updating system packages and installing prerequisites..."
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg lsb-release tar gzip

echo "[3/5] Setting up Docker official repository (ARM64)..."
if ! command -v docker &> /dev/null; then
    sudo install -m 0755 -d /etc/apt/keyrings
    if [ ! -f /etc/apt/keyrings/docker.gpg ]; then
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        sudo chmod a+r /etc/apt/keyrings/docker.gpg
    fi
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker $USER
    echo "Docker & Docker Compose installed successfully."
else
    echo "Docker already installed, skipping."
fi

echo "[4/5] Preparing application directory structure..."
mkdir -p /home/ubuntu/mini-forum/backups
mkdir -p /home/ubuntu/mini-forum/logs

echo "[5/5] Checking Docker service and permissions..."
docker --version || sudo docker --version
docker compose version || sudo docker compose version

echo "=================================================="
echo "VM Provisioning Completed Successfully!"
echo "=================================================="
EOF

print_success "VM setup is complete!"
