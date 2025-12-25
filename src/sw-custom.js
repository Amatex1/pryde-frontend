/**
 * Custom Service Worker - API Bypass
 * 
 * 🔥 CRITICAL: This service worker ensures ALL API requests bypass caching
 * 
 * This file is injected into the Workbox-generated service worker to add
 * custom fetch event handling that runs BEFORE Workbox routing.
 * 
 * Strategy:
 * 1. Intercept ALL fetch events
 * 2. Check if request is to API endpoint
 * 3. If yes, fetch directly from network (bypass Workbox)
 * 4. If no, let Workbox handle it
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
  try {
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
  } catch (error) {
    console.error('[SW Custom] Error checking bypass:', error);
    return false;
  }
}

/**
 * Log API bypass (dev mode only)
 */
function logApiBypass(url, reason) {
  if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
    console.log(`[SW Custom] ⚠️ API request bypassed: ${url} (${reason})`);
  }
}

// Add fetch event listener BEFORE Workbox
// This ensures our bypass logic runs first
self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  // Check if request should bypass service worker
  if (shouldBypassServiceWorker(request)) {
    // Determine bypass reason for logging
    let reason = 'unknown';
    const url = new URL(request.url);
    
    if (API_PATTERNS.some(pattern => pattern.test(url.pathname))) {
      reason = 'API endpoint';
    } else if (request.headers.has('Authorization')) {
      reason = 'Authorization header';
    } else if (request.credentials === 'include') {
      reason = 'credentials: include';
    } else if (request.headers.get('Accept')?.includes('application/json')) {
      reason = 'JSON Accept header';
    }
    
    // Log bypass in dev mode
    logApiBypass(request.url, reason);
    
    // Bypass service worker - fetch directly from network
    // This prevents CORS errors, ERR_FAILED loops, and auth issues
    event.respondWith(
      fetch(request).catch(error => {
        console.error('[SW Custom] Network fetch failed:', error);
        return new Response('Network error', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      })
    );
    
    // Stop propagation to prevent Workbox from handling this request
    event.stopImmediatePropagation();
  }
  
  // For non-API requests, let Workbox handle it
  // (Workbox fetch handler will run after this)
});

/**
 * Message handler for dev warnings
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK_API_BYPASS') {
    const url = event.data.url;
    const mockRequest = {
      url,
      headers: new Headers(),
      credentials: 'omit'
    };
    const shouldBypass = shouldBypassServiceWorker(mockRequest);
    
    event.ports[0].postMessage({
      type: 'API_BYPASS_RESULT',
      url,
      shouldBypass
    });
  }
});

