# cycle-snap

A KWin script that brings Rectangle-style cycling window snapping to KDE.

When you snap a window left or right, repeated presses cycle through three widths instead of always snapping to half the screen:

```
1/2  →  2/3  →  1/3  →  1/2  → …
```

The current step is inferred from the window's actual geometry, so the cycle stays correct even if you manually resize or move the window in between presses.

## Installation

1. Clone the repo:
   ```
   git clone https://github.com/youruser/cycle-snap.git ~/cycle-snap
   ```

2. Symlink the script into KWin's scripts directory:
   ```
   ln -s ~/cycle-snap/kwin/cycle-snap ~/.local/share/kwin/scripts/cycle-snap
   ```

3. Enable the script:
   ```
   kwriteconfig6 --file kwinrc --group Plugins --key cycle-snapEnabled true
   qdbus-qt6 org.kde.KWin /KWin reconfigure
   ```

4. Disable the built-in conflicting shortcuts. In **System Settings → Shortcuts → KWin**, find **Quick Tile Window to the Left** and **Quick Tile Window to the Right** and clear their bindings. The cycle-snap shortcuts (`Meta+Left` / `Meta+Right`) will replace them.

## Shortcuts

| Action | Default shortcut |
|---|---|
| Cycle snap left | `Meta+Left` |
| Cycle snap right | `Meta+Right` |

Shortcuts can be changed in **System Settings → Shortcuts → KWin** after the script is loaded.
