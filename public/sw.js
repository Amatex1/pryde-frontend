/* =====================================================
   PRYDE — SERVICE WORKER WITH CACHING

   Features:
   - Push notifications
   - PWA install prompt
   - Notification click handling
   - Offline caching for static assets
   - Cache-first for images
   - Network-first for API calls
   ===================================================== */

const VERSION = '2.2.0'; // Increment to force update - Added caching for performance
const STATIC_CACHE = `pryde-static-${VERSION}`;
const IMAGE_CACHE = `pryde-images-${VERSION}`;
const API_CACHE = `pryde-api-${VERSION}`;

// Critical assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/pryde-logo.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  console.log(`[SW ${VERSION}] Installing...`);

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

self.addEventListener('activate', (event) => {
  console.log(`[SW ${VERSION}] Activating...`);
  event.waitUntil(
    Promise.all([
      self.clients.claim(), // Take control immediately
      // Clear old caches from previous versions
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name.startsWith('pryde-') && name !== STATIC_CACHE && name !== IMAGE_CACHE && name !== API_CACHE)
            .map(cacheName => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
    ])
  );
  console.log(`[SW ${VERSION}] Activated and ready`);
});

/* 🚀 FETCH HANDLER - Caching strategies for performance */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // Strategy 1: Cache-first for images (faster repeat visits)
  if (request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  // Strategy 2: Network-first for API calls (fresh data)
  if (url.pathname.startsWith('/api/') || url.hostname.includes('pryde-backend')) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // Strategy 3: Cache-first for static assets (JS, CSS)
  if (request.destination === 'script' || request.destination === 'style') {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Strategy 4: Network-first for everything else
  event.respondWith(networkFirst(request, STATIC_CACHE));
});

// Cache-first: Check cache, then network
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Network-first: Try network, fall back to cache
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response('Offline', { status: 503 });
  }
}

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

