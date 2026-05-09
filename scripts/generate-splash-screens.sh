#!/usr/bin/env bash
# Generates Apple touch startup images (iOS PWA splash screens) for both panels.
# Re-run whenever the brand logo changes.
#   ./scripts/generate-splash-screens.sh
# Requires: ImageMagick 7+ (`magick` on PATH).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SPLASH_DIR_CLIENT="$ROOT/public/splash/client"
SPLASH_DIR_OWNER="$ROOT/public/splash/owner"
LOGO_CLIENT="$ROOT/public/images/logo.png"
LOGO_OWNER="$ROOT/public/images/logo-teal.png"

# Brand backgrounds (must match manifest.background_color)
BG_CLIENT="#F6475F"   # crimson
BG_OWNER="#134E4A"    # deep teal

mkdir -p "$SPLASH_DIR_CLIENT" "$SPLASH_DIR_OWNER"

# Each entry: WIDTHxHEIGHT
SIZES=(
  "640x1136"    # iPhone SE 1
  "750x1334"    # iPhone SE 2/3, 8, 7, 6
  "828x1792"    # iPhone 11, XR
  "1125x2436"   # iPhone 11 Pro, X, XS
  "1170x2532"   # iPhone 14/13/12 / 13/12 Pro
  "1179x2556"   # iPhone 15, 14 Pro
  "1242x2688"   # iPhone 11 Pro Max, XS Max
  "1284x2778"   # iPhone 14 Plus, 13/12 Pro Max
  "1290x2796"   # iPhone 15 Pro Max
  "1536x2048"   # iPad 9.7
  "1620x2160"   # iPad 10.2
  "1668x2388"   # iPad Pro 11
  "2048x2732"   # iPad Pro 12.9
)

generate() {
  local logo="$1"
  local bg="$2"
  local outdir="$3"

  for size in "${SIZES[@]}"; do
    width="${size%x*}"
    height="${size#*x}"
    # Logo at ~28% of the shorter edge keeps it visually balanced on phones + iPads
    short_edge=$(( width < height ? width : height ))
    logo_size=$(( short_edge * 28 / 100 ))

    out="$outdir/apple-splash-${width}x${height}.png"
    magick -size "${width}x${height}" "xc:${bg}" \
      \( "$logo" -resize "${logo_size}x${logo_size}" \) \
      -gravity center -composite \
      "$out"
    printf '  %s\n' "${out#$ROOT/}"
  done
}

echo "→ Client splash (${BG_CLIENT}):"
generate "$LOGO_CLIENT" "$BG_CLIENT" "$SPLASH_DIR_CLIENT"

echo "→ Owner splash (${BG_OWNER}):"
generate "$LOGO_OWNER" "$BG_OWNER" "$SPLASH_DIR_OWNER"

echo "✅ Splash screens regenerated."
