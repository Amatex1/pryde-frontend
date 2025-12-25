import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './styles/breakpoints.css' // Responsive breakpoint system + PWA utilities (MUST be loaded early)
import './styles/darkMode.css'
import './styles/quiet-mode.css' // MUST be loaded AFTER darkMode.css to override properly
import './styles/mobileFriendly.css' // Mobile-friendly layout fixes for PWA
// NOTE: Service worker lifecycle is centrally managed by serviceWorkerManager.
// All production SW registration must flow through initializeServiceWorker() to
// avoid double registration and PWA refresh loops.
import { registerServiceWorker, setupInstallPrompt, requestPersistentStorage } from './utils/pwa'
import { initializeServiceWorker } from './utils/serviceWorkerManager'
import { initWebVitals } from './utils/webVitals'
import { initializePushNotifications } from './utils/pushNotifications'
import { initializeTheme } from './utils/themeManager'
import { logMobileEnvironment } from './utils/mobileDebug'
import { initCircuitBreaker } from './utils/authCircuitBreaker' // 🔥 NEW: Circuit breaker
import { initServiceWorkerDebug } from './utils/serviceWorkerDebug'
import { clearStaleSWAndCaches } from './utils/clearStaleSW'
import { initSwApiCollisionDetector } from './utils/swApiCollisionDetector'
import { initSWTestingInfrastructure } from './utils/swTestingInfrastructure'
import { initSWAutoDisable, isSWDisabledForRecovery } from './utils/swAutoDisable'

// ========================================
// INITIALIZE CIRCUIT BREAKER IMMEDIATELY
// Must run before any API calls
// ========================================
initCircuitBreaker();

// ========================================
// INITIALIZE THEME IMMEDIATELY
// Set data-theme and data-quiet attributes before React renders
// ========================================
initializeTheme();

// ========================================
// MOBILE DEBUG (DEV MODE ONLY)
// Log mobile environment and initialize service worker debug
// ========================================
if (import.meta.env.DEV) {
  logMobileEnvironment();
  initServiceWorkerDebug();

  // 🔥 PHASE 2: Initialize SW testing infrastructure
  // Provides manual test hooks and interception logging
  initSWTestingInfrastructure();

  // 🔥 CRITICAL: Initialize SW-API collision detector
  // This detects if service worker intercepts API requests (should NEVER happen)
  initSwApiCollisionDetector();
}

// ========================================
// SERVICE WORKER REGISTRATION (PRODUCTION ONLY)
// ========================================
if (import.meta.env.PROD) {
  // 🔥 PHASE 3: Initialize auto-disable protection
  // This monitors auth failures and auto-disables SW if needed
  initSWAutoDisable();

  // 🔥 PHASE 3: Check if SW is disabled for recovery
  if (isSWDisabledForRecovery()) {
    console.warn('[PWA] ⚠️ Service worker disabled for recovery - skipping registration');
  } else {
    // 🔥 CRITICAL: Service worker lifecycle is now fully owned by
    // serviceWorkerManager.initializeServiceWorker(). This helper:
    //   - Unregisters ALL existing SWs
    //   - Clears orphaned caches on version mismatch
    //   - Registers EXACTLY ONE SW at scope "/"
    //   - Logs active controller state
    //
    // No other code path should register/unregister service workers directly.
    initializeServiceWorker().catch(err => {
      console.error('[PWA] Service worker initialization failed:', err);
    });
  }

  // Setup install prompt
  setupInstallPrompt();

  // Request persistent storage using modern Storage API
  // This replaces the deprecated StorageType.persistent API
  requestPersistentStorage().catch(err => {
    console.error('[PWA] Persistent storage request failed:', err);
  });

  // Initialize push notifications
  initializePushNotifications().catch(err => {
    console.error('[Push Notifications] Initialization failed:', err);
  });

  // Listen for service worker controller change (new version installed)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[PWA] Service worker controller changed - dispatching update event');
      window.dispatchEvent(new Event('pryde-update-detected'));
    });
  }

  // Listen for PWA update events and show a brief notification
  window.addEventListener('pwa-update-available', (event) => {
    // Create a simple toast notification
    const toast = document.createElement('div');
    toast.textContent = event.detail?.message || 'Updating to latest version...';
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #6C5CE7;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 999999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: slideUp 0.3s ease;
    `;
    document.body.appendChild(toast);

    // Remove toast after 1.5 seconds (before reload happens)
    setTimeout(() => {
      toast.remove();
    }, 1500);
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Initialize Web Vitals monitoring
initWebVitals()
