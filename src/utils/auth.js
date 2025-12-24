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

export const logout = async () => {
  // Set flag to indicate manual logout (not session expiration)
  sessionStorage.setItem('manualLogout', 'true');

  // 🔥 CRITICAL: Mark as unauthenticated FIRST to prevent redirects
  try {
    const { markUnauthenticated } = await import('../state/authStatus');
    markUnauthenticated();
  } catch (error) {
    console.error('Failed to mark unauthenticated:', error);
  }

  // 🔥 CRITICAL: Disconnect socket SECOND to prevent zombie sockets
  try {
    const { disconnectSocketForLogout } = await import('./socket');
    disconnectSocketForLogout();
  } catch (error) {
    // Silently fail - socket might not be initialized
  }

  // Call backend logout endpoint to invalidate refresh token
  // Backend will also force disconnect the socket from server side
  try {
    // Import api dynamically to avoid circular dependency
    const { default: api } = await import('./api');
    await api.post('/auth/logout').catch(() => {
      // Silently fail - we'll clear local state anyway
    });
  } catch (error) {
    // Silently fail - we'll clear local state anyway
  }

  // Clear all local auth state
  localStorage.removeItem('token');
  localStorage.removeItem('tokenSetTime');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  sessionStorage.clear();

  // Clear all draft data
  try {
    const { clearAllDrafts } = await import('./draftStore');
    clearAllDrafts();
    console.log('🗑️ Cleared all draft data on logout');
  } catch (error) {
    console.error('Failed to clear drafts:', error);
  }

  // Immediately redirect to login to prevent flash of protected content
  window.location.href = '/login';
};

export const isManualLogout = () => {
  return sessionStorage.getItem('manualLogout') === 'true';
};

export const clearManualLogoutFlag = () => {
  sessionStorage.removeItem('manualLogout');
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};

/**
 * Refresh the access token before an update reload
 * This ensures the user stays logged in after the app reloads
 */
export async function refreshAccessToken() {
  try {
    // Import api dynamically to avoid circular dependency
    const { default: api } = await import('./api');
    const response = await api.post('/auth/refresh');

    // If new tokens are returned, store them
    if (response.data?.token) {
      setAuthToken(response.data.token);
    }
    if (response.data?.refreshToken) {
      setRefreshToken(response.data.refreshToken);
    }

    console.log('✅ Token refreshed before update');
  } catch (err) {
    console.warn('⚠️ Token refresh failed during update:', err.message);
    // Don't throw - we still want to reload even if refresh fails
  }
}
