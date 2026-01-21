// ═══════════════════════════════════════════════════════════════════════════
// 🔐 SECURITY HARDENING: In-Memory Token Storage
// ═══════════════════════════════════════════════════════════════════════════
// Access tokens now stored ONLY in memory - NOT localStorage
// This protects against XSS attacks that could steal tokens from localStorage
// On page reload, silent refresh via httpOnly cookie restores the session
// ═══════════════════════════════════════════════════════════════════════════

// Module-level in-memory store (not accessible to XSS)
let inMemoryAccessToken = null;
let tokenSetTime = null;

export const setAuthToken = (token) => {
  if (token) {
    console.log('🔑 Setting access token (in-memory only)');
    inMemoryAccessToken = token;
    tokenSetTime = Date.now();
    // Also clear any legacy localStorage token
    localStorage.removeItem('token');
    localStorage.removeItem('tokenSetTime');
  } else {
    console.log('🗑️ Clearing access token from memory');
    inMemoryAccessToken = null;
    tokenSetTime = null;
    // Also clear any legacy localStorage token
    localStorage.removeItem('token');
    localStorage.removeItem('tokenSetTime');
  }
};

// 🔐 SECURITY: Refresh tokens are stored ONLY in httpOnly cookies
// These functions are DEPRECATED - kept for backward compatibility but do nothing
export const setRefreshToken = (token) => {
  // NO-OP: Refresh tokens no longer stored in localStorage
  // They are stored in httpOnly cookies by the backend
  if (token) {
    console.debug('⚠️ setRefreshToken called but localStorage storage disabled (httpOnly cookie is sole source)');
  }
};

export const getRefreshToken = () => {
  // Always return null - refresh tokens come from httpOnly cookie only
  // The cookie is sent automatically via credentials: 'include'
  return null;
};

export const getAuthToken = () => {
  // First check in-memory token
  if (inMemoryAccessToken) {
    if (tokenSetTime) {
      const ageMinutes = (Date.now() - tokenSetTime) / 1000 / 60;
      // Only log if token is expired (> 15 minutes) to reduce console noise
      if (ageMinutes > 15) {
        console.warn(`⚠️ Access token expired (${ageMinutes.toFixed(1)} minutes old) - will refresh on next API call`);
      }
    }
    return inMemoryAccessToken;
  }

  // Fallback: Check for legacy localStorage token (migration path)
  // This handles the case where user had token in localStorage before upgrade
  const legacyToken = localStorage.getItem('token');
  if (legacyToken) {
    console.log('📦 Migrating legacy token from localStorage to memory');
    inMemoryAccessToken = legacyToken;
    tokenSetTime = parseInt(localStorage.getItem('tokenSetTime') || Date.now().toString());
    // Clear localStorage after migration
    localStorage.removeItem('token');
    localStorage.removeItem('tokenSetTime');
    return inMemoryAccessToken;
  }

  return null;
};

// Clear all tokens (used during logout)
export const clearAllTokens = () => {
  inMemoryAccessToken = null;
  tokenSetTime = null;
  localStorage.removeItem('token');
  localStorage.removeItem('tokenSetTime');
  localStorage.removeItem('refreshToken');
};

export const setCurrentUser = (user) => {
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    localStorage.removeItem('user');
  }
};

export const getCurrentUser = () => {
  try {
    const user = localStorage.getItem('user');
    if (!user) return null;

    const parsedUser = JSON.parse(user);

    // Validate that the parsed user is an object with expected properties
    if (!parsedUser || typeof parsedUser !== 'object') {
      console.warn('Invalid user data in localStorage, clearing...');
      localStorage.removeItem('user');
      return null;
    }

    return parsedUser;
  } catch (error) {
    console.error('Error parsing user from localStorage:', error);
    // Clear corrupted data
    localStorage.removeItem('user');
    return null;
  }
};

// Global flag to track logout state
let isLoggingOut = false;

