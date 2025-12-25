import { API_BASE_URL } from "../config/api.js"; // include .js extension
import axios from "axios";
import { getAuthToken, logout, isManualLogout, setAuthToken, getRefreshToken, setRefreshToken, getCurrentUser } from "./auth";
import logger from './logger';
import { disconnectSocket, initializeSocket } from './socket';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Enable cookies for refresh token
  timeout: 10000 // 10 second timeout for better UX
});

// 🔥 TOKEN REFRESH RACE PROTECTION
// Track if we're currently refreshing the token
let isRefreshing = false;
let refreshPromise = null; // 🔥 NEW: Single-flight refresh promise
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

/**
 * CSRF token storage
 * For cross-origin requests, we can't read the XSRF-TOKEN cookie via document.cookie
 * because sameSite='none' cookies are not accessible to JavaScript.
 * Instead, we store the token from the X-CSRF-Token response header.
 */
let csrfToken = null;

/**
 * Get CSRF token from storage
 */
const getCsrfToken = () => {
  return csrfToken;
};

/**
 * Set CSRF token from response header
 */
const setCsrfToken = (token) => {
  csrfToken = token;
};

// Add auth token and CSRF token to requests
api.interceptors.request.use(
  (config) => {
    // Ensure headers object exists
    if (!config.headers) {
      config.headers = {};
    }

    // Add JWT token for authentication
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add CSRF token for state-changing requests (POST, PUT, PATCH, DELETE)
    const method = config.method?.toUpperCase();
    if (method && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        config.headers['X-XSRF-TOKEN'] = csrfToken;
        logger.debug(`🛡️ CSRF token attached to ${method} ${config.url}:`, csrfToken.substring(0, 20) + '...');
      } else {
        logger.warn(`⚠️ No CSRF token found for ${method} ${config.url}`);
        logger.warn(`📋 Current cookies: ${document.cookie}`);
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 errors (unauthorized) and 403 CSRF errors
api.interceptors.response.use(
  (response) => {
    // Extract CSRF token from response header if present
    const csrfTokenHeader = response.headers['x-csrf-token'];
    if (csrfTokenHeader) {
      setCsrfToken(csrfTokenHeader);
      logger.debug('🛡️ CSRF token updated from response header');
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 403 errors
    if (error.response?.status === 403) {
      const errorMessage = error.response?.data?.message || '';
      const errorCode = error.response?.data?.code || '';

      // CRITICAL: Handle account deactivation - redirect to reactivate screen
      // DO NOT logout - keep tokens so user can reactivate
      if (errorCode === 'ACCOUNT_DEACTIVATED' || errorMessage.includes('deactivated')) {
        logger.warn('🔒 Account deactivated - redirecting to reactivate screen');
        // Only redirect if not already on reactivate page
        if (!window.location.pathname.includes('/reactivate')) {
          window.location.href = '/reactivate';
        }
        return Promise.reject(new Error('Account deactivated'));
      }

      // Check if it's a CSRF error
      if (errorMessage.includes('CSRF') || errorMessage.includes('csrf')) {
        logger.error('🛡️ CSRF token error:', errorMessage);
        logger.error('📋 Current cookies:', document.cookie);
        logger.error('📋 Request headers:', originalRequest.headers);

        // If CSRF token is missing or expired, make a GET request to get a new token
        // The backend's setCsrfToken middleware will set a new cookie on any request
        if (!originalRequest._csrfRetry) {
          originalRequest._csrfRetry = true;

          try {
            // Make a lightweight GET request to trigger CSRF token refresh
            logger.debug('🔄 Requesting new CSRF token...');
            await api.get('/posts?limit=1');

            // Wait a moment for the cookie to be set
            await new Promise(resolve => setTimeout(resolve, 100));

            // Check if we now have a CSRF token
            const newCsrfToken = getCsrfToken();
            if (newCsrfToken) {
              logger.debug('✅ New CSRF token obtained, retrying request');
              // Retry the original request with the new CSRF token
              return api(originalRequest);
            } else {
              logger.error('❌ Failed to obtain new CSRF token');
              return Promise.reject(new Error('Security token expired. Please refresh the page and try again.'));
            }
          } catch (refreshError) {
            logger.error('❌ Failed to refresh CSRF token:', refreshError);
            return Promise.reject(new Error('Security token expired. Please refresh the page and try again.'));
          }
        }

        // If retry failed, show user-friendly error
        logger.error('❌ CSRF protection failed after retry. Please refresh the page.');
        return Promise.reject(new Error('Security token expired. Please refresh the page and try again.'));
      }
    }

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      const errorCode = error.response?.data?.code || '';
      const errorMessage = error.response?.data?.message || '';

      // CRITICAL: Handle account deletion - force logout immediately, no refresh attempt
      if (errorCode === 'ACCOUNT_DELETED' || errorMessage.includes('deleted')) {
        logger.warn('🔒 Account deleted - forcing logout');
        logout();
        window.location.href = '/login?reason=deleted';
        return Promise.reject(new Error('Account deleted'));
      }

      // CRITICAL: Never attempt refresh on login/register pages
      const currentPath = window.location.pathname;
      if (currentPath === '/login' || currentPath === '/register' || currentPath === '/') {
        logger.debug('⏸️ Skipping refresh on public page:', currentPath);
        return Promise.reject(error);
      }

      // Only attempt refresh if user was previously authenticated
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        logger.debug('⏸️ No refresh token available - skipping refresh');
        return Promise.reject(error);
      }

      // 🔥 SINGLE-FLIGHT REFRESH: If already refreshing, await existing promise
      if (isRefreshing && refreshPromise) {
        logger.debug('🔄 Refresh already in progress - awaiting existing promise');
        try {
          const token = await refreshPromise;
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      originalRequest._retry = true;
      isRefreshing = true;

      // 🔥 Create single-flight refresh promise
      refreshPromise = (async () => {
        try {
          // Try to refresh the token
          logger.debug('🔄 Token expired, refreshing...');

        // Get refresh token from localStorage (for cross-domain setups)
        const refreshToken = getRefreshToken();

        const response = await axios.post(`${API_BASE_URL}/refresh`, {
          refreshToken // Send refresh token in body for cross-domain
        }, {
          withCredentials: true // Also try to send httpOnly cookie if available
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        if (accessToken) {
          logger.debug('✅ Token refreshed successfully');
          setAuthToken(accessToken);

          // Store new refresh token if provided
          if (newRefreshToken) {
            setRefreshToken(newRefreshToken);
          }

          // Reconnect socket with new token
          try {
            const currentUser = getCurrentUser();
            if (currentUser?.id) {
              disconnectSocket();
              initializeSocket(currentUser.id);
            }
          } catch (socketError) {
            logger.error('⚠️ Failed to reconnect socket:', socketError);
          }

          // Update the failed request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          // Process queued requests
          processQueue(null, accessToken);

          isRefreshing = false;
          refreshPromise = null; // 🔥 Clear refresh promise

          // 🔥 Return token for awaiting requests
          return accessToken;
        }
        } catch (refreshError) {
          logger.error('❌ Token refresh failed:', refreshError.message);
          logger.error('📍 Refresh error response:', refreshError.response?.data);
          logger.error('📍 Refresh error status:', refreshError.response?.status);
          logger.error('📍 Current cookies at failure:', document.cookie);

          processQueue(refreshError, null);
          isRefreshing = false;
          refreshPromise = null; // 🔥 Clear refresh promise

          // Check if this is a manual logout or session expiration
          const wasManualLogout = isManualLogout();

          // Token refresh failed - logout
          logger.warn('🔒 Authentication failed - logging out');
          logout();

          // Only redirect if not already on login/register page
          const currentPath = window.location.pathname;
          if (currentPath !== '/login' && currentPath !== '/register') {
            // Only add expired=true if it was NOT a manual logout
            if (wasManualLogout) {
              window.location.href = '/login';
            } else {
              window.location.href = '/login?expired=true';
            }
          }

          throw refreshError; // 🔥 Throw to reject promise
        }
      })();

      // 🔥 Await refresh promise and retry original request
      try {
        const token = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
export { getCsrfToken };
