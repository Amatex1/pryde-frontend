/**
 * Consistency Guard - Dev-Mode Runtime Guards
 *
 * Provides dev-only runtime checks to catch state-persistence bugs
 * BEFORE they reach production. These guards help ensure:
 *
 * 1. UI state is never mutated without an API request
 * 2. API responses match expected UI state
 * 3. Deleted entities don't reappear
 * 4. Refresh never "fixes" bugs
 *
 * In production, all guards are no-ops for performance.
 *
 * MUTATION TRACE ID FLOW:
 * Frontend generates mutationId → Backend includes in response → Compare
 */

import logger from './logger';

const isDev = import.meta.env.DEV;

// ═══════════════════════════════════════════════════════════════════
// MUTATION TRACE ID GENERATION
// ═══════════════════════════════════════════════════════════════════

/**
 * Generate a unique mutation trace ID
 * Format: mut_<timestamp>_<random>
 */
export function generateMutationId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `mut_${timestamp}_${random}`;
}

// Track mutations for debugging
const mutationLog = [];
const MAX_LOG_SIZE = 100;

/**
 * Log a mutation for debugging purposes
 */
function logMutation(type, entity, data) {
  if (!isDev) return;
  
  const entry = {
    timestamp: new Date().toISOString(),
    type,
    entity,
    data,
    stack: new Error().stack?.split('\n').slice(2, 5).join('\n'),
  };
  
  mutationLog.push(entry);
  if (mutationLog.length > MAX_LOG_SIZE) {
    mutationLog.shift();
  }
}

/**
 * Get recent mutations for debugging
 */
export function getMutationLog() {
  return [...mutationLog];
}

/**
 * Clear mutation log
 */
export function clearMutationLog() {
  mutationLog.length = 0;
}

// ═══════════════════════════════════════════════════════════════════
// CORE GUARDS
// ═══════════════════════════════════════════════════════════════════

/**
 * Guard: Warn when UI mutates without API
 * 
 * Call this BEFORE any optimistic update to register intent.
 * If the API is never called, this will warn in dev mode.
 */
const pendingMutations = new Map();

export function registerMutationIntent(mutationId, entityType, action) {
  if (!isDev) return;
  
  pendingMutations.set(mutationId, {
    entityType,
    action,
    timestamp: Date.now(),
    resolved: false,
  });
  
  // Check after 5 seconds if mutation was resolved
  setTimeout(() => {
    const mutation = pendingMutations.get(mutationId);
    if (mutation && !mutation.resolved) {
      console.warn(
        `⚠️ [CONSISTENCY] Non-persistent UI mutation detected!\n` +
        `Entity: ${entityType}\n` +
        `Action: ${action}\n` +
        `This change may be lost on refresh.`
      );
      logger.warn(`Non-persistent mutation: ${entityType}.${action}`);
    }
    pendingMutations.delete(mutationId);
  }, 5000);
}

export function resolveMutationIntent(mutationId) {
  if (!isDev) return;
  
  const mutation = pendingMutations.get(mutationId);
  if (mutation) {
    mutation.resolved = true;
  }
}

/**
 * Guard: Assert backend was called before state update
 * 
 * Use this in reducers/state updates to ensure API was called first.
 */
export function assertBackendFirst(mutationId, action) {
  if (!isDev) return true;
  
  const mutation = pendingMutations.get(mutationId);
  if (!mutation) {
    console.error(
      `❌ [CONSISTENCY VIOLATION] State updated without registered mutation!\n` +
      `Action: ${action}\n` +
      `This is a bug - state should only update after API call.`
    );
    return false;
  }
  return true;
}

/**
 * Guard: Warn if deleted entity still exists in backend
 * 
 * After delete, optionally verify the entity is truly gone.
 */
