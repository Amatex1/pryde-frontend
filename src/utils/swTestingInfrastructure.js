/**
 * Service Worker Testing Infrastructure
 * 
 * 🔥 PHASE 2: SAFE SERVICE WORKER BEHAVIOR TESTING
 * 
 * DEV-ONLY instrumentation for:
 * - Logging all SW interceptions
 * - Detecting API handling regressions
 * - Manual test hooks
 * - Checklist enforcement
 */

const SW_TEST_FLAG = 'sw_test_mode';
const SW_DISABLED_FLAG = 'sw_disabled_manual';

/**
 * SW Interception Logger
 * Logs when service worker intercepts a request
 */
class SWInterceptionLogger {
  constructor() {
    this.interceptions = [];
    this.apiInterceptions = [];
    this.enabled = false;
  }

  enable() {
    this.enabled = true;
    console.log('[SW Test] 📊 Interception logging enabled');
  }

  disable() {
    this.enabled = false;
    console.log('[SW Test] 📊 Interception logging disabled');
  }

  logInterception(url, bypassed, reason) {
    if (!this.enabled) return;

    const interception = {
      url,
      bypassed,
      reason,
      timestamp: Date.now()
    };

    this.interceptions.push(interception);

    // Check if this is an API request
    const isApiRequest = url.includes('/api/') || url.includes('/auth/') || 
                         url.includes('/me') || url.includes('/status');

    if (isApiRequest) {
      this.apiInterceptions.push(interception);

      if (!bypassed) {
        // 🚨 HARD WARNING: Service worker attempted to handle API request
        console.error(`🚨 [SW Test] REGRESSION: Service worker handled API request: ${url}`);
        console.error(`🚨 [SW Test] Reason: ${reason}`);
        console.trace('[SW Test] Stack trace:');
      } else {
        console.log(`✅ [SW Test] API request correctly bypassed: ${url} (${reason})`);
      }
    } else {
      console.log(`[SW Test] Request ${bypassed ? 'bypassed' : 'handled'}: ${url} (${reason})`);
    }
  }

  getReport() {
    return {
      totalInterceptions: this.interceptions.length,
      // Numeric count of API interceptions (kept separate from the full list)
      apiInterceptionCount: this.apiInterceptions.length,
      apiHandled: this.apiInterceptions.filter(i => !i.bypassed).length,
      apiBypassed: this.apiInterceptions.filter(i => i.bypassed).length,
      interceptions: this.interceptions,
      apiInterceptions: this.apiInterceptions
    };
  }

  clear() {
    this.interceptions = [];
    this.apiInterceptions = [];
    console.log('[SW Test] 📊 Interception log cleared');
  }
}

// Global logger instance
const swLogger = new SWInterceptionLogger();

/**
 * Manual Test Hooks
 * Provides manual controls for testing SW behavior
 */
export const swTestHooks = {
  /**
   * Toggle service worker on/off
   */
  async toggleSW(enable) {
    if (enable) {
      localStorage.removeItem(SW_DISABLED_FLAG);
      console.log('[SW Test] 🔄 Service worker enabled - reload to activate');
      window.location.reload();
    } else {
      localStorage.setItem(SW_DISABLED_FLAG, 'true');
      await this.unregisterSW();
      console.log('[SW Test] ⏸️ Service worker disabled');
    }
  },

  /**
   * Check if SW is manually disabled
   */
  isSWDisabled() {
    return localStorage.getItem(SW_DISABLED_FLAG) === 'true';
  },

  /**
   * Force service worker update
   */
  async forceSWUpdate() {
    if (!('serviceWorker' in navigator)) {
      console.log('[SW Test] Service workers not supported');
      return;
    }

    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      console.log('[SW Test] 🔄 Forcing service worker update...');
      await registration.update();
      console.log('[SW Test] ✅ Service worker update complete');
    } else {
      console.log('[SW Test] No service worker registered');
    }
  },

  /**
   * Force cache clear
   */
  async forceCacheClear() {
    if (!('caches' in window)) {
      console.log('[SW Test] Cache API not supported');
      return;
    }

    const cacheNames = await caches.keys();
    console.log(`[SW Test] 🗑️ Clearing ${cacheNames.length} cache(s)...`);

    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('[SW Test] ✅ All caches cleared');
  },

  /**
   * Unregister service worker
   */
  async unregisterSW() {
    if (!('serviceWorker' in navigator)) {
      console.log('[SW Test] Service workers not supported');
      return;
    }

    const registrations = await navigator.serviceWorker.getRegistrations();
    console.log(`[SW Test] 🗑️ Unregistering ${registrations.length} service worker(s)...`);

    await Promise.all(registrations.map(reg => reg.unregister()));
    console.log('[SW Test] ✅ All service workers unregistered');
  },

  /**
   * Simulate offline mode
   */
  simulateOffline(offline) {
    if (offline) {
      console.log('[SW Test] 📴 Simulating offline mode...');
      console.log('[SW Test] Note: Use DevTools Network tab to actually go offline');
    } else {
      console.log('[SW Test] 📶 Simulating online mode...');
    }
  },

  /**
   * Get interception report
   */
  getReport() {
    return swLogger.getReport();
  },

  /**
   * Clear interception log
   */
  clearLog() {
    swLogger.clear();
  },

  /**
   * Enable interception logging
   */
  enableLogging() {
    swLogger.enable();
  },

  /**
   * Disable interception logging
   */
  disableLogging() {
    swLogger.disable();
  }
};

