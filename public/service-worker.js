// Legacy service worker file for backward compatibility
// This redirects old registrations to the new /sw.js location

// Unregister this old service worker and register the new one
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', async (event) => {
  event.waitUntil(
    (async () => {
      // Unregister this service worker
      const registration = await self.registration;
      await registration.unregister();

      // Tell all clients to reload and register the new service worker
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach(client => {
        client.postMessage({
          type: 'REDIRECT_TO_NEW_SW',
          newSwUrl: '/sw.js'
        });
      });
    })()
  );
});

