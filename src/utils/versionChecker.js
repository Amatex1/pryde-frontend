/**
 * Version Checker Utility
 * Detects updates automatically without requiring manual refresh
 */

import { API_BASE_URL } from '../config/api';

let currentVersion = null;
let updateDetected = false;
const listeners = new Set();

/**
 * Subscribe to update notifications
 * @param {Function} fn - Callback function to call when update is detected
 * @returns {Function} Unsubscribe function
 */
export function subscribeToUpdates(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Notify all subscribers of an update
 */
function notify() {
  listeners.forEach(fn => fn());
}

/**
 * Check for new version from backend
 * @returns {Promise<void>}
 */
export async function checkVersion() {
  try {
    const res = await fetch(`${API_BASE_URL}/version`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (!res.ok) {
      console.warn('[Version Check] API request failed:', res.status);
      return;
    }

    const data = await res.json();

    // First time - store current version
    if (!currentVersion) {
      currentVersion = data.version;
      console.log('[Version Check] Initial version:', currentVersion);
      return;
    }

    // Version changed - update detected
    if (data.version !== currentVersion && !updateDetected) {
      console.log('[Version Check] Update detected!', {
        old: currentVersion,
        new: data.version
      });
      updateDetected = true;
      notify();
    }
  } catch (e) {
    // Silent fail - do not block UX
    console.warn('[Version Check] Failed:', e.message);
  }
}

/**
 * Reset update detection state
 * Used after user refreshes the page
 */
export function resetUpdateDetection() {
  updateDetected = false;
  currentVersion = null;
}

/**
 * Get current update detection state
 * @returns {boolean}
 */
export function isUpdateDetected() {
  return updateDetected;
}

