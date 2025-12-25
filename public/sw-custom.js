/**
 * Custom Service Worker Extensions
 * 
 * This file extends the Workbox-generated service worker with:
 * - Version checking
 * - Cache invalidation on version mismatch
 * - Dev logging for cache hits/misses
 * 
 * 🔥 CRITICAL: This prevents stale JS bundles from running against new backend
 */

// Import Workbox (will be injected by vite-plugin-pwa)
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

const CACHE_VERSION = '{{BUILD_VERSION}}'; // Replaced at build time
const isDev = false; // Always false in service worker

/**
 * Check if cached response is stale
 */
function isCachedResponseStale(response, maxAge) {
  if (!response) return true;
  
  const dateHeader = response.headers.get('date');
  if (!dateHeader) return false;
  
  const responseTime = new Date(dateHeader).getTime();
  const now = Date.now();
  const age = now - responseTime;
  
  return age > maxAge;
}

/**
 * Send message to all clients
 */
async function notifyClients(message) {
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach(client => {
    client.postMessage(message);
  });
}

/**
 * Intercept fetch events for dev logging
 */
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Check if this is an auth endpoint (should NEVER be cached)
  const authPatterns = [
    '/api/auth/',
    '/api/refresh',
    '/api/push/status',
    '/api/users/me'
  ];
  
  const isAuthEndpoint = authPatterns.some(pattern => url.includes(pattern));
  
  if (isAuthEndpoint) {
    // Force network-only for auth endpoints
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Notify clients in dev mode
          if (isDev) {
            notifyClients({
              type: 'CACHE_MISS',
              url: url,
              reason: 'Auth endpoint - never cached'
            });
          }
          return response;
        })
        .catch(error => {
          console.error('[SW] Auth endpoint fetch failed:', url, error);
          throw error;
        })
    );
    return;
  }
  
  // For other requests, check cache and notify
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Cache hit
          if (isDev) {
            notifyClients({
              type: 'CACHE_HIT',
              url: url
            });
          }
          
          // Check if cached response is stale (for API calls)
          if (url.includes('/api/')) {
            const maxAge = 5 * 60 * 1000; // 5 minutes
            if (isCachedResponseStale(cachedResponse, maxAge)) {
              notifyClients({
                type: 'STALE_CACHE',
                url: url,
                age: maxAge
              });
            }
          }
          
          return cachedResponse;
        }
        
        // Cache miss - fetch from network
        if (isDev) {
          notifyClients({
            type: 'CACHE_MISS',
            url: url
          });
        }
        
        return fetch(event.request);
      })
  );
});

/**
 * On activate, check version and clear old caches if needed
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Get all cache names
      const cacheNames = await caches.keys();
      
      // Check if we need to clear caches due to version change
      const versionCache = await caches.open('version-cache');
      const versionResponse = await versionCache.match('/version.json');
      
      if (versionResponse) {
        const cachedVersion = await versionResponse.json();
        
        if (cachedVersion.version !== CACHE_VERSION) {
          console.log('[SW] Version mismatch detected - clearing all caches');
          console.log(`   Cached: ${cachedVersion.version}`);
          console.log(`   Current: ${CACHE_VERSION}`);
          
          // Clear all caches
          await Promise.all(
            cacheNames.map(name => caches.delete(name))
          );
          
          // Notify clients
          notifyClients({
            type: 'VERSION_MISMATCH',
            cachedVersion: cachedVersion.version,
            currentVersion: CACHE_VERSION
          });
        }
      }
      
      // Cache current version
      await versionCache.put('/version.json', new Response(JSON.stringify({
        version: CACHE_VERSION,
        timestamp: Date.now()
      })));
      
      // Claim all clients
      await self.clients.claim();
    })()
  );
});

/**
 * On install, skip waiting to activate immediately
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing new service worker version:', CACHE_VERSION);
  self.skipWaiting();
});

