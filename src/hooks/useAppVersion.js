import { useEffect, useState, useRef } from 'react';
import { APP_VERSION } from '../utils/version';
import api from '../utils/api';

const CHECK_INTERVAL = 60_000; // 60 seconds

/**
 * Hook to detect when a new app version has been deployed
 * Polls both frontend (/version.json) and backend (/api/version) every 60 seconds
 * Returns true if a new version is available
 *
 * FIXED: Race condition where version checking started before initial versions were set
 */
export default function useAppVersion() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  // Use refs to store initial versions (persists across renders without causing re-renders)
  const initialBackendVersion = useRef(null);
  const initialFrontendVersion = useRef(null);
  const hasInitialized = useRef(false);
  const hasDetectedUpdate = useRef(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Prevent double initialization in StrictMode
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const checkVersion = async () => {
      try {
        // Check backend version
        const backendResponse = await api.get('/version');
        const currentBackendVersion = backendResponse.data?.version;

        if (!currentBackendVersion) {
          console.warn('[VersionCheck] No backend version in response');
          return;
        }

        // Check frontend version
        let currentFrontendVersion = APP_VERSION;
        try {
          const frontendResponse = await fetch('/version.json', {
            cache: 'no-store',
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

        // First time - store initial versions
        if (!initialBackendVersion.current || !initialFrontendVersion.current) {
          initialBackendVersion.current = currentBackendVersion;
          initialFrontendVersion.current = currentFrontendVersion;
          console.log('📦 Initial versions:', {
            backend: currentBackendVersion,
            frontend: currentFrontendVersion
          });
          return;
        }

        // Check for version mismatches
        const backendChanged = currentBackendVersion !== initialBackendVersion.current;
        const frontendChanged = currentFrontendVersion !== initialFrontendVersion.current;

        if ((backendChanged || frontendChanged) && !hasDetectedUpdate.current) {
          console.log('🔄 Update detected:', {
            backend: { old: initialBackendVersion.current, new: currentBackendVersion },
            frontend: { old: initialFrontendVersion.current, new: currentFrontendVersion }
          });

          setUpdateAvailable(true);
          hasDetectedUpdate.current = true;

          // Stop polling once update is detected
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
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
