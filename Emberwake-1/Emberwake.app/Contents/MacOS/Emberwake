#!/bin/bash
# Emberwake.app launcher: hands the game to a native macOS window (window.js).
C="$(cd "$(dirname "$0")/.." && pwd)"
exec /usr/bin/osascript -l JavaScript "$C/Resources/window.js" "$C/Resources/game/index.html" "$C/Resources/Emberwake.icns"
