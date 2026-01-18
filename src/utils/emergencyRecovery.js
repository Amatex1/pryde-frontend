/**
 * Emergency Recovery Utilities (SAFE MODE)
 *
 * 🔒 Production-safe version:
 * - NO automatic reloads
 * - NO background execution
 * - Manual recovery ONLY
 *
 * This file exists to allow *explicit user-triggered recovery*
 * without risking infinite reload loops.
 */

import logger from './logger';

/**
 * MANUAL recovery ONLY
 * Must be triggered by a user action (button / admin tool)
 */
export async function disablePWAAndReload(message = 'Manually resetting app...') {
  logger.warn('[Emergency Recovery] Manual recovery triggered');
  logger.warn(`Reason: ${message}`);

  try {
    await unregisterAllServiceWorkers();
    await clearAllCaches();

    // IMPORTANT: do NOT clear sessionStorage (prevents loops)
    localStorage.clear();

    alert(message + '\n\nThe app will now reload once.');

    window.location.reload();
  } catch (error) {
    logger.error('[Emergency Recovery] Manual recovery failed:', error);
    alert('Recovery failed. Please reload the page manually.');
  }
}

/**
 * Manual cache clear (NO reload)
 */
export async function clearCachesManually() {
  try {
    await clearAllCaches();
    alert('Caches cleared. You may now refresh the page.');
  } catch (error) {
    logger.error('[Emergency Recovery] Cache clear failed:', error);
  }
}

/**
 * Service worker cleanup (safe)
 */
export async function unregisterAllServiceWorkers() {
  if (!('serviceWorker' in navigator)) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  for (const registration of registrations) {
    await registration.unregister();
    logger.info(`[Emergency Recovery] Unregistered SW: ${registration.scope}`);
  }
}

/**
 * Cache cleanup (safe)
 */
export async function clearAllCaches() {
  if (!('caches' in window)) return;

  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  logger.info('[Emergency Recovery] All caches cleared');
}

/**
 * 🚫 DISABLED
 * Automatic emergency detection is NOT SAFE in production
 */
export function isEmergencyRecoveryNeeded() {
  return false;
}