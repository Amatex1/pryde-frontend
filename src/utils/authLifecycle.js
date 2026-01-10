/**
 * Auth Lifecycle Manager
 *
 * Keeps users logged in like major social platforms (Facebook, Instagram, etc.)
 * Proactively refreshes tokens to prevent session expiration during idle periods.
 *
 * Strategy:
 * - Refresh on app load (bootstrap)
 * - Refresh on tab focus (user returning)
 * - Refresh every 10 minutes (background keep-alive)
 * - Refresh before token expiry (proactive)
 * - Refresh when returning from sleep/suspend (PC fix)
 *
 * 🔥 PC FIX: Uses timestamp tracking to detect long gaps caused by:
 * - Browser tab suspension
 * - Computer sleep/hibernate
 * - Browser throttling background intervals
 */

import { getAuthToken, getRefreshToken, setAuthToken, setRefreshToken, getIsLoggingOut } from './auth';
import { API_BASE_URL } from '../config/api';
import logger from './logger';

// Track if lifecycle is already set up (prevent duplicates)
let lifecycleInitialized = false;
let refreshInterval = null;
let lastRefreshCheck = Date.now(); // 🔥 Track when we last checked for refresh

/**
 * Attempt to refresh the session using httpOnly cookie (primary) or localStorage (fallback)
 *
 * 🔥 CRITICAL: httpOnly cookie is the SINGLE SOURCE OF TRUTH
 * - Always attempt refresh call, even if localStorage is empty
 * - The httpOnly cookie will be sent automatically via credentials: 'include'
 *
 * @returns {Promise<string|null>} New access token or null on failure
 */
export async function refreshSession() {
  // Don't refresh during logout
  if (getIsLoggingOut()) {
    logger.debug('[AuthLifecycle] Skipping refresh - logout in progress');
    return null;
  }

  // Get localStorage token as OPTIONAL fallback (httpOnly cookie is primary)
  const localRefreshToken = getRefreshToken();

  try {
    logger.debug('[AuthLifecycle] Proactive token refresh via httpOnly cookie...');

    // 🔥 ALWAYS call /refresh - let the httpOnly cookie authenticate
    const response = await fetch(`${API_BASE_URL}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // 🔥 CRITICAL: Sends httpOnly cookie automatically
      body: JSON.stringify(localRefreshToken ? { refreshToken: localRefreshToken } : {})
    });

    if (!response.ok) {
      logger.warn('[AuthLifecycle] Refresh failed:', response.status);
      return null;
    }

    const data = await response.json();

    if (data.accessToken) {
      logger.debug('[AuthLifecycle] ✅ Token refreshed successfully');
      setAuthToken(data.accessToken);

      if (data.refreshToken) {
        setRefreshToken(data.refreshToken);
      }

      return data.accessToken;
    }

    return null;
  } catch (error) {
    logger.warn('[AuthLifecycle] Refresh error:', error.message);
    return null;
  }
}

/**
 * Set up proactive auth lifecycle management
 * Call this once on app initialization
 */
export function setupAuthLifecycle() {
  // Prevent duplicate setup
  if (lifecycleInitialized) {
    logger.debug('[AuthLifecycle] Already initialized, skipping');
    return;
  }

  lifecycleInitialized = true;
  logger.debug('[AuthLifecycle] Setting up auth lifecycle...');

  // 1. Refresh on app load (if user has tokens)
  if (getAuthToken() || getRefreshToken()) {
    refreshSession().catch((err) => {
      logger.warn('[AuthLifecycle] App load refresh failed:', err);
    });
  }

  // 2. Refresh on tab focus (user returning from another tab/app)
  // 🔥 PC FIX: Also detect if we've been suspended (gap > 5 minutes)
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      // Only refresh if user is logged in
      if (getAuthToken() || getRefreshToken()) {
        const now = Date.now();
        const timeSinceLastCheck = now - lastRefreshCheck;
        const minutesSinceLastCheck = timeSinceLastCheck / 1000 / 60;

        // 🔥 PC FIX: If more than 5 minutes have passed, we likely woke from sleep
        // Browsers throttle intervals in background tabs, so this catches that
        if (minutesSinceLastCheck > 5) {
          logger.info(`[AuthLifecycle] ⚡ Wake from suspend detected (${minutesSinceLastCheck.toFixed(1)} min gap) - forcing refresh`);
        } else {
          logger.debug('[AuthLifecycle] Tab focused - refreshing session');
        }

        lastRefreshCheck = now;
        refreshSession().catch((err) => {
          logger.warn('[AuthLifecycle] Visibility change refresh failed:', err);
        });
      }
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  // 3. Refresh every 10 minutes (keep session alive during active use)
  // Access tokens expire in 15 minutes, so refreshing at 10 minutes gives buffer
  // 🔥 PC FIX: Also check for gaps caused by tab throttling/suspension
  refreshInterval = setInterval(() => {
    if (getAuthToken() || getRefreshToken()) {
      const now = Date.now();
      const timeSinceLastCheck = now - lastRefreshCheck;
      const minutesSinceLastCheck = timeSinceLastCheck / 1000 / 60;

      // 🔥 PC FIX: Detect if browser throttled us (gap > 15 minutes)
      if (minutesSinceLastCheck > 15) {
        logger.warn(`[AuthLifecycle] ⚠️ Interval gap detected (${minutesSinceLastCheck.toFixed(1)} min) - browser may have throttled us`);
      }

      lastRefreshCheck = now;
      logger.debug('[AuthLifecycle] Interval refresh');
      refreshSession().catch((err) => {
        logger.warn('[AuthLifecycle] Interval refresh failed:', err);
      });
    }
  }, 10 * 60 * 1000); // 10 minutes

  // 4. Refresh on window focus (backup for visibility change)
  const handleWindowFocus = () => {
    if (getAuthToken() || getRefreshToken()) {
      lastRefreshCheck = Date.now();
      logger.debug('[AuthLifecycle] Window focused - refreshing session');
      refreshSession().catch((err) => {
        logger.warn('[AuthLifecycle] Window focus refresh failed:', err);
      });
    }
  };

  window.addEventListener('focus', handleWindowFocus);

  // 🔥 PC FIX: Listen for online event (user's network came back)
  const handleOnline = () => {
    if (getAuthToken() || getRefreshToken()) {
      logger.info('[AuthLifecycle] 🌐 Network restored - refreshing session');
      lastRefreshCheck = Date.now();
      refreshSession().catch((err) => {
        logger.warn('[AuthLifecycle] Online refresh failed:', err);
      });
    }
  };

  window.addEventListener('online', handleOnline);

  logger.debug('[AuthLifecycle] ✅ Auth lifecycle initialized (PC suspend detection enabled)');

  // Return cleanup function
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', handleWindowFocus);
    window.removeEventListener('online', handleOnline);
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
    lifecycleInitialized = false;
  };
}

/**
 * Clean up auth lifecycle (call on logout)
 */
export function cleanupAuthLifecycle() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
  lifecycleInitialized = false;
  logger.debug('[AuthLifecycle] Cleaned up');
}