export async function verifyDeletion(entityType, id, fetchFn) {
  if (!isDev) return;
  
  try {
    await fetchFn(id);
    // If we got here, the entity still exists!
    console.error(
      `❌ [CONSISTENCY VIOLATION] Deleted ${entityType} still exists!\n` +
      `ID: ${id}\n` +
      `The backend did not properly delete this entity.`
    );
    logger.error(`Delete verification failed: ${entityType} ${id} still exists`);
  } catch (error) {
    // 404 is expected - entity was deleted
    if (error.response?.status === 404) {
      logger.debug(`✅ [VERIFY] ${entityType} ${id} properly deleted`);
    } else {
      // Some other error - might be a problem
      logger.warn(`⚠️ [VERIFY] Could not verify deletion of ${entityType} ${id}`, error);
    }
  }
}

/**
 * Guard: Compare UI state with server state
 */
export function detectStateMismatch(entityType, localState, serverState, idField = '_id') {
  if (!isDev) return { matches: true, mismatches: [] };
  
  const mismatches = [];
  
  // Check for items in local but not in server (ghost data)
  const serverIds = new Set(serverState.map(item => item[idField]));
  localState.forEach(item => {
    if (!serverIds.has(item[idField])) {
      mismatches.push({
        type: 'ghost',
        entity: entityType,
        id: item[idField],
        message: `${entityType} ${item[idField]} exists in UI but not on server (ghost data)`,
      });
    }
  });

  // Check for items in server but not in local (missing data)
  const localIds = new Set(localState.map(item => item[idField]));
  serverState.forEach(item => {
    if (!localIds.has(item[idField])) {
      mismatches.push({
        type: 'missing',
        entity: entityType,
        id: item[idField],
        message: `${entityType} ${item[idField]} exists on server but not in UI`,
      });
    }
  });

  if (mismatches.length > 0) {
    console.warn(
      `⚠️ [CONSISTENCY] State mismatch detected for ${entityType}:\n`,
      mismatches.map(m => m.message).join('\n')
    );
  }

  return { matches: mismatches.length === 0, mismatches };
}

// ═══════════════════════════════════════════════════════════════════
// REFRESH DETECTION
// ═══════════════════════════════════════════════════════════════════

let preRefreshState = null;
const REFRESH_STATE_KEY = '__pryde_pre_refresh_state__';

/**
 * Capture state before refresh for comparison
 * Stores in sessionStorage to survive page refresh
 */
export function capturePreRefreshState(state) {
  if (!isDev) return;

  const snapshot = {
    timestamp: Date.now(),
    state: JSON.parse(JSON.stringify(state)),
  };

  preRefreshState = snapshot;

  // Also store in sessionStorage to survive actual page refresh
  try {
    sessionStorage.setItem(REFRESH_STATE_KEY, JSON.stringify(snapshot));
    logger.debug('📸 [REFRESH] Captured pre-refresh state snapshot');
  } catch (e) {
    logger.warn('⚠️ Could not save pre-refresh state to sessionStorage');
  }
}

/**
 * Get pre-refresh state (from memory or sessionStorage)
 */
function getPreRefreshState() {
  if (preRefreshState) return preRefreshState;

  try {
    const stored = sessionStorage.getItem(REFRESH_STATE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Only use if less than 30 seconds old
      if (Date.now() - parsed.timestamp < 30000) {
        return parsed;
      }
    }
  } catch (e) {
    // Ignore parse errors
  }
  return null;
}

/**
 * Clear pre-refresh state
 */
function clearPreRefreshState() {
  preRefreshState = null;
  try {
    sessionStorage.removeItem(REFRESH_STATE_KEY);
  } catch (e) {
    // Ignore
  }
}

/**
 * Compare state after refresh to detect refresh-masked bugs
 */
