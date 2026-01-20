/**
 * PWA-Safe Auth Bootstrap Flow
 * 
 * 🔥 CRITICAL: Enforces deterministic auth initialization
 * 
 * BOOT SEQUENCE (MANDATORY ORDER):
 * 1. App mounts
 * 2. authLoading = true
 * 3. Load token from storage
 * 4. IF no token:
 *    - authReady = true
 *    - authLoading = false
 *    - render logged-out UI
 * 5. IF token exists:
 *    - Attach token to API client
 *    - Call /api/auth/me ONCE
 * 6. IF /me succeeds:
 *    - hydrate user
 *    - authReady = true
 * 7. IF /me fails:
 *    - clear token
 *    - authReady = true
 * 8. authLoading = false
 * 9. ONLY NOW allow:
 *    - data fetches
 *    - sockets
 *    - polling
 * 
 * ABSOLUTE RULES:
 * - No retries
 * - No loops
 * - No auth calls before bootstrap completes
 */

import { apiFetch } from './apiClient';
import logger from './logger';
import { refreshSession } from './authLifecycle';
import { isManualLogout } from './auth';

// Bootstrap state (singleton)
let bootstrapState = {
  isBootstrapping: false,
  isComplete: false,
  user: null,
  error: null
};

/**
 * Get current bootstrap state
 */
export function getBootstrapState() {
  return { ...bootstrapState };
}

/**
 * Check if bootstrap is complete
 */
export function isBootstrapComplete() {
  return bootstrapState.isComplete;
}

/**
 * Execute PWA-safe auth bootstrap
 * 
 * @returns {Promise<{user: Object|null, error: Error|null}>}
 */
export async function executeAuthBootstrap() {
  // Prevent duplicate bootstrap
  if (bootstrapState.isBootstrapping) {
    logger.warn('[Bootstrap] Already bootstrapping - waiting for completion');
    return waitForBootstrap();
  }

  if (bootstrapState.isComplete) {
    logger.debug('[Bootstrap] Already complete - returning cached result');
    return {
      user: bootstrapState.user,
      error: bootstrapState.error
    };
  }

  bootstrapState.isBootstrapping = true;
  logger.info('[Bootstrap] 🚀 Starting PWA-safe auth bootstrap...');

  try {
    // STEP 1: Load token from storage
    let token = localStorage.getItem('token');

    // STEP 2: No token - attempt silent refresh before declaring logged out
    // 🔥 FIX: Access token may have expired but httpOnly refresh cookie might be valid
    if (!token) {
      // Skip silent refresh if user just manually logged out
      const wasManualLogout = isManualLogout();
      const isOnLoginPage = window.location.pathname === '/login' || window.location.pathname === '/register';

      if (wasManualLogout || isOnLoginPage) {
        logger.info('[Bootstrap] ❌ No token found (manual logout or login page) - user logged out');
        bootstrapState.user = null;
        bootstrapState.error = null;
        bootstrapState.isComplete = true;
        bootstrapState.isBootstrapping = false;
        sessionStorage.setItem('authReady', 'true');
        return { user: null, error: null };
      }

      // 🔥 Attempt silent refresh using httpOnly cookie
      logger.info('[Bootstrap] 🔄 No access token - attempting silent refresh via httpOnly cookie...');
      try {
        const newToken = await refreshSession();
        if (newToken) {
          token = newToken;
          logger.info('[Bootstrap] ✅ Silent refresh succeeded - session restored');
        } else {
          logger.info('[Bootstrap] ❌ Silent refresh failed - user logged out');
          bootstrapState.user = null;
          bootstrapState.error = null;
          bootstrapState.isComplete = true;
          bootstrapState.isBootstrapping = false;
          sessionStorage.setItem('authReady', 'true');
          return { user: null, error: null };
        }
      } catch (refreshError) {
        logger.info('[Bootstrap] ❌ Silent refresh error - user logged out:', refreshError.message);
        bootstrapState.user = null;
        bootstrapState.error = null;
        bootstrapState.isComplete = true;
        bootstrapState.isBootstrapping = false;
        sessionStorage.setItem('authReady', 'true');
        return { user: null, error: null };
      }
    }

    // STEP 3: Token exists - verify with /auth/me (ONCE, NO RETRIES)
    logger.info('[Bootstrap] 🔐 Token found - verifying with /auth/me...');
    
    try {
      const user = await apiFetch('/auth/me', {}, { cacheTtl: 0 }); // No cache for bootstrap
      
      if (user) {
        // STEP 4: Success - user authenticated
        logger.info('[Bootstrap] ✅ User authenticated:', user.username);
        bootstrapState.user = user;
        bootstrapState.error = null;
        bootstrapState.isComplete = true;
        bootstrapState.isBootstrapping = false;
        
        // Set authReady flag for dev warnings
        sessionStorage.setItem('authReady', 'true');
        
        return { user, error: null };
      } else {
        // STEP 5: /me returned null - clear token
        logger.warn('[Bootstrap] ⚠️ /auth/me returned null - clearing token');
        localStorage.removeItem('token');
        
        bootstrapState.user = null;
        bootstrapState.error = null;
        bootstrapState.isComplete = true;
        bootstrapState.isBootstrapping = false;
        
        // Set authReady flag for dev warnings
        sessionStorage.setItem('authReady', 'true');
        
        return { user: null, error: null };
      }
    } catch (error) {
      // STEP 6: /me failed - clear token (NO RETRY)
      logger.error('[Bootstrap] ❌ /auth/me failed - clearing token:', error);
      localStorage.removeItem('token');
      
      bootstrapState.user = null;
      bootstrapState.error = error;
      bootstrapState.isComplete = true;
      bootstrapState.isBootstrapping = false;
      
      // Set authReady flag for dev warnings
      sessionStorage.setItem('authReady', 'true');
      
      return { user: null, error };
    }
  } catch (error) {
    // Unexpected error during bootstrap
    logger.error('[Bootstrap] 💥 Unexpected bootstrap error:', error);
    
    bootstrapState.user = null;
    bootstrapState.error = error;
    bootstrapState.isComplete = true;
    bootstrapState.isBootstrapping = false;
    
    // Set authReady flag for dev warnings
    sessionStorage.setItem('authReady', 'true');
    
    return { user: null, error };
  }
}

/**
 * Wait for bootstrap to complete (if already in progress)
 */
async function waitForBootstrap() {
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      if (bootstrapState.isComplete) {
        clearInterval(checkInterval);
        resolve({
          user: bootstrapState.user,
          error: bootstrapState.error
        });
      }
    }, 50); // Check every 50ms
    
    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      logger.error('[Bootstrap] Timeout waiting for bootstrap');
      resolve({ user: null, error: new Error('Bootstrap timeout') });
    }, 10000);
  });
}

/**
 * Reset bootstrap state (for testing or logout)
 */
export function resetBootstrap() {
  logger.debug('[Bootstrap] Resetting bootstrap state');
  bootstrapState = {
    isBootstrapping: false,
    isComplete: false,
    user: null,
    error: null
  };
  sessionStorage.removeItem('authReady');
}

