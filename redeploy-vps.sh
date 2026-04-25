#!/usr/bin/env bash
set -euo pipefail

# Redeploy app to VPS path: /var/www/vibe-drama
# Usage:
#   bash redeploy-vps.sh <vps_ip> [vps_user] [ssh_port]
# Example:
#   bash redeploy-vps.sh 203.0.113.10 root 22

if [[ $# -lt 1 ]]; then
  echo "Usage: bash redeploy-vps.sh <vps_ip> [vps_user] [ssh_port]"
  exit 1
fi

VPS_IP="$1"
VPS_USER="${2:-root}"
SSH_PORT="${3:-22}"
APP_DIR="/var/www/vibe-drama"
SSH_TARGET="${VPS_USER}@${VPS_IP}"

for cmd in ssh rsync npm; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Missing required command: $cmd"
    exit 1
  fi
done

echo "[1/5] Build local project..."
npm run build

echo "[2/5] Ensure remote directory exists..."
ssh -p "$SSH_PORT" "$SSH_TARGET" "mkdir -p '$APP_DIR'"

echo "[3/5] Sync source to VPS ($SSH_TARGET:$APP_DIR)..."
rsync -az --protect-args --delete \
  -e "ssh -p $SSH_PORT" \
  --exclude ".git" \
  --exclude "node_modules" \
  --exclude ".env*" \
  --exclude "deploy.zip" \
  --exclude "*.log" \
  ./ "$SSH_TARGET:$APP_DIR/"

echo "[4/5] Install dependencies on VPS..."
ssh -p "$SSH_PORT" "$SSH_TARGET" "bash -lc '
  set -euo pipefail
  cd "$APP_DIR"

  if [[ -f package-lock.json ]]; then
    npm ci --omit=dev --no-audit --no-fund || npm install --omit=dev --no-audit --no-fund
  else
    npm install --omit=dev --no-audit --no-fund
  fi
'"

echo "[5/5] Restart app with PM2..."
ssh -p "$SSH_PORT" "$SSH_TARGET" "bash -lc '
  set -euo pipefail
  cd "$APP_DIR"

  if pm2 describe vibe-drama >/dev/null 2>&1; then
    pm2 restart vibe-drama --update-env
  elif [[ -f ecosystem.config.js ]]; then
    pm2 start ecosystem.config.js --only vibe-drama --env production || pm2 start ecosystem.config.js --env production
  else
    pm2 start server.js --name vibe-drama --env production
  fi

  pm2 save >/dev/null 2>&1 || true
  pm2 status vibe-drama || pm2 status
'"

echo "Done. Redeployed to $SSH_TARGET:$APP_DIR"
