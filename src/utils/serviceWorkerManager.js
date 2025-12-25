/**
 * Service Worker Manager
 * 
 * Ensures clean, deterministic PWA lifecycle:
 * - Unregister ALL existing service workers
 * - Register EXACTLY ONE service worker
 * - Enforce scope = "/"
 * - Clear orphaned caches on version mismatch
 * - Log active service worker + cache version
 * 
 * Guarantees:
 * - No multiple SW instances
 * - No competing cache layers
 * - No zombie PWA state
 */

const EXPECTED_SW_URL = '/sw.js';
const EXPECTED_SCOPE = '/';
const CACHE_VERSION_KEY = 'pwa_cache_version';
const CURRENT_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';

/**
 * Unregister all existing service workers
 */
async function unregisterAllServiceWorkers() {
  if (!('serviceWorker' in navigator)) {
    console.log('[SW Manager] Service workers not supported');
    return [];
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    if (registrations.length === 0) {
      console.log('[SW Manager] ✅ No existing service workers to unregister');
      return [];
    }

    console.log(`[SW Manager] 🗑️ Found ${registrations.length} existing service worker(s), unregistering...`);
    
    const unregisterPromises = registrations.map(async (registration) => {
      const scope = registration.scope;
      const success = await registration.unregister();
      console.log(`[SW Manager] ${success ? '✅' : '❌'} Unregistered SW with scope: ${scope}`);
      return { scope, success };
    });

    const results = await Promise.all(unregisterPromises);
    
    const successCount = results.filter(r => r.success).length;
    console.log(`[SW Manager] ✅ Unregistered ${successCount}/${registrations.length} service workers`);
    
    return results;
  } catch (error) {
    console.error('[SW Manager] ❌ Error unregistering service workers:', error);
    return [];
  }
}

/**
 * Clear orphaned caches
 */
async function clearOrphanedCaches() {
  if (!('caches' in window)) {
    console.log('[SW Manager] Cache API not supported');
    return;
  }

  try {
    const cacheNames = await caches.keys();
    
    if (cacheNames.length === 0) {
      console.log('[SW Manager] ✅ No caches to clear');
      return;
    }

    console.log(`[SW Manager] 🗑️ Found ${cacheNames.length} cache(s), checking for orphans...`);
    
    const storedVersion = localStorage.getItem(CACHE_VERSION_KEY);
    
    // If version mismatch, clear all caches
    if (storedVersion && storedVersion !== CURRENT_VERSION) {
      console.log(`[SW Manager] 🔄 Version mismatch (${storedVersion} → ${CURRENT_VERSION}), clearing all caches...`);
      
      const deletePromises = cacheNames.map(async (cacheName) => {
        const success = await caches.delete(cacheName);
        console.log(`[SW Manager] ${success ? '✅' : '❌'} Deleted cache: ${cacheName}`);
        return { cacheName, success };
      });
      
      await Promise.all(deletePromises);
      
      // Update stored version
      localStorage.setItem(CACHE_VERSION_KEY, CURRENT_VERSION);
      console.log(`[SW Manager] ✅ All caches cleared, version updated to ${CURRENT_VERSION}`);
    } else {
      console.log(`[SW Manager] ✅ Cache version matches (${CURRENT_VERSION}), no cleanup needed`);
    }
  } catch (error) {
    console.error('[SW Manager] ❌ Error clearing caches:', error);
  }
}

/**
 * Register exactly one service worker
 */
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('[SW Manager] Service workers not supported');
    return null;
  }

  try {
    console.log(`[SW Manager] 📝 Registering service worker: ${EXPECTED_SW_URL} with scope: ${EXPECTED_SCOPE}`);
    
    const registration = await navigator.serviceWorker.register(EXPECTED_SW_URL, {
      scope: EXPECTED_SCOPE,
      updateViaCache: 'none' // Always check for updates
    });

    console.log(`[SW Manager] ✅ Service worker registered successfully`);
    console.log(`[SW Manager] 📍 Scope: ${registration.scope}`);
    console.log(`[SW Manager] 🔄 Update found: ${registration.waiting ? 'Yes' : 'No'}`);
    console.log(`[SW Manager] ⚡ Active: ${registration.active ? 'Yes' : 'No'}`);
    
    // Store current version
    localStorage.setItem(CACHE_VERSION_KEY, CURRENT_VERSION);
    
    return registration;
  } catch (error) {
    console.error('[SW Manager] ❌ Error registering service worker:', error);
    return null;
  }
}

/**
 * Log active service worker state
 */
function logServiceWorkerState() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  const controller = navigator.serviceWorker.controller;
  
  if (controller) {
    console.log('[SW Manager] 🎯 Active Service Worker:');
    console.log(`  - Script URL: ${controller.scriptURL}`);
    console.log(`  - State: ${controller.state}`);
    console.log(`  - Cache Version: ${localStorage.getItem(CACHE_VERSION_KEY) || 'unknown'}`);
  } else {
    console.log('[SW Manager] ⚠️ No active service worker controller');
  }
}

/**
 * Initialize clean PWA lifecycle
 */
export async function initializeServiceWorker() {
  console.log('[SW Manager] 🚀 Initializing clean PWA lifecycle...');
  console.log(`[SW Manager] 📦 App Version: ${CURRENT_VERSION}`);
  
  // Step 1: Unregister all existing service workers
  await unregisterAllServiceWorkers();
  
  // Step 2: Clear orphaned caches
  await clearOrphanedCaches();
  
  // Step 3: Register exactly one service worker
  const registration = await registerServiceWorker();
  
  // Step 4: Log active state
  logServiceWorkerState();
  
  console.log('[SW Manager] ✅ Clean PWA lifecycle initialized');
  
  return registration;
}

