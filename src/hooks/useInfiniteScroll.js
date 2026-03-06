/**
 * useInfiniteScroll - Custom hook for infinite scroll functionality
 * 
 * Uses Intersection Observer to detect when user scrolls to bottom of list
 * and automatically loads more items.
 * 
 * Features:
 * - Automatic loading when approaching bottom of list
 * - Prefetch threshold (loads next page before reaching bottom)
 * - Configurable threshold distance
 * - Works with any scrollable container
 */

import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for infinite scroll functionality with prefetching
 * @param {Object} options - Configuration options
 * @param {boolean} options.fetching - Whether data is currently being fetched
 * @param {boolean} options.hasMore - Whether there are more items to load
 * @param {Function} options.onLoadMore - Callback to load more items
 * @param {number} options.threshold - Distance from bottom to trigger load (default: 300px)
 * @param {number} options.prefetchThreshold - Distance before bottom to prefetch (default: 500px)
 * @param {string} options.rootMargin - CSS margin for Intersection Observer
 * @returns {Object} - { sentinelRef }
 */
export function useInfiniteScroll({
  fetching,
  hasMore,
  onLoadMore,
  threshold = 300,
  prefetchThreshold = 500,
  rootMargin = `0px 0px ${prefetchThreshold}px 0px`
}) {
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  // Callback for Intersection Observer
  const handleIntersect = useCallback((entries) => {
    const [entry] = entries;
    if (entry.isIntersecting && hasMore && !fetching) {
      onLoadMore();
    }
  }, [hasMore, fetching, onLoadMore]);

  // Set up Intersection Observer
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    observerRef.current = new IntersectionObserver(handleIntersect, {
      root: null, // viewport
      rootMargin,
      threshold: 0
    });

    observerRef.current.observe(sentinel);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleIntersect, rootMargin]);

  return {
    sentinelRef
  };
}

export default useInfiniteScroll;
