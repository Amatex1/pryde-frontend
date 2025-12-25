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
 */

import logger from './logger';

const isDev = process.env.NODE_ENV === 'development';

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

/**
 * Capture state before refresh for comparison
 */
export function capturePreRefreshState(state) {
  if (!isDev) return;
  preRefreshState = JSON.parse(JSON.stringify(state));
}

/**
 * Compare state after refresh to detect refresh-masked bugs
 */
export function detectRefreshMaskedBugs(postRefreshState, entityType) {
  if (!isDev || !preRefreshState) return;

  const issues = [];

  // Check if items that were deleted came back
  if (preRefreshState.deletedIds && preRefreshState.deletedIds.length > 0) {
    preRefreshState.deletedIds.forEach(id => {
      const reappeared = postRefreshState.items?.find(item =>
        (item._id === id || item.id === id)
      );
      if (reappeared) {
        issues.push({
          type: 'zombie',
          message: `${entityType} ${id} reappeared after refresh (delete was not persisted)`,
        });
      }
    });
  }

  if (issues.length > 0) {
    console.error(
      `❌ [CONSISTENCY VIOLATION] Refresh-masked bugs detected!\n` +
      `These issues were hidden by refresh:\n`,
      issues.map(i => i.message).join('\n')
    );
  }

  preRefreshState = null;
  return issues;
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
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

export default {
  registerMutationIntent,
  resolveMutationIntent,
  assertBackendFirst,
  verifyDeletion,
  detectStateMismatch,
  capturePreRefreshState,
  detectRefreshMaskedBugs,
  createOptimisticUpdater,
  withOptimisticUpdate,
  getMutationLog,
  clearMutationLog,
};

