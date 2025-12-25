/**
 * Clear Stale Service Workers & Caches
 * 
 * On next load:
 * - Unregister ALL existing service workers
 * - Delete all Workbox caches
 * - Register clean service worker with corrected rules
 * 
 * This removes zombie behavior and ensures clean state.
 */

const CACHE_CLEAR_FLAG = 'sw_cache_cleared_v2';
const WORKBOX_CACHE_PREFIXES = [
  'workbox-',
  'api-cache',
  'auth-no-cache',
  'refresh-no-cache',
  'push-no-cache',
  'user-no-cache',
  'image-cache',
  'static-image-cache',
  'font-cache',
  'static-resources'
];

/**
 * Check if caches have been cleared
 */
function haveCachesBeenCleared() {
  return localStorage.getItem(CACHE_CLEAR_FLAG) === 'true';
}

/**
 * Mark caches as cleared
 */
function markCachesAsCleared() {
  localStorage.setItem(CACHE_CLEAR_FLAG, 'true');
}

/**
 * Unregister all service workers
 */
async function unregisterAllServiceWorkers() {
  if (!('serviceWorker' in navigator)) {
    console.log('[Clear SW] Service workers not supported');
    return [];
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    console.log(`[Clear SW] Found ${registrations.length} service worker(s)`);

    const unregisterPromises = registrations.map(async (registration) => {
      console.log(`[Clear SW] Unregistering service worker: ${registration.scope}`);
      return registration.unregister();
    });

    await Promise.all(unregisterPromises);
    console.log('[Clear SW] ✅ All service workers unregistered');
    
    return registrations;
  } catch (error) {
    console.error('[Clear SW] ❌ Error unregistering service workers:', error);
    return [];
  }
}

/**
 * Delete all Workbox caches
 */
async function deleteAllWorkboxCaches() {
  if (!('caches' in window)) {
    console.log('[Clear SW] Cache API not supported');
    return [];
  }

  try {
    const cacheNames = await caches.keys();
    console.log(`[Clear SW] Found ${cacheNames.length} cache(s)`);

    // Filter for Workbox caches
    const workboxCaches = cacheNames.filter(name => 
      WORKBOX_CACHE_PREFIXES.some(prefix => name.startsWith(prefix))
    );

    console.log(`[Clear SW] Deleting ${workboxCaches.length} Workbox cache(s)`);

    const deletePromises = workboxCaches.map(async (cacheName) => {
      console.log(`[Clear SW] Deleting cache: ${cacheName}`);
      return caches.delete(cacheName);
    });

    await Promise.all(deletePromises);
    console.log('[Clear SW] ✅ All Workbox caches deleted');
    
    return workboxCaches;
  } catch (error) {
    console.error('[Clear SW] ❌ Error deleting caches:', error);
    return [];
  }
}

/**
 * Clear all stale service workers and caches
 */
export async function clearStaleSWAndCaches() {
  // Check if already cleared
  if (haveCachesBeenCleared()) {
    console.log('[Clear SW] Caches already cleared, skipping');
    return {
      alreadyCleared: true,
      serviceWorkersUnregistered: 0,
      cachesDeleted: 0
    };
  }

  console.log('[Clear SW] 🧹 Starting cleanup of stale service workers and caches...');

  // Step 1: Unregister all service workers
  const unregisteredSWs = await unregisterAllServiceWorkers();

  // Step 2: Delete all Workbox caches
  const deletedCaches = await deleteAllWorkboxCaches();

  // Step 3: Mark as cleared
  markCachesAsCleared();

  console.log('[Clear SW] ✅ Cleanup complete');
  console.log(`[Clear SW] 📊 Summary:`);
  console.log(`[Clear SW]   - Service workers unregistered: ${unregisteredSWs.length}`);
  console.log(`[Clear SW]   - Caches deleted: ${deletedCaches.length}`);

  return {
    alreadyCleared: false,
    serviceWorkersUnregistered: unregisteredSWs.length,
    cachesDeleted: deletedCaches.length,
    unregisteredSWs,
    deletedCaches
  };
}

/**
 * Force clear (ignore flag)
 */
export async function forceClearStaleSWAndCaches() {
  localStorage.removeItem(CACHE_CLEAR_FLAG);
  return clearStaleSWAndCaches();
}

/**
 * Reset clear flag (for testing)
 */
export function resetClearFlag() {
  localStorage.removeItem(CACHE_CLEAR_FLAG);
}

