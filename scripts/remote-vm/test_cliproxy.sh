#!/usr/bin/env bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"

ssh -i "$KEY_FILE" $SSH_OPTS "${VM_USER}@${VM_IP}" "bash -s" << 'EOF'
docker restart mini-forum-cliproxy >/dev/null
sleep 2
echo "=== Models available in CLIProxyAPI ==="
curl -s http://127.0.0.1:8317/v1/models -H "Authorization: Bearer vibe-cliproxy-secret-2026"
echo ""
echo "=== Vibe-Content Model Stack ==="
curl -s http://127.0.0.1:4000/status | jq .providerHealth.byType 2>/dev/null || curl -s http://127.0.0.1:4000/status
echo ""
EOF
