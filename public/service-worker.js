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
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Take control of all clients immediately
  event.waitUntil(self.clients.claim());
});

// Fetch handler with navigation bypass
self.addEventListener('fetch', (event) => {
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