export function detectRefreshMaskedBugs(postRefreshState, entityType) {
  if (!isDev) return { issues: [], hasIssues: false };

  const savedState = getPreRefreshState();
  if (!savedState) return { issues: [], hasIssues: false };

  const issues = [];
  const preState = savedState.state;

  // Check if items that were deleted came back
  if (preState.deletedIds && preState.deletedIds.length > 0) {
    preState.deletedIds.forEach(id => {
      const reappeared = postRefreshState.items?.find(item =>
        (item._id === id || item.id === id)
      );
      if (reappeared) {
        issues.push({
          type: 'zombie',
          severity: 'error',
          entityType,
          id,
          message: `${entityType} ${id} reappeared after refresh (delete was not persisted)`,
        });
      }
    });
  }

  // Check for items that existed pre-refresh but are now missing
  if (preState.items && postRefreshState.items) {
    preState.items.forEach(preItem => {
      const id = preItem._id || preItem.id;
      const stillExists = postRefreshState.items.find(item =>
        (item._id === id || item.id === id)
      );
      if (!stillExists && !preState.deletedIds?.includes(id)) {
        issues.push({
          type: 'vanished',
          severity: 'warning',
          entityType,
          id,
          message: `${entityType} ${id} vanished after refresh (was in UI but not in fresh data)`,
        });
      }
    });
  }

  // Check for new items that appeared after refresh (not created by user)
  if (preState.items && postRefreshState.items) {
    const preIds = new Set(preState.items.map(i => i._id || i.id));
    postRefreshState.items.forEach(postItem => {
      const id = postItem._id || postItem.id;
      if (!preIds.has(id) && !postRefreshState.newlyCreatedIds?.includes(id)) {
        issues.push({
          type: 'appeared',
          severity: 'info',
          entityType,
          id,
          message: `${entityType} ${id} appeared after refresh (new data from server)`,
        });
      }
    });
  }

  if (issues.length > 0) {
    const errors = issues.filter(i => i.severity === 'error');
    const warnings = issues.filter(i => i.severity === 'warning');

    if (errors.length > 0) {
      console.error(
        `❌ [CONSISTENCY VIOLATION] Refresh-masked bugs detected!\n` +
        `These issues were hidden by refresh:\n`,
        errors.map(i => i.message).join('\n')
      );
    }

    if (warnings.length > 0) {
      console.warn(
        `⚠️ [CONSISTENCY] State differences after refresh:\n`,
        warnings.map(i => i.message).join('\n')
      );
    }
  }

  clearPreRefreshState();
  return { issues, hasIssues: issues.some(i => i.severity === 'error') };
}

/**
 * Setup automatic refresh detection
 * Call this once on app initialization
 */
export function setupRefreshDetection(getStateCallback, entityType) {
  if (!isDev) return () => {};

  // Capture state before page unload
  const handleBeforeUnload = () => {
    const state = getStateCallback();
    capturePreRefreshState(state);
  };

  window.addEventListener('beforeunload', handleBeforeUnload);

  // Check for refresh-masked bugs on page load
  const checkOnLoad = () => {
    const savedState = getPreRefreshState();
    if (savedState) {
      logger.debug('🔄 [REFRESH] Detected page refresh, will compare states after data loads');
    }
  };

  // Run check on next tick to allow state to initialize
  setTimeout(checkOnLoad, 0);

  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}

// ═══════════════════════════════════════════════════════════════════
// OPTIMISTIC UPDATE HELPERS
// ═══════════════════════════════════════════════════════════════════

/**
 * Create a safe optimistic updater with automatic rollback
 */
export function createOptimisticUpdater(setState, getState) {
  return (updateFn) => {
    const savedState = getState();

    return {
      apply: () => setState(updateFn),
      rollback: () => setState(savedState),
      savedState,
    };
  };
}

/**
 * Wrap a mutation with optimistic update and rollback
 */
