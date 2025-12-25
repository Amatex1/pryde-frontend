/**
 * Install Prompt Manager
 * 
 * Properly handles beforeinstallprompt:
 * - Capture event
 * - Prevent default browser prompt
 * - Store reference
 * - Expose manual "Install Pryde" trigger
 * 
 * Rules:
 * - Prompt only when:
 *   - authReady === true
 *   - app stable
 *   - NOT already installed
 * - Never auto-dismiss
 * - Never fire during auth bootstrap
 * 
 * Outcome:
 * - Install prompt reliability restored
 * - Browser trust maintained
 */

// Stored install prompt event
let deferredPrompt = null;

// Install state
let isInstalled = false;
let isInstallable = false;
let authReady = false;

// Callbacks
let onInstallableCallback = null;
let onInstalledCallback = null;

/**
 * Check if app is already installed
 */
function checkIfInstalled() {
  // Check if running as PWA
  const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                window.navigator.standalone === true;
  
  if (isPWA) {
    isInstalled = true;
    console.log('[Install Manager] ✅ App is already installed');
    return true;
  }

  return false;
}

/**
 * Set auth ready state
 */
export function setAuthReady(ready) {
  authReady = ready;
  console.log(`[Install Manager] 🔐 Auth ready: ${ready}`);
  
  // If auth is ready and we have a deferred prompt, notify
  if (ready && deferredPrompt && onInstallableCallback) {
    onInstallableCallback();
  }
}

/**
 * Check if install prompt can be shown
 */
export function canShowInstallPrompt() {
  if (isInstalled) {
    console.log('[Install Manager] ⏭️ App already installed');
    return false;
  }

  if (!authReady) {
    console.log('[Install Manager] ⏭️ Auth not ready yet');
    return false;
  }

  if (!deferredPrompt) {
    console.log('[Install Manager] ⏭️ No install prompt available');
    return false;
  }

  return true;
}

/**
 * Show install prompt
 */
export async function showInstallPrompt() {
  if (!canShowInstallPrompt()) {
    console.log('[Install Manager] ❌ Cannot show install prompt');
    return { outcome: 'dismissed', reason: 'not_available' };
  }

  try {
    console.log('[Install Manager] 🎉 Showing install prompt...');
    
    // Show the prompt
    deferredPrompt.prompt();
    
    // Wait for user response
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`[Install Manager] 📊 User choice: ${outcome}`);
    
    if (outcome === 'accepted') {
      console.log('[Install Manager] ✅ User accepted install');
      isInstalled = true;
      
      // Trigger callback
      if (onInstalledCallback) {
        onInstalledCallback();
      }
    } else {
      console.log('[Install Manager] ❌ User dismissed install');
    }
    
    // Clear the deferred prompt
    deferredPrompt = null;
    isInstallable = false;
    
    return { outcome };
  } catch (error) {
    console.error('[Install Manager] ❌ Error showing install prompt:', error);
    return { outcome: 'error', error };
  }
}

/**
 * Set callback for when app becomes installable
 */
export function onInstallable(callback) {
  onInstallableCallback = callback;
}

/**
 * Set callback for when app is installed
 */
export function onInstalled(callback) {
  onInstalledCallback = callback;
}

/**
 * Get install state
 */
export function getInstallState() {
  return {
    isInstalled,
    isInstallable,
    authReady,
    canInstall: canShowInstallPrompt()
  };
}

/**
 * Initialize install prompt manager
 */
export function initializeInstallPrompt() {
  console.log('[Install Manager] 🚀 Initializing install prompt manager...');
  
  // Check if already installed
  checkIfInstalled();
  
  if (isInstalled) {
    console.log('[Install Manager] ✅ App already installed, skipping prompt setup');
    return;
  }

  // Listen for beforeinstallprompt
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('[Install Manager] 📥 beforeinstallprompt event fired');
    
    // Prevent the default browser prompt
    e.preventDefault();
    
    // Store the event
    deferredPrompt = e;
    isInstallable = true;
    
    console.log('[Install Manager] ✅ Install prompt captured and stored');
    
    // If auth is ready, notify immediately
    if (authReady && onInstallableCallback) {
      console.log('[Install Manager] 🎉 Auth ready, app is installable!');
      onInstallableCallback();
    } else {
      console.log('[Install Manager] ⏳ Waiting for auth to be ready...');
    }
  });

  // Listen for appinstalled
  window.addEventListener('appinstalled', () => {
    console.log('[Install Manager] 🎉 App installed successfully!');
    isInstalled = true;
    isInstallable = false;
    deferredPrompt = null;
    
    // Trigger callback
    if (onInstalledCallback) {
      onInstalledCallback();
    }
  });

  console.log('[Install Manager] ✅ Install prompt manager initialized');
}

