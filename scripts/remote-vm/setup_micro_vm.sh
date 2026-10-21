#!/usr/bin/env bash
# ==============================================================================
# Mini Forum - Provisioning for Low-Resource VM (VM.Standard.E2.1.Micro)
# Specs: AMD EPYC 7551 (1/8 OCPU / 1 vCPU), 1.0 GB RAM
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"

print_info "================================================================="
print_info "Starting Micro VM Setup (1GB RAM Tuning) on: $VM_USER@$VM_IP"
print_info "================================================================="

ssh -i "$KEY_FILE" $SSH_OPTS "${VM_USER}@${VM_IP}" "bash -s" << 'EOF'
set -e

echo "[1/6] Checking and configuring 4GB Swap for 1GB RAM safety net..."
if [ ! -f /swapfile ] || [ $(stat -c %s /swapfile 2>/dev/null || echo 0) -lt 3000000000 ]; then
    echo "Creating 4GB swapfile..."
    sudo swapoff /swapfile 2>/dev/null || true
    sudo rm -f /swapfile 2>/dev/null || true
    sudo fallocate -l 4G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=4096
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    if ! grep -q '/swapfile' /etc/fstab; then
        echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    fi
    echo "Swap 4GB created and activated successfully."
else
    echo "Adequate swapfile already exists."
fi

echo "[2/6] Applying Linux Kernel low-memory sysctl optimizations..."
cat << 'SYSCTL_EOF' | sudo tee /etc/sysctl.d/99-micro-vm.conf > /dev/null
# Tuning for 1GB RAM instance
# Allow balanced swapping of idle pages to free RAM for Node/Postgres
vm.swappiness = 60
# Keep filesystem dentry/inode cache in memory longer
vm.vfs_cache_pressure = 50
# Write dirty pages to disk frequently in small chunks to avoid IO stall
vm.dirty_background_ratio = 5
vm.dirty_ratio = 10
# Allow memory overcommit to prevent premature V8 allocation failures
vm.overcommit_memory = 1
SYSCTL_EOF
sudo sysctl -p /etc/sysctl.d/99-micro-vm.conf

echo "[3/6] Restricting systemd-journald disk and memory usage..."
sudo mkdir -p /etc/systemd/journald.conf.d
cat << 'JOURNAL_EOF' | sudo tee /etc/systemd/journald.conf.d/00-journal-limit.conf > /dev/null
[Journal]
SystemMaxUse=100M
RuntimeMaxUse=50M
JOURNAL_EOF
sudo systemctl restart systemd-journald 2>/dev/null || true

echo "[4/6] Updating system packages and installing prerequisites..."
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg lsb-release tar gzip htop

echo "[5/6] Setting up Docker official repository (Auto-detect amd64/arm64)..."
ARCH=$(dpkg --print-architecture)
echo "Detected architecture: $ARCH (AMD EPYC is amd64/x86_64)"

if ! command -v docker &> /dev/null; then
    sudo install -m 0755 -d /etc/apt/keyrings
    if [ ! -f /etc/apt/keyrings/docker.gpg ]; then
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        sudo chmod a+r /etc/apt/keyrings/docker.gpg
    fi
    echo "deb [arch=${ARCH} signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker $USER
    echo "Docker & Docker Compose installed."
else
    echo "Docker already installed, skipping."
fi

# Configure Docker daemon optimizations for low-resource VM
echo "Configuring /etc/docker/daemon.json for low resource limits..."
sudo mkdir -p /etc/docker
cat << 'DOCKER_EOF' | sudo tee /etc/docker/daemon.json > /dev/null
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "5m",
    "max-file": "2"
  },
  "max-concurrent-downloads": 2,
  "max-concurrent-uploads": 2
}
DOCKER_EOF
sudo systemctl daemon-reload
sudo systemctl restart docker 2>/dev/null || true

echo "[6/6] Preparing application directory structure..."
mkdir -p /home/ubuntu/mini-forum/backups
mkdir -p /home/ubuntu/mini-forum/logs

echo ""
echo "==================== [ SYSTEM MEMORY SUMMARY ] ===================="
free -h
echo "==================================================================="
echo "Micro VM Provisioning Completed Successfully!"
EOF

print_success "VM.Standard.E2.1.Micro setup complete!"
