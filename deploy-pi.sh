#!/bin/bash
# ============================================================
# ROCK.SCOT — Deploy to Raspberry Pi ONLY (no git)
# Usage: ./deploy-pi.sh
# ============================================================

set -e

ORANGE='\033[0;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

PI_USER="ubuntu"
PI_HOST="82.7.194.110"
PI_PATH="/var/www/html"

echo -e "${ORANGE}========================================${NC}"
echo -e "${ORANGE}  ROCK.SCOT — PI DEPLOYMENT${NC}"
echo -e "${ORANGE}========================================${NC}"
echo ""

echo -e "${GREEN}Syncing files to Pi ($PI_HOST)...${NC}"

rsync -avz --delete \
    --exclude '.git' \
    --exclude '.gitignore' \
    --exclude 'node_modules' \
    --exclude '*.md' \
    --exclude 'deploy.sh' \
    --exclude 'deploy-pi.sh' \
    --exclude 'supabase/migrations' \
    --exclude 'supabase/functions' \
    --exclude 'ROCKSCOT-MASTER-SETUP.sql' \
    --exclude 'SQL-VALIDATION-REPORT.md' \
    ./ "$PI_USER@$PI_HOST:$PI_PATH/"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  PI DEPLOYMENT COMPLETE${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "  Live:    http://$PI_HOST"
echo -e "  Wire:    http://$PI_HOST/wire.htm"
echo ""
