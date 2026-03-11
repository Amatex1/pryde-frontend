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

import { createLogger } from './logger';

const EXPECTED_SW_URL = '/sw.js';
const EXPECTED_SCOPE = '/';
const CACHE_VERSION_KEY = 'pwa_cache_version';
const CURRENT_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';
const logger = createLogger('serviceWorkerManager');

/**
 * Unregister all existing service workers
 */
async function unregisterAllServiceWorkers() {
  if (!('serviceWorker' in navigator)) {
    logger.debug('Service workers not supported');
    return [];
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    if (registrations.length === 0) {
      logger.debug('No existing service workers to unregister');
      return [];
    }

    logger.debug('Unregistering existing service workers', { count: registrations.length });
    
    const unregisterPromises = registrations.map(async (registration) => {
      const scope = registration.scope;
      const success = await registration.unregister();
      logger.debug('Service worker unregister attempt finished', { scope, success });
      return { scope, success };
    });

    const results = await Promise.all(unregisterPromises);
    
    const successCount = results.filter(r => r.success).length;
    logger.debug('Service worker cleanup complete', {
      successCount,
      total: registrations.length
    });
    
    return results;
  } catch (error) {
    logger.error('Error unregistering service workers', error);
    return [];
  }
}

/**
 * Clear orphaned caches
 */
async function clearOrphanedCaches() {
  if (!('caches' in window)) {
    logger.debug('Cache API not supported');
    return;
  }

  try {
    const cacheNames = await caches.keys();
    
    if (cacheNames.length === 0) {
      logger.debug('No caches to clear');
      return;
    }

    logger.debug('Checking caches for cleanup', { count: cacheNames.length });
    
    const storedVersion = localStorage.getItem(CACHE_VERSION_KEY);
    
    // If version mismatch, clear all caches
    if (storedVersion && storedVersion !== CURRENT_VERSION) {
      logger.debug('Version mismatch detected while clearing caches', {
        storedVersion,
        currentVersion: CURRENT_VERSION
      });
      
      const deletePromises = cacheNames.map(async (cacheName) => {
        const success = await caches.delete(cacheName);
        logger.debug('Cache delete attempt finished', { cacheName, success });
        return { cacheName, success };
      });
      
      await Promise.all(deletePromises);
      
      // Update stored version
      localStorage.setItem(CACHE_VERSION_KEY, CURRENT_VERSION);
      logger.debug('Caches cleared and version updated', { currentVersion: CURRENT_VERSION });
    } else {
      logger.debug('Cache version matches current build', { currentVersion: CURRENT_VERSION });
    }
  } catch (error) {
    logger.error('Error clearing caches', error);
  }
}

/**
 * Register exactly one service worker
 */
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    logger.debug('Service workers not supported');
    return null;
  }

  try {
    logger.debug('Registering service worker', {
      url: EXPECTED_SW_URL,
      scope: EXPECTED_SCOPE
    });
    
    const registration = await navigator.serviceWorker.register(EXPECTED_SW_URL, {
      scope: EXPECTED_SCOPE,
      updateViaCache: 'none' // Always check for updates
    });

    logger.debug('Service worker registered successfully', {
      scope: registration.scope,
      hasWaitingWorker: Boolean(registration.waiting),
      hasActiveWorker: Boolean(registration.active)
    });
    
    // Store current version
    localStorage.setItem(CACHE_VERSION_KEY, CURRENT_VERSION);
    
    return registration;
  } catch (error) {
    logger.error('Error registering service worker', error);
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
    logger.debug('Active service worker detected', {
      scriptUrl: controller.scriptURL,
      state: controller.state,
      cacheVersion: localStorage.getItem(CACHE_VERSION_KEY) || 'unknown'
    });
  } else {
    logger.debug('No active service worker controller');
  }
}

/**
 * Initialize clean PWA lifecycle
 */
export async function initializeServiceWorker() {
  logger.debug('Initializing clean PWA lifecycle', { currentVersion: CURRENT_VERSION });
  
  // Step 1: Unregister all existing service workers
  await unregisterAllServiceWorkers();
  
  // Step 2: Clear orphaned caches
  await clearOrphanedCaches();
  
  // Step 3: Register exactly one service worker
  const registration = await registerServiceWorker();
  
  // Step 4: Log active state
  logServiceWorkerState();
  
  logger.debug('Clean PWA lifecycle initialized');
  
  return registration;
}

