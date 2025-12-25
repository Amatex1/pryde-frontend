/**
 * AuthContext - Centralized Authentication State Management
 * 
 * CRITICAL: This context prevents duplicate /auth/me calls across the app.
 * All components should use useAuth() instead of fetching user data directly.
 * 
 * Features:
 * - Single source of truth for user data
 * - Automatic hydration on mount
 * - Cached responses (5 min TTL)
 * - Loading state management
 * - Prevents request storms
 * 
 * Usage:
 * import { useAuth } from '../context/AuthContext';
 * 
 * function MyComponent() {
 *   const { user, loading, refreshUser } = useAuth();
 *   
 *   if (loading) return <div>Loading...</div>;
 *   if (!user) return <div>Not logged in</div>;
 *   
 *   return <div>Hello {user.username}</div>;
 * }
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiFetch, clearCachePattern } from '../utils/apiClient';
import { listenForAuthEvents, closeAuthSync } from '../utils/authSync'; // 🔥 NEW: Cross-tab sync
import logger from '../utils/logger';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authReady, setAuthReady] = useState(false); // Auth ready gate
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Auth state
  const [authLoading, setAuthLoading] = useState(true); // 🔥 NEW: Global auth loading state

  /**
   * Hydrate user data from API
   * Uses apiFetch with 5-minute cache to prevent duplicate requests
   * 🔥 CRITICAL: This is the FIRST protected call - sets authLoading = false when done
   */
  const hydrate = useCallback(async () => {
    try {
      logger.debug('[AuthContext] 🔐 Starting auth verification...');
      setAuthLoading(true); // Start loading

      // Check if we have a token before making the request
      const token = localStorage.getItem('token');
      if (!token) {
        logger.debug('[AuthContext] No token found - marking unauthenticated');
        setUser(null);
        setIsAuthenticated(false);
        setAuthReady(true);
        setAuthLoading(false); // 🔥 Auth verification complete
        setLoading(false);
        return;
      }

      // 🔥 CRITICAL: /auth/me is ALWAYS the first protected call
      const data = await apiFetch(
        '/auth/me',
        {},
        { cacheTtl: 300_000 } // 5 minutes
      );

      if (data) {
        setUser(data);
        setIsAuthenticated(true);
        setAuthReady(true); // Auth is ready after successful fetch
        setAuthLoading(false); // 🔥 Auth verification complete
        sessionStorage.setItem('authReady', 'true'); // 🔥 DEV: Set flag for dev warnings
        setError(null);
        logger.debug('[AuthContext] ✅ User authenticated:', data.username);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setAuthReady(true);
        setAuthLoading(false); // 🔥 Auth verification complete
        sessionStorage.setItem('authReady', 'true'); // 🔥 DEV: Set flag for dev warnings
        logger.debug('[AuthContext] ❌ Not authenticated');
      }
    } catch (err) {
      logger.error('[AuthContext] Auth verification failed:', err);
      setError(err);
      setUser(null);
      setIsAuthenticated(false);
      setAuthReady(true); // Still mark as ready even on error
      setAuthLoading(false); // 🔥 Auth verification complete (even on error)
      sessionStorage.setItem('authReady', 'true'); // 🔥 DEV: Set flag for dev warnings
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh user data (bypasses cache)
   */
  const refreshUser = useCallback(async () => {
    // Clear auth cache to force fresh fetch
    clearCachePattern('/auth/me');
    setLoading(true);
    await hydrate();
  }, [hydrate]);

  /**
   * Update user data locally (optimistic update)
   */
  const updateUser = useCallback((updates) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  /**
   * Clear user data (on logout)
   */
  const clearUser = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    setAuthReady(false); // Reset auth ready on logout
    setAuthLoading(false); // Reset auth loading
    setLoading(false);
    sessionStorage.removeItem('authReady'); // 🔥 DEV: Clear flag for dev warnings
    clearCachePattern('/auth/me');
    logger.debug('[AuthContext] User cleared');
  }, []);

  // Hydrate on mount
  useEffect(() => {
    let active = true;

    async function init() {
      await hydrate();
      if (!active) return;
    }

    init();

    return () => {
      active = false;
    };
  }, [hydrate]);

  // 🔥 CROSS-TAB AUTH SYNC: Listen for auth events from other tabs
  useEffect(() => {
    const cleanup = listenForAuthEvents(async (type, data) => {
      logger.debug(`[AuthContext] Received cross-tab event: ${type}`);

      if (type === 'auth:login') {
        // Another tab logged in - rehydrate auth
        logger.debug('[AuthContext] Another tab logged in - rehydrating...');
        await refreshUser();
      } else if (type === 'auth:logout') {
        // Another tab logged out - clear auth
        logger.debug('[AuthContext] Another tab logged out - clearing auth...');
        clearUser();

        // Redirect to login if not already there
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/') {
          window.location.href = '/login';
        }
      }
    });

    // Cleanup on unmount
    return () => {
      cleanup();
      closeAuthSync();
    };
  }, [refreshUser, clearUser]);

  const value = {
    user,
    loading,
    error,
    authReady, // Expose auth ready state
    isAuthenticated, // Expose auth state
    authLoading, // 🔥 NEW: Expose global auth loading state
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
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

/**
 * HOC to require authentication
 * Redirects to login if not authenticated
 */
export function withAuth(Component) {
  return function AuthenticatedComponent(props) {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
      if (!loading && !user) {
        navigate('/login');
      }
    }, [user, loading, navigate]);

    if (loading) {
      return <div className="loading-spinner">Loading...</div>;
    }

    if (!user) {
      return null;
    }

    return <Component {...props} />;
  };
}

