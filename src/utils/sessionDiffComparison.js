/**
 * Session Diff Comparison
 * 
 * For clustered errors:
 * - Capture session snapshots (auth, cache, SW, online/offline, mutation queue)
 * - Diff failing sessions against healthy sessions
 * - Highlight what changed, what broke first, what correlates with failure
 * 
 * Outcome:
 * - Root causes emerge visually
 * - No guesswork debugging
 */

// Session snapshots storage
const sessionSnapshots = new Map();
const MAX_SNAPSHOTS = 100;

/**
 * Capture session snapshot
 */
export function captureSessionSnapshot(sessionId, status = 'healthy') {
  const snapshot = {
    sessionId,
    status, // 'healthy' or 'failed'
    timestamp: Date.now(),
    
    // Auth state
    auth: {
      isAuthenticated: !!localStorage.getItem('token'),
      authReady: window.__authReady || false,
      authLoading: window.__authLoading || false,
      userId: localStorage.getItem('userId') || null
    },
    
    // Cache state
    cache: {
      version: localStorage.getItem('pwa_cache_version') || 'unknown',
      hasCache: 'caches' in window
    },
    
    // Service worker state
    serviceWorker: {
      registered: !!navigator.serviceWorker?.controller,
      state: navigator.serviceWorker?.controller?.state || 'none',
      scriptURL: navigator.serviceWorker?.controller?.scriptURL || null
    },
    
    // Online/offline state
    network: {
      isOnline: navigator.onLine,
      effectiveType: navigator.connection?.effectiveType || 'unknown',
      downlink: navigator.connection?.downlink || null
    },
    
    // Mutation queue (if available)
    mutations: {
      pending: window.__mutationQueue?.pending || 0,
      failed: window.__mutationQueue?.failed || 0
    },
    
    // App state
    app: {
      version: import.meta.env.VITE_APP_VERSION || 'unknown',
      route: window.location.pathname,
      isPWA: window.matchMedia('(display-mode: standalone)').matches
    },
    
    // Performance
    performance: {
      memory: performance.memory ? {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      } : null,
      timing: {
        loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
        domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart
      }
    }
  };

  // Store snapshot
  sessionSnapshots.set(sessionId, snapshot);

  // Limit storage
  if (sessionSnapshots.size > MAX_SNAPSHOTS) {
    const oldestKey = sessionSnapshots.keys().next().value;
    sessionSnapshots.delete(oldestKey);
  }

  console.log(`[Session Diff] 📸 Captured ${status} session snapshot: ${sessionId}`);

  return snapshot;
}

/**
 * Compare two session snapshots
 */
export function compareSnapshots(snapshot1, snapshot2) {
  const differences = [];

  // Helper to compare nested objects
  function compareObjects(obj1, obj2, path = '') {
    for (const key in obj1) {
      const fullPath = path ? `${path}.${key}` : key;
      const val1 = obj1[key];
      const val2 = obj2[key];

      if (typeof val1 === 'object' && val1 !== null && typeof val2 === 'object' && val2 !== null) {
        compareObjects(val1, val2, fullPath);
      } else if (val1 !== val2) {
        differences.push({
          field: fullPath,
          value1: val1,
          value2: val2,
          changed: true
        });
      }
    }
  }

  compareObjects(snapshot1, snapshot2);

  return differences;
}

/**
 * Diff failing session against healthy sessions
 */
export function diffFailingSession(failingSessionId) {
  const failingSnapshot = sessionSnapshots.get(failingSessionId);

  if (!failingSnapshot) {
    console.log('[Session Diff] ❌ Failing session not found');
    return null;
  }

  // Get all healthy sessions
  const healthySessions = Array.from(sessionSnapshots.values())
    .filter(s => s.status === 'healthy')
    .sort((a, b) => b.timestamp - a.timestamp) // Most recent first
    .slice(0, 10); // Compare against last 10 healthy sessions

  if (healthySessions.length === 0) {
    console.log('[Session Diff] ⚠️ No healthy sessions to compare against');
    return {
      failingSnapshot,
      healthySnapshots: [],
      commonDifferences: [],
      uniqueDifferences: []
    };
  }

  // Compare failing session against each healthy session
  const allDifferences = healthySessions.map(healthySnapshot => ({
    healthySessionId: healthySnapshot.sessionId,
    differences: compareSnapshots(failingSnapshot, healthySnapshot)
  }));

  // Find common differences (appear in all comparisons)
  const commonDifferences = [];
  const differenceMap = new Map();

  allDifferences.forEach(({ differences }) => {
    differences.forEach(diff => {
      const count = differenceMap.get(diff.field) || 0;
      differenceMap.set(diff.field, count + 1);
    });
  });

  differenceMap.forEach((count, field) => {
    if (count === allDifferences.length) {
      const diff = allDifferences[0].differences.find(d => d.field === field);
      commonDifferences.push(diff);
    }
  });

  console.log(`[Session Diff] 🔍 Found ${commonDifferences.length} common differences`);

  return {
    failingSnapshot,
    healthySnapshots: healthySessions,
    commonDifferences,
    allDifferences
  };
}

/**
 * Get session snapshot
 */
export function getSessionSnapshot(sessionId) {
  return sessionSnapshots.get(sessionId);
}

/**
 * Get all session snapshots
 */
export function getAllSessionSnapshots() {
  return Array.from(sessionSnapshots.values());
}

console.log('[Session Diff] 🚀 Session diff comparison initialized');

