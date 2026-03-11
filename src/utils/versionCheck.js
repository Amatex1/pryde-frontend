/**
 * Version Check Utility
 * Automatically detects new deployments and prompts user to refresh
 */

import { createLogger } from './logger';
import '../styles/version-check-toast.css';

const VERSION_CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes
const BUILD_VERSION_KEY = 'app_build_version';
const DISMISSED_VERSION_KEY = 'version_update_dismissed';
const TOAST_ID = 'version-update-toast';
const logger = createLogger('versionCheck');

const createToastButton = (id, text, className) => {
  const button = document.createElement('button');
  button.id = id;
  button.type = 'button';
  button.className = className;
  button.textContent = text;
  return button;
};

const createUpdateToast = () => {
  const toast = document.createElement('div');
  toast.id = TOAST_ID;
  toast.className = 'version-update-toast';

  const panel = document.createElement('div');
  panel.className = 'version-update-toast__panel';

  const header = document.createElement('div');
  header.className = 'version-update-toast__header';

  const icon = document.createElement('div');
  icon.className = 'version-update-toast__icon';
  icon.textContent = '🎉';

  const content = document.createElement('div');
  content.className = 'version-update-toast__content';

  const title = document.createElement('div');
  title.className = 'version-update-toast__title';
  title.textContent = 'New Update Available!';

  const message = document.createElement('div');
  message.className = 'version-update-toast__message';
  message.textContent = 'A new version of Pryde Social is ready.';

  const actions = document.createElement('div');
  actions.className = 'version-update-toast__actions';

  const refreshNowBtn = createToastButton(
    'refresh-now-btn',
    'Refresh Now',
    'version-update-toast__button version-update-toast__button--primary'
  );
  const refreshLaterBtn = createToastButton(
    'refresh-later-btn',
    'Later',
    'version-update-toast__button version-update-toast__button--secondary'
  );

  content.append(title, message);
  header.append(icon, content);
  actions.append(refreshNowBtn, refreshLaterBtn);
  panel.append(header, actions);
  toast.appendChild(panel);

  return { toast, refreshNowBtn, refreshLaterBtn };
};

const clearSiteCaches = async () => {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      logger.debug('Unregistering service workers before refresh', {
        count: registrations.length
      });

      for (const registration of registrations) {
        await registration.unregister();
      }
    }

    if ('caches' in window) {
      const cacheNames = await caches.keys();
      logger.debug('Clearing caches before refresh', { count: cacheNames.length });
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }

    logger.debug('Client caches cleared before refresh');
  } catch (error) {
    logger.error('Error clearing caches before refresh', error);
  }
};

/**
 * Get the current build version from the HTML meta tag
 * This is set during build time
 */
export const getCurrentBuildVersion = () => {
  const metaTag = document.querySelector('meta[name="build-version"]');
  return metaTag?.content || 'unknown';
};

/**
 * Get the stored build version from localStorage
 */
export const getStoredBuildVersion = () => {
  return localStorage.getItem(BUILD_VERSION_KEY);
};

/**
 * Store the current build version
 */
export const storeBuildVersion = version => {
  localStorage.setItem(BUILD_VERSION_KEY, version);
};

/**
 * Check if a new version is available
 * Returns true if the current build version differs from stored version
 */
export const isNewVersionAvailable = () => {
  const currentVersion = getCurrentBuildVersion();
  const storedVersion = getStoredBuildVersion();

  if (!storedVersion) {
    storeBuildVersion(currentVersion);
    return false;
  }

  return currentVersion !== storedVersion && currentVersion !== 'unknown';
};

/**
 * Show a toast notification prompting user to refresh
 */
export const promptUserToRefresh = () => {
  const dismissed = localStorage.getItem(DISMISSED_VERSION_KEY);
  const currentVersion = getCurrentBuildVersion();

  if (dismissed === currentVersion) {
    logger.debug('Version update prompt already dismissed for current version', {
      currentVersion
    });
    return;
  }

  if (document.getElementById(TOAST_ID)) {
    logger.debug('Version update prompt already visible');
    return;
  }

  const { toast, refreshNowBtn, refreshLaterBtn } = createUpdateToast();
  document.body.appendChild(toast);

  refreshNowBtn.addEventListener('click', async () => {
    logger.debug('Refreshing page after version update prompt accepted');
    storeBuildVersion(getCurrentBuildVersion());
    localStorage.removeItem(DISMISSED_VERSION_KEY);

    await clearSiteCaches();

    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set('v', String(Date.now()));
    window.location.assign(nextUrl.toString());
  });

  refreshLaterBtn.addEventListener('click', () => {
    logger.debug('User deferred version refresh prompt');
    localStorage.setItem(DISMISSED_VERSION_KEY, getCurrentBuildVersion());
    toast.remove();
  });

  window.setTimeout(() => {
    const existingToast = document.getElementById(TOAST_ID);
    if (existingToast) {
      logger.debug('Auto-dismissing version update prompt');
      existingToast.remove();
    }
  }, 30000);
};

/**
 * Perform a single version check
 * Used by startVersionCheck and can be called manually for testing
 */
export const checkForUpdate = () => {
  const currentVersion = getCurrentBuildVersion();
  const storedVersion = getStoredBuildVersion();
  const isNewVersion = currentVersion !== storedVersion && currentVersion !== 'unknown';

  logger.debug('Checking for new version', {
    currentVersion,
    storedVersion,
    isNewVersion
  });

  if (isNewVersionAvailable()) {
    logger.debug('New version detected during local version check');
    promptUserToRefresh();
  } else {
    logger.debug('Already on latest known version');
  }
};

/**
 * Start periodic version checking
 * Call this once when the app initializes
 */
export const startVersionCheck = () => {
  checkForUpdate();

  const onFocus = () => {
    logger.debug('Window focus triggered version check');
    checkForUpdate();
  };
  window.addEventListener('focus', onFocus);

  window.setInterval(() => {
    logger.debug('Running periodic version check');

    fetch('/', {
      cache: 'no-cache',
      headers: { 'Cache-Control': 'no-cache' }
    })
      .then(response => response.text())
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const metaTag = doc.querySelector('meta[name="build-version"]');
        const fetchedVersion = metaTag?.content;
        const currentVersion = getCurrentBuildVersion();

        logger.debug('Fetched version metadata during periodic check', {
          fetchedVersion,
          currentVersion
        });

        if (fetchedVersion && fetchedVersion !== currentVersion) {
          logger.debug('New version available from periodic check', { fetchedVersion });
          promptUserToRefresh();
        } else {
          logger.debug('Periodic check found no new version');
        }
      })
      .catch(error => {
        logger.debug('Periodic version check failed safely', {
          message: error?.message
        });
      });
  }, VERSION_CHECK_INTERVAL);
};

