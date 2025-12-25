// EMERGENCY: Service worker completely disabled to fix refresh loop
// This service worker does nothing and will unregister itself

self.addEventListener('install', () => {
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Take control of all clients immediately
  event.waitUntil(self.clients.claim());
});

// Don't cache anything - let everything go to network
self.addEventListener('fetch', (event) => {
  // Just pass through to network, no caching
  event.respondWith(fetch(event.request));
});

