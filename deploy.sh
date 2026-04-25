#!/bin/bash
# ─────────────────────────────────────────────────
# deploy.sh — Build + Zip cho VPS
# Chạy: bash deploy.sh
# ─────────────────────────────────────────────────
set -e

echo "🔨 [1/3] Building production..."
npm run build

echo ""
echo "📦 [2/3] Creating deploy.zip..."
rm -f deploy.zip

zip -r deploy.zip \
  .next \
  node_modules \
  public \
  src \
  server.js \
  ecosystem.config.js \
  package.json \
  next.config.ts \
  tsconfig.json \
  postcss.config.mjs \
  eslint.config.mjs \
  next-env.d.ts \
  .env.production \
  -x "*.DS_Store"

SIZE=$(du -h deploy.zip | cut -f1)
echo ""
echo "✅ [3/3] Done! deploy.zip ($SIZE)"
echo ""
echo "── Upload lên VPS ──────────────────────────"
echo "scp deploy.zip root@<IP_VPS>:/home/vibe-drama/"
echo ""
echo "── Trên VPS chạy ───────────────────────────"
echo "cd /home/vibe-drama && unzip -o deploy.zip && mv .env.production .env.local && pm2 restart vibe-drama"
