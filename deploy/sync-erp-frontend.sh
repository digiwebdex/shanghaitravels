#!/usr/bin/env bash
# Deploy TravelOS Vite build to production /erp/ only.
# Does NOT touch marketing document root, visa-admin, or APIs.
set -euo pipefail

SRC_ROOT="${SRC_ROOT:-/var/www/ShanghaiTravels-src}"
WEB_DIR="${WEB_DIR:-$SRC_ROOT/apps/web}"
DEST="${DEST:-/var/www/ShanghaiTravels/erp}"

if [[ ! -f "$WEB_DIR/dist/index.html" ]]; then
  echo "Missing $WEB_DIR/dist/index.html — run: (cd \"$WEB_DIR\" && npm run build)" >&2
  exit 1
fi

# Guard: refuse if dist was built without /erp/ base
if ! grep -q '/erp/assets/' "$WEB_DIR/dist/index.html"; then
  echo "dist/index.html does not reference /erp/assets/ — check vite base: '/erp/'" >&2
  exit 1
fi

mkdir -p "$DEST"
rsync -a --delete "$WEB_DIR/dist/" "$DEST/"

echo "Synced $(find "$DEST/assets" -type f | wc -l) assets → $DEST"
echo "Shell: $DEST/index.html"
head -n 12 "$DEST/index.html"
