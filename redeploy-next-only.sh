#!/usr/bin/env bash
set -euo pipefail

# Deploy only .next to VPS and restart PM2
# Usage:
#   bash redeploy-next-only.sh <vps_ip> [vps_user] [ssh_port] [ssh_password]
# Or set SSH_PASS env:
#   SSH_PASS='your_password' bash redeploy-next-only.sh <vps_ip> [vps_user] [ssh_port]
# Example:
#   bash redeploy-next-only.sh 203.0.113.10 root 22 my_password

if [[ $# -lt 1 ]]; then
  echo "Usage: bash redeploy-next-only.sh <vps_ip> [vps_user] [ssh_port] [ssh_password]"
  exit 1
fi

VPS_IP="$1"
VPS_USER="${2:-root}"
SSH_PORT="${3:-22}"
SSH_PASS="${4:-${SSH_PASS:-}}"
APP_DIR="/var/www/vibe-drama"
SSH_TARGET="${VPS_USER}@${VPS_IP}"

for cmd in ssh rsync npm; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Missing required command: $cmd"
    exit 1
  fi
done

SSH_CMD=(ssh -p "$SSH_PORT")
RSYNC_RSH="ssh -p $SSH_PORT"

if [[ -n "$SSH_PASS" ]]; then
  if ! command -v sshpass >/dev/null 2>&1; then
    echo "Missing required command for password auth: sshpass"
    echo "Install it (macOS): brew install hudochenkov/sshpass/sshpass"
    exit 1
  fi
  SSH_CMD=(sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" -o StrictHostKeyChecking=accept-new)
  RSYNC_RSH="sshpass -p '$SSH_PASS' ssh -p $SSH_PORT -o StrictHostKeyChecking=accept-new"
fi

echo "[1/4] Build local project..."
npm run build

LOCAL_BUILD_ID="$(cat .next/BUILD_ID 2>/dev/null || echo unknown)"
echo "Local BUILD_ID: $LOCAL_BUILD_ID"

echo "[2/4] Ensure remote .next path exists..."
"${SSH_CMD[@]}" "$SSH_TARGET" "mkdir -p '$APP_DIR/.next'"

echo "[3/4] Sync .next to VPS ($SSH_TARGET:$APP_DIR/.next)..."
rsync -az --delete \
  -e "$RSYNC_RSH" \
  --exclude "cache" \
  .next/ "$SSH_TARGET:$APP_DIR/.next/"

echo "[4/4] Restart PM2 app from $APP_DIR..."
"${SSH_CMD[@]}" "$SSH_TARGET" "bash -lc '
  set -euo pipefail
  cd "$APP_DIR"

  REMOTE_BUILD_ID=\"\$(cat .next/BUILD_ID 2>/dev/null || echo unknown)\"
  echo \"Remote BUILD_ID: \$REMOTE_BUILD_ID\"

  # Important: PM2 may point to an old script/cwd. Recreate process with explicit cwd.
  if pm2 describe vibe-drama >/dev/null 2>&1; then
    pm2 delete vibe-drama
  fi
  pm2 start server.js --name vibe-drama --cwd "$APP_DIR" --env production

  pm2 save >/dev/null 2>&1 || true
  pm2 status vibe-drama || pm2 status
'"

echo "Done. Synced .next only to $SSH_TARGET:$APP_DIR"
