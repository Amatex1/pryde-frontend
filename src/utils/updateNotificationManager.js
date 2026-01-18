/**
 * Update Notification Manager (SAFE MODE)
 *
 * 🔒 Production-safe:
 * - NO automatic reloads
 * - NO background polling loops
 * - User-initiated updates ONLY
 * - Single update notice per version
 */

const UPDATE_SHOWN_KEY = 'pwa_update_shown';
const CURRENT_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';

let hasShownUpdateNotice = false;
let onUpdateAvailableCallback = null;

/**
 * Guard: has update been shown already?
 */
function hasShownUpdateForCurrentVersion() {
  if (hasShownUpdateNotice) return true;

  try {
    const stored = sessionStorage.getItem(UPDATE_SHOWN_KEY);
    if (!stored) return false;

    const { version } = JSON.parse(stored);
    if (version === CURRENT_VERSION) {
      hasShownUpdateNotice = true;
      return true;
    }
  } catch {
    /* ignore */
  }

  return false;
}

/**
 * Mark update notice as shown
 */
function markUpdateAsShown() {
  hasShownUpdateNotice = true;
  sessionStorage.setItem(
    UPDATE_SHOWN_KEY,
    JSON.stringify({ version: CURRENT_VERSION, ts: Date.now() })
  );
}

/**
 * Reset guard manually (after full reload)
 */
export function resetUpdateNoticeGuard() {
  hasShownUpdateNotice = false;
  sessionStorage.removeItem(UPDATE_SHOWN_KEY);
}

/**
 * Register callback when update is available
 */
export function onUpdateAvailable(callback) {
  onUpdateAvailableCallback = callback;
}

/**
 * Initialize update handling (NO polling, NO reload)
 */
export function initializeUpdateNotifications(registration) {
  if (!registration) return;

  // If already waiting, notify once
  if (registration.waiting && !hasShownUpdateForCurrentVersion()) {
    markUpdateAsShown();
    onUpdateAvailableCallback?.(registration);
  }

  registration.addEventListener('updatefound', () => {
    const worker = registration.installing;
    if (!worker) return;

    worker.addEventListener('statechange', () => {
      if (
        worker.state === 'installed' &&
        navigator.serviceWorker.controller &&
        !hasShownUpdateForCurrentVersion()
      ) {
        markUpdateAsShown();
        onUpdateAvailableCallback?.(registration);
      }
    });
  });
}

/**
 * USER-INITIATED update trigger
 */
export function triggerUpdate(registration) {
  if (!registration?.waiting) return;

  // Activate new SW
  registration.waiting.postMessage({ type: 'SKIP_WAITING' });

  // ONE-TIME reload on controller change
  const onControllerChange = () => {
    navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    window.location.reload();
  };

  navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
}
