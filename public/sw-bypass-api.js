/**
 * Service Worker API Bypass Plugin
 * 
 * 🔥 CRITICAL: This plugin ensures ALL API requests bypass the service worker
 * 
 * Prevents:
 * - CORS errors from Workbox
 * - ERR_FAILED loops
 * - Auth request interception
 * - Stale API responses
 * 
 * Strategy:
 * - Intercept ALL fetch events
 * - Check if request is to API endpoint
 * - If yes, bypass service worker entirely (return fetch directly)
 * - If no, let Workbox handle it
 */

// API endpoints that MUST bypass service worker
const API_PATTERNS = [
  /\/api\//,
  /\/auth\//,
  /\/status$/,
  /\/me$/,
  /\/notifications$/,
  /\/counts$/,
  /\/refresh$/,
  /\/push\//,
  /\/users\//,
  /\/posts\//,
  /\/messages\//,
  /\/feed\//,
  /\/search\//,
  /\/upload\//,
  /\/admin\//,
  /\/stability\//,
  /\/session-inspector\//,
  /\/safe-mode\//
];

/**
 * Check if request should bypass service worker
 */
function shouldBypassServiceWorker(request) {
  const url = new URL(request.url);
  
  // Check if URL matches any API pattern
  const isApiRequest = API_PATTERNS.some(pattern => pattern.test(url.pathname));
  
  if (isApiRequest) {
    return true;
  }
  
  // Check if request has Authorization header
  if (request.headers.has('Authorization')) {
    return true;
  }
  
  // Check if request has credentials
  if (request.credentials === 'include') {
    return true;
  }
  
  // Check if request accepts JSON
  const acceptHeader = request.headers.get('Accept');
  if (acceptHeader && acceptHeader.includes('application/json')) {
    return true;
  }
  
  return false;
}

/**
 * Log API bypass (dev mode only)
 */
function logApiBypass(url) {
  if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
    console.log(`[SW Bypass] ⚠️ API request bypassed service worker: ${url}`);
  }
}

// Install event - skip waiting
self.addEventListener('install', (event) => {
  console.log('[SW Bypass] Installing...');
  self.skipWaiting();
});

// Activate event - claim clients
self.addEventListener('activate', (event) => {
  console.log('[SW Bypass] Activating...');
  event.waitUntil(self.clients.claim());
});

// Fetch event - bypass API requests
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Check if request should bypass service worker
  if (shouldBypassServiceWorker(request)) {
    // Log bypass in dev mode
    logApiBypass(request.url);

    // Notify clients that we're bypassing this request
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'FETCH_BYPASSED',
          url: request.url
        });
      });
    });

    // Bypass service worker - fetch directly from network
    event.respondWith(fetch(request));

    // Stop propagation to prevent Workbox from handling this
    event.stopImmediatePropagation();
    return;
  }

  // For non-API requests, let Workbox handle it
  // (This will be handled by the Workbox-generated service worker)
});

/**
 * Message handler for dev warnings
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK_API_BYPASS') {
    const url = event.data.url;
    const shouldBypass = shouldBypassServiceWorker({ url, headers: new Headers() });
    
    event.ports[0].postMessage({
      type: 'API_BYPASS_RESULT',
      url,
      shouldBypass
    });
  }
});

/**
 * Export for testing
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    shouldBypassServiceWorker,
    API_PATTERNS
  };
}

