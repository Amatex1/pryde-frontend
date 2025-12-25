/**
 * Service Worker Auto-Disable on Auth Instability
 * 
 * 🔥 PHASE 3: AUTO-DISABLE SERVICE WORKER ON AUTH INSTABILITY
 * 
 * Self-healing PWA that automatically disables service worker
 * when auth instability is detected.
 * 
 * Monitors:
 * - Auth bootstrap failures
 * - Repeated /api/auth/me failures
 * - AuthReady loops
 * - ERR_FAILED on auth endpoints
 * 
 * Trigger conditions:
 * - Same auth failure occurs N times in one session
 * - Failure originates from fetch interception
 * - Service worker involved in request chain
 * 
 * When triggered:
 * - Automatically unregister service worker
 * - Clear SW caches
 * - Set SW_DISABLED_RECOVERY flag
 * - Reload app cleanly (network-only)
 * - Show calm banner
 */

const SW_DISABLED_RECOVERY_FLAG = 'sw_disabled_recovery';
const AUTH_FAILURE_THRESHOLD = 3; // Trigger after 3 failures
const AUTH_FAILURE_WINDOW = 60000; // 1 minute window

/**
 * Auth Failure Tracker
 */
class AuthFailureTracker {
  constructor() {
    this.failures = [];
    this.autoDisableTriggered = false;
  }

  /**
   * Record an auth failure
   */
  recordFailure(endpoint, error, swInvolved) {
    const failure = {
      endpoint,
      error: error?.message || 'Unknown error',
      swInvolved,
      timestamp: Date.now()
    };

    this.failures.push(failure);

    // Clean up old failures (outside window)
    this.cleanupOldFailures();

    console.warn(`[SW Auto-Disable] Auth failure recorded: ${endpoint} (SW involved: ${swInvolved})`);
    console.warn(`[SW Auto-Disable] Total failures in window: ${this.failures.length}/${AUTH_FAILURE_THRESHOLD}`);

    // Check if we should trigger auto-disable
    if (this.shouldTriggerAutoDisable()) {
      this.triggerAutoDisable();
    }
  }

  /**
   * Clean up failures outside the time window
   */
  cleanupOldFailures() {
    const now = Date.now();
    this.failures = this.failures.filter(f => now - f.timestamp < AUTH_FAILURE_WINDOW);
  }

  /**
   * Check if auto-disable should be triggered
   */
  shouldTriggerAutoDisable() {
    // Don't trigger if already triggered
    if (this.autoDisableTriggered) {
      return false;
    }

    // Don't trigger if below threshold
    if (this.failures.length < AUTH_FAILURE_THRESHOLD) {
      return false;
    }

    // Check if service worker was involved in failures
    const swInvolvedCount = this.failures.filter(f => f.swInvolved).length;
    
    if (swInvolvedCount === 0) {
      console.log('[SW Auto-Disable] Failures not related to service worker - skipping auto-disable');
      return false;
    }

    // Check if failures are for auth endpoints
    const authEndpointFailures = this.failures.filter(f => 
      f.endpoint.includes('/auth/') || 
      f.endpoint.includes('/me') ||
      f.endpoint.includes('/status')
    );

    if (authEndpointFailures.length < AUTH_FAILURE_THRESHOLD) {
      console.log('[SW Auto-Disable] Not enough auth endpoint failures - skipping auto-disable');
      return false;
    }

    return true;
  }

  /**
   * Trigger auto-disable
   */
  async triggerAutoDisable() {
    this.autoDisableTriggered = true;

    console.error('[SW Auto-Disable] 🚨 AUTO-DISABLE TRIGGERED');
    console.error('[SW Auto-Disable] Auth instability detected - disabling service worker');
    console.error('[SW Auto-Disable] Failures:', this.failures);

    try {
      // Step 1: Unregister all service workers
      await this.unregisterAllServiceWorkers();

      // Step 2: Clear all caches
      await this.clearAllCaches();

      // Step 3: Set recovery flag
      localStorage.setItem(SW_DISABLED_RECOVERY_FLAG, 'true');
      localStorage.setItem('sw_disabled_reason', JSON.stringify({
        reason: 'auth_instability',
        failures: this.failures.length,
        timestamp: Date.now()
      }));

      // Step 4: Show calm banner
      this.showRecoveryBanner();

      // Step 5: Reload app cleanly (network-only)
      console.log('[SW Auto-Disable] 🔄 Reloading app in network-only mode...');
      setTimeout(() => {
        window.location.reload();
      }, 2000); // Give user time to see banner

    } catch (error) {
      console.error('[SW Auto-Disable] ❌ Error during auto-disable:', error);
    }
  }

  /**
   * Unregister all service workers
   */
  async unregisterAllServiceWorkers() {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    const registrations = await navigator.serviceWorker.getRegistrations();
    console.log(`[SW Auto-Disable] Unregistering ${registrations.length} service worker(s)...`);

    await Promise.all(registrations.map(reg => reg.unregister()));
    console.log('[SW Auto-Disable] ✅ All service workers unregistered');
  }

  /**
   * Clear all caches
   */
  async clearAllCaches() {
    if (!('caches' in window)) {
      return;
    }

    const cacheNames = await caches.keys();
    console.log(`[SW Auto-Disable] Clearing ${cacheNames.length} cache(s)...`);

    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('[SW Auto-Disable] ✅ All caches cleared');
  }

