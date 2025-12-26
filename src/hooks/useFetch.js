/**
 * useFetch Hook - Standardized data fetching with loading/error/empty states
 * PHASE 3: Ensures every async fetch handles all states properly
 * 
 * Features:
 * - Loading state management
 * - Error state with retry capability
 * - Empty state detection
 * - Automatic refetch on dependency changes
 * - No silent failures
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import logger from '../utils/logger';

/**
 * Fetch states enum
 */
export const FetchState = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

/**
 * useFetch - Hook for data fetching with complete state management
 * 
 * @param {Function} fetchFn - Async function that fetches data
 * @param {Object} options - Configuration options
 * @param {Array} options.deps - Dependencies array to trigger refetch
 * @param {boolean} options.enabled - Whether to fetch on mount (default: true)
 * @param {boolean} options.refetchOnWindowFocus - Refetch when window gains focus
 * @param {Function} options.onSuccess - Callback on successful fetch
 * @param {Function} options.onError - Callback on fetch error
 * @param {any} options.initialData - Initial data before first fetch
 * @param {Function} options.isEmpty - Custom function to check if data is empty
 * @returns {Object} - { data, isLoading, isError, isEmpty, error, refetch, state }
 */
export function useFetch(fetchFn, options = {}) {
  const {
    deps = [],
    enabled = true,
    refetchOnWindowFocus = false,
    onSuccess,
    onError,
    initialData = null,
    isEmpty: customIsEmpty,
  } = options;

  const [state, setState] = useState(FetchState.IDLE);
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(null);

  // Track if component is mounted
  const mountedRef = useRef(true);
  const fetchIdRef = useRef(0);

  // Check if data is empty
  const checkEmpty = useCallback((data) => {
    if (customIsEmpty) {
      return customIsEmpty(data);
    }
    if (data === null || data === undefined) return true;
    if (Array.isArray(data)) return data.length === 0;
    if (typeof data === 'object') return Object.keys(data).length === 0;
    return false;
  }, [customIsEmpty]);

  const fetchData = useCallback(async () => {
    const currentFetchId = ++fetchIdRef.current;

    if (!enabled) {
      return;
    }

    setState(FetchState.LOADING);
    setError(null);

    try {
      const result = await fetchFn();

      // Check if this fetch is still relevant
      if (!mountedRef.current || currentFetchId !== fetchIdRef.current) {
        return;
      }

      setData(result);
      setState(FetchState.SUCCESS);

      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (err) {
      // Check if this fetch is still relevant
      if (!mountedRef.current || currentFetchId !== fetchIdRef.current) {
        return;
      }

      logger.error('[useFetch] Fetch error:', err);
      setError(err);
      setState(FetchState.ERROR);

      if (onError) {
        onError(err);
      }

      throw err;
    }
  }, [fetchFn, enabled, onSuccess, onError]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    if (enabled) {
      fetchData().catch(() => {
        // Error already handled in fetchData
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Refetch on window focus (optional)
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      if (enabled) {
        fetchData().catch(() => {});
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchOnWindowFocus, enabled, fetchData]);

  return {
    data,
    isLoading: state === FetchState.LOADING,
    isError: state === FetchState.ERROR,
    isSuccess: state === FetchState.SUCCESS,
    isEmpty: state === FetchState.SUCCESS && checkEmpty(data),
    error,
    refetch: fetchData,
    state,
  };
}

export default useFetch;

