import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // Includes layout.css as LAST import (authority for .page-container)
import './styles/breakpoints.css' // Responsive breakpoint system + PWA utilities (MUST be loaded early)
import './styles/darkMode.css'
import './styles/quiet-mode.css' // MUST be loaded AFTER darkMode.css to override properly
import './styles/mobileFriendly.css' // Mobile-friendly layout fixes for PWA
import './styles/sidebar.css' // Sidebar feature discovery styles
import './styles/navbar.css' // Desktop navbar grid layout
import './styles/cursors.css' // Optional cursor customization styles
// NOTE: Using PUSH-ONLY service worker - NO fetch, NO cache, NO navigation
// This is safe by design and only handles push notifications
import { setupInstallPrompt, requestPersistentStorage } from './utils/pwa'
import { initWebVitals } from './utils/webVitals'
import { initializePushNotifications } from './utils/pushNotifications'
import { initializeTheme } from './utils/themeManager'
import { initCircuitBreaker } from './utils/authCircuitBreaker'
import { initServiceWorkerDebug } from './utils/serviceWorkerDebug'
import { clearStaleSWAndCaches } from './utils/clearStaleSW'
import { initSwApiCollisionDetector } from './utils/swApiCollisionDetector'
import { initSWTestingInfrastructure } from './utils/swTestingInfrastructure'

// ========================================
// CHUNK LOAD ERROR RECOVERY
// Detects stale JS chunk errors and auto-refreshes
// ========================================
window.addEventListener('error', (event) => {
  // Check if it's a script/module loading error
  const isChunkError =
    event.message?.includes('Failed to fetch dynamically imported module') ||
    event.message?.includes('Loading chunk') ||
    event.message?.includes('Loading module') ||
    event.message?.includes('Failed to load module script') ||
    (event.target?.tagName === 'SCRIPT' && event.target?.src?.includes('.js'));

  if (isChunkError) {
    console.error('[ChunkError] Detected stale chunk error - triggering refresh');

    // Prevent showing this error multiple times
    const alreadyRefreshing = sessionStorage.getItem('chunk_error_refresh');
    if (alreadyRefreshing) {
      console.log('[ChunkError] Already attempted refresh this session');
      return;
    }

    // Mark that we're about to refresh
    sessionStorage.setItem('chunk_error_refresh', 'true');

    // Clear caches and refresh
    if ('caches' in window) {
      caches.keys().then(names => {
        Promise.all(names.map(name => caches.delete(name))).then(() => {
          console.log('[ChunkError] Caches cleared, refreshing...');
          window.location.reload();
        });
      });
    } else {
      window.location.reload();
    }
  }
}, true); // Use capture phase to catch errors early

// Clear the refresh flag on successful load
window.addEventListener('load', () => {
  sessionStorage.removeItem('chunk_error_refresh');
});

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
// DEV MODE ONLY
// Initialize service worker debug and testing infrastructure
// ========================================
if (import.meta.env.DEV) {
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
  // 🔥 CRITICAL: Register PUSH-ONLY service worker
  // This SW only handles push notifications - NO fetch, NO cache, NO navigation
  // Safe by design - cannot cause ERR_FAILED or stale content issues
  if ('serviceWorker' in navigator) {
    // First, FORCE unregister ALL existing service workers
    navigator.serviceWorker.getRegistrations().then(registrations => {
      console.log(`[PWA] 🔍 Found ${registrations.length} existing service worker(s)`);

      // Unregister all old service workers
      const unregisterPromises = registrations.map(reg => {
        console.log(`[PWA] 🗑️ Unregistering old service worker: ${reg.scope}`);
        return reg.unregister();
      });

      return Promise.all(unregisterPromises);
    }).then(() => {
      console.log('[PWA] ✅ All old service workers unregistered');

      // Clean up old caches
      return clearStaleSWAndCaches();
    }).then(() => {
      console.log('[PWA] ✅ Old caches cleaned up');

      // Now register the NEW service worker
      return navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none' // Force check for updates every time
      });
    }).then(registration => {
      console.log('[PWA] ✅ New service worker registered');
      console.log('[PWA] 📍 Scope:', registration.scope);

      // Force immediate activation
      if (registration.waiting) {
        console.log('[PWA] 🔄 Activating waiting service worker...');
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

      // Check for updates every 60 seconds
      setInterval(() => {
        registration.update();
      }, 60000);
    }).catch(err => {
      console.error('[PWA] Service worker registration failed:', err);
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
