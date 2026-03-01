/* =========================================================
   sw.js — MINIMAL SERVICE WORKER (PUSH ONLY)
   OPTION A — FINAL, CORRECT IMPLEMENTATION
   ========================================================= */

const VERSION = 'pryde-sw-3.2-fcm-compat';

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

  let data;
  try {
    data = event.data.json();
  } catch {
    // Plain-text payload (e.g. DevTools test button) — wrap it
    data = { title: 'Pryde', body: event.data.text() };
  }

  // Support two payload shapes:
  //   VAPID (our backend): { title, body, icon, data: { url } }
  //   FCM nested format:   { notification: { title, body }, data: { url } }
  const notification = data.notification || {};
  const title = data.title || notification.title || 'Pryde';
  const body  = data.body  || notification.body  || '';
  const url   = data.data?.url || data.data || '/';

  const options = {
    body,
    icon: data.icon || '/pryde-logo-small.webp',
    badge: '/pryde-logo-small.webp',
    data: url,
    ...(data.tag && { tag: data.tag }),
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

