// cycle-snap: Rectangle-style cycling window snap for KWin
//
// Each press of the snap-left or snap-right shortcut advances through:
//   1/2  →  2/3  →  1/3  →  1/2  → …
//
// The current step is inferred from the window's actual geometry, so the
// cycle works correctly even after manually resizing or moving the window.

var TOLERANCE = 20; // pixels — how close geometry must be to count as a match

// Each step: fraction of screen width for x-offset and window width.
// Right-side steps mirror left: x starts at (1 - widthFrac) of screen width.
var STEPS = [
  { widthFrac: 1/2 },
  { widthFrac: 2/3 },
  { widthFrac: 1/3 },
];

function getScreenArea(window) {
  // Plasma 6: clientArea(option, output, desktop)
  // Plasma 5: clientArea(option, window)  or  clientArea(option, screen, desktop)
  try {
    var desktops = window.desktops;
    var desktop  = (desktops && desktops.length > 0) ? desktops[0] : workspace.currentDesktop;
    return workspace.clientArea(KWin.MaximizeArea, window.output, desktop);
  } catch (_) {}
  try { return workspace.clientArea(KWin.MaximizeArea, window); } catch (_) {}
  try { return workspace.clientArea(KWin.MaximizeArea, 0, 0);   } catch (_) {}
  return null;
}

function near(a, b) { return Math.abs(a - b) <= TOLERANCE; }

// Returns the index of the step the window currently occupies for the given
// direction ("left" or "right"), or -1 if none match.
function detectStep(window, direction, area) {
  var geo = window.frameGeometry || window.geometry;
  if (!geo) return -1;

  for (var i = 0; i < STEPS.length; i++) {
    var expectedWidth = Math.round(STEPS[i].widthFrac * area.width);
    var expectedX;
    if (direction === "left") {
      expectedX = area.x;
    } else {
      expectedX = area.x + area.width - expectedWidth;
    }

    if (near(geo.x, expectedX) && near(geo.width, expectedWidth)) {
      return i;
    }
  }
  return -1;
}

function applyStep(window, direction, stepIndex, area) {
  var step        = STEPS[stepIndex];
  var newWidth    = Math.round(step.widthFrac * area.width);
  var newX;
  if (direction === "left") {
    newX = area.x;
  } else {
    newX = area.x + area.width - newWidth;
  }

  var newGeo = { x: newX, y: area.y, width: newWidth, height: area.height };

  // A snapped window is not maximized. Clear KWin's maximize flag before
  // repositioning; otherwise setting geometry directly leaves the window
  // visually snapped but still flagged maximized, so a later Maximize press
  // is a no-op until the flag is cleared some other way (e.g. a mouse move).
  try { window.setMaximize(false, false); } catch (_) {}

  // Plasma 6 uses frameGeometry; Plasma 5 uses geometry.
  try { window.frameGeometry = newGeo; return; } catch (_) {}
  try { window.geometry       = newGeo; return; } catch (_) {}
}

function handleSnap(direction) {
  var window = workspace.activeWindow || workspace.activeClient;
  if (!window) return;
  // Skip special windows (desktop, panel, etc.)
  if (window.specialWindow || window.skipTaskbar) return;

  var area = getScreenArea(window);
  if (!area) return;

  var currentStep = detectStep(window, direction, area);
  // If not currently at any step, start at 0 (1/2); otherwise advance.
  var nextStep = (currentStep + 1) % STEPS.length;

  applyStep(window, direction, nextStep, area);
}

// Maximize the active window in a single press, instantly. We set the geometry
// straight to the full work area — the same mechanism as the left/right snaps —
// rather than calling setMaximize(). setMaximize() triggers KWin's maximize
// *effect* (the stretch animation) on the state transition regardless of the
// window already being at the maximized geometry, so we avoid it entirely.
// Consequence: KDE does not flag the window as formally "maximized", which is
// consistent with how the snap steps behave.
function handleMaximize() {
  var window = workspace.activeWindow || workspace.activeClient;
  if (!window) return;
  if (window.specialWindow || window.skipTaskbar) return;

  var area = getScreenArea(window);
  if (!area) return;

  // Clear any lingering maximized flag so KWin doesn't fight the geometry set.
  try { window.setMaximize(false, false); } catch (_) {}

  var newGeo = { x: area.x, y: area.y, width: area.width, height: area.height };
  try { window.frameGeometry = newGeo; return; } catch (_) {}
  try { window.geometry = newGeo; return; } catch (_) {}
}

registerShortcut(
  "CycleSnapLeft",
  "Cycle Snap Left",
  "Meta+Left",
  function() { handleSnap("left"); }
);

registerShortcut(
  "CycleSnapRight",
  "Cycle Snap Right",
  "Meta+Right",
  function() { handleSnap("right"); }
);

registerShortcut(
  "CycleSnapMaximizeWindow",
  "Cycle Snap Maximize",
  "Ctrl+Alt+Meta+Shift+F",
  handleMaximize
);