export const logout = async () => {
  // Prevent duplicate logout calls
  if (isLoggingOut) {
    console.log('🚫 Logout already in progress');
    return;
  }

  isLoggingOut = true;
  console.log('🚪 Starting logout process...');

  // Set flag to indicate manual logout (not session expiration)
  sessionStorage.setItem('manualLogout', 'true');

  // 🔥 STEP 0: Broadcast logout to other tabs
  try {
    const { broadcastLogout } = await import('./authSync');
    broadcastLogout();
    console.log('✅ Broadcasted logout to other tabs');
  } catch (error) {
    console.error('Failed to broadcast logout:', error);
  }

  // 🔥 STEP 1: Mark as unauthenticated FIRST to prevent new requests
  try {
    const { markUnauthenticated } = await import('../state/authStatus');
    markUnauthenticated();
    console.log('✅ Marked as unauthenticated');
  } catch (error) {
    console.error('Failed to mark unauthenticated:', error);
  }

  // 🔥 STEP 2: Clear AuthContext to stop authenticated effects
  try {
    // This will be called by components using useAuth
    console.log('✅ Auth context will be cleared by components');
  } catch (error) {
    console.error('Failed to clear auth context:', error);
  }

  // 🔥 STEP 3: Abort all in-flight requests
  try {
    const { abortAllRequests } = await import('./apiClient');
    if (abortAllRequests) {
      abortAllRequests();
      console.log('✅ Aborted in-flight requests');
    }
  } catch (error) {
    // Function might not exist yet - that's okay
    console.debug('No abort function available');
  }

  // 🔥 STEP 4: Disconnect socket to prevent reconnection
  try {
    const { disconnectSocketForLogout } = await import('./socket');
    disconnectSocketForLogout();
    console.log('✅ Socket disconnected');
  } catch (error) {
    // Silently fail - socket might not be initialized
    console.debug('Socket disconnect skipped');
  }

  // 🔥 STEP 5: Stop auth lifecycle refresh interval
  try {
    const { cleanupAuthLifecycle } = await import('./authLifecycle');
    cleanupAuthLifecycle();
    console.log('✅ Auth lifecycle stopped');
  } catch (error) {
    console.debug('Auth lifecycle cleanup skipped');
  }

  // 🔥 STEP 6: Clear all local auth state BEFORE backend call
  clearAllTokens(); // Clears in-memory and localStorage tokens
  localStorage.removeItem('user');
  console.log('✅ Local auth state cleared');

  // 🔥 STEP 7: Call backend logout endpoint (best effort)
  try {
    const { default: api } = await import('./api');
    await api.post('/auth/logout').catch(() => {
      // Silently fail - we've already cleared local state
    });
    console.log('✅ Backend logout called');
  } catch (error) {
    // Silently fail - we've already cleared local state
    console.debug('Backend logout skipped');
  }

  // 🔥 STEP 8: Clear all caches
  try {
    const { clearCache } = await import('./apiClient');
    if (clearCache) {
      clearCache();
      console.log('✅ API cache cleared');
    }
  } catch (error) {
    console.debug('Cache clear skipped');
  }

  // 🔥 STEP 9: Clear all draft data
  try {
    const { clearAllDrafts } = await import('./draftStore');
    clearAllDrafts();
    console.log('✅ Draft data cleared');
  } catch (error) {
    console.error('Failed to clear drafts:', error);
  }

  // 🔥 STEP 10: Clear all mutation guard tracked entities
  try {
    const { clearAllEntities } = await import('./mutationGuard');
    clearAllEntities();
    console.log('✅ Mutation guard cleared');
  } catch (error) {
    console.error('Failed to clear mutation guard:', error);
  }

  // 🔥 STEP 11: Clear session storage
  sessionStorage.clear();
  console.log('✅ Session storage cleared');

  console.log('🎉 Logout complete - redirecting to login');

  // Reset logout flag before redirect
  isLoggingOut = false;

  // Immediately redirect to login to prevent flash of protected content
  window.location.href = '/login';
};

export const isManualLogout = () => {
  return sessionStorage.getItem('manualLogout') === 'true';
};

export const clearManualLogoutFlag = () => {
  sessionStorage.removeItem('manualLogout');
};

export const getIsLoggingOut = () => {
  return isLoggingOut;
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};

/**
 * Refresh the access token before an update reload
 * This ensures the user stays logged in after the app reloads
 *
 * 🔐 SECURITY: httpOnly cookie is the SINGLE SOURCE OF TRUTH
 * No refresh token is sent in request body - cookie only
 */
export async function refreshAccessToken() {
  try {
    // Import api dynamically to avoid circular dependency
    const { default: api } = await import('./api');

    // 🔐 SECURITY: Call /refresh with NO body - httpOnly cookie is sole source
    const response = await api.post('/refresh', {}, {
      withCredentials: true // CRITICAL: Sends httpOnly cookie automatically
    });

    // Store new access token (returned in JSON body)
    if (response.data?.accessToken || response.data?.token) {
      setAuthToken(response.data.accessToken || response.data.token);
    }
    // Note: refreshToken no longer returned in body - cookie is updated by backend

    console.log('✅ Token refreshed before update via httpOnly cookie');
  } catch (err) {
    console.warn('⚠️ Token refresh failed during update:', err.message);
    // Don't throw - we still want to reload even if refresh fails
  }
}
