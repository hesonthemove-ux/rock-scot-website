#!/bin/bash
# ============================================================
# ROCK.SCOT — Deploy to GitHub + Raspberry Pi
# Usage: ./deploy.sh "commit message"
#
# Run from your DEV machine (not the Pi).
# To deploy ON the Pi itself, use: ./deploy-on-pi.sh
# ============================================================

set -e

ORANGE='\033[0;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

PI_USER="rockscot"
PI_HOST="192.168.0.200"
PI_PATH="/var/www/html"
BRANCH="main"

COMMIT_MSG="${1:-Update ROCK.SCOT website}"

echo -e "${ORANGE}========================================${NC}"
echo -e "${ORANGE}  ROCK.SCOT — DEPLOYMENT${NC}"
echo -e "${ORANGE}========================================${NC}"
echo ""

# ── STEP 1: GIT ──
echo -e "${GREEN}[1/3] Committing to Git...${NC}"
git add -A
git status --short

if git diff --cached --quiet; then
    echo -e "${ORANGE}  No changes to commit.${NC}"
else
    git commit -m "$COMMIT_MSG"
    echo -e "${GREEN}  Committed.${NC}"
fi

echo -e "${GREEN}[2/3] Pushing to GitHub (branch: $BRANCH)...${NC}"
git push -u origin "$BRANCH" || {
    echo -e "${RED}  Push failed. Retrying in 4s...${NC}"
    sleep 4
    git push -u origin "$BRANCH" || {
        echo -e "${RED}  Push failed. Retrying in 8s...${NC}"
        sleep 8
        git push -u origin "$BRANCH" || {
            echo -e "${RED}  Push failed. Retrying in 16s...${NC}"
            sleep 16
            git push -u origin "$BRANCH"
        }
    }
}
echo -e "${GREEN}  Pushed to GitHub.${NC}"

# ── STEP 2: DEPLOY TO PI ──
echo -e "${GREEN}[3/3] Deploying to Raspberry Pi ($PI_HOST)...${NC}"
echo -e "${ORANGE}  Syncing files (preserving Pi-only directories)...${NC}"

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

echo -e "${GREEN}  Files synced to Pi.${NC}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  DEPLOYMENT COMPLETE${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "  GitHub:  https://github.com/hesonthemove-ux/rock-scot-website"
echo -e "  Live:    http://82.7.194.110"
echo -e "  Wire:    http://82.7.194.110/wire.htm"
echo ""