/**
 * Checklist Enforcement
 * Ensures auth bootstrap works with and without SW
 */
export class SWAuthChecklist {
  constructor() {
    this.results = {
      swEnabled: null,
      swDisabled: null
    };
  }

  async testAuthWithSW() {
    console.log('[SW Test] 🧪 Testing auth bootstrap with SW enabled...');

    try {
      // This should be called after auth bootstrap completes
      const authReady = window.__authReady || false;
      const authUser = window.__authUser || null;

      this.results.swEnabled = {
        success: authReady,
        user: authUser,
        timestamp: Date.now()
      };

      if (authReady) {
        console.log('[SW Test] ✅ Auth bootstrap succeeded with SW enabled');
      } else {
        console.error('[SW Test] ❌ Auth bootstrap failed with SW enabled');
      }

      return authReady;
    } catch (error) {
      console.error('[SW Test] ❌ Error testing auth with SW:', error);
      this.results.swEnabled = {
        success: false,
        error: error.message,
        timestamp: Date.now()
      };
      return false;
    }
  }

  async testAuthWithoutSW() {
    console.log('[SW Test] 🧪 Testing auth bootstrap with SW disabled...');

    try {
      // This should be called after auth bootstrap completes
      const authReady = window.__authReady || false;
      const authUser = window.__authUser || null;

      this.results.swDisabled = {
        success: authReady,
        user: authUser,
        timestamp: Date.now()
      };

      if (authReady) {
        console.log('[SW Test] ✅ Auth bootstrap succeeded with SW disabled');
      } else {
        console.error('[SW Test] ❌ Auth bootstrap failed with SW disabled');
      }

      return authReady;
    } catch (error) {
      console.error('[SW Test] ❌ Error testing auth without SW:', error);
      this.results.swDisabled = {
        success: false,
        error: error.message,
        timestamp: Date.now()
      };
      return false;
    }
  }

  checkBehaviorIdentical() {
    if (!this.results.swEnabled || !this.results.swDisabled) {
      console.warn('[SW Test] ⚠️ Cannot check behavior - missing test results');
      return false;
    }

    const identical = this.results.swEnabled.success === this.results.swDisabled.success;

    if (identical) {
      console.log('[SW Test] ✅ Behavior is identical with and without SW');
    } else {
      console.error('[SW Test] ❌ Behavior differs with and without SW');
      console.error('[SW Test] SW enabled:', this.results.swEnabled);
      console.error('[SW Test] SW disabled:', this.results.swDisabled);
    }

    return identical;
  }

  getResults() {
    return this.results;
  }
}

/**
 * Initialize SW testing infrastructure (DEV-ONLY)
 */
export function initSWTestingInfrastructure() {
  if (import.meta.env.PROD) {
    console.log('[SW Test] Skipping in production mode');
    return;
  }

  console.log('[SW Test] 🔧 Initializing SW testing infrastructure...');

  // Enable interception logging
  swLogger.enable();

  // Listen for messages from service worker
  if (navigator.serviceWorker) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'FETCH_BYPASSED') {
        swLogger.logInterception(event.data.url, true, event.data.reason);
      } else if (event.data && event.data.type === 'FETCH_HANDLED') {
        swLogger.logInterception(event.data.url, false, event.data.reason);
      }
    });
  }

  // Expose test hooks globally (DEV-ONLY)
  window.swTest = swTestHooks;
  window.swAuthChecklist = new SWAuthChecklist();

  console.log('[SW Test] ✅ SW testing infrastructure initialized');
  console.log('[SW Test] 📖 Available commands:');
  console.log('[SW Test]   - window.swTest.toggleSW(true/false)');
  console.log('[SW Test]   - window.swTest.forceSWUpdate()');
  console.log('[SW Test]   - window.swTest.forceCacheClear()');
  console.log('[SW Test]   - window.swTest.getReport()');
  console.log('[SW Test]   - window.swAuthChecklist.testAuthWithSW()');
  console.log('[SW Test]   - window.swAuthChecklist.checkBehaviorIdentical()');
}


