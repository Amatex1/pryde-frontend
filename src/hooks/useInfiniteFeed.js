/**
 * useInfiniteFeed Hook
 * 
 * Provides infinite scroll functionality for feed components.
 * Features:
 * - Automatic prefetch when scrolling near bottom (80% threshold)
 * - Loading states and error handling
 * - Intersection Observer for sentinel detection
 * - Supports both cursor-based and page-based pagination
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for infinite scroll feed
 * 
 * @param {Object} options - Configuration options
 * @param {Function} options.fetchFn - Function to fetch data (page) => Promise
 * @param {number} options.initialPage - Starting page number (default: 1)
 * @param {number} options.threshold - Scroll threshold (0-1) to trigger prefetch (default: 0.8)
 * @param {number} options.prefetchDistance - Pixels before bottom to trigger (default: 300)
 * @param {boolean} options.enabled - Whether to enable infinite scroll (default: true)
 * 
 * @returns {Object} Feed state and control functions
 */
export function useInfiniteFeed({
  fetchFn,
  initialPage = 1,
  threshold = 0.8,
  prefetchDistance = 300,
  enabled = true
}) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const sentinelRef = useRef(null);
  const observerRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Fetch initial data
  const fetchInitial = useCallback(async () => {
    if (!enabled || loading) return;
    
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn(initialPage);
      
      if (result) {
        setItems(result.posts || result.items || result || []);
        setHasMore((result.posts?.length > 0) || (result.hasMore !== false));
        setPage(initialPage);
        setInitialized(true);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to load feed');
        console.error('[useInfiniteFeed] Initial fetch error:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFn, initialPage, enabled]);

  // Fetch more data (next page)
  const fetchMore = useCallback(async () => {
    if (!enabled || loading || loadingMore || !hasMore) return;

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoadingMore(true);
    setError(null);

    try {
      const nextPage = page + 1;
      const result = await fetchFn(nextPage);
      
      if (result) {
        const newItems = result.posts || result.items || result || [];
        
        if (newItems.length === 0) {
          setHasMore(false);
        } else {
          setItems(prev => [...prev, ...newItems]);
          setPage(nextPage);
          setHasMore(newItems.length > 0);
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to load more');
        console.error('[useInfiniteFeed] Fetch more error:', err);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [fetchFn, page, enabled, loading, loadingMore, hasMore]);

  // Intersection Observer callback
  const handleIntersection = useCallback((entries) => {
    const [entry] = entries;
    
    // Trigger when sentinel is 80% visible or within prefetchDistance
    if (entry.isIntersecting && hasMore && !loadingMore && !loading) {
      fetchMore();
    }
  }, [hasMore, loadingMore, loading, fetchMore]);

  // Set up Intersection Observer
  useEffect(() => {
    if (!enabled || !sentinelRef.current) return;

    observerRef.current = new IntersectionObserver(handleIntersection, {
      root: null, // viewport
      rootMargin: `${prefetchDistance}px`,
      threshold: threshold
    });

    observerRef.current.observe(sentinelRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [enabled, threshold, prefetchDistance, handleIntersection]);

  // Initial fetch on mount
  useEffect(() => {
    if (enabled && !initialized) {
      fetchInitial();
    }
  }, [enabled, initialized, fetchInitial]);

  // Reset feed
  const reset = useCallback(() => {
    setItems([]);
    setPage(initialPage);
    setHasMore(true);
    setError(null);
    setInitialized(false);
    fetchInitial();
  }, [initialPage, fetchInitial]);

  // Refresh feed (re-fetch first page)
  const refresh = useCallback(() => {
    setItems([]);
    setPage(initialPage);
    setHasMore(true);
    setError(null);
    fetchInitial();
  }, [initialPage, fetchInitial]);

  // Append items manually (for real-time updates)
  const prependItems = useCallback((newItems) => {
    if (Array.isArray(newItems) && newItems.length > 0) {
      setItems(prev => [...newItems, ...prev]);
    }
  }, []);

  // Remove item by ID
  const removeItem = useCallback((itemId) => {
    setItems(prev => prev.filter(item => item._id !== itemId));
  }, []);

  // Update item by ID
  const updateItem = useCallback((itemId, updates) => {
    setItems(prev => 
      prev.map(item => 
        item._id === itemId ? { ...item, ...updates } : item
      )
    );
  }, []);

  return {
    // Data
    items,
    hasMore,
    isEmpty: initialized && items.length === 0,
    
    // Loading states
    loading,
    loadingMore,
    error,
    
    // Pagination
    page,
    
    // Refs
    sentinelRef,
    
    // Actions
    fetchMore,
    fetchInitial,
    reset,
    refresh,
    prependItems,
    removeItem,
    updateItem,
    
    // Setters for external control
    setItems,
    setHasMore
  };
}

export default useInfiniteFeed;
