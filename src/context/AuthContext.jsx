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
import logger from '../utils/logger';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Hydrate user data from API
   * Uses apiFetch with 5-minute cache to prevent duplicate requests
   */
  const hydrate = useCallback(async () => {
    try {
      logger.debug('[AuthContext] Hydrating user data...');
      
      const data = await apiFetch(
        '/auth/me',
        {},
        { cacheTtl: 300_000 } // 5 minutes
      );

      if (data) {
        setUser(data);
        setError(null);
        logger.debug('[AuthContext] User hydrated:', data.username);
      } else {
        setUser(null);
        logger.debug('[AuthContext] No user data (not authenticated)');
      }
    } catch (err) {
      logger.error('[AuthContext] Hydration failed:', err);
      setError(err);
      setUser(null);
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
    setLoading(false);
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

  const value = {
    user,
    loading,
    error,
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

