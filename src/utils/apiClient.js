/**
 * Global API Client with Request Deduplication and 429 Backoff
 *
 * Features:
 * - Deduplicates inflight requests (prevents duplicate API calls)
 * - Response caching with configurable TTL
 * - Global 429 rate limit handling with backoff
 * - Automatic retry with exponential backoff
 * - Normalized error responses (never throws raw errors to components)
 *
 * Usage:
 * import { apiFetch, ApiError, isApiError } from '../utils/apiClient';
 *
 * const data = await apiFetch('/api/users/me', {}, { cacheTtl: 60000 });
 * if (isApiError(data)) {
 *   // Handle structured error
 *   console.log(data.message, data.status);
 * }
 */

/**
 * Structured API Error object (returned instead of throwing)
 * @typedef {Object} ApiErrorResponse
 * @property {boolean} error - Always true for error responses
 * @property {number} status - HTTP status code (0 for network errors)
 * @property {string} message - User-friendly error message
 * @property {string} code - Error code for programmatic handling
 */

/**
 * Create a structured API error (for internal use)
 */
export function createApiError(status, message, code = 'UNKNOWN_ERROR') {
  return {
    error: true,
    status,
    message,
    code,
  };
}

/**
 * Check if a response is an API error
 * @param {any} response - Response from apiFetch
 * @returns {boolean}
 */
export function isApiError(response) {
  return response && typeof response === 'object' && response.error === true;
}

import { API_BASE_URL } from '../config/api.js';
import { getAuthToken, getRefreshToken, setAuthToken, setRefreshToken, getIsLoggingOut } from './auth';
import logger from './logger';
import { FRONTEND_VERSION } from './pwaSafety';
import { forceReloadWithCacheClear } from './emergencyRecovery';
import {
  shouldBlockRequest,
  recordAuthFailure,
  isPushEndpoint,
  handlePushFailure
} from './authCircuitBreaker';

// In-flight request tracking (prevents duplicate requests)
const inflight = new Map();

// Response cache with expiration
const cache = new Map();

// Rate limit backoff state
let rateLimitedUntil = 0;
let backoffDelay = 1000; // Start with 1 second

// AbortController for canceling in-flight requests
const abortControllers = new Map();

// Token refresh state (single-flight pattern to prevent race conditions)
let isRefreshing = false;
let refreshPromise = null;

/**
 * Attempt to refresh the access token
 * Uses single-flight pattern to prevent multiple simultaneous refreshes
 *
 * 🔥 CRITICAL: httpOnly cookie is the SINGLE SOURCE OF TRUTH
 * - Always attempt refresh call, even if localStorage is empty
 * - The httpOnly cookie will be sent automatically via credentials: 'include'
 *
 * @returns {Promise<string|null>} New access token or null if refresh failed
 */
