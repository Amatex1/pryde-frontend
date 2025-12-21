import { useEffect, useState } from 'react';
import { APP_VERSION } from '../utils/version';

/**
 * Hook to detect when a new app version has been deployed
 * Returns true if a new version is available
 */
export default function useAppVersion() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const storedVersion = localStorage.getItem('app_version');

    // If stored version exists and differs from current, new update is available
    if (storedVersion && storedVersion !== APP_VERSION && APP_VERSION !== 'dev') {
      console.log('🎉 New version detected:', { stored: storedVersion, current: APP_VERSION });
      setUpdateAvailable(true);
    }

    // Always store the current version
    if (APP_VERSION !== 'dev') {
      localStorage.setItem('app_version', APP_VERSION);
    }
  }, []);

  return updateAvailable;
}

