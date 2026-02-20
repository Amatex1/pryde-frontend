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
  getAuthToken,
  setAuthToken,
  setCurrentUser,
  clearAllTokens,
  logout as authLogout,
  isManualLogout
} from '../utils/auth';
import { refreshAccessToken } from '../utils/tokenRefresh'; // 🔐 Global single-flight refresh
import { listenForAuthEvents, closeAuthSync, broadcastLogin, broadcastLogout } from '../utils/authSync';
import { clearCachePattern } from '../utils/apiClient';
import logger from '../utils/logger';
import { markAuthReady, resetAuthReady } from '../utils/authCircuitBreaker';
import {
  AUTH_STATUS,
  markAuthenticated as markAuthStatusAuthenticated,
  markUnauthenticated as markAuthStatusUnauthenticated
} from '../state/authStatus';
import { initializeSocket, disconnectSocket, disconnectSocketForLogout } from '../utils/socket';
import { applyUserTheme } from '../utils/themeManager';

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

  // ======================================================
  // 🔐 AUTHORITATIVE READY SIGNAL (RACE CONDITION FIX)
  // isAuthReady = true ONLY when:
  // - login() completes successfully
  // - OR initial silent refresh attempt completes (success OR failure)
  //
  // CRITICAL: This gates ALL protected behavior:
  // - Token refresh (authLifecycle.js)
  // - Protected API calls (useUnreadMessages, preloaders)
  // - Socket connection
  // ======================================================
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Derived state for backward compatibility
  const loading = authStatus === AUTH_STATES.LOADING;
  const authLoading = authStatus === AUTH_STATES.LOADING;
  const authReady = authStatus !== AUTH_STATES.LOADING; // Keep for backward compat
  const isAuthenticated = authStatus === AUTH_STATES.AUTHENTICATED;

  // ======================================================
  // 🔍 AUTH VERIFICATION DIAGNOSTIC (PART 1)
  // Attach auth state to window for debugging - DEV ONLY
  // ======================================================
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    window.__PRYDE_AUTH__ = {
      authStatus,
      isAuthReady, // Now uses explicit state, not derived
      hasAccessToken: !!getAuthToken(),
      timestamp: new Date().toISOString()
    };
  }

  // Derive role from user object
  const role = useMemo(() => user?.role || null, [user]);

  /**
   * Attempt silent token refresh using httpOnly cookie
   *
   * 🔐 CRITICAL: Uses global single-flight refresh from tokenRefresh.js
   * This prevents race conditions when multiple triggers fire simultaneously.
   *
   * @returns {boolean} true if refresh succeeded
   */
  const attemptSilentRefresh = useCallback(async () => {
    try {
      logger.debug('[AuthContext] 🔄 Attempting silent token refresh via global single-flight...');

      // 🔐 CRITICAL: Use global single-flight refresh to prevent race conditions
      const accessToken = await refreshAccessToken();

      if (accessToken) {
        logger.debug('[AuthContext] ✅ Silent refresh succeeded');
        return true;
      }

      logger.debug('[AuthContext] ❌ Silent refresh returned null - no valid session');
      return false;
    } catch (err) {
      // Expected to fail if no valid session exists (no cookie, user logged out, etc.)
      logger.debug('[AuthContext] ❌ Silent refresh threw error:', err.message);
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
      // 🔐 SECURITY: Uses in-memory token storage (not localStorage)
      let token = getAuthToken();

      // 🔥 Validate token format - clear if empty/malformed
      if (token && (token === 'undefined' || token === 'null' || token.trim() === '')) {
        logger.debug('[AuthContext] Invalid token format detected - clearing');
        setAuthToken(null);
        token = null;
      }

      // 🔥 NEW: If no access token, attempt silent refresh using httpOnly cookie
      // This restores sessions after browser restart, tab close, or PWA relaunch
      if (!token) {
        // 🔥 CRITICAL: Skip silent refresh if user just logged out manually
        // This prevents unnecessary 401 errors on the login page
        const wasManualLogout = isManualLogout();
        const forceLogout = localStorage.getItem('forceLogout') === 'true';
        const isOnLoginPage = window.location.pathname === '/login' || window.location.pathname === '/register';

        if (wasManualLogout || forceLogout || isOnLoginPage) {
          logger.debug('[AuthContext] Skipping silent refresh (manual logout, force logout, or login page)');
          // Clear the force logout flag after checking it
          if (forceLogout) {
            localStorage.removeItem('forceLogout');
          }
          setUser(null);
          setCurrentUser(null); // Clear localStorage user
          clearAllTokens(); // Clear any stale tokens
          setAuthStatus(AUTH_STATES.UNAUTHENTICATED);
          markAuthStatusUnauthenticated();
          markAuthReady();
          sessionStorage.setItem('authReady', 'true');
          setIsAuthReady(true); // 🔐 Auth resolution complete
          return { authenticated: false };
        }

        logger.debug('[AuthContext] No access token - attempting silent refresh...');
        const refreshed = await attemptSilentRefresh();

        if (refreshed) {
          // Silent refresh succeeded - we now have a token in memory
          token = getAuthToken();
          logger.debug('[AuthContext] ✅ Session restored via silent refresh');
        } else {
          // No valid refresh token - user is truly unauthenticated
          logger.debug('[AuthContext] 🚪 Silent refresh failed - setting UNAUTHENTICATED');

          // 🔥 CRITICAL: Clear ALL cached user data to prevent stale state
          setUser(null);
          setCurrentUser(null); // Clear localStorage user
          clearAllTokens(); // Clear any stale tokens

          setAuthStatus(AUTH_STATES.UNAUTHENTICATED);
          markAuthStatusUnauthenticated();
          markAuthReady();
          sessionStorage.setItem('authReady', 'true');
          setIsAuthReady(true); // 🔐 Auth resolution complete

          return { authenticated: false };
        }
      }

      // 🔥 Double-check we have a valid token before calling /auth/me
      if (!token) {
        logger.debug('[AuthContext] No token after refresh attempt - skipping /auth/me');
        setUser(null);
        setAuthStatus(AUTH_STATES.UNAUTHENTICATED);
        markAuthStatusUnauthenticated();
        markAuthReady();
        sessionStorage.setItem('authReady', 'true');
        setIsAuthReady(true); // 🔐 Auth resolution complete
        return { authenticated: false };
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
        setIsAuthReady(true); // 🔐 Auth resolution complete - GATES ALL PROTECTED BEHAVIOR
        setError(null);
        logger.debug('[AuthContext] ✅ User authenticated:', userData.username);

        // Initialize socket for authenticated user
        // 🔐 Socket now knows isAuthReady=true, so it will connect
        try {
          initializeSocket(userData._id, {
            isAuthReady: true,
            authStatus: 'authenticated'
          });
        } catch (socketErr) {
          logger.warn('[AuthContext] Socket initialization failed:', socketErr);
        }

        // 🎨 THEME PERSISTENCE: Apply user's theme from backend settings
        // This ensures theme persists across page refresh and devices
        applyUserTheme(userData);

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
      setIsAuthReady(true); // 🔐 Auth resolution complete (even on failure)

      return { authenticated: false, error: err };
    }
  }, [attemptSilentRefresh]);

  /**
   * Login function - to be called after successful login API call
   * @param {Object} authData - { token, user, countryCode } (refreshToken now stored only in httpOnly cookie)
   */
  const login = useCallback(async (authData) => {
    const { token, accessToken, user: userData, countryCode } = authData;

    // 🔍 AUTH VERIFICATION DIAGNOSTIC - Log login start
    if (process.env.NODE_ENV === 'development') {
      console.log('[AUTH VERIFY] 🔑 Login starting:', {
        authStatus,
        isAuthReady, // Now uses explicit state
        hasToken: !!(token || accessToken),
        hasUser: !!userData,
        countryCode,
        time: new Date().toISOString()
      });
    }

    logger.debug('[AuthContext] 🔑 Processing login...');

    // Store access token (from JSON body)
    const tokenToStore = token || accessToken;
    if (tokenToStore) {
      setAuthToken(tokenToStore);
    }

    // 🌍 Store countryCode for SafetyWarning (from backend geolocation, avoids CORS issues)
    if (countryCode) {
      try {
        localStorage.setItem('pryde_user_country', countryCode);
        logger.debug('[AuthContext] 🌍 Stored countryCode:', countryCode);
      } catch (e) {
        logger.warn('[AuthContext] Failed to store countryCode:', e);
      }
    }

    // 🔐 SECURITY: refreshToken no longer stored in localStorage
    // It's stored in httpOnly cookie by the backend

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

    // Fetch CSRF token after login AND get full user data with privacySettings
    try {
      logger.debug('[AuthContext] 🛡️ Fetching CSRF token after login...');
      const meResponse = await api.get('/auth/me');
      logger.debug('[AuthContext] ✅ CSRF token obtained');
      
      // Update userData with full data from /auth/me (includes privacySettings)
      const fullUserData = meResponse.data;
      if (fullUserData && fullUserData._id) {
        setUser(fullUserData);
        setCurrentUser(fullUserData);
        
        // 🎨 THEME PERSISTENCE: Apply user's theme from backend settings
        // This ensures theme persists across login and devices
        applyUserTheme(fullUserData);
      }
    } catch (csrfErr) {
      logger.warn('[AuthContext] ⚠️ CSRF token fetch failed (non-blocking):', csrfErr.message);
      
      // Still try to apply theme from login response userData
      applyUserTheme(userData);
    }

    // 🔐 CRITICAL: Set isAuthReady AFTER CSRF token fetch (before socket init)
    // This gates all protected behavior including socket connection
    setIsAuthReady(true);

    // Initialize socket (now isAuthReady=true)
    if (userData?._id) {
      try {
        initializeSocket(userData._id, {
          isAuthReady: true,
          authStatus: 'authenticated'
        });
      } catch (socketErr) {
        logger.warn('[AuthContext] Socket initialization failed:', socketErr);
      }
    }

    // Broadcast login to other tabs
    broadcastLogin();

    // 🎨 THEME PERSISTENCE: Apply user's theme from backend settings
    // This ensures theme persists across login and devices
    applyUserTheme(userData);

    // 🔍 AUTH VERIFICATION DIAGNOSTIC - Log login complete
    if (process.env.NODE_ENV === 'development') {
      console.log('[AUTH VERIFY] ✅ Login complete:', {
        authStatus: AUTH_STATES.AUTHENTICATED,
        isAuthReady: true,
        username: userData?.username,
        time: new Date().toISOString()
      });
    }

    logger.debug('[AuthContext] ✅ Login complete:', userData?.username);
  }, []);

  /**
   * Logout function - clears all auth state and redirects to login
   */
  const logout = useCallback(async () => {
    logger.debug('[AuthContext] 🚪 Processing logout...');

    // Disconnect socket first
    // 🔥 CRITICAL: Use logout-safe disconnect to prevent reconnection
    try {
      disconnectSocketForLogout();
    } catch (err) {
      logger.warn('[AuthContext] Socket disconnect failed:', err);
    }

    // Clear context state
    setUser(null);
    setAuthStatus(AUTH_STATES.UNAUTHENTICATED);
    markAuthStatusUnauthenticated();
    resetAuthReady();
    sessionStorage.removeItem('authReady');
    // 🔐 NOTE: Do NOT reset isAuthReady on logout
    // isAuthReady means "auth resolution has completed" not "user is authenticated"
    // After logout, we know auth state (unauthenticated) so isAuthReady stays true
    clearCachePattern('/auth/me');

    // Use the auth utility logout (handles backend call and localStorage cleanup)
    await authLogout();

    logger.debug('[AuthContext] ✅ Logout complete');
  }, []);

  /**
   * Manually refresh the access token
   * Note: The api.js interceptor handles this automatically on 401
   *
   * 🔐 CRITICAL: Uses global single-flight refresh from tokenRefresh.js
   */
  const refreshToken = useCallback(async () => {
    try {
      logger.debug('[AuthContext] 🔄 Manually refreshing token via global single-flight...');

      // 🔐 CRITICAL: Use global single-flight refresh to prevent race conditions
      const accessToken = await refreshAccessToken();

      if (accessToken) {
        logger.debug('[AuthContext] ✅ Token refreshed');
        return { success: true };
      }

      // No token returned - refresh failed
      throw new Error('No access token from refresh');
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

  // ======================================================
  // 🔐 AUTH STATE SNAPSHOT (REQUIRED FOR AUTH GATES)
  // This MUST be set in ALL environments - socket.js, authLifecycle.js,
  // resourcePreloader.js, etc. depend on this for auth readiness checks
  // ======================================================
  useEffect(() => {
    // 🔐 CRITICAL: Update window snapshot in ALL environments (not just dev)
    // This is required for auth gates in socket.js, authLifecycle.js, etc.
    if (typeof window !== 'undefined') {
      window.__PRYDE_AUTH__ = {
        authStatus,
        isAuthReady,
        hasAccessToken: !!getAuthToken(),
        timestamp: new Date().toISOString()
      };
    }

    // Diagnostic logging (dev only)
    if (process.env.NODE_ENV === 'development') {
      console.log('[AUTH VERIFY] 🔄 authStatus changed:', {
        authStatus,
        isAuthReady,
        hasAccessToken: !!getAuthToken(),
        hasUser: !!user,
        time: new Date().toISOString()
      });
    }
  }, [authStatus, isAuthReady, user]);

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

  // 🔥 PROACTIVE TOKEN REFRESH - Refresh token every 10 minutes while authenticated
  // This prevents session expiration during long idle periods (e.g., overnight)
  // NOTE: Visibility change refresh is handled by authLifecycle.js with socket coordination
  useEffect(() => {
    if (authStatus !== AUTH_STATES.AUTHENTICATED) return;

    const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes
    let refreshTimer = null;

    const proactiveRefresh = async () => {
      try {
        logger.debug('[AuthContext] ⏰ Proactive token refresh...');
        const success = await attemptSilentRefresh();
        if (!success) {
          logger.warn('[AuthContext] Proactive refresh failed - will retry on next interval');
        }
      } catch (err) {
        logger.warn('[AuthContext] Proactive refresh error:', err.message);
      }
    };

    // Start the refresh timer
    refreshTimer = setInterval(proactiveRefresh, REFRESH_INTERVAL);

    // 🔥 REMOVED: Visibility change handler
    // Now handled by authLifecycle.js with proper socket coordination
    // to prevent 401 errors on tab switch (socket waits for token refresh)

    return () => {
      if (refreshTimer) clearInterval(refreshTimer);
    };
  }, [authStatus, attemptSilentRefresh]);

  const value = {
    // Core state
    user,
    role,
    authStatus,
    error,

    // 🔐 AUTHORITATIVE READY SIGNAL (RACE CONDITION FIX)
    // isAuthReady = true ONLY when auth resolution is complete
    // Use this to gate ALL protected behavior
    isAuthReady,

    // Derived state (backward compatibility)
    loading,
    authLoading,
    authReady, // DEPRECATED: Use isAuthReady instead
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
