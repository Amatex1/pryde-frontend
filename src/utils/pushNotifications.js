import api from './api';
import { isAuthReady } from './authCircuitBreaker';
import { isFirebaseConfigured, getFCMToken, onForegroundMessage, detectDevicePlatform } from './firebaseConfig';

let isSubscribed = false;
let fcmToken = null;
let foregroundMessageUnsubscribe = null;

/* -------------------------------------------
   CHECK SUBSCRIPTION STATE
--------------------------------------------*/
// Returns true only if THIS browser/device has an active push subscription.
// Uses browser-local PushManager so it's accurate per-device regardless of
// how many other devices the same account has subscribed.
export const isPushNotificationSubscribed = async () => {
  try {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      isSubscribed = !!subscription;
      return isSubscribed;
    }
    return false;
  } catch (error) {
    console.debug('[Push] Failed to check local subscription:', error);
    return false;
  }
};

/* -------------------------------------------
   SUBSCRIBE
--------------------------------------------*/
export const subscribeToPushNotifications = async () => {
  console.log("🔔 Subscribing user to push notifications...");

  try {
    // Check if browser supports notifications
    if (!("Notification" in window)) {
      throw new Error("This browser does not support desktop notifications");
    }

    // Check if service worker is supported
    if (!("serviceWorker" in navigator)) {
      throw new Error("This browser does not support service workers");
    }

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error("Notification permission denied");
    }

    // Get VAPID public key
    const vapidResponse = await api.get('/push/vapid-public-key');
    const publicKey = vapidResponse.data.publicKey;

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Subscribe to push service
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    // Send subscription to backend
    await api.post('/push/subscribe', { subscription });

    // Also register FCM token for native Android/iOS push
    await registerFCMToken();

    isSubscribed = true;
    return true;
  } catch (error) {
    console.error("Failed to subscribe to push notifications:", error);
    return false;
  }
};

/* -------------------------------------------
   UNSUBSCRIBE
--------------------------------------------*/
export const unsubscribeFromPushNotifications = async () => {
  console.log("🔕 Unsubscribing user from push notifications...");

  try {
    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Get current subscription
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // Tell backend to remove only this device's subscription
      await api.post('/push/unsubscribe', { endpoint: subscription.endpoint });
      // Unsubscribe from push service
      await subscription.unsubscribe();
    } else {
      await api.post('/push/unsubscribe');
    }

    // Also unregister FCM token
    await unregisterFCMToken();

    isSubscribed = false;
    return true;
  } catch (error) {
    console.error("Failed to unsubscribe from push notifications:", error);
    return false;
  }
};

/* -------------------------------------------
   SEND TEST NOTIFICATION
--------------------------------------------*/
export const sendTestNotification = async () => {
  console.log("📨 Sending test notification...");

  try {
    // Get the current device's subscription endpoint so the backend targets this device only
    let currentEndpoint = null;
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      currentEndpoint = subscription?.endpoint || null;
    }

    const response = await api.post('/push/test', { endpoint: currentEndpoint });
    return response.data;
  } catch (error) {
    console.error("Failed to send test notification:", error);
    return error.response?.data || { success: false };
  }
};

/* -------------------------------------------
   UTILITY FUNCTION: BASE64 TO UINT8ARRAY
--------------------------------------------*/
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/* -------------------------------------------
   FCM TOKEN REGISTRATION
--------------------------------------------*/
async function registerFCMToken() {
  if (!isFirebaseConfigured()) return;

  try {
    const token = await getFCMToken();
    if (token) {
      fcmToken = token;
      const device = detectDevicePlatform();
      await api.post('/push/fcm-register', { token, device });
      console.log('[FCM] Token registered for device:', device);
    }
  } catch (error) {
    console.debug('[FCM] Token registration failed (non-critical):', error.message);
  }
}

async function unregisterFCMToken() {
  if (!fcmToken) return;

  try {
    await api.post('/push/fcm-unregister', { token: fcmToken });
    fcmToken = null;
    console.log('[FCM] Token unregistered');
  } catch (error) {
    console.debug('[FCM] Token unregister failed (non-critical):', error.message);
  }
}

export function cleanupPushNotifications() {
  if (typeof foregroundMessageUnsubscribe === 'function') {
    foregroundMessageUnsubscribe();
  }

  foregroundMessageUnsubscribe = null;
}

/* -------------------------------------------
   INITIALIZE PUSH NOTIFICATIONS
--------------------------------------------*/
export const initializePushNotifications = async () => {
  // 🔥 CIRCUIT BREAKER: Don't initialize push before auth is ready
  if (!isAuthReady()) {
    console.debug('[Push] Skipping initialization - auth not ready');
    return false;
  }

  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      // Get existing service worker registration (already registered by app bootstrap)
      const registration = await navigator.serviceWorker.ready;

      // Check current subscription status (will respect circuit breaker)
      const subscriptionStatus = await isPushNotificationSubscribed();

      // Initialize FCM for native Android/iOS push
      if (isFirebaseConfigured()) {
        try {
          const fcmRegistration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
          if (!fcmRegistration) {
            await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
          }

          // Register FCM token with backend
          await registerFCMToken();

          // Listen for foreground FCM messages
          if (!foregroundMessageUnsubscribe) {
            foregroundMessageUnsubscribe = await onForegroundMessage((payload) => {
              const title = payload.notification?.title || 'Pryde Social';
              const options = {
                body: payload.notification?.body || 'New notification',
                icon: payload.notification?.icon || '/pryde-logo-small.webp',
                badge: '/pryde-logo-small.webp',
                data: payload.data || {},
              };

              registration.showNotification(title, options);
            });
          }

          console.log('[Push] FCM initialized for native push notifications');
        } catch (fcmError) {
          console.debug('[Push] FCM initialization failed (falling back to VAPID only):', fcmError.message);
        }
      }

      return subscriptionStatus;
    } catch (error) {
      console.error("Failed to initialize push notifications:", error);
      return false;
    }
  }
  return false;
};
