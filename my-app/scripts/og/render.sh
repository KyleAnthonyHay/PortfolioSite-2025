#!/usr/bin/env bash
# Renders scripts/og/og-card.html to the site's link-preview images with
# headless Chrome, so the card uses the same system fonts as the site.
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
app="$here/../../src/app"
chrome="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

"$chrome" --headless=new --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=1 --window-size=1200,630 \
  --allow-file-access-from-files \
  --screenshot="$tmp/card.png" "file://$here/og-card.html" >/dev/null 2>&1

# JPEG keeps the photo card small enough for every scraper (LinkedIn, X, iMessage).
sips -s format jpeg -s formatOptions 90 "$tmp/card.png" --out "$app/opengraph-image.jpg" >/dev/null
cp "$app/opengraph-image.jpg" "$app/twitter-image.jpg"
echo "Wrote $app/opengraph-image.jpg and twitter-image.jpg"
