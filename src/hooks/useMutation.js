/**
 * Unified Mutation Handler Hook
 * 
 * Provides a standardized pattern for ALL data mutations in the app.
 * Ensures consistent optimistic updates, rollback on failure, and
 * reconciliation with server state.
 * 
 * MANDATORY FLOW:
 * 1. Optimistic UI update (if provided)
 * 2. Backend API call
 * 3. Backend validation + persistence
 * 4. Success → reconcile state with response
 * 5. Failure → rollback UI + show error
 * 6. Emit socket event (handled by backend)
 */

import { useState, useCallback, useRef } from 'react';
import logger from '../utils/logger';

const isDev = process.env.NODE_ENV === 'development';

/**
 * Logs dev-mode warnings for state consistency issues
 */
const devWarn = (message, data = null) => {
  if (isDev) {
    console.warn(`⚠️ [MUTATION] ${message}`, data || '');
    logger.warn(`[MUTATION] ${message}`, data);
  }
};

/**
 * Logs dev-mode errors that should block deployment
 */
const devError = (message, data = null) => {
  if (isDev) {
    console.error(`❌ [MUTATION VIOLATION] ${message}`, data || '');
    logger.error(`[MUTATION VIOLATION] ${message}`, data);
  }
};

/**
 * useMutation Hook
 * 
 * @param {Object} options - Mutation configuration
 * @param {Function} options.mutationFn - Async function that makes the API call
 * @param {Function} options.onOptimisticUpdate - Function to perform optimistic update, returns rollback function
 * @param {Function} options.onSuccess - Called with API response on success
 * @param {Function} options.onError - Called with error on failure
 * @param {Function} options.onSettled - Called after mutation completes (success or error)
 * @param {string} options.mutationKey - Unique identifier for this mutation (for logging)
 * @returns {Object} - { mutate, mutateAsync, isLoading, isError, error, data, reset }
 */
export function useMutation(options = {}) {
  const {
    mutationFn,
    onOptimisticUpdate,
    onSuccess,
    onError,
    onSettled,
    mutationKey = 'unknown',
  } = options;

  const [state, setState] = useState({
    isLoading: false,
    isError: false,
    isSuccess: false,
    error: null,
    data: null,
  });

  // Track if optimistic update was applied (for rollback)
  const rollbackRef = useRef(null);
  const mutationIdRef = useRef(0);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      isError: false,
      isSuccess: false,
      error: null,
      data: null,
    });
    rollbackRef.current = null;
  }, []);

  const mutateAsync = useCallback(async (variables) => {
    const currentMutationId = ++mutationIdRef.current;
    
    if (isDev) {
      logger.debug(`🔄 [MUTATION:${mutationKey}] Starting mutation`, { variables });
    }

    setState(prev => ({ ...prev, isLoading: true, isError: false, error: null }));

    // Step 1: Optimistic Update
    if (onOptimisticUpdate) {
      try {
        const rollback = onOptimisticUpdate(variables);
        if (typeof rollback === 'function') {
          rollbackRef.current = rollback;
        } else {
          devWarn(`${mutationKey}: onOptimisticUpdate should return a rollback function`);
        }
      } catch (optimisticError) {
        devError(`${mutationKey}: Optimistic update failed`, optimisticError);
      }
    }

    try {
      // Step 2: API Call
      if (!mutationFn) {
        throw new Error('mutationFn is required');
      }

      const response = await mutationFn(variables);

      // Check if this mutation is still current (prevent race conditions)
      if (currentMutationId !== mutationIdRef.current) {
        devWarn(`${mutationKey}: Mutation superseded by newer mutation`);
        return response;
      }

      // Step 3: Success - Reconcile with server response
      setState({
        isLoading: false,
        isError: false,
        isSuccess: true,
        error: null,
        data: response,
      });

      // Clear rollback since mutation succeeded
      rollbackRef.current = null;

      if (isDev) {
        logger.debug(`✅ [MUTATION:${mutationKey}] Mutation successful`, { response });
      }

      // Step 4: Call success callback
      if (onSuccess) {
        onSuccess(response, variables);
      }

      // Step 5: Call settled callback
      if (onSettled) {
        onSettled(response, null, variables);
      }

      return response;
    } catch (error) {
      // Check if this mutation is still current
      if (currentMutationId !== mutationIdRef.current) {
        return;
      }

      if (isDev) {
        logger.error(`❌ [MUTATION:${mutationKey}] Mutation failed`, error);
      }

      // Step 5: Rollback optimistic update
      if (rollbackRef.current) {
        try {
          rollbackRef.current();
          if (isDev) {
            logger.debug(`🔙 [MUTATION:${mutationKey}] Rolled back optimistic update`);
          }
        } catch (rollbackError) {
          devError(`${mutationKey}: Rollback failed`, rollbackError);
        }
        rollbackRef.current = null;
      }

      setState({
        isLoading: false,
        isError: true,
        isSuccess: false,
        error,
        data: null,
      });

      // Call error callback
      if (onError) {
        onError(error, variables);
      }

      // Call settled callback
      if (onSettled) {
        onSettled(null, error, variables);
      }

      throw error;
    }
  }, [mutationFn, onOptimisticUpdate, onSuccess, onError, onSettled, mutationKey]);

  // Non-throwing version
  const mutate = useCallback((variables, callbacks = {}) => {
    mutateAsync(variables)
      .then(data => callbacks.onSuccess?.(data, variables))
      .catch(error => callbacks.onError?.(error, variables))
      .finally(() => callbacks.onSettled?.());
  }, [mutateAsync]);

  return {
    mutate,
    mutateAsync,
    isLoading: state.isLoading,
    isError: state.isError,
    isSuccess: state.isSuccess,
    error: state.error,
    data: state.data,
    reset,
  };
}

