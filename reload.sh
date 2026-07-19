#!/bin/bash
# Reload a KWin script so that registerShortcut callbacks are properly reconnected.
# Usage: ./reload.sh <script-id>
#
# Strategy: unload via DBus, then toggle the plugin off/on via kwriteconfig so
# KWin re-loads it through the full package system (required for shortcuts to work).
# KWin caches compiled scripts under ~/.cache/kwin/qmlcache; without clearing it
# a reload silently keeps running the previously compiled version, so we wipe it
# before re-enabling. (Clearing just forces a harmless recompile of cached QML.)

set -e

SCRIPT_ID="${1:?Usage: $0 <script-id>}"
KEY="${SCRIPT_ID}Enabled"

echo "Unloading $SCRIPT_ID..."
qdbus-qt6 org.kde.KWin /Scripting org.kde.kwin.Scripting.unloadScript "$SCRIPT_ID"

echo "Disabling plugin in kwinrc..."
kwriteconfig6 --file kwinrc --group Plugins --key "$KEY" false
qdbus-qt6 org.kde.KWin /KWin reconfigure

echo "Clearing KWin script compile cache..."
rm -rf "${HOME:?HOME not set}/.cache/kwin/qmlcache"

sleep 0.5

echo "Re-enabling plugin..."
kwriteconfig6 --file kwinrc --group Plugins --key "$KEY" true
qdbus-qt6 org.kde.KWin /KWin reconfigure

echo "Done."
