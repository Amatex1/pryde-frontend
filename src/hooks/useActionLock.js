/**
 * useActionLock Hook - Prevents double-posting and manages button locking
 * PHASE 3: Ensures actions are only executed once and provides clear feedback
 * 
 * Features:
 * - Prevents double-clicks and double-submits
 * - Tracks action state (idle, pending, success, error)
 * - Provides feedback messages
 * - Auto-resets after configurable timeout
 * - Debounce protection
 */

import { useState, useCallback, useRef } from 'react';
import logger from '../utils/logger';

/**
 * Action states enum
 */
export const ActionState = {
  IDLE: 'idle',
  PENDING: 'pending',
  SUCCESS: 'success',
  ERROR: 'error',
};

/**
 * useActionLock - Hook for action locking and double-submit prevention
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.successResetMs - Time to auto-reset after success (default: 2000)
 * @param {number} options.errorResetMs - Time to auto-reset after error (default: 3000)
 * @param {number} options.debounceMs - Minimum time between actions (default: 300)
 * @param {string} options.actionName - Name for logging purposes
 * @returns {Object} - { execute, isLocked, isPending, isSuccess, isError, state, message, reset }
 */
export function useActionLock(options = {}) {
  const {
    successResetMs = 2000,
    errorResetMs = 3000,
    debounceMs = 300,
    actionName = 'action',
  } = options;

  const [state, setState] = useState(ActionState.IDLE);
  const [message, setMessage] = useState('');
  
  const lastActionRef = useRef(0);
  const resetTimeoutRef = useRef(null);

  // Clear any pending reset timeout
  const clearResetTimeout = useCallback(() => {
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
  }, []);

  // Reset to idle state
  const reset = useCallback(() => {
    clearResetTimeout();
    setState(ActionState.IDLE);
    setMessage('');
  }, [clearResetTimeout]);

  // Schedule auto-reset
  const scheduleReset = useCallback((delay) => {
    clearResetTimeout();
    resetTimeoutRef.current = setTimeout(reset, delay);
  }, [clearResetTimeout, reset]);

  /**
   * Execute an action with locking protection
   * 
   * @param {Function} actionFn - Async function to execute
   * @param {Object} callbacks - Optional callbacks
   * @param {string} callbacks.successMessage - Message to show on success
   * @param {string} callbacks.errorMessage - Message to show on error
   * @param {Function} callbacks.onSuccess - Called on success
   * @param {Function} callbacks.onError - Called on error
   * @returns {Promise} - Result of actionFn or undefined if locked
   */
  const execute = useCallback(async (actionFn, callbacks = {}) => {
    const now = Date.now();

    // Check debounce
    if (now - lastActionRef.current < debounceMs) {
      logger.debug(`[useActionLock] ${actionName} debounced`);
      return;
    }

    // Check if already pending
    if (state === ActionState.PENDING) {
      logger.debug(`[useActionLock] ${actionName} already pending`);
      return;
    }

    lastActionRef.current = now;
    clearResetTimeout();

    setState(ActionState.PENDING);
    setMessage('');

    try {
      const result = await actionFn();

      setState(ActionState.SUCCESS);
      setMessage(callbacks.successMessage || 'Success!');
      
      if (callbacks.onSuccess) {
        callbacks.onSuccess(result);
      }

      scheduleReset(successResetMs);
      return result;
    } catch (error) {
      logger.error(`[useActionLock] ${actionName} failed:`, error);

      setState(ActionState.ERROR);
      setMessage(callbacks.errorMessage || error.message || 'Something went wrong');
      
      if (callbacks.onError) {
        callbacks.onError(error);
      }

      scheduleReset(errorResetMs);
      throw error;
    }
  }, [state, debounceMs, actionName, clearResetTimeout, scheduleReset, successResetMs, errorResetMs]);

  return {
    execute,
    isLocked: state === ActionState.PENDING,
    isPending: state === ActionState.PENDING,
    isSuccess: state === ActionState.SUCCESS,
    isError: state === ActionState.ERROR,
    state,
    message,
    reset,
  };
}

export default useActionLock;

