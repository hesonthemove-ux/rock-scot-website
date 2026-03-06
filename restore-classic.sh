#!/usr/bin/env bash
set -euo pipefail
cd /home/rockscot/rock-scot-website || exit 1
BACKUP_DIR="${1:-$(cat .last-refresh-backup 2>/dev/null || true)}"
[ -z "${BACKUP_DIR:-}" ] && { echo "No backup path found"; exit 1; }
cp -a "$BACKUP_DIR/index.html" index.html
cp -a "$BACKUP_DIR/wire.html" wire.html 2>/dev/null || true
rm -rf css js
cp -a "$BACKUP_DIR/css" css
cp -a "$BACKUP_DIR/js" js
echo "Restored from $BACKUP_DIR"
