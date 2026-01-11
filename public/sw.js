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

const VERSION = '2.4.0-websocket-fix'; // Increment to force update - Fixed WebSocket bypass + notification permission
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

  // ========================================
  // 🚫 CRITICAL: NEVER INTERCEPT REALTIME CONNECTIONS
  // ========================================
  // WebSocket upgrade requests MUST bypass service worker
  // Otherwise they will stall indefinitely
  if (
    url.pathname.startsWith('/socket.io') ||
    request.headers.get('upgrade') === 'websocket' ||
    request.headers.get('upgrade') === 'Websocket' ||
    request.headers.get('Upgrade') === 'websocket'
  ) {
    console.log('[SW] 🔌 WebSocket/Socket.IO request - bypassing:', request.url);
    return; // Browser handles WebSocket upgrade
  }

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // 🔥 CRITICAL: Skip external domains - let browser handle them directly
  // This prevents CSP violations when trying to cache third-party resources
  const ownDomain = self.location.hostname;
  if (url.hostname !== ownDomain && !url.hostname.includes('pryde-backend')) {
    // Don't intercept external requests (tenor, hcaptcha, fonts, etc.)
    return;
  }

  // Strategy 1: Cache-first for images (faster repeat visits) - SAME ORIGIN ONLY
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

  // 🔥 CRITICAL: Check notification permission before showing
  // This prevents "No notification permission" errors
  event.waitUntil(
    (async () => {
      try {
        // Check if we have permission
        const permission = await self.registration.pushManager.permissionState({
          userVisibleOnly: true
        });

        if (permission === 'granted') {
          await self.registration.showNotification(title, {
            body,
            icon,
            badge,
            data: { url },
          });
        } else {
          console.log('[SW] Push notification received but permission not granted:', permission);
        }
      } catch (error) {
        console.error('[SW] Error showing notification:', error);
      }
    })()
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

