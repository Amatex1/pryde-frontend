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
 *
 * 🔐 CRITICAL: Uses global single-flight refresh from tokenRefresh.js
 * This prevents race conditions when multiple triggers fire simultaneously.
 */

import { getAuthToken } from './auth';
import { refreshAccessToken } from './tokenRefresh';
import { isAuthConfirmed, AUTH_STATUS } from '../state/authStatus';
import logger from './logger';

// Track if lifecycle is already set up (prevent duplicates)
let lifecycleInitialized = false;
let refreshInterval = null;
let lastRefreshCheck = Date.now(); // 🔥 Track when we last checked for refresh

/**
 * 🔐 RACE CONDITION FIX: Check if auth is ready from window snapshot
 * Returns true ONLY when AuthContext has set isAuthReady=true
 */
function isAuthReadyFromContext() {
  if (typeof window === 'undefined') return false;
  return window.__PRYDE_AUTH__?.isAuthReady === true;
}

/**
 * 🔐 RACE CONDITION FIX: Check if refresh should proceed
 * BOTH conditions must be true:
 * 1. isAuthReady (auth resolution complete)
 * 2. authStatus === 'authenticated' (user is logged in)
 */
function shouldAllowRefresh() {
  const authReady = isAuthReadyFromContext();
  const authConfirmed = isAuthConfirmed();

  if (process.env.NODE_ENV === 'development') {
    console.log('[AUTH GATE] authLifecycle check:', {
      isAuthReady: authReady,
      isAuthConfirmed: authConfirmed,
      allowed: authReady && authConfirmed
    });
  }

  return authReady && authConfirmed;
}

/**
 * Dispatch custom event to coordinate with socket.js
 * @param {string} eventName - Event name to dispatch
 * @param {object} detail - Event detail payload
 */
function dispatchRefreshEvent(eventName, detail = {}) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  }
}

/**
 * Attempt to refresh the session using httpOnly cookie
 *
 * 🔐 CRITICAL: Uses global single-flight refresh from tokenRefresh.js
 * This prevents race conditions when multiple triggers fire simultaneously.
 *
 * @param {boolean} coordinateWithSocket - If true, dispatch events for socket coordination
 * @returns {Promise<string|null>} New access token or null on failure
 */
