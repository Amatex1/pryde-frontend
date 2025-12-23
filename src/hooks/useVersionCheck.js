import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';

const CHECK_INTERVAL = 60_000; // 60 seconds

// Store initial versions on app load
let initialBackendVersion = null;
let initialFrontendVersion = null;

const useVersionCheck = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateType, setUpdateType] = useState(null); // 'backend' | 'frontend' | 'both'
  const [dismissed, setDismissed] = useState(false);
  const intervalRef = useRef(null);
  const hasDetectedUpdate = useRef(false);

  // Initialize versions on mount
  useEffect(() => {
    const initializeVersions = async () => {
      try {
        // Get backend version
        const backendResponse = await api.get('/version');
        initialBackendVersion = backendResponse.data.version;

        // Get frontend version from env or window
        initialFrontendVersion = import.meta.env.VITE_APP_VERSION || window.__PRYDE_VERSION__?.version || '1.0.0';

        console.log('📦 Initial versions:', {
          backend: initialBackendVersion,
          frontend: initialFrontendVersion
        });
      } catch (error) {
        console.error('Failed to initialize versions:', error);
        // Silently fail - don't block the app
      }
    };

    initializeVersions();
  }, []);

  // Start polling for version changes
  useEffect(() => {
    // Don't start polling until we have initial versions
    if (!initialBackendVersion || !initialFrontendVersion) {
      return;
    }

    // Don't poll if update already detected
    if (hasDetectedUpdate.current) {
      return;
    }

    const checkForUpdates = async () => {
      try {
        // Fetch current backend version
        const backendResponse = await api.get('/version');
        const currentBackendVersion = backendResponse.data.version;

        // Get current frontend version
        const currentFrontendVersion = import.meta.env.VITE_APP_VERSION || window.__PRYDE_VERSION__?.version || '1.0.0';

        // Check for version mismatches
        const backendChanged = currentBackendVersion !== initialBackendVersion;
        const frontendChanged = currentFrontendVersion !== initialFrontendVersion;

        if (backendChanged || frontendChanged) {
          console.log('🔄 Update detected:', {
            backend: { old: initialBackendVersion, new: currentBackendVersion },
            frontend: { old: initialFrontendVersion, new: currentFrontendVersion }
          });

          // Determine update type
          let type = null;
          if (backendChanged && frontendChanged) {
            type = 'both';
          } else if (backendChanged) {
            type = 'backend';
          } else {
            type = 'frontend';
          }

          setUpdateType(type);
          setUpdateAvailable(true);
          hasDetectedUpdate.current = true;

          // Stop polling once update is detected
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      } catch (error) {
        console.error('Version check failed:', error);
        // Silently retry next interval - never block the app
      }
    };

    // Start polling
    intervalRef.current = setInterval(checkForUpdates, CHECK_INTERVAL);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const dismissUpdate = () => {
    setDismissed(true);
    // Persist dismissal for session only (not localStorage)
    sessionStorage.setItem('updateDismissed', 'true');
  };

  const refreshApp = () => {
    // Unregister service worker if present
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
        });
      });
    }

    // Clear service worker cache
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name);
        });
      });
    }

    // Force hard reload
    window.location.reload(true);
  };

  // Check if update was dismissed this session
  useEffect(() => {
    const wasDismissed = sessionStorage.getItem('updateDismissed') === 'true';
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  return {
    updateAvailable: updateAvailable && !dismissed,
    updateType,
    dismissUpdate,
    refreshApp
  };
};

export default useVersionCheck;

