/**
 * AuthContext - Centralized Authentication State Management
 *
 * 🔥 GLOBAL AUTH GATE: This is the SINGLE source of truth for auth state.
 *
 * CRITICAL RULES:
 * - All components MUST use useAuth() instead of fetching user data directly
 * - NO component should call /auth/me directly - AuthContext handles this
 * - authStatus has 3 states: "loading" | "authenticated" | "unauthenticated"
 * - App rendering is blocked until authStatus !== "loading"
 *
 * Features:
 * - Single auth check on app load (GET /auth/me)
 * - Automatic token refresh on 401 (handled by api.js interceptor)
 * - login(), logout(), refreshToken() functions exposed
 * - Role derived from user object
 * - Cross-tab sync for login/logout events
 * - Circuit breaker to prevent API storms
 *
 * Usage:
 * import { useAuth } from '../context/AuthContext';
 *
 * function MyComponent() {
 *   const { user, authStatus, login, logout } = useAuth();
 *
 *   if (authStatus === 'loading') return <div>Loading...</div>;
 *   if (authStatus === 'unauthenticated') return <Navigate to="/login" />;
 *
 *   return <div>Hello {user.username} (role: {user.role})</div>;
 * }
 */

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import api from '../utils/api';
import {
  setAuthToken,
  setRefreshToken,
  setCurrentUser,
  getRefreshToken,
  logout as authLogout
} from '../utils/auth';
import { listenForAuthEvents, closeAuthSync, broadcastLogin, broadcastLogout } from '../utils/authSync';
import { clearCachePattern } from '../utils/apiClient';
import logger from '../utils/logger';
import { markAuthReady, resetAuthReady } from '../utils/authCircuitBreaker';
import {
  AUTH_STATUS,
  markAuthenticated as markAuthStatusAuthenticated,
  markUnauthenticated as markAuthStatusUnauthenticated
} from '../state/authStatus';
import { initializeSocket, disconnectSocket } from '../utils/socket';

const AuthContext = createContext(null);

