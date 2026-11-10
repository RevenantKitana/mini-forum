#!/usr/bin/env bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"

ACTION="${1:-post}"

print_info "Triggering action '$ACTION' on VM ($VM_IP)..."

ssh -i "$KEY_FILE" $SSH_OPTS "${VM_USER}@${VM_IP}" "bash -s" << EOF
echo "=== Step 1: Triggering /trigger/$ACTION ==="
RESP=\$(curl -s -X POST http://127.0.0.1:4000/trigger/$ACTION)
echo "Response: \$RESP"

JOB_ID=\$(echo "\$RESP" | grep -o '"jobId":"[^"]*' | cut -d'"' -f4)
if [ -n "\$JOB_ID" ]; then
  echo "Job ID: \$JOB_ID. Polling progress..."
  for i in {1..15}; do
    sleep 3
    STATUS=\$(curl -s http://127.0.0.1:4000/trigger/status/\$JOB_ID)
    echo "Progress [\$i]: \$STATUS"
    if echo "\$STATUS" | grep -q '"completed":true'; then
      echo ">>> Job completed successfully!"
      break
    fi
    if echo "\$STATUS" | grep -q '"status":"failed"'; then
      echo ">>> Job failed!"
      break
    fi
  done
fi

echo ""
echo "=== Step 2: Recent Vibe-Content Logs ==="
docker logs --tail 25 mini-forum-vibe
EOF