export async function withOptimisticUpdate({
  name,
  getState,
  setState,
  optimisticFn,
  mutationFn,
  reconcileFn,
  onError,
}) {
  const savedState = getState();
  const mutationId = `${name}-${Date.now()}`;

  // Register intent
  registerMutationIntent(mutationId, name, 'mutation');
  logMutation('start', name, { mutationId });

  // Apply optimistic update
  if (optimisticFn) {
    setState(optimisticFn);
    logMutation('optimistic', name, { mutationId });
  }

  try {
    // Execute mutation
    const result = await mutationFn();

    // Resolve intent
    resolveMutationIntent(mutationId);
    logMutation('success', name, { mutationId, result });

    // Reconcile with server response
    if (reconcileFn) {
      setState(reconcileFn(result));
    }

    return result;
  } catch (error) {
    // Rollback
    setState(savedState);
    logMutation('rollback', name, { mutationId, error: error.message });

    if (onError) {
      onError(error);
    }

    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════
// MUTATION TRACE ID VERIFICATION
// ═══════════════════════════════════════════════════════════════════

/**
 * Verify API response matches mutation request
 * Compares mutationId from request with response to ensure end-to-end traceability
 */
export function verifyMutationResponse(requestMutationId, response, entityType, action) {
  if (!isDev) return { verified: true };

  const responseMutationId = response?._mutationId;

  if (!responseMutationId) {
    console.warn(
      `⚠️ [CONSISTENCY] API response missing _mutationId\n` +
      `Entity: ${entityType}\n` +
      `Action: ${action}\n` +
      `Request mutationId: ${requestMutationId}\n` +
      `Backend may not support mutation tracing.`
    );
    return { verified: false, reason: 'missing_mutation_id' };
  }

  if (requestMutationId !== responseMutationId) {
    console.error(
      `❌ [CONSISTENCY VIOLATION] Mutation ID mismatch!\n` +
      `Entity: ${entityType}\n` +
      `Action: ${action}\n` +
      `Request mutationId: ${requestMutationId}\n` +
      `Response mutationId: ${responseMutationId}\n` +
      `This indicates a response was received for a different request.`
    );
    logger.error(`Mutation ID mismatch: ${requestMutationId} vs ${responseMutationId}`);
    return { verified: false, reason: 'mutation_id_mismatch' };
  }

  logger.debug(`✅ [VERIFY] Mutation ${requestMutationId} verified for ${entityType}.${action}`);
  return { verified: true, mutationId: responseMutationId };
}

/**
 * Compare UI state with API response after mutation
 * Call this after updating UI state to verify consistency
 */
export function verifyUIAPIConsistency(uiState, apiResponse, entityType, fields = []) {
  if (!isDev) return { consistent: true };

  const mismatches = [];
  const mutationId = apiResponse?._mutationId || 'unknown';

  fields.forEach(field => {
    const uiValue = uiState?.[field];
    const apiValue = apiResponse?.[field];

    // Deep compare for objects/arrays
    const uiString = JSON.stringify(uiValue);
    const apiString = JSON.stringify(apiValue);

    if (uiString !== apiString) {
      mismatches.push({
        field,
        uiValue,
        apiValue,
        message: `${field}: UI has "${uiString}" but API returned "${apiString}"`
      });
    }
  });

  if (mismatches.length > 0) {
    console.warn(
      `⚠️ [CONSISTENCY] UI state differs from API response (mutationId: ${mutationId})\n` +
      `Entity: ${entityType}\n`,
      mismatches
    );
    return { consistent: false, mismatches, mutationId };
  }

  return { consistent: true, mutationId };
}

/**
 * Create API request headers with mutation trace ID
 */
export function createMutationHeaders(mutationId = null) {
  const id = mutationId || generateMutationId();
  return {
    'X-Mutation-Id': id,
    _mutationId: id
  };
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

export default {
  generateMutationId,
  registerMutationIntent,
  resolveMutationIntent,
  assertBackendFirst,
  verifyDeletion,
  detectStateMismatch,
  capturePreRefreshState,
  detectRefreshMaskedBugs,
  setupRefreshDetection,
  createOptimisticUpdater,
  withOptimisticUpdate,
  getMutationLog,
  clearMutationLog,
  verifyMutationResponse,
  verifyUIAPIConsistency,
  createMutationHeaders,
};

