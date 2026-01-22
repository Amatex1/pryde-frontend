/**
 * Pryde PWA Service Worker
 *
 * CACHING STRATEGY:
 * - Navigation requests: BYPASS (browser handles)
 * - WebSocket/Socket.IO: BYPASS (realtime connections)
 * - API requests (/api/*): NETWORK ONLY (always fresh)
 * - Static assets (JS, CSS, images, fonts): CACHE FIRST with network fallback
 *
 * This improves:
 * - Offline experience (cached assets still work)
 * - Performance (cached assets load instantly)
 * - Reliability (network failures don't break cached content)
 */

// 🔥 CACHE VERSION - Increment this to force cache invalidation
const CACHE_VERSION = 'pryde-cache-v9-mime-fix';
const STATIC_CACHE = 'pryde-static-v9';
const isDev = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

// Static asset extensions to cache
const CACHEABLE_EXTENSIONS = ['.js', '.css', '.woff', '.woff2', '.ttf', '.otf', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp'];

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

/**
 * Check if request is for a static asset (cacheable)
 */
function isStaticAsset(url) {
  const pathname = url.pathname.toLowerCase();
  // Check extensions
  if (CACHEABLE_EXTENSIONS.some(ext => pathname.endsWith(ext))) return true;
  // Vite/bundler assets folder
  if (pathname.startsWith('/assets/')) return true;
  // Icons
  if (pathname.startsWith('/icons/')) return true;
  return false;
}

/**
 * Check if request is an API call
 */
function isApiRequest(url) {
  return url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/');
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
          if (cacheName !== STATIC_CACHE && cacheName !== CACHE_VERSION) {
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

// Fetch handler with caching strategies
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // ========================================
  // 🚫 CRITICAL: NEVER INTERCEPT REALTIME CONNECTIONS
  // ========================================
  if (
    url.pathname.startsWith('/socket.io') ||
    event.request.headers.get('upgrade') === 'websocket' ||
    event.request.headers.get('upgrade') === 'Websocket' ||
    event.request.headers.get('Upgrade') === 'websocket'
  ) {
    if (isDev) console.log('[SW] 🔌 WebSocket bypass:', url.pathname);
    return; // Browser handles WebSocket upgrade
  }

  // ========================================
  // 🔥 CRITICAL: HARD BYPASS ALL NAVIGATION REQUESTS
  // ========================================
  if (isNavigationRequest(event.request)) {
    if (isDev) console.warn('[SW] ⚠️ Navigation bypass:', url.pathname);
    return; // Browser handles it
  }

  // ========================================
  // 🌐 API REQUESTS: Network only (always fresh data)
  // ========================================
  if (isApiRequest(url)) {
    event.respondWith(fetch(event.request, { redirect: 'follow' }));
    return;
  }

  // ========================================
  // 📦 STATIC ASSETS: Cache first, network fallback
  // ========================================
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(cache => {
        return cache.match(event.request).then(cachedResponse => {
          // Validate cached response has correct content-type
          // Avoid serving HTML as CSS/JS (MIME type mismatch)
          if (cachedResponse) {
            const contentType = cachedResponse.headers.get('content-type') || '';
            const pathname = url.pathname.toLowerCase();
            const isValidCache = (
              (pathname.endsWith('.css') && contentType.includes('text/css')) ||
              (pathname.endsWith('.js') && (contentType.includes('javascript') || contentType.includes('application/javascript'))) ||
              (!pathname.endsWith('.css') && !pathname.endsWith('.js')) // Other assets: trust cache
            );

            if (isValidCache) {
              if (isDev) console.log('[SW] 📦 Cache hit:', url.pathname);
              // Stale-while-revalidate: update cache in background
              fetch(event.request).then(networkResponse => {
                if (networkResponse.ok) {
                  cache.put(event.request, networkResponse.clone());
                }
              }).catch(() => {});
              return cachedResponse;
            } else {
              // Invalid cached response - delete and fetch fresh
              if (isDev) console.warn('[SW] ⚠️ Invalid cache (MIME mismatch), refetching:', url.pathname);
              cache.delete(event.request);
            }
          }
          // Not in cache or invalid - fetch from network and cache
          return fetch(event.request).then(networkResponse => {
            if (networkResponse.ok) {
              // Only cache if content-type is valid
              const contentType = networkResponse.headers.get('content-type') || '';
              const pathname = url.pathname.toLowerCase();
              const shouldCache = !(
                (pathname.endsWith('.css') && !contentType.includes('text/css')) ||
                (pathname.endsWith('.js') && !contentType.includes('javascript'))
              );
              if (shouldCache) {
                if (isDev) console.log('[SW] 📥 Caching:', url.pathname);
                cache.put(event.request, networkResponse.clone());
              }
            }
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // ========================================
  // 🔄 ALL OTHER REQUESTS: Network only
  // ========================================
  event.respondWith(fetch(event.request, { redirect: 'follow' }));
});

