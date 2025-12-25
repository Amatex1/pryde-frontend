/**
 * Update Notification Manager
 * 
 * Centralizes update handling to prevent duplicate notifications:
 * - Single update listener
 * - In-memory + sessionStorage guard
 * - Never show update prompt more than once per version
 * - Reset guard only after reload or service worker replacement
 * 
 * Outcome:
 * - One update notice per release
 * - No stacked or duplicate banners
 */

const UPDATE_SHOWN_KEY = 'pwa_update_shown';
const CURRENT_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';

// In-memory guard
let hasShownUpdateNotice = false;

// Callbacks
let onUpdateAvailableCallback = null;
let onUpdateInstalledCallback = null;

/**
 * Check if update notice has been shown for current version
 */
function hasShownUpdateForCurrentVersion() {
  // Check in-memory guard first
  if (hasShownUpdateNotice) {
    console.log('[Update Manager] ⏭️ Update notice already shown (in-memory)');
    return true;
  }

  // Check sessionStorage
  const storedData = sessionStorage.getItem(UPDATE_SHOWN_KEY);
  
  if (storedData) {
    try {
      const { version, timestamp } = JSON.parse(storedData);
      
      // If same version and within session
      if (version === CURRENT_VERSION) {
        console.log('[Update Manager] ⏭️ Update notice already shown (sessionStorage)');
        hasShownUpdateNotice = true;
        return true;
      }
    } catch (error) {
      console.error('[Update Manager] Error parsing stored update data:', error);
    }
  }

  return false;
}

/**
 * Mark update notice as shown
 */
function markUpdateAsShown() {
  hasShownUpdateNotice = true;
  
  sessionStorage.setItem(UPDATE_SHOWN_KEY, JSON.stringify({
    version: CURRENT_VERSION,
    timestamp: Date.now()
  }));
  
  console.log(`[Update Manager] ✅ Marked update notice as shown for version ${CURRENT_VERSION}`);
}

/**
 * Reset update notice guard
 * Call this after reload or service worker replacement
 */
export function resetUpdateNoticeGuard() {
  hasShownUpdateNotice = false;
  sessionStorage.removeItem(UPDATE_SHOWN_KEY);
  console.log('[Update Manager] 🔄 Reset update notice guard');
}

/**
 * Set callback for when update is available
 */
export function onUpdateAvailable(callback) {
  onUpdateAvailableCallback = callback;
}

/**
 * Set callback for when update is installed
 */
export function onUpdateInstalled(callback) {
  onUpdateInstalledCallback = callback;
}

/**
 * Handle service worker update found
 */
function handleUpdateFound(registration) {
  console.log('[Update Manager] 🔄 Service worker update found');
  
  const newWorker = registration.installing || registration.waiting;
  
  if (!newWorker) {
    console.log('[Update Manager] ⚠️ No new worker found');
    return;
  }

  // Listen for state changes
  newWorker.addEventListener('statechange', () => {
    console.log(`[Update Manager] 📡 New worker state: ${newWorker.state}`);
    
    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
      // New service worker installed, but old one still controlling
      handleUpdateAvailable(registration);
    }
  });
}

/**
 * Handle update available
 */
function handleUpdateAvailable(registration) {
  // Check if we've already shown the notice
  if (hasShownUpdateForCurrentVersion()) {
    return;
  }

  console.log('[Update Manager] 🎉 New version available!');
  
  // Mark as shown
  markUpdateAsShown();
  
  // Trigger callback
  if (onUpdateAvailableCallback) {
    onUpdateAvailableCallback(registration);
  }
}

/**
 * Handle update installed
 */
function handleUpdateInstalled() {
  console.log('[Update Manager] ✅ Update installed');
  
  // Trigger callback
  if (onUpdateInstalledCallback) {
    onUpdateInstalledCallback();
  }
}

/**
 * Trigger update (skip waiting and reload)
 */
export function triggerUpdate(registration) {
  if (!registration || !registration.waiting) {
    console.log('[Update Manager] ⚠️ No waiting service worker to activate');
    return;
  }

  console.log('[Update Manager] 🚀 Triggering update...');
  
  // Tell the waiting service worker to skip waiting
  registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  
  // Listen for controller change
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('[Update Manager] 🔄 Controller changed, reloading...');
    handleUpdateInstalled();
    window.location.reload();
  });
}

/**
 * Initialize update notification manager
 */
export function initializeUpdateNotifications(registration) {
  if (!registration) {
    console.log('[Update Manager] ⚠️ No registration provided');
    return;
  }

  console.log('[Update Manager] 🚀 Initializing update notification manager...');
  
  // Listen for updates
  registration.addEventListener('updatefound', () => {
    handleUpdateFound(registration);
  });

  // Check if there's already a waiting worker
  if (registration.waiting) {
    console.log('[Update Manager] ⚠️ Service worker already waiting');
    handleUpdateAvailable(registration);
  }

  // Check for updates periodically (every 60 seconds)
  setInterval(() => {
    console.log('[Update Manager] 🔍 Checking for updates...');
    registration.update();
  }, 60000);

  console.log('[Update Manager] ✅ Update notification manager initialized');
}

