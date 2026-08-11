#!/usr/bin/env bash
# Renders every screen to PNG in light and dark at exactly 1920x1080.
set -u
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
BASE="D:/Apps/Wander/rekru/mockups"
mkdir -p "$BASE/png"

SCREENS="dashboard jobs job-detail add-candidate interviews stage-queue conduct-interview analytics interview-stages"

for s in $SCREENS; do
  "$CHROME" --headless=old --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --virtual-time-budget=3000 --window-size=1920,1080 \
    --screenshot="$BASE/png/$s.png" "file:///$BASE/$s.html?fit=off" >/dev/null 2>&1
  "$CHROME" --headless=old --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --virtual-time-budget=3000 --window-size=1920,1080 \
    --screenshot="$BASE/png/$s-dark.png" "file:///$BASE/$s.html?fit=off&theme=dark" >/dev/null 2>&1
  echo "  shot $s (light + dark)"
done
