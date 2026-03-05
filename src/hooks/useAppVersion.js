import { useEffect, useState, useRef } from 'react';
import { APP_VERSION } from '../utils/version';
import api from '../utils/api';

const CHECK_INTERVAL = 60_000; // 60 seconds
const STORAGE_KEY_BACKEND = 'pryde_last_backend_version';
const STORAGE_KEY_FRONTEND = 'pryde_last_frontend_version';
const STORAGE_KEY_CHECK_TIME = 'pryde_last_version_check';
const STORAGE_KEY_PENDING_UPDATE = 'pryde_pending_update'; // New: stores pending update version

/**
 * Hook to detect when a new app version has been deployed
 * 
 * SILENT UPDATE MODE: Instead of showing a banner, this now:
 * 1. Detects new version in background
 * 2. Stores pending update in localStorage
 * 3. On next page load, auto-refreshes to get new version
 * 
 * This ensures all users get updates automatically without any manual action.
 */
export default function useAppVersion() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const hasInitialized = useRef(false);
  const hasDetectedUpdate = useRef(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Prevent double initialization in StrictMode
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const checkVersion = async () => {
      try {
        // Check backend version (cache-bust through Vercel proxy)
        const backendResponse = await api.get(`/version?t=${Date.now()}`);
        const currentBackendVersion = backendResponse.data?.version;

        if (!currentBackendVersion) {
          console.warn('[VersionCheck] No backend version in response');
          return;
        }

        // Check frontend version from version.json (bypasses cache)
        let currentFrontendVersion = APP_VERSION;
        try {
          const frontendResponse = await fetch(`/version.json?t=${Date.now()}`, {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
          });
          if (frontendResponse.ok) {
            const frontendData = await frontendResponse.json();
            if (frontendData.version && frontendData.version !== '__BUILD_VERSION__') {
              currentFrontendVersion = frontendData.version;
            }
          }
        } catch {
          // version.json might not exist, use APP_VERSION
        }

        // Get stored versions from localStorage (persists across sessions)
        const storedBackend = localStorage.getItem(STORAGE_KEY_BACKEND);
        const storedFrontend = localStorage.getItem(STORAGE_KEY_FRONTEND);

        // First time ever - store versions and return (no update on first load)
        if (!storedBackend || !storedFrontend) {
          localStorage.setItem(STORAGE_KEY_BACKEND, currentBackendVersion);
          localStorage.setItem(STORAGE_KEY_FRONTEND, currentFrontendVersion);
          localStorage.setItem(STORAGE_KEY_CHECK_TIME, Date.now().toString());
          console.log('[VersionCheck] 📦 First run - storing versions:', {
            backend: currentBackendVersion,
            frontend: currentFrontendVersion
          });
          return;
        }

        // Check for version changes
        const backendChanged = currentBackendVersion !== storedBackend;
        const frontendChanged = currentFrontendVersion !== storedFrontend;

        if ((backendChanged || frontendChanged) && !hasDetectedUpdate.current) {
          console.log('[VersionCheck] 🔄 New version detected (will apply on next load):', {
            backend: { old: storedBackend, new: currentBackendVersion, changed: backendChanged },
            frontend: { old: storedFrontend, new: currentFrontendVersion, changed: frontendChanged }
          });

          // Store pending update instead of showing banner
          // This will trigger auto-refresh on next page load
          const updateInfo = {
            backend: currentBackendVersion,
            frontend: currentFrontendVersion,
            detectedAt: Date.now()
          };
          localStorage.setItem(STORAGE_KEY_PENDING_UPDATE, JSON.stringify(updateInfo));
          
          setUpdateAvailable(true);
          hasDetectedUpdate.current = true;

          // Stop polling once update is detected
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        } else {
          // No change - update the check time
          localStorage.setItem(STORAGE_KEY_CHECK_TIME, Date.now().toString());
        }
      } catch (error) {
        // Silently fail - never block the app
        console.warn('[VersionCheck] Check failed:', error.message);
      }
    };

    // Check immediately on mount
    checkVersion();

    // Check again on tab focus (user returning to app)
    const onFocus = () => {
      if (!hasDetectedUpdate.current) {
        checkVersion();
      }
    };
    window.addEventListener('focus', onFocus);

    // Periodic background check every 60 seconds
    intervalRef.current = setInterval(() => {
      if (!hasDetectedUpdate.current) {
        checkVersion();
      }
    }, CHECK_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  return updateAvailable;

}

/**
 * Check for pending update on app load and auto-refresh if needed
 * Call this early in app initialization (before React renders)
 * 
 * Returns true if auto-refresh was triggered
 */
export function checkAndApplyPendingUpdate() {
  try {
    const pendingUpdate = localStorage.getItem(STORAGE_KEY_PENDING_UPDATE);
    
    if (pendingUpdate) {
      const updateInfo = JSON.parse(pendingUpdate);
      const currentTime = Date.now();
      const detectedAt = updateInfo.detectedAt || 0;
      
      // Only apply if update was detected in the last 24 hours
      // (prevents stale updates from triggering refresh)
      if (currentTime - detectedAt < 24 * 60 * 60 * 1000) {
        console.log('[VersionCheck] 🔄 Applying pending update, refreshing...');
        
        // Clear the pending update flag
        localStorage.removeItem(STORAGE_KEY_PENDING_UPDATE);
        
        // Clear service worker caches to ensure fresh content
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(registrations => {
            registrations.forEach(reg => reg.unregister());
          });
        }
        
        // Clear all caches
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
          });
        }
        
        // Force refresh with cache bust
        const timestamp = Date.now();
        window.location.href = `${window.location.origin}${window.location.pathname}?v=${timestamp}`;
        
        return true;
      } else {
        // Update is stale (older than 24 hours), clear it
        console.log('[VersionCheck] ⏰ Pending update stale, clearing...');
        localStorage.removeItem(STORAGE_KEY_PENDING_UPDATE);
      }
    }
  } catch (error) {
    console.warn('[VersionCheck] Error checking pending update:', error);
  }
  
  return false;
}

/**
 * Clear stored version info - call this after a successful update
 * to reset the detection for the next update
 */
export function clearStoredVersions() {
  localStorage.removeItem(STORAGE_KEY_BACKEND);
  localStorage.removeItem(STORAGE_KEY_FRONTEND);
  localStorage.removeItem(STORAGE_KEY_CHECK_TIME);
  localStorage.removeItem(STORAGE_KEY_PENDING_UPDATE);
}
