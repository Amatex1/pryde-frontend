/**
 * Service Worker Debug Logging (DEV MODE ONLY)
 * 
 * 🔥 CRITICAL: Helps detect stale cache issues in PWA
 * 
 * Features:
 * - Log when service worker serves cached response
 * - Warn if cached JS version != backend API version
 * - Detect stale auth responses
 * - Monitor cache hit/miss rates
 */

import logger from './logger';

const isDev = import.meta.env.DEV;

// Cache statistics
const cacheStats = {
  hits: 0,
  misses: 0,
  staleWarnings: 0
};

/**
 * Initialize service worker debug logging
 */
export function initServiceWorkerDebug() {
  if (!isDev) return;
  
  if (!('serviceWorker' in navigator)) {
    logger.debug('[SW Debug] Service workers not supported');
    return;
  }

  logger.info('[SW Debug] 🔍 Initializing service worker debug logging...');

  // Listen for service worker messages
  navigator.serviceWorker.addEventListener('message', (event) => {
    handleServiceWorkerMessage(event.data);
  });

  // Monitor fetch events (if possible)
  monitorFetchEvents();

  // Log cache stats every 30 seconds
  setInterval(() => {
    if (cacheStats.hits > 0 || cacheStats.misses > 0) {
      const hitRate = (cacheStats.hits / (cacheStats.hits + cacheStats.misses) * 100).toFixed(1);
      logger.debug(`[SW Debug] Cache stats - Hits: ${cacheStats.hits}, Misses: ${cacheStats.misses}, Hit rate: ${hitRate}%`);
      
      if (cacheStats.staleWarnings > 0) {
        logger.warn(`[SW Debug] ⚠️ Stale cache warnings: ${cacheStats.staleWarnings}`);
      }
    }
  }, 30000);
}

/**
 * Handle messages from service worker
 */
function handleServiceWorkerMessage(data) {
  if (!data || !data.type) return;

  switch (data.type) {
    case 'CACHE_HIT':
      cacheStats.hits++;
      logger.debug(`[SW Debug] 💾 Cache hit: ${data.url}`);
      
      // Warn if auth endpoint is cached (should never happen)
      if (isAuthEndpoint(data.url)) {
        cacheStats.staleWarnings++;
        logger.error(`[SW Debug] 🔥 CRITICAL: Auth endpoint served from cache!`);
        logger.error(`   URL: ${data.url}`);
        logger.error(`   This should NEVER happen - check service worker config`);
      }
      break;

    case 'CACHE_MISS':
      cacheStats.misses++;
      logger.debug(`[SW Debug] 🌐 Cache miss: ${data.url}`);
      break;

    case 'VERSION_MISMATCH':
      cacheStats.staleWarnings++;
      logger.warn(`[SW Debug] ⚠️ Version mismatch detected!`);
      logger.warn(`   Cached version: ${data.cachedVersion}`);
      logger.warn(`   Current version: ${data.currentVersion}`);
      logger.warn(`   Recommendation: Clear cache and reload`);
      break;

    case 'STALE_CACHE':
      cacheStats.staleWarnings++;
      logger.warn(`[SW Debug] ⚠️ Stale cache detected: ${data.url}`);
      logger.warn(`   Age: ${data.age}ms`);
      break;

    default:
      logger.debug(`[SW Debug] Unknown message type: ${data.type}`);
  }
}

/**
 * Monitor fetch events (via Performance API)
 */
function monitorFetchEvents() {
  if (!window.PerformanceObserver) return;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          // Check if response came from service worker
          if (entry.transferSize === 0 && entry.decodedBodySize > 0) {
            logger.debug(`[SW Debug] 💾 Likely cached: ${entry.name}`);
            
            // Warn if auth endpoint
            if (isAuthEndpoint(entry.name)) {
              logger.error(`[SW Debug] 🔥 CRITICAL: Auth endpoint likely cached!`);
              logger.error(`   URL: ${entry.name}`);
            }
          }
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });
  } catch (error) {
    logger.debug('[SW Debug] Could not initialize PerformanceObserver:', error);
  }
}

/**
 * Check if URL is an auth endpoint (should never be cached)
 */
function isAuthEndpoint(url) {
  const authPatterns = [
    '/api/auth/',
    '/api/refresh',
    '/api/push/status',
    '/api/users/me'
  ];

  return authPatterns.some(pattern => url.includes(pattern));
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return { ...cacheStats };
}

/**
 * Reset cache statistics
 */
export function resetCacheStats() {
  cacheStats.hits = 0;
  cacheStats.misses = 0;
  cacheStats.staleWarnings = 0;
  logger.debug('[SW Debug] Cache stats reset');
}

/**
 * Check if service worker is active
 */
export async function checkServiceWorkerStatus() {
  if (!('serviceWorker' in navigator)) {
    return { active: false, reason: 'Not supported' };
  }

  const registration = await navigator.serviceWorker.getRegistration();
  
  if (!registration) {
    return { active: false, reason: 'Not registered' };
  }

  if (!registration.active) {
    return { active: false, reason: 'Not active' };
  }

  return {
    active: true,
    scope: registration.scope,
    updateViaCache: registration.updateViaCache,
    installing: !!registration.installing,
    waiting: !!registration.waiting
  };
}

/**
 * Force service worker update
 */
export async function forceServiceWorkerUpdate() {
  if (!('serviceWorker' in navigator)) {
    logger.warn('[SW Debug] Service workers not supported');
    return;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  
  if (!registration) {
    logger.warn('[SW Debug] No service worker registered');
    return;
  }

  logger.info('[SW Debug] 🔄 Forcing service worker update...');
  await registration.update();
  logger.info('[SW Debug] ✅ Service worker update triggered');
}

