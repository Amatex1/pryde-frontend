/**
 * Pryde Social - Main Service Worker
 * 
 * NAVIGATION BYPASS DESIGN:
 * - Navigation requests (mode === 'navigate') are NEVER intercepted
 * - HTML requests (accept includes 'text/html') are NEVER intercepted
 * - Browser handles all redirects correctly
 * - No ERR_FAILED on reload
 * - No SW interference with routing
 * 
 * CACHING STRATEGY:
 * - Only cache static assets (js, css, fonts, images)
 * - Never cache HTML documents
 * - Never cache API requests
 * 
 * GUARANTEES:
 * - Hard reloads always work
 * - Auth redirects behave correctly
 * - Mobile / PWA startup stabilizes
 * - ERR_FAILED eliminated
 * - "Bypass for network" no longer needed
 */

const CACHE_NAME = 'pryde-static-v1';
const isDev = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

// Static assets to cache (only these file types)
const STATIC_ASSET_PATTERNS = [
  /\.js$/,
  /\.css$/,
  /\.woff2?$/,
  /\.ttf$/,
  /\.png$/,
  /\.jpg$/,
  /\.jpeg$/,
  /\.svg$/,
  /\.gif$/,
  /\.webp$/,
  /\.ico$/
];

// API patterns to bypass
const API_PATTERNS = [
  /\/api\//,
  /\/auth\//
];

/**
 * Check if request is a navigation request
 */
function isNavigationRequest(request) {
  // Primary check: request.mode === 'navigate'
  if (request.mode === 'navigate') {
    return true;
  }
  
  // Secondary check: Accept header includes 'text/html'
  const acceptHeader = request.headers.get('Accept');
  if (acceptHeader && acceptHeader.includes('text/html')) {
    return true;
  }
  
  // Tertiary check: request.destination === 'document'
  if (request.destination === 'document') {
    return true;
  }
  
  return false;
}

/**
 * Check if request is a static asset
 */
function isStaticAsset(url) {
  return STATIC_ASSET_PATTERNS.some(pattern => pattern.test(url.pathname));
}

/**
 * Check if request is an API request
 */
function isApiRequest(url) {
  return API_PATTERNS.some(pattern => pattern.test(url.pathname));
}

// Install event
self.addEventListener('install', (event) => {
  if (isDev) console.log('[SW] Installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  if (isDev) console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // ========================================
  // RULE 1: HARD BYPASS ALL NAVIGATION REQUESTS
  // ========================================
  // DO NOT call event.respondWith()
  // DO NOT fetch
  // DO NOT cache
  // Let browser handle navigation completely
  if (isNavigationRequest(request)) {
    if (isDev) {
      console.warn('[SW] ⚠️ Navigation request detected - bypassing SW completely:', url.pathname);
    }
    // Simply return - browser handles everything
    return;
  }
  
  // ========================================
  // RULE 2: BYPASS ALL API REQUESTS
  // ========================================
  if (isApiRequest(url)) {
    if (isDev) console.log('[SW] API request - bypassing:', url.pathname);
    return;
  }
  
  // ========================================
  // RULE 3: BYPASS CROSS-ORIGIN REQUESTS
  // ========================================
  if (url.origin !== self.location.origin) {
    if (isDev) console.log('[SW] Cross-origin request - bypassing:', url.origin);
    return;
  }
  
  // ========================================
  // RULE 4: ONLY CACHE STATIC ASSETS
  // ========================================
  if (!isStaticAsset(url)) {
    if (isDev) console.log('[SW] Non-static asset - bypassing:', url.pathname);
    return;
  }
  
  // ========================================
  // CACHE STATIC ASSETS (cache-first strategy)
  // ========================================
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(request, { redirect: 'follow' }).then(response => {
        // Only cache successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, responseToCache);
        });
        
        return response;
      });
    })
  );
});