export async function refreshSession(coordinateWithSocket = false) {
  // 🔥 SOCKET COORDINATION: Notify socket to pause reconnection
  if (coordinateWithSocket) {
    console.log('🔄 [AuthLifecycle] Starting coordinated refresh - notifying socket');
    dispatchRefreshEvent('pryde:token-refresh-start');
  }

  try {
    logger.debug('[AuthLifecycle] Proactive token refresh via global single-flight...');

    // 🔐 CRITICAL: Use global single-flight refresh to prevent race conditions
    const accessToken = await refreshAccessToken();

    if (accessToken) {
      logger.debug('[AuthLifecycle] ✅ Token refreshed successfully');
      // 🔥 SOCKET COORDINATION: Notify socket refresh succeeded
      if (coordinateWithSocket) {
        console.log('🔄 [AuthLifecycle] Refresh complete - notifying socket to reconnect');
        dispatchRefreshEvent('pryde:token-refresh-complete', { success: true });
      }
      return accessToken;
    }

    // 🔥 SOCKET COORDINATION: Notify socket refresh failed
    if (coordinateWithSocket) {
      dispatchRefreshEvent('pryde:token-refresh-complete', { success: false });
    }
    return null;
  } catch (error) {
    logger.warn('[AuthLifecycle] Refresh error:', error.message);
    // 🔥 SOCKET COORDINATION: Notify socket refresh failed
    if (coordinateWithSocket) {
      dispatchRefreshEvent('pryde:token-refresh-complete', { success: false });
    }
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

  // 1. Refresh on app load (if user has access token)
  // Note: If user only has httpOnly cookie, AuthContext.verifyAuth() handles that
  // 🔐 RACE CONDITION FIX: Do NOT refresh on app load - AuthContext handles bootstrap
  // This was causing refresh to fire before auth was resolved
  // The refresh will happen naturally after isAuthReady=true via interval/focus triggers

  // 2. Refresh on tab focus (user returning from another tab/app)
  // 🔥 PC FIX: Also detect if we've been suspended (gap > 5 minutes)
  // 🔥 SOCKET COORDINATION: Use coordinated refresh to prevent 401 on tab switch
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      // 🔍 AUTH VERIFICATION DIAGNOSTIC (PART 2) - Log visibility refresh trigger
      if (process.env.NODE_ENV === 'development') {
        console.log('[AUTH VERIFY] authLifecycle refresh trigger (visibilitychange)', {
          authStatus: typeof window !== 'undefined' ? window.__PRYDE_AUTH__?.authStatus : 'N/A',
          isAuthReady: typeof window !== 'undefined' ? window.__PRYDE_AUTH__?.isAuthReady : 'N/A',
          hasToken: !!getAuthToken(),
          time: new Date().toISOString()
        });
      }

      // 🔐 RACE CONDITION FIX: HARD GATE - Do NOT refresh if auth not ready
      if (!shouldAllowRefresh()) {
        logger.debug('[AuthLifecycle] ⏸️ Skipping visibility refresh (auth not ready)');
        return;
      }

      // Only refresh if user is logged in (has access token)
      if (getAuthToken()) {
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
        // 🔥 CRITICAL: Pass true to coordinate with socket
        // This prevents socket from reconnecting with stale token
        refreshSession(true).catch((err) => {
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
    // 🔍 AUTH VERIFICATION DIAGNOSTIC (PART 2) - Log interval refresh trigger
    if (process.env.NODE_ENV === 'development') {
      console.log('[AUTH VERIFY] authLifecycle refresh trigger (interval)', {
        authStatus: typeof window !== 'undefined' ? window.__PRYDE_AUTH__?.authStatus : 'N/A',
        isAuthReady: typeof window !== 'undefined' ? window.__PRYDE_AUTH__?.isAuthReady : 'N/A',
        hasToken: !!getAuthToken(),
        time: new Date().toISOString()
      });
    }

    // 🔐 RACE CONDITION FIX: HARD GATE - Do NOT refresh if auth not ready
    if (!shouldAllowRefresh()) {
      logger.debug('[AuthLifecycle] ⏸️ Skipping interval refresh (auth not ready)');
      return;
    }

    if (getAuthToken()) {
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
  // 🔥 SOCKET COORDINATION: Use coordinated refresh
  const handleWindowFocus = () => {
    // 🔍 AUTH VERIFICATION DIAGNOSTIC (PART 2) - Log focus refresh trigger
    if (process.env.NODE_ENV === 'development') {
      console.log('[AUTH VERIFY] authLifecycle refresh trigger (focus)', {
        authStatus: typeof window !== 'undefined' ? window.__PRYDE_AUTH__?.authStatus : 'N/A',
        isAuthReady: typeof window !== 'undefined' ? window.__PRYDE_AUTH__?.isAuthReady : 'N/A',
        hasToken: !!getAuthToken(),
        time: new Date().toISOString()
      });
    }

    // 🔐 RACE CONDITION FIX: HARD GATE - Do NOT refresh if auth not ready
    if (!shouldAllowRefresh()) {
      logger.debug('[AuthLifecycle] ⏸️ Skipping focus refresh (auth not ready)');
      return;
    }

    if (getAuthToken()) {
      lastRefreshCheck = Date.now();
      logger.debug('[AuthLifecycle] Window focused - refreshing session');
      refreshSession(true).catch((err) => {
        logger.warn('[AuthLifecycle] Window focus refresh failed:', err);
      });
    }
  };

  window.addEventListener('focus', handleWindowFocus);

  // 🔥 PC FIX: Listen for online event (user's network came back)
  // 🔥 SOCKET COORDINATION: Use coordinated refresh
  const handleOnline = () => {
    // 🔍 AUTH VERIFICATION DIAGNOSTIC (PART 2) - Log online refresh trigger
    if (process.env.NODE_ENV === 'development') {
      console.log('[AUTH VERIFY] authLifecycle refresh trigger (online)', {
        authStatus: typeof window !== 'undefined' ? window.__PRYDE_AUTH__?.authStatus : 'N/A',
        isAuthReady: typeof window !== 'undefined' ? window.__PRYDE_AUTH__?.isAuthReady : 'N/A',
        hasToken: !!getAuthToken(),
        time: new Date().toISOString()
      });
    }

    // 🔐 RACE CONDITION FIX: HARD GATE - Do NOT refresh if auth not ready
    if (!shouldAllowRefresh()) {
      logger.debug('[AuthLifecycle] ⏸️ Skipping online refresh (auth not ready)');
      return;
    }

    if (getAuthToken()) {
      logger.info('[AuthLifecycle] 🌐 Network restored - refreshing session');
      lastRefreshCheck = Date.now();
      refreshSession(true).catch((err) => {
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

