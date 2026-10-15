#!/usr/bin/env bash
# ==============================================================================
# Mini Forum - Install & Configure Cloudflare Tunnel Service on VM
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"

TOKEN="${1:-eyJhIjoiNTM0NWNmMGY3NWIwZmM3YmZjOWE5MzU3MTAyYWIwNzEiLCJ0IjoiZmM2NjlkMTYtZmYzMy00MDBmLWFmNGMtNzkzMTgyYzIwMjU0IiwicyI6Ik4yUTNOVEU0TURNdE5qUXhPQzAwTVRkbUxXRTRZMll0TmpBd1lXWTNPRGt6TUdJNCJ9}"

print_info "=================================================="
print_info "Installing Cloudflare Tunnel on $VM_USER@$VM_IP"
print_info "=================================================="

ssh -i "$KEY_FILE" $SSH_OPTS "${VM_USER}@${VM_IP}" "bash -s" << EOF
set -e

echo "[1/4] Adding Cloudflare GPG key and APT repository..."
sudo -n mkdir -p --mode=0755 /usr/share/keyrings
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo -n tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main' | sudo -n tee /etc/apt/sources.list.d/cloudflared.list

echo "[2/4] Updating package index and installing cloudflared..."
sudo -n apt-get update -y
sudo -n apt-get install -y cloudflared

echo "[3/4] Checking cloudflared version..."
cloudflared --version

echo "[4/4] Installing and starting cloudflared systemd service..."
sudo -n systemctl stop cloudflared 2>/dev/null || true
sudo -n cloudflared service uninstall 2>/dev/null || true
sudo -n cloudflared service install "$TOKEN"

sudo -n systemctl daemon-reload
sudo -n systemctl enable cloudflared
sudo -n systemctl restart cloudflared

# Save token to .env for reference
if [ -f /home/ubuntu/mini-forum/.env ]; then
    if grep -q '^TUNNEL_TOKEN=' /home/ubuntu/mini-forum/.env; then
        sed -i "s|^TUNNEL_TOKEN=.*|TUNNEL_TOKEN=$TOKEN|" /home/ubuntu/mini-forum/.env
    else
        echo "TUNNEL_TOKEN=$TOKEN" >> /home/ubuntu/mini-forum/.env
    fi
fi

sleep 4
echo "[*] Checking cloudflared service status:"
sudo -n systemctl status cloudflared --no-pager
EOF

print_success "Cloudflare Tunnel service is active and running!"
