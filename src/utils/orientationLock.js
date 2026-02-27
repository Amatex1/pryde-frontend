/**
 * orientationLock.js
 *
 * Attempts to lock the screen to portrait orientation when running as an
 * installed PWA (standalone display mode).
 *
 * Why standalone-only:
 *   - screen.orientation.lock() requires fullscreen or standalone context.
 *     Calling it in a regular browser tab throws a SecurityError.
 *   - iOS Safari does not implement screen.orientation.lock() at all.
 *     Portrait preference on iOS is handled by manifest.json "orientation".
 *
 * Fails silently in all unsupported contexts (browser tabs, iOS, desktop).
 */
export function initOrientationLock() {
  // Only attempt in standalone/installed PWA mode
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true; // iOS Safari installed PWA

  if (!isStandalone) return;
  if (!screen?.orientation?.lock) return;

  screen.orientation.lock('portrait-primary').catch(() => {
    // Silently ignore — unsupported browser, wrong context, or user denied
  });
}