/**
 * createMutationHandler - Factory for creating standardized mutation handlers
 *
 * Use this to create reusable mutation handlers that follow the platform pattern.
 *
 * @param {Object} config - Configuration for the mutation
 * @returns {Function} - A function that executes the mutation
 */
export function createMutationHandler(config) {
  const {
    name,
    apiCall,
    optimisticUpdate,
    reconcile,
    rollback,
    onError,
  } = config;

  return async (variables, setState) => {
    let savedState = null;

    // Step 1: Save current state for rollback
    if (optimisticUpdate) {
      savedState = optimisticUpdate.saveState?.(variables);
    }

    // Step 2: Optimistic update
    if (optimisticUpdate?.apply) {
      optimisticUpdate.apply(variables, setState);
    }

    try {
      // Step 3: API call
      const response = await apiCall(variables);

      // Step 4: Reconcile with server response
      if (reconcile) {
        reconcile(response, setState);
      }

      if (isDev) {
        logger.debug(`✅ [${name}] Mutation successful`, response);
      }

      return response;
    } catch (error) {
      // Step 5: Rollback
      if (rollback && savedState !== null) {
        rollback(savedState, setState);
        if (isDev) {
          logger.debug(`🔙 [${name}] Rolled back to previous state`);
        }
      }

      if (onError) {
        onError(error);
      }

      if (isDev) {
        logger.error(`❌ [${name}] Mutation failed`, error);
      }

      throw error;
    }
  };
}

/**
 * withMutationGuard - HOC-style wrapper for mutation functions
 *
 * Wraps any async mutation function with standard optimistic update,
 * rollback, and error handling.
 *
 * @param {Function} fn - The mutation function to wrap
 * @param {Object} options - Guard options
 * @returns {Function} - Wrapped function
 */
export function withMutationGuard(fn, options = {}) {
  const {
    name = 'anonymous',
    getState,
    setState,
    rollbackOnError = true
  } = options;

  return async (...args) => {
    let savedState = null;

    if (rollbackOnError && getState) {
      savedState = getState();
    }

    try {
      const result = await fn(...args);
      if (isDev) {
        logger.debug(`✅ [${name}] Completed successfully`);
      }
      return result;
    } catch (error) {
      if (rollbackOnError && savedState !== null && setState) {
        setState(savedState);
        devWarn(`${name}: Rolled back after error`);
      }
      throw error;
    }
  };
}

export default useMutation;