// Auth status constants for components
export const AUTH_STATES = {
  LOADING: 'loading',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authStatus, setAuthStatus] = useState(AUTH_STATES.LOADING);
  const [error, setError] = useState(null);

  // Derived state for backward compatibility
  const loading = authStatus === AUTH_STATES.LOADING;
  const authLoading = authStatus === AUTH_STATES.LOADING;
  const authReady = authStatus !== AUTH_STATES.LOADING;
  const isAuthenticated = authStatus === AUTH_STATES.AUTHENTICATED;

  // Derive role from user object
  const role = useMemo(() => user?.role || null, [user]);

  /**
   * Attempt silent token refresh using httpOnly cookie
   * This runs BEFORE checking localStorage to restore sessions across browser restarts
   * @returns {boolean} true if refresh succeeded
   */
  const attemptSilentRefresh = useCallback(async () => {
    try {
      logger.debug('[AuthContext] 🔄 Attempting silent token refresh...');

      // Get refresh token from localStorage as fallback for cross-domain setups
      // (Cloudflare Pages → Render may not send httpOnly cookies due to browser restrictions)
      const localRefreshToken = getRefreshToken();

      // 🔥 CRITICAL: Skip refresh call if no token available
      // This prevents unnecessary 401 errors after logout or on fresh visits
      if (!localRefreshToken) {
        logger.debug('[AuthContext] No refresh token in localStorage - skipping silent refresh');
        return false;
      }

      // Call refresh endpoint - httpOnly cookie will be sent automatically via withCredentials
      // Also send localStorage token as fallback for cross-origin scenarios
      const response = await api.post('/refresh', {
        refreshToken: localRefreshToken
      }, {
        withCredentials: true,
      });

      const { accessToken, refreshToken: newRefreshToken, user: userData } = response.data;

      if (accessToken) {
        logger.debug('[AuthContext] ✅ Silent refresh succeeded');
        setAuthToken(accessToken);

        // Store new refresh token in localStorage as backup for cross-domain setups
        if (newRefreshToken) {
          setRefreshToken(newRefreshToken);
        }

        // If user data was returned, use it directly
        if (userData) {
          setCurrentUser(userData);
        }

        return true;
      }

      return false;
    } catch (err) {
      // Expected to fail if no valid refresh token exists
      logger.debug('[AuthContext] Silent refresh failed (expected if not logged in):', err.message);
      return false;
    }
  }, []);

  /**
   * Verify auth state with backend
   * Uses Axios-based api.js for auth-critical flows (handles token refresh automatically)
   * 🔥 CRITICAL: This is the ONLY place that calls /auth/me on app load
   */
  const verifyAuth = useCallback(async () => {
    try {
      logger.debug('[AuthContext] 🔐 Starting auth verification...');

      // Check if we have a token before making the request
      let token = localStorage.getItem('token');

      // 🔥 NEW: If no access token, attempt silent refresh using httpOnly cookie
      // This restores sessions after browser restart, tab close, or PWA relaunch
      if (!token) {
        logger.debug('[AuthContext] No access token - attempting silent refresh...');
        const refreshed = await attemptSilentRefresh();

        if (refreshed) {
          // Silent refresh succeeded - we now have a token
          token = localStorage.getItem('token');
          logger.debug('[AuthContext] ✅ Session restored via silent refresh');
        } else {
          // No valid refresh token - user is truly unauthenticated
          logger.debug('[AuthContext] No valid session - marking unauthenticated');
          setUser(null);
          setAuthStatus(AUTH_STATES.UNAUTHENTICATED);
          markAuthStatusUnauthenticated();
          markAuthReady();
          sessionStorage.setItem('authReady', 'true');
          return { authenticated: false };
        }
      }

      // 🔥 Use Axios api.js for auth-critical flows (has token refresh interceptor)
      const response = await api.get('/auth/me');
      const userData = response.data;

      if (userData && userData._id) {
        setUser(userData);
        setCurrentUser(userData); // Sync to localStorage for other utils
        setAuthStatus(AUTH_STATES.AUTHENTICATED);
        markAuthStatusAuthenticated();
        markAuthReady();
        sessionStorage.setItem('authReady', 'true');
        setError(null);
        logger.debug('[AuthContext] ✅ User authenticated:', userData.username);

        // Initialize socket for authenticated user
        try {
          initializeSocket(userData._id);
        } catch (socketErr) {
          logger.warn('[AuthContext] Socket initialization failed:', socketErr);
        }

        return { authenticated: true, user: userData };
      } else {
        throw new Error('Invalid user data received');
      }
    } catch (err) {
      logger.error('[AuthContext] Auth verification failed:', err);

      // If 401, the interceptor already tried to refresh - user is truly unauthenticated
      setError(err);
      setUser(null);
      setAuthStatus(AUTH_STATES.UNAUTHENTICATED);
      markAuthStatusUnauthenticated();
      markAuthReady();
      sessionStorage.setItem('authReady', 'true');

      return { authenticated: false, error: err };
    }
  }, [attemptSilentRefresh]);

  /**
   * Login function - to be called after successful login API call
   * @param {Object} authData - { token, refreshToken, user }
   */
  const login = useCallback(async (authData) => {
    const { token, refreshToken, user: userData } = authData;

    logger.debug('[AuthContext] 🔑 Processing login...');

    // Store tokens
    if (token) {
      setAuthToken(token);
    }
    if (refreshToken) {
      setRefreshToken(refreshToken);
    }

    // Set user state
    if (userData) {
      setUser(userData);
      setCurrentUser(userData);
    }

    setAuthStatus(AUTH_STATES.AUTHENTICATED);
    markAuthStatusAuthenticated();
    markAuthReady();
    sessionStorage.setItem('authReady', 'true');
    setError(null);

    // Initialize socket
    if (userData?._id) {
      try {
        initializeSocket(userData._id);
      } catch (socketErr) {
        logger.warn('[AuthContext] Socket initialization failed:', socketErr);
      }
    }

    // Broadcast login to other tabs
    broadcastLogin();

    logger.debug('[AuthContext] ✅ Login complete:', userData?.username);
  }, []);

  /**
   * Logout function - clears all auth state and redirects to login
   */
  const logout = useCallback(async () => {
    logger.debug('[AuthContext] 🚪 Processing logout...');

    // Disconnect socket first
    try {
      disconnectSocket();
    } catch (err) {
      logger.warn('[AuthContext] Socket disconnect failed:', err);
    }

    // Clear context state
    setUser(null);
    setAuthStatus(AUTH_STATES.UNAUTHENTICATED);
    markAuthStatusUnauthenticated();
    resetAuthReady();
    sessionStorage.removeItem('authReady');
    clearCachePattern('/auth/me');

    // Use the auth utility logout (handles backend call and localStorage cleanup)
    await authLogout();

    logger.debug('[AuthContext] ✅ Logout complete');
  }, []);

  /**
   * Manually refresh the access token
   * Note: The api.js interceptor handles this automatically on 401
   */
  const refreshToken = useCallback(async () => {
    try {
      logger.debug('[AuthContext] 🔄 Manually refreshing token...');

      const currentRefreshToken = getRefreshToken();
      if (!currentRefreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post('/auth/refresh', {
        refreshToken: currentRefreshToken
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data;

      if (accessToken) {
        setAuthToken(accessToken);
        logger.debug('[AuthContext] ✅ Token refreshed');
      }

      if (newRefreshToken) {
        setRefreshToken(newRefreshToken);
      }

      return { success: true };
    } catch (err) {
      logger.error('[AuthContext] Token refresh failed:', err);

      // If refresh fails, user needs to re-login
      setUser(null);
      setAuthStatus(AUTH_STATES.UNAUTHENTICATED);
      markAuthStatusUnauthenticated();

      return { success: false, error: err };
    }
  }, []);

  /**
   * Refresh user data from API (bypasses cache)
   */
  const refreshUser = useCallback(async () => {
    clearCachePattern('/auth/me');
    return await verifyAuth();
  }, [verifyAuth]);

  /**
   * Update user data locally (optimistic update)
   */
  const updateUser = useCallback((updates) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      setCurrentUser(updated); // Sync to localStorage
      return updated;
    });
  }, []);

  /**
   * Clear user data (used by cross-tab sync)
   */
  const clearUser = useCallback(() => {
    setUser(null);
    setAuthStatus(AUTH_STATES.UNAUTHENTICATED);
    markAuthStatusUnauthenticated();
    resetAuthReady();
    sessionStorage.removeItem('authReady');
    clearCachePattern('/auth/me');
    logger.debug('[AuthContext] User cleared');
  }, []);

  // 🔥 SINGLE AUTH CHECK ON MOUNT
  useEffect(() => {
    let active = true;

    async function init() {
      await verifyAuth();
      if (!active) return;
    }

    init();

    return () => {
      active = false;
    };
  }, [verifyAuth]);

  // 🔥 CROSS-TAB AUTH SYNC
  useEffect(() => {
    const cleanup = listenForAuthEvents(async (type, data) => {
      logger.debug(`[AuthContext] Received cross-tab event: ${type}`);

      if (type === 'auth:login') {
        logger.debug('[AuthContext] Another tab logged in - rehydrating...');
        await refreshUser();
      } else if (type === 'auth:logout') {
        logger.debug('[AuthContext] Another tab logged out - clearing auth...');
        clearUser();

        // Redirect to login if on protected route
        const currentPath = window.location.pathname;
        const publicPaths = ['/login', '/register', '/', '/forgot-password', '/reset-password'];
        if (!publicPaths.includes(currentPath) && !currentPath.startsWith('/terms') && !currentPath.startsWith('/privacy')) {
          window.location.href = '/login';
        }
      }
    });

    return () => {
      cleanup();
      closeAuthSync();
    };
  }, [refreshUser, clearUser]);

  const value = {
    // Core state
    user,
    role,
    authStatus,
    error,

    // Derived state (backward compatibility)
    loading,
    authLoading,
    authReady,
    isAuthenticated,

    // Actions
    login,
    logout,
    refreshToken,
    refreshUser,
    updateUser,
    clearUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context
 * @returns {Object} Auth context value
 * @throws {Error} If used outside AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

/**
 * HOC to require authentication
 * Redirects to login if not authenticated
 * @deprecated Use PrivateRoute component instead for route-level protection
 */
export function withAuth(Component) {
  return function AuthenticatedComponent(props) {
    const { authStatus } = useAuth();

    if (authStatus === AUTH_STATES.LOADING) {
      return <div className="loading-spinner">Loading...</div>;
    }

    if (authStatus === AUTH_STATES.UNAUTHENTICATED) {
      // Redirect will be handled by PrivateRoute
      return null;
    }

    return <Component {...props} />;
  };
}
