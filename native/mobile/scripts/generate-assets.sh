#!/usr/bin/env bash
# Rebuilds the Android launcher icons and the splash logo from the website's own
# icon (apps/web/public/icons/icon-512.png), so the phone app and the site never
# drift apart. Needs ImageMagick ("convert"). Run it from anywhere:
#
#   native/mobile/scripts/generate-assets.sh
#
# The generated files are committed; you only run this when the icon changes.
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
repo="$(cd "$here/../../.." && pwd)"
source_icon="$repo/apps/web/public/icons/icon-512.png"
res="$here/../android/app/src/main/res"
background="#fbfaf7" # the site's own background, so the icon edge never shows
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

command -v convert >/dev/null || { echo "ImageMagick (convert) is required" >&2; exit 1; }

# The logo with its transparent margin cut off.
convert "$source_icon" -trim +repage "$work/logo.png"

# Each launcher density: name, dp-to-pixel multiplier x10 (so 1.5 is 15).
densities="mdpi:10 hdpi:15 xhdpi:20 xxhdpi:30 xxxhdpi:40"

for entry in $densities; do
  name="${entry%%:*}"
  scale="${entry##*:}"
  dir="$res/mipmap-$name"
  mkdir -p "$dir"

  # Adaptive icon foreground: a 108dp canvas. Launchers show only the middle
  # 66dp circle, so the logo is kept to 58dp wide, inside it.
  canvas=$((108 * scale / 10))
  width=$((58 * scale / 10))
  convert -size "${canvas}x${canvas}" xc:none \
    \( "$work/logo.png" -resize "${width}x" \) -gravity center -composite \
    -depth 8 "$dir/ic_launcher_foreground.png"

  # Older phones (Android 7.0 and 7.1) use plain icons: 48dp.
  box=$((48 * scale / 10))
  radius=$((box * 18 / 100))
  last=$((box - 1))
  logo=$((box * 82 / 100))
  convert -size "${box}x${box}" xc:none -fill "$background" \
    -draw "roundrectangle 0,0,$last,$last,$radius,$radius" \
    \( "$work/logo.png" -resize "${logo}x" \) -gravity center -composite \
    -depth 8 "$dir/ic_launcher.png"

  logo=$((box * 70 / 100))
  half=$((box / 2))
  convert -size "${box}x${box}" xc:none -fill "$background" \
    -draw "circle $half,$half $half,0" \
    \( "$work/logo.png" -resize "${logo}x" \) -gravity center -composite \
    -depth 8 "$dir/ic_launcher_round.png"
done

# The splash logo is one density-independent picture, drawn at its own size and
# centred on the background colour (see drawable/splash.xml), so it is never
# stretched on a tall or wide phone.
mkdir -p "$res/drawable-nodpi"
convert "$work/logo.png" -resize 420x -depth 8 "$res/drawable-nodpi/splash_logo.png"

echo "Launcher icons and splash logo rebuilt from $source_icon"
