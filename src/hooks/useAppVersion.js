import { useEffect, useState } from 'react';
import { APP_VERSION } from '../utils/version';

const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Hook to detect when a new app version has been deployed
 * Polls /version.json in the background to detect new builds
 * Returns true if a new version is available
 */
export default function useAppVersion() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    let intervalId;

    const checkVersion = async () => {
      try {
        // Fetch version.json with cache-busting to get latest version
        const res = await fetch('/version.json', {
          cache: 'no-store',
        });

        if (!res.ok) return;

        const data = await res.json();

        // Compare server version with current app version
        if (data.version && data.version !== APP_VERSION && data.version !== '__BUILD_VERSION__') {
          console.log('🎉 New version detected:', { server: data.version, current: APP_VERSION });
          setUpdateAvailable(true);
        }
      } catch {
        // Silent fail — no UX impact
      }
    };

    // Check immediately on mount
    checkVersion();

    // Check again on tab focus (user returning to app)
    const onFocus = () => checkVersion();
    window.addEventListener('focus', onFocus);

    // Periodic background check every 5 minutes
    intervalId = setInterval(checkVersion, CHECK_INTERVAL);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  return updateAvailable;
}
