/**
 * State Synchronization Utilities
 * 
 * These utilities help ensure frontend state stays in sync with backend.
 * Provides dev-mode warnings for potential state/persistence mismatches.
 */

import logger from './logger';

const isDev = process.env.NODE_ENV === 'development';

/**
 * Logs a warning in dev mode when state might be out of sync
 * @param {string} action - The action being performed
 * @param {string} issue - Description of the potential issue
 */
export const warnStateMismatch = (action, issue) => {
  if (isDev) {
    console.warn(`⚠️ [STATE SYNC] ${action}: ${issue}`);
    logger.warn(`[STATE SYNC] ${action}: ${issue}`);
  }
};

/**
 * Logs when optimistic update is performed without rollback capability
 * @param {string} action - The action being performed
 */
export const warnOptimisticNoRollback = (action) => {
  if (isDev) {
    console.warn(`⚠️ [OPTIMISTIC] ${action}: No rollback handler defined. If API fails, state may be inconsistent.`);
  }
};

/**
 * Helper for optimistic updates with automatic rollback on failure
 * @param {Object} options - Configuration options
 * @param {Function} options.optimisticUpdate - Function that performs the optimistic state update, should return previous state
 * @param {Function} options.apiCall - Async function that makes the API call
 * @param {Function} options.onSuccess - Function called with API response on success
 * @param {Function} options.onError - Function called with error on failure
 * @param {Function} options.rollback - Function that restores previous state on error
 * @returns {Promise<{success: boolean, data?: any, error?: any}>}
 */
export const optimisticUpdate = async ({
  optimisticUpdate: doOptimisticUpdate,
  apiCall,
  onSuccess,
  onError,
  rollback
}) => {
  let previousState = null;
  
  try {
    // Perform optimistic update and save previous state
    if (doOptimisticUpdate) {
      previousState = doOptimisticUpdate();
    }
    
    // Make API call
    const response = await apiCall();
    
    // On success, optionally reconcile with server response
    if (onSuccess) {
      onSuccess(response);
    }
    
    if (isDev) {
      logger.debug(`✅ [STATE SYNC] API call succeeded, state reconciled`);
    }
    
    return { success: true, data: response };
  } catch (error) {
    // On error, rollback to previous state
    if (rollback && previousState !== null) {
      if (isDev) {
        console.warn('⚠️ [STATE SYNC] API failed, rolling back optimistic update');
      }
      rollback(previousState);
    } else if (isDev && doOptimisticUpdate) {
      warnOptimisticNoRollback('optimisticUpdate');
    }
    
    if (onError) {
      onError(error);
    }
    
    return { success: false, error };
  }
};

/**
 * Validates that UI update happened after backend confirmation
 * Use in dev mode to catch state changes that happen before API response
 * @param {boolean} apiComplete - Whether API call completed
 * @param {string} action - Action name for logging
 */
export const assertBackendFirst = (apiComplete, action) => {
  if (isDev && !apiComplete) {
    console.error(`❌ [STATE SYNC VIOLATION] ${action}: State updated before backend confirmation!`);
    throw new Error(`State sync violation: ${action} updated state before API response`);
  }
};

/**
 * Compares local state with server response and logs discrepancies
 * @param {any} localState - Current local state
 * @param {any} serverState - State from server response
 * @param {string} context - Context for logging
 */
export const reconcileState = (localState, serverState, context) => {
  if (isDev) {
    const localJson = JSON.stringify(localState);
    const serverJson = JSON.stringify(serverState);
    
    if (localJson !== serverJson) {
      console.info(`🔄 [STATE RECONCILE] ${context}: Local state differs from server, using server state`);
      logger.debug(`[STATE RECONCILE] ${context}`, { local: localState, server: serverState });
    }
  }
  
  // Always return server state as source of truth
  return serverState;
};

export default {
  warnStateMismatch,
  warnOptimisticNoRollback,
  optimisticUpdate,
  assertBackendFirst,
  reconcileState
};

