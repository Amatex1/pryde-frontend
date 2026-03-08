/**
 * 🔐 GLOBAL SINGLE-FLIGHT TOKEN REFRESH
 *
 * This module is the SINGLE SOURCE OF TRUTH for token refresh.
 * All other modules (api.js, apiClient.js, authLifecycle.js) MUST use this.
 *
 * WHY:
 * - Multiple refresh triggers can fire simultaneously (tab focus, interval, 401 interceptor)
 * - Token rotation on the backend causes previous tokens to become invalid after 30 min
 * - Race conditions: if two refreshes fire, the second one gets a different token
 *   and the first one's token becomes invalid → logout
 *
 * HOW:
 * - Single-flight pattern: only ONE refresh request can be in-flight at a time
 * - All callers await the same promise
 * - Token is stored in memory (auth.js) after successful refresh
 */

import { getAuthToken, setAuthToken, getIsLoggingOut } from './auth';
import { API_AUTH_URL } from '../config/api';
import logger from './logger';

// Single-flight state
let isRefreshing = false;
let refreshPromise = null;

// Cooldown state: after a failed refresh, block retries for a short window.
// This prevents sequential 401 responses (from concurrent API calls) from each
// triggering their own /api/refresh request after the first one already failed.
let lastRefreshFailedAt = 0;
const REFRESH_FAIL_COOLDOWN_MS = 10_000; // 10 seconds

/**
 * Attempt to refresh the access token using httpOnly cookie
 *
 * 🔐 SECURITY: httpOnly cookie is the SINGLE SOURCE OF TRUTH
 * - No refresh token in request body
 * - Cookie is sent automatically via credentials: 'include'
 *
 * @param {Object} options - Optional configuration
 * @param {boolean} options.force - Force refresh even if we think we're already refreshing (rare edge case)
 * @returns {Promise<string|null>} New access token or null if refresh failed
 */
export async function refreshAccessToken({ force = false } = {}) {
  // ======================================================
  // 🔍 AUTH VERIFICATION DIAGNOSTIC (PART 3)
  // Log refresh entry with auth state snapshot
  // ======================================================
  if (process.env.NODE_ENV === 'development') {
    console.groupCollapsed('[AUTH VERIFY] Refresh called');
    console.log('Auth snapshot:', typeof window !== 'undefined' ? window.__PRYDE_AUTH__ : 'N/A');
    console.log('Force:', force);
    console.log('isRefreshing:', isRefreshing);
    console.log('Time:', new Date().toISOString());
    console.trace('Call stack');
    console.groupEnd();
  }

  // 🔥 CRITICAL: Skip if logout is in progress
  if (getIsLoggingOut()) {
    logger.debug('[TokenRefresh] ⏸️ Skipping - logout in progress');
    return null;
  }

  // 🔥 COOLDOWN: If the last refresh attempt failed recently, bail out immediately.
  // Sequential 401 responses (from concurrent API calls) would otherwise each trigger
  // their own /api/refresh request after the first one already failed and cleaned up.
  if (!force && lastRefreshFailedAt > 0 && Date.now() - lastRefreshFailedAt < REFRESH_FAIL_COOLDOWN_MS) {
    logger.debug('[TokenRefresh] ⏸️ Skipping - recent refresh failure cooldown active');
    return null;
  }

  // Single-flight: if already refreshing, await existing promise
  if (isRefreshing && refreshPromise && !force) {
    logger.debug('[TokenRefresh] 🔄 Already refreshing - awaiting existing promise');
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      logger.debug('[TokenRefresh] 🔄 Starting token refresh via httpOnly cookie...');

      // 🔐 SECURITY: Call /refresh with NO body - httpOnly cookie is sole source
      const response = await fetch(`${API_AUTH_URL}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // CRITICAL: Sends httpOnly cookie automatically
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        logger.warn(`[TokenRefresh] ❌ Failed: ${response.status} - ${errorText}`);
        lastRefreshFailedAt = Date.now();
        return null;
      }

      const data = await response.json();

      if (data.accessToken) {
        logger.debug('[TokenRefresh] ✅ Token refreshed successfully');
        setAuthToken(data.accessToken);
        lastRefreshFailedAt = 0; // Clear cooldown on success
        return data.accessToken;
      }

      logger.warn('[TokenRefresh] ⚠️ No accessToken in response');
      lastRefreshFailedAt = Date.now();
      return null;
    } catch (error) {
      // TypeError("Failed to fetch") = network error (server sleeping, offline, CORS preflight)
      // This is transient and handled gracefully — log as warn, not error
      if (error instanceof TypeError) {
        logger.warn('[TokenRefresh] ⚠️ Network unavailable (server may be waking up)');
      } else {
        logger.error('[TokenRefresh] ❌ Error:', error.message);
      }
      lastRefreshFailedAt = Date.now();
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Check if a refresh is currently in progress
 * @returns {boolean}
 */
export function isRefreshInProgress() {
  return isRefreshing;
}

/**
 * Get the current refresh promise (if any)
 * Useful for awaiting an in-progress refresh without triggering a new one
 * @returns {Promise<string|null>|null}
 */
export function getRefreshPromise() {
  return refreshPromise;
}

