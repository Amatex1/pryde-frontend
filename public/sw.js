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

self.addEventListener('install', () => {
  self.skipWaiting(); // Activate immediately
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim()); // Take control immediately
});

/* ⚠️ NO FETCH HANDLER - Browser handles all requests
   This eliminates the "no-op fetch handler" warning
   PWA install prompt works without fetch handler in modern browsers */

self.addEventListener('activate', (event) => {
  // Clean up any old caches from previous SW versions
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

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

