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
 */

import { getAuthToken, getRefreshToken, setAuthToken, setRefreshToken, getIsLoggingOut } from './auth';
import { API_BASE_URL } from '../config/api';
import logger from './logger';

// Track if lifecycle is already set up (prevent duplicates)
let lifecycleInitialized = false;
let refreshInterval = null;

/**
 * Attempt to refresh the session using refresh token
 * @returns {Promise<string|null>} New access token or null on failure
 */
export async function refreshSession() {
  // Don't refresh during logout
  if (getIsLoggingOut()) {
    logger.debug('[AuthLifecycle] Skipping refresh - logout in progress');
    return null;
  }

  const refreshToken = getRefreshToken();
  
  // If no refresh token exists, user is not logged in
  if (!refreshToken) {
    logger.debug('[AuthLifecycle] No refresh token available');
    return null;
  }

  try {
    logger.debug('[AuthLifecycle] Proactive token refresh...');

    const response = await fetch(`${API_BASE_URL}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Send httpOnly cookies
      body: JSON.stringify({ refreshToken })
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
    refreshSession().catch(() => {});
  }

  // 2. Refresh on tab focus (user returning from another tab/app)
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      // Only refresh if user is logged in
      if (getAuthToken() || getRefreshToken()) {
        logger.debug('[AuthLifecycle] Tab focused - refreshing session');
        refreshSession().catch(() => {});
      }
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  // 3. Refresh every 10 minutes (keep session alive during active use)
  // Access tokens expire in 15 minutes, so refreshing at 10 minutes gives buffer
  refreshInterval = setInterval(() => {
    if (getAuthToken() || getRefreshToken()) {
      logger.debug('[AuthLifecycle] Interval refresh');
      refreshSession().catch(() => {});
    }
  }, 10 * 60 * 1000); // 10 minutes

  // 4. Refresh on window focus (backup for visibility change)
  const handleWindowFocus = () => {
    if (getAuthToken() || getRefreshToken()) {
      logger.debug('[AuthLifecycle] Window focused - refreshing session');
      refreshSession().catch(() => {});
    }
  };

  window.addEventListener('focus', handleWindowFocus);

  logger.debug('[AuthLifecycle] ✅ Auth lifecycle initialized');

  // Return cleanup function
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', handleWindowFocus);
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

