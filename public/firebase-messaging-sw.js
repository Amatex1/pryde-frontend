/* =========================================================
   firebase-messaging-sw.js — FCM Background Message Handler
   Handles push notifications from Firebase Cloud Messaging
   when the app is in the background or closed.
   ========================================================= */

// Import Firebase scripts for service worker context
importScripts('https://www.gstatic.com/firebasejs/11.4.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.4.0/firebase-messaging-compat.js');

// Firebase config — these values are public (client-side safe)
firebase.initializeApp({
  apiKey: 'AIzaSyCvqmbg5qlhiK7Gmojm3HxOOlPsUHdpGxw',
  authDomain: 'pryde-social.firebaseapp.com',
  projectId: 'pryde-social',
  storageBucket: 'pryde-social.firebasestorage.app',
  messagingSenderId: '219429795853',
  appId: '1:219429795853:web:a7fed2a9109392a411fd44',
});

const messaging = firebase.messaging();

// Handle background messages (when app is not in foreground)
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM SW] Background message received:', payload);

  const title = payload.notification?.title || payload.data?.title;
  const body  = payload.notification?.body  || payload.data?.body;

  // Skip FCM internal/management messages that have no real content
  // (token validation, subscription refresh, etc. arrive as data-only with no title/body)
  if (!title && !body) return;

  const notificationOptions = {
    body: body || '',
    icon: payload.notification?.icon || '/pryde-logo-small.webp',
    badge: '/pryde-logo-small.webp',
    data: {
      url: payload.data?.url || payload.fcmOptions?.link || '/',
      type: payload.data?.type || 'general',
      ...payload.data,
    },
    vibrate: [100, 50, 100],
    tag: payload.data?.type || 'pryde-notification',
  };

  return self.registration.showNotification(title, notificationOptions);
});

// Handle notification click from FCM notifications
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Try to focus an existing window
        for (const client of clients) {
          if (client.url.includes(targetUrl) && 'focus' in client) {
            return client.focus();
          }
        }
        // Open a new window if none found
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});

