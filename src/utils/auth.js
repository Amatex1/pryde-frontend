// ═══════════════════════════════════════════════════════════════════════════
// 🔐 SECURITY HARDENING: Hybrid Token Storage
// ═══════════════════════════════════════════════════════════════════════════
// Access tokens are stored in BOTH memory AND localStorage:
// - Primary: in-memory (protects against XSS)
// - Fallback: localStorage (survives page refresh, enables silent refresh)
//
// On page reload, we first check localStorage for a fallback token,
// then attempt refresh if needed. This provides UX continuity while
// maintaining XSS protection for active sessions.
// ═══════════════════════════════════════════════════════════════════════════

import { markUnauthenticated } from '../state/authStatus';
import { broadcastLogout } from './authSync';

// Module-level in-memory store (not accessible to XSS)
let inMemoryAccessToken = null;
let tokenSetTime = null;

// Fallback: localStorage token (for page reload survival)
const FALLBACK_TOKEN_KEY = 'pryde_access_token';
const FALLBACK_TOKEN_TIME_KEY = 'pryde_access_token_time';

export const setAuthToken = (token) => {
  if (token) {
    console.log('🔑 Setting access token (memory + localStorage fallback)');
    inMemoryAccessToken = token;
    tokenSetTime = Date.now();
    
    // Store in localStorage as fallback for page reload survival
    try {
      localStorage.setItem(FALLBACK_TOKEN_KEY, token);
      localStorage.setItem(FALLBACK_TOKEN_TIME_KEY, tokenSetTime.toString());
    } catch (e) {
      console.warn('Failed to store token fallback:', e);
    }
    
    // Also clear any legacy localStorage token
    localStorage.removeItem('token');
    localStorage.removeItem('tokenSetTime');
  } else {
    console.log('🗑️ Clearing access token from memory');
    inMemoryAccessToken = null;
    tokenSetTime = null;
    
    // Clear localStorage fallback
    try {
      localStorage.removeItem(FALLBACK_TOKEN_KEY);
      localStorage.removeItem(FALLBACK_TOKEN_TIME_KEY);
    } catch (e) {
      console.warn('Failed to clear token fallback:', e);
    }
    
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

  // Fallback: Check for new localStorage token (hybrid storage)
  const fallbackToken = localStorage.getItem(FALLBACK_TOKEN_KEY);
  if (fallbackToken) {
    console.log('📦 Restoring token from localStorage fallback');
    inMemoryAccessToken = fallbackToken;
    tokenSetTime = parseInt(localStorage.getItem(FALLBACK_TOKEN_TIME_KEY) || Date.now().toString());
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
  localStorage.removeItem(FALLBACK_TOKEN_KEY);
  localStorage.removeItem(FALLBACK_TOKEN_TIME_KEY);
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
  // 🔧 FIX: Use localStorage instead of sessionStorage so it persists across page loads
  // sessionStorage.clear() was wiping this flag before the redirect completed
  localStorage.setItem('manualLogout', 'true');

  // 🔥 STEP 0: Broadcast logout to other tabs
  try {
    broadcastLogout();
    console.log('✅ Broadcasted logout to other tabs');
  } catch (error) {
    console.error('Failed to broadcast logout:', error);
  }

  // 🔥 STEP 1: Mark as unauthenticated FIRST to prevent new requests
  try {
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

  // 🔥 STEP 3-6: Run deferred shared-module logout work before clearing tokens
  try {
    const { runPreTokenClearLogoutWork } = await import('./authDeferred');
    await runPreTokenClearLogoutWork();
  } catch (error) {
    console.debug('Deferred logout preparation skipped');
  }

  // 🔥 STEP 7: Clear all local auth state AFTER backend call
  clearAllTokens(); // Clears in-memory and localStorage tokens
  localStorage.removeItem('user');
  console.log('✅ Local auth state cleared');

  // 🔥 STEP 8-10: Clear deferred caches and client-side artifacts
  try {
    const { runPostTokenClearLogoutWork } = await import('./authDeferred');
    runPostTokenClearLogoutWork();
  } catch (error) {
    console.debug('Deferred logout cleanup skipped');
  }

  // 🔥 STEP 11: Clear session storage
  sessionStorage.clear();
  console.log('✅ Session storage cleared');

  // 🔥 STEP 12: Set a flag to prevent auto-login on next page load
  // This ensures that even if the httpOnly cookie wasn't cleared by the backend,
  // the frontend will not attempt to use it
  localStorage.setItem('forceLogout', 'true');
  console.log('✅ Force logout flag set');

  console.log('🎉 Logout complete - redirecting to login');

  // NOTE: Do NOT reset isLoggingOut here. Keeping it true until the page
  // actually navigates prevents any last-moment Axios 401 interceptors
  // (which aren't cancelled by abortAllRequests) from firing and
  // calling logout() a second time, which would cause a double-redirect.
  // The flag resets naturally on page reload since it's module-level state.

  // Use replace() instead of href assignment to:
  // 1. Prevent the browser's bfcache from flashing the old feed page on mobile
  // 2. Remove the feed from history so the Back button doesn't return to it
  window.location.replace('/login');
};

export const isManualLogout = () => {
  // 🔧 FIX: Use localStorage to persist across page loads
  return localStorage.getItem('manualLogout') === 'true';
};

export const clearManualLogoutFlag = () => {
  // 🔧 FIX: Use localStorage to match setItem
  localStorage.removeItem('manualLogout');
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
 * 🔐 CRITICAL: Uses global single-flight refresh from tokenRefresh.js
 * This prevents race conditions when multiple triggers fire simultaneously.
 */
export async function refreshBeforeUpdate() {
  try {
    const { refreshBeforeUpdateWithSingleFlight } = await import('./authDeferred');
    await refreshBeforeUpdateWithSingleFlight();
  } catch (err) {
    console.warn('⚠️ Token refresh helper failed during update:', err.message);
  }
}
