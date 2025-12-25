/**
 * Service Worker API Bypass Plugin
 *
 * 🔥 PHASE 1: EXACT WORKBOX EXCLUSION RULES (MANDATORY)
 *
 * RULE: Service Worker must NEVER intercept API or auth traffic.
 *
 * This plugin ensures:
 * - ALL API requests bypass service worker
 * - ALL auth requests bypass service worker
 * - ALL requests with Authorization header bypass service worker
 * - ALL requests with credentials: include bypass service worker
 *
 * Prevents:
 * - CORS errors from Workbox
 * - ERR_FAILED loops
 * - Auth request interception
 * - Stale API responses
 *
 * Strategy:
 * - Intercept ALL fetch events BEFORE Workbox routing
 * - Check if request should bypass
 * - If yes, return fetch(event.request) directly
 * - If no, let Workbox handle it (static assets only)
 */

// 🔥 MANDATORY: API endpoints that MUST bypass service worker
const API_PATTERNS = [
  /\/api\//,
  /\/auth\//,
  /\/me$/,
  /\/status$/,
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

// 🔥 ALLOWED: Static asset patterns (same-origin only)
const STATIC_ASSET_PATTERNS = [
  /\.js$/,
  /\.css$/,
  /\.woff2?$/,
  /\.ttf$/,
  /\.eot$/,
  /\.png$/,
  /\.jpg$/,
  /\.jpeg$/,
  /\.svg$/,
  /\.gif$/,
  /\.webp$/,
  /\.ico$/
];

/**
 * Check if request should bypass service worker
 *
 * BYPASS if:
 * - URL matches API pattern
 * - Has Authorization header
 * - Has credentials: include
 * - Accepts JSON
 * - Is cross-origin
 */
function shouldBypassServiceWorker(request) {
  try {
    const url = new URL(request.url);

    // 🔥 RULE 1: Bypass if URL matches API pattern
    const isApiRequest = API_PATTERNS.some(pattern => pattern.test(url.pathname));
    if (isApiRequest) {
      return { bypass: true, reason: 'API endpoint' };
    }

    // 🔥 RULE 2: Bypass if has Authorization header
    if (request.headers.has('Authorization')) {
      return { bypass: true, reason: 'Authorization header' };
    }

    // 🔥 RULE 3: Bypass if has credentials: include
    if (request.credentials === 'include') {
      return { bypass: true, reason: 'credentials: include' };
    }

    // 🔥 RULE 4: Bypass if accepts JSON
    const acceptHeader = request.headers.get('Accept');
    if (acceptHeader && acceptHeader.includes('application/json')) {
      return { bypass: true, reason: 'JSON Accept header' };
    }

    // 🔥 RULE 5: Bypass if cross-origin (only cache same-origin)
    if (url.origin !== self.location.origin) {
      return { bypass: true, reason: 'cross-origin' };
    }

    // 🔥 RULE 6: Only allow static assets
    const isStaticAsset = STATIC_ASSET_PATTERNS.some(pattern => pattern.test(url.pathname));
    if (!isStaticAsset) {
      return { bypass: true, reason: 'not a static asset' };
    }

    return { bypass: false, reason: 'static asset' };
  } catch (error) {
    console.error('[SW Bypass] Error checking bypass:', error);
    // On error, bypass to be safe
    return { bypass: true, reason: 'error' };
  }
}

/**
 * Log API bypass (dev mode only)
 */
function logApiBypass(url, reason) {
  if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
    console.log(`[SW Bypass] ⚠️ Request bypassed: ${url} (${reason})`);
  }
}

/**
 * Log API interception (HARD WARNING - should NEVER happen)
 */
function logApiInterception(url) {
  console.error(`🚨 [SW Bypass] REGRESSION: Service worker attempted to handle API request: ${url}`);
  console.error(`🚨 [SW Bypass] This should NEVER happen - check Workbox configuration`);
  console.trace('[SW Bypass] Stack trace:');
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

// 🔥 PHASE 1: Fetch event - bypass API requests BEFORE Workbox routing
// This listener is registered FIRST to ensure it runs before Workbox
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Check if request should bypass service worker
  const bypassResult = shouldBypassServiceWorker(request);

  if (bypassResult.bypass) {
    // Log bypass in dev mode
    logApiBypass(request.url, bypassResult.reason);

    // Notify clients that we're bypassing this request (for testing/debugging)
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'FETCH_BYPASSED',
          url: request.url,
          reason: bypassResult.reason
        });
      });
    });

    // 🔥 CRITICAL: Bypass service worker - fetch directly from network
    // DO NOT route through Workbox
    // DO NOT cache
    // DO NOT fallback
    event.respondWith(
      fetch(request).catch(error => {
        console.error('[SW Bypass] Network fetch failed:', error);
        // Return network error (do NOT use cache fallback for API requests)
        return new Response('Network error', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' }
        });
      })
    );

    // Stop propagation to prevent Workbox from handling this request
    event.stopImmediatePropagation();
    return;
  }

  // For static assets only, let Workbox handle it
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

