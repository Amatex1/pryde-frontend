export const setAuthToken = (token) => {
  if (token) {
    console.log('🔑 Setting access token (first 20 chars):', token.substring(0, 20) + '...');
    console.log('⏰ Token set at:', new Date().toISOString());
    localStorage.setItem('token', token);
    localStorage.setItem('tokenSetTime', Date.now().toString());
  } else {
    console.log('🗑️ Removing access token');
    localStorage.removeItem('token');
    localStorage.removeItem('tokenSetTime');
  }
};

export const setRefreshToken = (token) => {
  if (token) {
    console.log('🔄 Setting refresh token (first 20 chars):', token.substring(0, 20) + '...');
    localStorage.setItem('refreshToken', token);
  } else {
    console.log('🗑️ Removing refresh token');
    localStorage.removeItem('refreshToken');
  }
};

export const getRefreshToken = () => {
  return localStorage.getItem('refreshToken');
};

export const getAuthToken = () => {
  const token = localStorage.getItem('token');
  const tokenSetTime = localStorage.getItem('tokenSetTime');

  if (token && tokenSetTime) {
    const ageMinutes = (Date.now() - parseInt(tokenSetTime)) / 1000 / 60;

    // Only log if token is expired (> 15 minutes) to reduce console noise
    if (ageMinutes > 15) {
      console.warn(`⚠️ Access token expired (${ageMinutes.toFixed(1)} minutes old) - will refresh on next API call`);
    }
  }

  return token;
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
  localStorage.removeItem('token');
  localStorage.removeItem('tokenSetTime');
  localStorage.removeItem('refreshToken');
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
 * 🔥 httpOnly cookie is the SINGLE SOURCE OF TRUTH
 */
export async function refreshAccessToken() {
  try {
    // Import api dynamically to avoid circular dependency
    const { default: api } = await import('./api');

    // Get localStorage token as OPTIONAL fallback (httpOnly cookie is primary)
    const localRefreshToken = getRefreshToken();

    // 🔥 ALWAYS call /refresh - let the httpOnly cookie authenticate
    const response = await api.post('/refresh', {
      // Send localStorage token only if available (optional backup)
      ...(localRefreshToken && { refreshToken: localRefreshToken })
    }, {
      withCredentials: true // 🔥 CRITICAL: Sends httpOnly cookie automatically
    });

    // If new tokens are returned, store them
    if (response.data?.accessToken || response.data?.token) {
      setAuthToken(response.data.accessToken || response.data.token);
    }
    if (response.data?.refreshToken) {
      setRefreshToken(response.data.refreshToken);
    }

    console.log('✅ Token refreshed before update via httpOnly cookie');
  } catch (err) {
    console.warn('⚠️ Token refresh failed during update:', err.message);
    // Don't throw - we still want to reload even if refresh fails
  }
}
