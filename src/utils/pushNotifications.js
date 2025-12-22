import api from './api';

let isSubscribed = false;

/* -------------------------------------------
   CHECK SUBSCRIPTION STATE
--------------------------------------------*/
export const isPushNotificationSubscribed = async () => {
  try {
    const response = await api.get('/push-notifications/status');
    isSubscribed = response.data.hasSubscription;
    return isSubscribed;
  } catch (error) {
    console.error("Failed to check push notification subscription:", error);
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
    const vapidResponse = await api.get('/push-notifications/vapid-public-key');
    const publicKey = vapidResponse.data.publicKey;

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Subscribe to push service
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    // Send subscription to backend
    await api.post('/push-notifications/subscribe', { subscription });

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
      // Unsubscribe from push service
      await subscription.unsubscribe();
    }

    // Notify backend
    await api.post('/push-notifications/unsubscribe');

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
    // Send test notification request to backend
    const response = await api.post('/push-notifications/test');
    
    if (response.data.success) {
      console.log("Test notification sent successfully");
      return true;
    } else {
      console.error("Failed to send test notification:", response.data.message);
      return false;
    }
  } catch (error) {
    console.error("Failed to send test notification:", error);
    return false;
  }
};

/* -------------------------------------------
   UTILITY FUNCTION: BASE64 TO UINT8ARRAY
--------------------------------------------*/
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/* -------------------------------------------
   INITIALIZE PUSH NOTIFICATIONS
--------------------------------------------*/
export const initializePushNotifications = async () => {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      
      // Check current subscription status
      const subscriptionStatus = await isPushNotificationSubscribed();
      
      // Set up push event listener
      registration.addEventListener('push', (event) => {
        const data = event.data.json();
        const options = {
          body: data.body,
          icon: data.icon || '/favicon.svg',
          badge: data.badge || '/favicon.svg',
          data: data.data || {}
        };
        
        registration.showNotification(data.title || 'Pryde Social', options);
      });

      return subscriptionStatus;
    } catch (error) {
      console.error("Failed to initialize push notifications:", error);
      return false;
    }
  }
  return false;
};