  /**
   * Show recovery banner
   */
  showRecoveryBanner() {
    // Create banner element
    const banner = document.createElement('div');
    banner.id = 'sw-recovery-banner';
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #ff9800;
      color: white;
      padding: 16px;
      text-align: center;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      z-index: 999999;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    banner.innerHTML = `
      <strong>We disabled offline mode to restore stability.</strong>
      <br>
      <small>The app will reload in a moment...</small>
    `;

    document.body.appendChild(banner);
  }

  /**
   * Get failure report
   */
  getReport() {
    return {
      failures: this.failures,
      autoDisableTriggered: this.autoDisableTriggered,
      threshold: AUTH_FAILURE_THRESHOLD,
      window: AUTH_FAILURE_WINDOW
    };
  }

  /**
   * Reset tracker
   */
  reset() {
    this.failures = [];
    this.autoDisableTriggered = false;
    console.log('[SW Auto-Disable] Tracker reset');
  }
}

// Global tracker instance
const authFailureTracker = new AuthFailureTracker();

/**
 * Check if service worker is disabled due to recovery
 */
export function isSWDisabledForRecovery() {
  return localStorage.getItem(SW_DISABLED_RECOVERY_FLAG) === 'true';
}

/**
 * Get recovery reason
 */
export function getRecoveryReason() {
  const reason = localStorage.getItem('sw_disabled_reason');
  return reason ? JSON.parse(reason) : null;
}

/**
 * Clear recovery flag (for manual re-enable)
 */
export function clearRecoveryFlag() {
  localStorage.removeItem(SW_DISABLED_RECOVERY_FLAG);
  localStorage.removeItem('sw_disabled_reason');
  console.log('[SW Auto-Disable] Recovery flag cleared - SW will be enabled on next load');
}

/**
 * Monitor fetch for auth failures
 */
export function monitorAuthFailures() {
  // Intercept fetch to detect auth failures
  const originalFetch = window.fetch;

  window.fetch = async function(...args) {
    const [resource, options] = args;
    const url = typeof resource === 'string' ? resource : resource.url;

    try {
      const response = await originalFetch.apply(this, args);

      // Check if this is an auth endpoint
      const isAuthEndpoint = url.includes('/api/auth/') ||
                             url.includes('/me') ||
                             url.includes('/status');

      // Check if request failed
      if (isAuthEndpoint && !response.ok && response.status !== 401) {
        // Check if service worker was involved
        const swInvolved = navigator.serviceWorker && navigator.serviceWorker.controller;

        // Record failure (but not 401s - those are normal)
        authFailureTracker.recordFailure(url, new Error(`HTTP ${response.status}`), swInvolved);
      }

      return response;
    } catch (error) {
      // Check if this is an auth endpoint
      const isAuthEndpoint = url.includes('/api/auth/') ||
                             url.includes('/me') ||
                             url.includes('/status');

      if (isAuthEndpoint) {
        // Check if service worker was involved
        const swInvolved = navigator.serviceWorker && navigator.serviceWorker.controller;

        // Record failure
        authFailureTracker.recordFailure(url, error, swInvolved);
      }

      throw error;
    }
  };

  console.log('[SW Auto-Disable] 🔍 Auth failure monitoring enabled');
}

/**
 * Get failure tracker report
 */
export function getFailureReport() {
  return authFailureTracker.getReport();
}

/**
 * Reset failure tracker
 */
export function resetFailureTracker() {
  authFailureTracker.reset();
}

/**
 * Initialize SW auto-disable
 */
export function initSWAutoDisable() {
  console.log('[SW Auto-Disable] 🛡️ Initializing auto-disable protection...');

  // Check if SW was disabled for recovery
  if (isSWDisabledForRecovery()) {
    const reason = getRecoveryReason();
    console.warn('[SW Auto-Disable] ⚠️ Service worker disabled for recovery');
    console.warn('[SW Auto-Disable] Reason:', reason);

    // Show persistent banner
    showPersistentRecoveryBanner(reason);
  }

  // Start monitoring auth failures
  monitorAuthFailures();

  // Expose utilities globally (for debugging)
  if (import.meta.env.DEV) {
    window.swAutoDisable = {
      getReport: getFailureReport,
      reset: resetFailureTracker,
      clearRecoveryFlag,
      isDisabled: isSWDisabledForRecovery,
      getReason: getRecoveryReason
    };
  }

  console.log('[SW Auto-Disable] ✅ Auto-disable protection initialized');
}

/**
 * Show persistent recovery banner
 */
function showPersistentRecoveryBanner(reason) {
  const banner = document.createElement('div');
  banner.id = 'sw-recovery-banner-persistent';
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #ff9800;
    color: white;
    padding: 12px 16px;
    text-align: center;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 13px;
    z-index: 999999;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  `;
  banner.innerHTML = `
    <strong>Offline mode is disabled to maintain stability.</strong>
    <button id="sw-recovery-dismiss" style="
      margin-left: 12px;
      background: rgba(255,255,255,0.2);
      border: 1px solid white;
      color: white;
      padding: 4px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    ">Dismiss</button>
  `;

  document.body.appendChild(banner);

  // Add dismiss handler
  document.getElementById('sw-recovery-dismiss')?.addEventListener('click', () => {
    banner.remove();
  });
}


