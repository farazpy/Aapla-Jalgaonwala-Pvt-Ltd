#!/usr/bin/env bash
set -e

# Target directory is the root directory containing this script
ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$ROOT_DIR"

echo "=========================================================="
echo " Starting Aapla Jalgaonwala auto-deploy at $(date)"
echo " Root directory: $ROOT_DIR"
echo "=========================================================="

# Fix safe directory issue if ownership warning occurs
git config --global --add safe.directory "$ROOT_DIR" 2>/dev/null || true

# Stash local changes and pull latest main
echo "--> Pulling latest code from origin main..."
git stash || true
git fetch origin main
git reset --hard origin/main

# Avoid permission errors (EACCES) between root and web user
export npm_config_cache="/tmp/.npm-cache-$(id -u)"
mkdir -p "$npm_config_cache" 2>/dev/null || true

# Install dependencies
echo "--> Installing dependencies..."
npm install --cache "$npm_config_cache"

# Build client and server
echo "--> Running build..."
npm run build

# Restart PM2 process
echo "--> Restarting application via PM2..."
if command -v pm2 &> /dev/null; then
    pm2 restart all || true
    echo "--> PM2 restarted successfully."
else
    echo "--> PM2 not detected in current PATH, skipping PM2 restart."
fi

echo "=========================================================="
echo " Auto-deploy completed successfully at $(date)"
echo "=========================================================="
