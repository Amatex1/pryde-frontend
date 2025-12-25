/**
 * AUTH CIRCUIT BREAKER
 * 
 * Prevents continuous recovery loops by:
 * 1. Blocking non-critical requests until authReady === true
 * 2. Redefining auth instability triggers
 * 3. Single-shot recovery guard
 * 4. Separating push status from auth health
 * 5. Disabling auto-reload in dev mode
 */

import logger from './logger';

// ────────────────────────────────────────────────────────────
// 1) CIRCUIT BREAKER STATE
// ────────────────────────────────────────────────────────────

const circuitBreakerState = {
  authReady: false,
  hasTriggeredRecovery: false,
  bootstrapComplete: false,
  allowedEndpoints: new Set([
    '/api/auth/me',      // Bootstrap auth check
    '/version/status',   // PWA safety checks (must run before auth)
  ]),
  blockedEndpoints: new Set([
    '/api/push/status',
    '/api/notifications',
    '/api/counts',
    '/api/status',
  ]),
};

// ────────────────────────────────────────────────────────────
// 2) AUTH READY MANAGEMENT
// ────────────────────────────────────────────────────────────

/**
 * Mark auth as ready (called after bootstrap completes)
 */
export function markAuthReady() {
  circuitBreakerState.authReady = true;
  circuitBreakerState.bootstrapComplete = true;
  logger.info('[Circuit Breaker] ✅ Auth ready - allowing all requests');
}

/**
 * Check if auth is ready
 */
export function isAuthReady() {
  return circuitBreakerState.authReady;
}

/**
 * Reset auth ready state (for logout)
 */
export function resetAuthReady() {
  circuitBreakerState.authReady = false;
  circuitBreakerState.bootstrapComplete = false;
  logger.info('[Circuit Breaker] 🔄 Auth ready reset');
}

// ────────────────────────────────────────────────────────────
// 3) REQUEST BLOCKING LOGIC
// ────────────────────────────────────────────────────────────

/**
 * Check if a request should be blocked before auth is ready
 * 
 * @param {string} url - Request URL
 * @returns {boolean} True if request should be blocked
 */
export function shouldBlockRequest(url) {
  // Auth is ready - allow all requests
  if (circuitBreakerState.authReady) {
    return false;
  }

  // Check if this is an allowed endpoint (only /api/auth/me)
  const isAllowed = Array.from(circuitBreakerState.allowedEndpoints).some(
    endpoint => url.includes(endpoint)
  );

  if (isAllowed) {
    return false;
  }

  // Check if this is a blocked endpoint
  const isBlocked = Array.from(circuitBreakerState.blockedEndpoints).some(
    endpoint => url.includes(endpoint)
  );

  if (isBlocked) {
    logger.warn(`[Circuit Breaker] 🚫 Blocked request before auth ready: ${url}`);
    return true;
  }

  // Block all other API requests by default
  if (url.includes('/api/')) {
    logger.warn(`[Circuit Breaker] 🚫 Blocked API request before auth ready: ${url}`);
    return true;
  }

  return false;
}

// ────────────────────────────────────────────────────────────
// 4) AUTH INSTABILITY DETECTION
// ────────────────────────────────────────────────────────────

const instabilityState = {
  postAuthFailures: [],
  failureWindow: 60000, // 1 minute
  failureThreshold: 3,
};

/**
 * Record auth failure AFTER bootstrap
 * 
 * @param {string} endpoint - Failed endpoint
 * @param {number} statusCode - HTTP status code
 */
export function recordAuthFailure(endpoint, statusCode) {
  // Only track failures AFTER auth is ready
  if (!circuitBreakerState.bootstrapComplete) {
    logger.debug('[Circuit Breaker] Ignoring auth failure during bootstrap');
    return;
  }

  // Only track 401s on critical endpoints
  if (statusCode !== 401) {
    return;
  }

  // Only track failures on auth-critical endpoints
  const criticalEndpoints = ['/api/auth/me', '/api/refresh'];
  const isCritical = criticalEndpoints.some(ep => endpoint.includes(ep));

  if (!isCritical) {
    logger.debug('[Circuit Breaker] Ignoring 401 on non-critical endpoint:', endpoint);
    return;
  }

  const now = Date.now();
  instabilityState.postAuthFailures.push({
    endpoint,
    statusCode,
    timestamp: now,
  });

  // Clean up old failures
  instabilityState.postAuthFailures = instabilityState.postAuthFailures.filter(
    f => now - f.timestamp < instabilityState.failureWindow
  );

  logger.warn(
    `[Circuit Breaker] Auth failure recorded: ${endpoint} (${instabilityState.postAuthFailures.length}/${instabilityState.failureThreshold})`
  );

  // Check if we should trigger recovery
  if (instabilityState.postAuthFailures.length >= instabilityState.failureThreshold) {
    triggerAuthInstability();
  }
}

