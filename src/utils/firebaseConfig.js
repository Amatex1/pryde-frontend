/**
 * Firebase Client SDK Configuration
 * Used for FCM (Firebase Cloud Messaging) push notifications on Android & iOS.
 *
 * Environment variables (set in .env or Vite env):
 *   VITE_FIREBASE_API_KEY
 *   VITE_FIREBASE_AUTH_DOMAIN
 *   VITE_FIREBASE_PROJECT_ID
 *   VITE_FIREBASE_STORAGE_BUCKET
 *   VITE_FIREBASE_MESSAGING_SENDER_ID
 *   VITE_FIREBASE_APP_ID
 *   VITE_FIREBASE_VAPID_KEY  (FCM Web Push certificate key pair)
 */

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// FCM VAPID key for web push (from Firebase Console > Cloud Messaging > Web Push certificates)
const FCM_VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

let app = null;
let messaging = null;

/**
 * Check if Firebase is configured (all required env vars are set)
 */
export const isFirebaseConfigured = () => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId
  );
};

/**
 * Initialize Firebase app and messaging
 * @returns {Object|null} Firebase messaging instance or null if not supported/configured
 */
export const initializeFirebaseMessaging = async () => {
  if (!isFirebaseConfigured()) {
    console.debug('[Firebase] Not configured — skipping FCM initialization');
    return null;
  }

  try {
    // Check if messaging is supported in this browser
    const supported = await isSupported();
    if (!supported) {
      console.debug('[Firebase] Messaging not supported in this browser');
      return null;
    }

    if (!app) {
      app = initializeApp(firebaseConfig);
    }

    if (!messaging) {
      messaging = getMessaging(app);
    }

    return messaging;
  } catch (error) {
    console.error('[Firebase] Initialization error:', error);
    return null;
  }
};

/**
 * Get FCM device token for this browser/device
 * @returns {string|null} FCM token or null
 */
export const getFCMToken = async () => {
  try {
    const msgInstance = await initializeFirebaseMessaging();
    if (!msgInstance) return null;

    // Get the service worker registration for FCM
    const swRegistration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');

    const token = await getToken(msgInstance, {
      vapidKey: FCM_VAPID_KEY,
      serviceWorkerRegistration: swRegistration || await navigator.serviceWorker.ready,
    });

    if (token) {
      console.log('[Firebase] FCM token obtained');
      return token;
    } else {
      console.debug('[Firebase] No FCM token available — permission may not be granted');
      return null;
    }
  } catch (error) {
    console.error('[Firebase] Error getting FCM token:', error);
    return null;
  }
};

/**
 * Listen for foreground FCM messages
 * @param {Function} callback - Called with message payload when a foreground message arrives
 * @returns {Function|null} Unsubscribe function or null
 */
export const onForegroundMessage = async (callback) => {
  try {
    const msgInstance = await initializeFirebaseMessaging();
    if (!msgInstance) return null;

    return onMessage(msgInstance, (payload) => {
      console.log('[Firebase] Foreground message received:', payload);
      callback(payload);
    });
  } catch (error) {
    console.error('[Firebase] Error setting up foreground listener:', error);
    return null;
  }
};

/**
 * Detect device platform for FCM token metadata
 */
export const detectDevicePlatform = () => {
  const ua = navigator.userAgent || '';
  if (/android/i.test(ua)) return 'android';
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Macintosh/.test(ua)) return 'macos';
  if (/Windows/.test(ua)) return 'windows';
  if (/Linux/.test(ua)) return 'linux';
  return 'web';
};

export default {
  isFirebaseConfigured,
  initializeFirebaseMessaging,
  getFCMToken,
  onForegroundMessage,
  detectDevicePlatform,
};

