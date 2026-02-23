#!/bin/bash
# ============================================================
# ROCK.SCOT — Pull & deploy ON the Raspberry Pi
# Run this directly on the Pi: ./deploy-on-pi.sh
#
# Pulls latest from GitHub and copies web files to /var/www/html
# WITHOUT deleting Pi-only directories (backups, uploads, data, news)
# ============================================================

set -e

ORANGE='\033[0;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

REPO="https://github.com/hesonthemove-ux/rock-scot-website.git"
BRANCH="${1:-main}"
WEB_ROOT="/var/www/html"
TEMP_DIR="$HOME/rockscot-deploy"

echo -e "${ORANGE}========================================${NC}"
echo -e "${ORANGE}  ROCK.SCOT — PI SELF-DEPLOY${NC}"
echo -e "${ORANGE}  Branch: $BRANCH${NC}"
echo -e "${ORANGE}========================================${NC}"
echo ""

# ── STEP 1: Clone / pull ──
if [ -d "$TEMP_DIR/.git" ]; then
    echo -e "${GREEN}[1/3] Updating existing clone...${NC}"
    cd "$TEMP_DIR"
    git fetch origin
    git checkout "$BRANCH"
    git pull origin "$BRANCH"
else
    echo -e "${GREEN}[1/3] Cloning fresh...${NC}"
    rm -rf "$TEMP_DIR"
    git clone "$REPO" "$TEMP_DIR"
    cd "$TEMP_DIR"
    git checkout "$BRANCH"
fi

# ── STEP 2: Sync web files (NO --delete to preserve Pi-only dirs) ──
echo -e "${GREEN}[2/3] Syncing to $WEB_ROOT (preserving backups, uploads, data, news)...${NC}"

sudo rsync -av \
    --exclude '.git' \
    --exclude '.gitignore' \
    --exclude '*.md' \
    --exclude 'deploy.sh' \
    --exclude 'deploy-pi.sh' \
    --exclude 'deploy-on-pi.sh' \
    --exclude 'supabase/' \
    --exclude 'ROCKSCOT-MASTER-SETUP.sql' \
    --exclude 'SQL-VALIDATION-REPORT.md' \
    ./ "$WEB_ROOT/"

# ── STEP 3: Set permissions ──
echo -e "${GREEN}[3/3] Setting permissions...${NC}"
sudo chown -R www-data:www-data "$WEB_ROOT" 2>/dev/null || true

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  DEPLOYMENT COMPLETE${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "  Live:  http://82.7.194.110"
echo -e "  Wire:  http://82.7.194.110/wire.htm"
echo ""
