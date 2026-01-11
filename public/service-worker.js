/**
 * Fallback Service Worker
 *
 * This is a minimal service worker that:
 * - NEVER intercepts navigation requests (fixes ERR_FAILED)
 * - Passes all other requests through to network
 * - Does NOT cache anything
 *
 * NAVIGATION BYPASS DESIGN:
 * - Navigation requests (mode === 'navigate') bypass SW completely
 * - HTML requests (accept includes 'text/html') bypass SW completely
 * - Browser handles all redirects correctly
 */

// 🔥 CACHE VERSION - Increment this to force cache invalidation
const CACHE_VERSION = 'pryde-cache-v7-websocket-fix';
const isDev = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

/**
 * Check if request is a navigation request
 */
function isNavigationRequest(request) {
  if (request.mode === 'navigate') return true;
  const accept = request.headers.get('Accept');
  if (accept && accept.includes('text/html')) return true;
  if (request.destination === 'document') return true;
  return false;
}

self.addEventListener('install', () => {
  console.log('[SW] Installing service worker version:', CACHE_VERSION);
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker version:', CACHE_VERSION);

  event.waitUntil(
    // Delete ALL old caches
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_VERSION) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] All old caches deleted');
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch handler with navigation bypass
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // ========================================
  // 🚫 CRITICAL: NEVER INTERCEPT REALTIME CONNECTIONS
  // ========================================
  // WebSocket upgrade requests MUST bypass service worker
  // Otherwise they will stall indefinitely
  if (
    url.pathname.startsWith('/socket.io') ||
    event.request.headers.get('upgrade') === 'websocket' ||
    event.request.headers.get('upgrade') === 'Websocket' ||
    event.request.headers.get('Upgrade') === 'websocket'
  ) {
    if (isDev) {
      console.log('[SW] 🔌 WebSocket/Socket.IO request - bypassing:', event.request.url);
    }
    return; // Browser handles WebSocket upgrade
  }

  // ========================================
  // 🔥 CRITICAL: HARD BYPASS ALL NAVIGATION REQUESTS
  // ========================================
  // DO NOT call event.respondWith()
  // Let browser handle navigation completely
  if (isNavigationRequest(event.request)) {
    if (isDev) {
      console.warn('[SW] ⚠️ Navigation request - bypassing:', event.request.url);
    }
    return; // Browser handles it
  }

  // All other requests: pass through to network (no caching)
  event.respondWith(
    fetch(event.request, { redirect: 'follow' })
  );
});

