/* =====================================================
   PRYDE — MINIMAL SERVICE WORKER
   Safe by design: NO cache, NO navigation interception

   Features:
   - Push notifications
   - PWA install prompt
   - Notification click handling

   Does NOT:
   - Cache anything
   - Intercept/modify any requests
   - Handle navigation
   ===================================================== */

const VERSION = '2.1.0'; // Increment to force update - Mobile/PWA dark mode fix

self.addEventListener('install', (event) => {
  console.log(`[SW ${VERSION}] Installing...`);
  self.skipWaiting(); // Activate immediately
});

self.addEventListener('activate', (event) => {
  console.log(`[SW ${VERSION}] Activating...`);
  event.waitUntil(
    Promise.all([
      self.clients.claim(), // Take control immediately
      // Clear old caches from previous versions
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      })
    ])
  );
  console.log(`[SW ${VERSION}] Activated and ready`);
});

/* ⚠️ CRITICAL: NO FETCH HANDLER AT ALL
   - Eliminates "no-op fetch handler" warning
   - Browser handles ALL requests natively
   - No interference with navigation or API calls
   - PWA install prompt works without fetch handler in modern browsers

   If you need push notifications, they work via the 'push' event handler below.
*/

/* 🔔 Handle push notifications */
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Pryde', body: event.data.text() };
  }

  const {
    title = 'Pryde',
    body = '',
    url = '/feed',
    icon = '/icon-192.png',
    badge = '/badge.png'
  } = payload;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      data: { url },
    })
  );
});

/* 👉 Open Pryde when notification is clicked */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if (client.url.includes(targetUrl) && 'focus' in client) {
            return client.focus();
          }
        }
        return self.clients.openWindow(targetUrl);
      })
  );
});

