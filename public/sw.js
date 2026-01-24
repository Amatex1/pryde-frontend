/* =========================================================
   sw.js — MINIMAL SERVICE WORKER (PUSH ONLY)
   OPTION A — FINAL, CORRECT IMPLEMENTATION
   ========================================================= */

const VERSION = 'pryde-sw-3.1-push-only-clean';

self.addEventListener('install', () => {
  console.log(`[SW ${VERSION}] Installed`);
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log(`[SW ${VERSION}] Activated`);

  event.waitUntil(
    Promise.all([
      // Take control immediately
      self.clients.claim(),

      // 🔥 CRITICAL: remove ALL old caches from previous SW versions
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            console.log(`[SW] Deleting old cache: ${cache}`);
            return caches.delete(cache);
          })
        );
      }),
    ])
  );
});

/* 🔔 PUSH NOTIFICATIONS */
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();

  const title = data.title || 'Pryde';
  const options = {
    body: data.body,
    icon: '/pryde-logo-small.webp',
    badge: '/pryde-logo-small.webp',
    data: data.url || '/messages',
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

/* 👉 NOTIFICATION CLICK */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data || '/messages';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if (client.url.includes(targetUrl) && 'focus' in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});

/* ❌ NO fetch handler
   ❌ NO caching
   ❌ NO precache
   ❌ NO update banners
*/