/**
 * Check if auth is unstable
 */
export function isAuthUnstable() {
  return instabilityState.postAuthFailures.length >= instabilityState.failureThreshold;
}

// ────────────────────────────────────────────────────────────
// 5) SINGLE-SHOT RECOVERY GUARD
// ────────────────────────────────────────────────────────────

/**
 * Trigger auth instability recovery (ONCE per session)
 */
function triggerAuthInstability() {
  // Check if recovery already triggered
  if (circuitBreakerState.hasTriggeredRecovery) {
    logger.warn('[Circuit Breaker] ⚠️ Recovery already triggered - ignoring');
    return;
  }

  // Mark recovery as triggered
  circuitBreakerState.hasTriggeredRecovery = true;

  logger.error('[Circuit Breaker] 🚨 AUTH INSTABILITY DETECTED');
  logger.error('[Circuit Breaker] Failures:', instabilityState.postAuthFailures);

  // In dev mode, just log - don't reload
  if (import.meta.env.DEV) {
    logger.warn('[Circuit Breaker] 🔧 DEV MODE: Recovery disabled - logging only');
    logger.warn('[Circuit Breaker] Would trigger recovery in production');
    return;
  }

  // In production, trigger recovery
  logger.error('[Circuit Breaker] 🔄 Triggering recovery...');

  // Clear auth state
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  sessionStorage.clear();

  // Redirect to login
  setTimeout(() => {
    window.location.href = '/login?reason=auth_instability';
  }, 1000);
}

/**
 * Check if recovery has been triggered
 */
export function hasTriggeredRecovery() {
  return circuitBreakerState.hasTriggeredRecovery;
}

/**
 * Reset recovery state (for testing only)
 */
export function resetRecoveryState() {
  circuitBreakerState.hasTriggeredRecovery = false;
  instabilityState.postAuthFailures = [];
  logger.info('[Circuit Breaker] 🔄 Recovery state reset');
}

// ────────────────────────────────────────────────────────────
// 6) PUSH STATUS SEPARATION
// ────────────────────────────────────────────────────────────

/**
 * Check if endpoint is push-related (should not affect auth)
 */
export function isPushEndpoint(url) {
  return url.includes('/api/push/');
}

/**
 * Handle push endpoint failure (silently)
 */
export function handlePushFailure(url, error) {
  logger.debug('[Circuit Breaker] Push endpoint failed (ignored):', url);
  // Do NOT trigger auth instability for push failures
}

// ────────────────────────────────────────────────────────────
// 7) DEBUG UTILITIES
// ────────────────────────────────────────────────────────────

/**
 * Get circuit breaker state (for debugging)
 */
export function getCircuitBreakerState() {
  return {
    authReady: circuitBreakerState.authReady,
    bootstrapComplete: circuitBreakerState.bootstrapComplete,
    hasTriggeredRecovery: circuitBreakerState.hasTriggeredRecovery,
    postAuthFailures: instabilityState.postAuthFailures.length,
    failureThreshold: instabilityState.failureThreshold,
  };
}

/**
 * Initialize circuit breaker
 */
export function initCircuitBreaker() {
  logger.info('[Circuit Breaker] 🛡️ Initializing auth circuit breaker...');

  // Expose debug utilities in dev mode
  if (import.meta.env.DEV) {
    window.authCircuitBreaker = {
      getState: getCircuitBreakerState,
      markReady: markAuthReady,
      reset: resetRecoveryState,
      isReady: isAuthReady,
      hasRecovered: hasTriggeredRecovery,
    };
    logger.info('[Circuit Breaker] 🔧 Debug utilities available: window.authCircuitBreaker');
  }
}