async function refreshAccessToken() {
  // If already refreshing, wait for existing promise
  if (isRefreshing && refreshPromise) {
    logger.debug('[API] 🔄 Token refresh already in progress, awaiting...');
    return refreshPromise;
  }

  // Get localStorage token as OPTIONAL fallback (httpOnly cookie is primary)
  const localRefreshToken = getRefreshToken();

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      logger.debug('[API] 🔄 Attempting token refresh via httpOnly cookie...');

      // 🔥 ALWAYS call /refresh - let the httpOnly cookie authenticate
      // Send localStorage token only as optional backup for cross-domain setups
      const response = await fetch(`${API_BASE_URL}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // 🔥 CRITICAL: Sends httpOnly cookie automatically
        body: JSON.stringify(localRefreshToken ? { refreshToken: localRefreshToken } : {})
      });

      if (!response.ok) {
        logger.warn(`[API] ❌ Token refresh failed: ${response.status}`);
        return null;
      }

      const data = await response.json();

      if (data.accessToken) {
        logger.debug('[API] ✅ Token refreshed successfully');
        setAuthToken(data.accessToken);

        if (data.refreshToken) {
          setRefreshToken(data.refreshToken);
        }

        return data.accessToken;
      }

      return null;
    } catch (error) {
      logger.error('[API] ❌ Token refresh error:', error.message);
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Global fetch coordinator with deduplication and caching
 * 
 * @param {string} url - API endpoint (relative or absolute)
 * @param {Object} options - Fetch options
 * @param {Object} config - Additional configuration
 * @param {number} config.cacheTtl - Cache time-to-live in milliseconds (0 = no cache)
 * @param {boolean} config.skipAuth - Skip adding auth token (default: false)
 * @returns {Promise<any>} Response data or null on error
 */
export async function apiFetch(url, options = {}, { cacheTtl = 0, skipAuth = false } = {}) {
  const now = Date.now();

  // 🔥 CIRCUIT BREAKER: Block non-critical requests before auth ready
  if (shouldBlockRequest(url)) {
    logger.warn(`[API] 🚫 Request blocked by circuit breaker: ${url}`);
    return null;
  }

  // 🔥 DEV WARNING: Check if protected request is made before authReady
  if (!skipAuth && import.meta.env.DEV) {
    try {
      // Check if AuthContext is ready
      const authReadyFlag = sessionStorage.getItem('authReady');
      if (authReadyFlag !== 'true' && url !== '/auth/me') {
        // Get stack trace
        const stack = new Error().stack;
        logger.warn(`⚠️ [DEV] Protected request fired before authReady!`);
        logger.warn(`   Endpoint: ${url}`);
        logger.warn(`   Stack trace:`, stack);

        // In dev mode, we still allow the request but log the warning
        // In production, this check is skipped for performance
      }
    } catch (error) {
      // Ignore errors in dev check
    }
  }

  // 🔥 AUTH GUARD: Check if we're logging out or not authenticated
  if (!skipAuth) {
    try {
      const { getIsLoggingOut } = await import('./auth');
      if (getIsLoggingOut()) {
        logger.debug(`[API] Skipping request during logout: ${url}`);
        return null;
      }
    } catch (error) {
      // Function might not exist - continue
    }

    // Check if we have a token for authenticated requests
    const token = localStorage.getItem('token');
    if (!token) {
      logger.debug(`[API] Skipping authenticated request without token: ${url}`);
      return null;
    }
  }

  // Check if we're rate limited
  if (rateLimitedUntil > now) {
    const waitTime = rateLimitedUntil - now;
    logger.warn(`[API] Rate limited, waiting ${waitTime}ms before retry`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  // Build full URL
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  const cacheKey = `${fullUrl}:${JSON.stringify(options)}`;

  // Serve cached response if valid
  if (cacheTtl && cache.has(cacheKey)) {
    const { data, expires } = cache.get(cacheKey);
    if (now < expires) {
      logger.debug(`[API] Cache hit: ${url}`);
      return data;
    }
    cache.delete(cacheKey);
  }

  // Deduplicate inflight requests
  if (inflight.has(cacheKey)) {
    logger.debug(`[API] Deduplicating request: ${url}`);
    return inflight.get(cacheKey);
  }

  // Create AbortController for this request
  const abortController = new AbortController();
  abortControllers.set(cacheKey, abortController);

  // Add auth token if not skipped
  if (!skipAuth) {
    const token = getAuthToken();
    if (token) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      };
    }
  }

  // Add default headers
  options.headers = {
    'Content-Type': 'application/json',
    'X-Frontend-Version': FRONTEND_VERSION, // 🔥 Version pinning
    ...options.headers,
  };

  // Add credentials for cookies
  options.credentials = options.credentials || 'include';

  // Add abort signal
  options.signal = abortController.signal;

  const request = fetch(fullUrl, options)
    .then(async (res) => {
      // 🔥 Handle 426 Upgrade Required (version mismatch)
      if (res.status === 426) {
        logger.error('[API] 🔥 Version mismatch detected (426 Upgrade Required)');

        try {
          const errorData = await res.json();
          logger.error(`   Backend version: ${errorData.backendVersion || 'unknown'}`);
          logger.error(`   Frontend version: ${FRONTEND_VERSION}`);
          logger.error(`   Message: ${errorData.message || 'Update required'}`);

          // Force reload with cache clear
          forceReloadWithCacheClear(errorData.message || 'App update required');
        } catch (error) {
          // If we can't parse the error, just force reload
          forceReloadWithCacheClear('App update required');
        }

        return null;
      }

      // Handle 429 Rate Limit
      if (res.status === 429) {
        const retryAfter = res.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : backoffDelay;

        rateLimitedUntil = now + delay;
        backoffDelay = Math.min(backoffDelay * 2, 60000); // Max 60 seconds

        logger.warn(`[API] Rate limited (429): ${url}, backing off for ${delay}ms`);
        return null;
      }

      // 🔥 Handle 410 Gone - Intentionally Removed Features
      // NOTE: Endpoints returning 410 indicate intentionally removed features.
      // These must be treated as resolved, terminal states.
      // Never retry 410 responses. Never trigger auth state changes.
      if (res.status === 410) {
        logger.info(`[API] 410 Gone: ${url} - Feature intentionally removed, treating as resolved`);
        // Return a resolved object instead of throwing - prevents retry loops
        return { removed: true, status: 410, url };
      }

      // Reset backoff on success
      if (res.ok) {
        backoffDelay = 1000;
        rateLimitedUntil = 0;
      }

      // Handle non-OK responses
      if (!res.ok) {
        // 🔥 TOKEN REFRESH: On 401, try to refresh token and retry (once)
        if (res.status === 401 && !skipAuth && !options._retried) {
          // 🔥 CRITICAL: Skip refresh if logout is in progress
          if (getIsLoggingOut()) {
            logger.debug(`[API] ⏸️ Skipping refresh for ${url} - logout in progress`);
            throw new Error('Logout in progress');
          }

          logger.debug(`[API] 🔄 Got 401 for ${url}, attempting token refresh...`);

          const newToken = await refreshAccessToken();

          if (newToken) {
            logger.debug(`[API] ✅ Token refreshed, retrying request: ${url}`);

            // Remove abort controller for retry
            abortControllers.delete(cacheKey);
            inflight.delete(cacheKey);

            // Retry with new token (mark as retried to prevent infinite loop)
            const retryOptions = {
              ...options,
              _retried: true,
              headers: {
                ...options.headers,
                'Authorization': `Bearer ${newToken}`,
              }
            };
            delete retryOptions.signal; // New request needs new signal

            // Direct fetch without going through cache/dedup again
            const retryResponse = await fetch(fullUrl, {
              ...retryOptions,
              signal: new AbortController().signal
            });

            if (retryResponse.ok) {
              const retryData = await retryResponse.json();

              // Cache successful retry response
              if (cacheTtl) {
                cache.set(cacheKey, {
                  data: retryData,
                  expires: Date.now() + cacheTtl,
                });
              }

              return retryData;
            } else {
              // Retry also failed - record failure
              logger.warn(`[API] ❌ Retry failed: ${retryResponse.status}`);
              if (isPushEndpoint(url)) {
                handlePushFailure(url, new Error(`HTTP ${retryResponse.status}`));
              } else {
                recordAuthFailure(url, retryResponse.status);
              }
              throw new Error(`API error ${retryResponse.status}`);
            }
          } else {
            // Refresh failed - record auth failure
            logger.warn(`[API] ❌ Token refresh failed for ${url}`);
            if (isPushEndpoint(url)) {
              handlePushFailure(url, new Error(`HTTP ${res.status}`));
            } else {
              recordAuthFailure(url, res.status);
            }
          }
        } else if (res.status === 401) {
          // 🔥 CIRCUIT BREAKER: Record auth failures (already retried or push endpoint)
          if (isPushEndpoint(url)) {
            handlePushFailure(url, new Error(`HTTP ${res.status}`));
          } else {
            recordAuthFailure(url, res.status);
          }
        }

        logger.warn(`[API] Error ${res.status}: ${url}`);
        throw new Error(`API error ${res.status}`);
      }

      // Parse JSON response
      const data = await res.json();

      // Cache successful response
      if (cacheTtl) {
        cache.set(cacheKey, {
          data,
          expires: now + cacheTtl,
        });
        logger.debug(`[API] Cached response: ${url} (TTL: ${cacheTtl}ms)`);
      }

      return data;
    })
    .catch(async (error) => {
      // Silence AbortError (expected during logout)
      if (error.name === 'AbortError') {
        logger.debug(`[API] Request aborted: ${url}`);
        return null; // Aborted requests return null (not an error)
      }

      // Silence 401 errors if we're logging out (expected)
      try {
        const { getIsLoggingOut } = await import('./auth');
        if (getIsLoggingOut && getIsLoggingOut() && error.message?.includes('401')) {
          logger.debug(`[API] Suppressing 401 during logout: ${url}`);
          return null;
        }
      } catch (e) {
        // If auth module isn't available for any reason, continue with normal error handling
      }

      // Parse status from error message if available
      const statusMatch = error.message?.match(/(\d{3})/);
      const status = statusMatch ? parseInt(statusMatch[1], 10) : 0;

      // Return structured error (never throw to components)
      logger.error(`[API] Request failed: ${url}`, error);
      return createApiError(
        status,
        status === 0 ? 'Network error. Please check your connection.' : `Request failed (${status})`,
        status === 0 ? 'NETWORK_ERROR' : `HTTP_${status}`
      );
    })
    .finally(() => {
      inflight.delete(cacheKey);
      abortControllers.delete(cacheKey);
    });

  inflight.set(cacheKey, request);
  return request;
}

/**
 * Abort all in-flight requests
 * Called during logout to cancel pending API calls
 */
export function abortAllRequests() {
  logger.debug(`[API] Aborting ${abortControllers.size} in-flight requests`);

  abortControllers.forEach((controller, key) => {
    try {
      controller.abort();
    } catch (error) {
      logger.warn(`[API] Failed to abort request: ${key}`, error);
    }
  });

  abortControllers.clear();
  inflight.clear();
  logger.debug('[API] All requests aborted');
}

/**
 * Clear all cached responses
 */
export function clearCache() {
  cache.clear();
  logger.debug('[API] Cache cleared');
}

/**
 * Clear cached responses matching a URL pattern
 * @param {string} pattern - URL pattern to match (e.g., '/friends', '/users/')
 */
export function clearCachePattern(pattern) {
  let cleared = 0;
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
      cleared++;
    }
  }
  logger.debug(`[API] Cleared ${cleared} cache entries matching: ${pattern}`);
}
