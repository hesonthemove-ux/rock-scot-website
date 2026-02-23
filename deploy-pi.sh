#!/bin/bash
# ============================================================
# ROCK.SCOT — Deploy to Raspberry Pi ONLY (no git)
# Run from your DEV machine — pushes files to Pi via rsync.
# Usage: ./deploy-pi.sh
# ============================================================

set -e

ORANGE='\033[0;33m'
GREEN='\033[0;32m'
NC='\033[0m'

PI_USER="rockscot"
PI_HOST="192.168.0.200"
PI_PATH="/var/www/html"

echo -e "${ORANGE}========================================${NC}"
echo -e "${ORANGE}  ROCK.SCOT — PI DEPLOYMENT${NC}"
echo -e "${ORANGE}========================================${NC}"
echo ""

echo -e "${GREEN}Syncing files to Pi ($PI_HOST)...${NC}"

rsync -avz \
    --exclude '.git' \
    --exclude '.gitignore' \
    --exclude 'node_modules' \
    --exclude '*.md' \
    --exclude 'deploy.sh' \
    --exclude 'deploy-pi.sh' \
    --exclude 'deploy-on-pi.sh' \
    --exclude 'supabase/' \
    --exclude 'ROCKSCOT-MASTER-SETUP.sql' \
    --exclude 'SQL-VALIDATION-REPORT.md' \
    ./ "$PI_USER@$PI_HOST:$PI_PATH/"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  PI DEPLOYMENT COMPLETE${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "  Live:    http://82.7.194.110"
echo -e "  Wire:    http://82.7.194.110/wire.htm"
echo ""
