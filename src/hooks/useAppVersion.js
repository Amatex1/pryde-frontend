import { useEffect, useState, useRef } from 'react';
import { APP_VERSION } from '../utils/version';
import api from '../utils/api';

const CHECK_INTERVAL = 60_000; // 60 seconds
const STORAGE_KEY_BACKEND = 'pryde_last_backend_version';
const STORAGE_KEY_FRONTEND = 'pryde_last_frontend_version';
const STORAGE_KEY_CHECK_TIME = 'pryde_last_version_check';

/**
 * Hook to detect when a new app version has been deployed
 *
 * Uses localStorage to persist version info across sessions, so users returning
 * after an update will see the banner immediately (not just after a second check).
 *
 * Polls both frontend (/version.json) and backend (/api/version) every 60 seconds.
 * Returns true if a new version is available.
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

        // First time ever - store versions and return (no banner on first load)
        if (!storedBackend || !storedFrontend) {
          localStorage.setItem(STORAGE_KEY_BACKEND, currentBackendVersion);
          localStorage.setItem(STORAGE_KEY_FRONTEND, currentFrontendVersion);
          localStorage.setItem(STORAGE_KEY_CHECK_TIME, Date.now().toString());
          console.warn('[VersionCheck] 📦 First run - storing versions:', {
            backend: currentBackendVersion,
            frontend: currentFrontendVersion
          });
          return;
        }

        // Check for version changes
        const backendChanged = currentBackendVersion !== storedBackend;
        const frontendChanged = currentFrontendVersion !== storedFrontend;

        if ((backendChanged || frontendChanged) && !hasDetectedUpdate.current) {
          console.warn('[VersionCheck] 🔄 Update detected:', {
            backend: { old: storedBackend, new: currentBackendVersion, changed: backendChanged },
            frontend: { old: storedFrontend, new: currentFrontendVersion, changed: frontendChanged }
          });

          setUpdateAvailable(true);
          hasDetectedUpdate.current = true;

          // DON'T update stored versions yet - wait for user to refresh
          // This way the banner persists until they actually update

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
 * Clear stored version info - call this after a successful update
 * to reset the detection for the next update
 */
export function clearStoredVersions() {
  localStorage.removeItem(STORAGE_KEY_BACKEND);
  localStorage.removeItem(STORAGE_KEY_FRONTEND);
  localStorage.removeItem(STORAGE_KEY_CHECK_TIME);
}
