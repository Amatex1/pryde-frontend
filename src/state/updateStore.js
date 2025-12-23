/**
 * Global Update Store
 * Manages update availability state across the app
 */

import { checkVersion, subscribeToUpdates } from '../utils/versionChecker';

let updateAvailable = false;
const subscribers = new Set();

/**
 * Subscribe to update availability changes
 * @param {Function} setter - State setter function
 * @returns {Function} Unsubscribe function
 */
export function useUpdateStore(setter) {
  subscribers.add(setter);
  // Immediately notify if update is already available
  if (updateAvailable) {
    setter(true);
  }
  return () => subscribers.delete(setter);
}

/**
 * Trigger update notification
 * Called when a new version is detected
 */
export function triggerUpdate() {
  if (!updateAvailable) {
    updateAvailable = true;
    console.log('[Update Store] Update triggered');
    subscribers.forEach(fn => fn(true));
  }
}

/**
 * Reset update state
 * Called after user refreshes
 */
export function resetUpdateState() {
  updateAvailable = false;
  subscribers.forEach(fn => fn(false));
}

/**
 * Get current update availability
 * @returns {boolean}
 */
export function isUpdateAvailable() {
  return updateAvailable;
}

// Subscribe to version checker updates
subscribeToUpdates(triggerUpdate);

// Listen for service worker update events
if (typeof window !== 'undefined') {
  window.addEventListener('pryde-update-detected', triggerUpdate);
}

