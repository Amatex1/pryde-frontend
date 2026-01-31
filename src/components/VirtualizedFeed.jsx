/**
 * VirtualizedFeed - Virtualized list for feed posts using react-window
 * 
 * Uses VariableSizeList for dynamic height posts.
 * Measures actual heights of rendered posts and caches them.
 * 
 * PHASE 1A: Performance hardening - only renders visible posts in DOM
 */

import { useRef, useCallback, useEffect, useState, memo, forwardRef } from 'react';
import { VariableSizeList as List } from 'react-window';
import './VirtualizedFeed.css';

// Default estimated height for posts (matches CSS contain-intrinsic-size)
const DEFAULT_POST_HEIGHT = 300;
// Gap between posts (matches CSS gap)
const POST_GAP = 24;
// Overscan to render extra items above/below viewport for smooth scrolling
const OVERSCAN_COUNT = 3;

/**
 * VirtualizedFeed Component
 * 
 * @param {Array} posts - Array of post objects to render
 * @param {Function} renderItem - Function to render a single post: (post, index, style, measureRef) => ReactNode
 * @param {number} [height] - Fixed height of the list container (defaults to window height - offset)
 * @param {number} [width] - Width of the list container (defaults to 100%)
 * @param {Function} [onScroll] - Callback when list is scrolled
 * @param {Object} [listRef] - Ref to access the VariableSizeList instance
 * @param {boolean} [loading] - Whether more posts are being loaded
 * @param {Function} [onLoadMore] - Callback to load more posts when reaching end
 * @param {ReactNode} [emptyState] - Element to render when posts array is empty
 * @param {ReactNode} [loadingIndicator] - Element to render when loading more
 * @param {ReactNode} [endOfListIndicator] - Element to render at end of list
 */
const VirtualizedFeed = memo(forwardRef(function VirtualizedFeed({
  posts,
  renderItem,
  height,
  width = '100%',
  onScroll,
  listRef: externalListRef,
  loading = false,
  onLoadMore,
  emptyState,
  loadingIndicator,
  endOfListIndicator,
  hasMore = true,
}, ref) {
  // Internal list ref
  const internalListRef = useRef(null);
  const listRef = externalListRef || internalListRef;
  
  // Cache for measured item heights
  const itemHeightsRef = useRef(new Map());
  
  // Container ref for measuring available height
  const containerRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(height || 600);
  
  // Measure container height on mount and resize
  useEffect(() => {
    if (height) {
      setContainerHeight(height);
      return;
    }
    
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Use viewport height minus container's top position
        const availableHeight = window.innerHeight - rect.top;
        setContainerHeight(Math.max(availableHeight, 400));
      }
    };
    
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [height]);
  
  // Get item size (height + gap)
  const getItemSize = useCallback((index) => {
    const cachedHeight = itemHeightsRef.current.get(index);
    return (cachedHeight || DEFAULT_POST_HEIGHT) + POST_GAP;
  }, []);
  
  // Update item height after measurement
  const setItemHeight = useCallback((index, height) => {
    const currentHeight = itemHeightsRef.current.get(index);
    if (currentHeight !== height) {
      itemHeightsRef.current.set(index, height);
      // Reset the list's cached sizes from this index forward
      if (listRef.current) {
        listRef.current.resetAfterIndex(index, false);
      }
    }
  }, [listRef]);
  
  // Handle scroll events
  const handleScroll = useCallback(({ scrollOffset, scrollUpdateWasRequested }) => {
    if (onScroll) {
      onScroll({ scrollOffset, scrollUpdateWasRequested });
    }
    
    // Check if we need to load more (within 500px of bottom)
    if (onLoadMore && !loading && hasMore) {
      const totalHeight = posts.reduce((sum, _, i) => sum + getItemSize(i), 0);
      const scrollBottom = scrollOffset + containerHeight;
      if (totalHeight - scrollBottom < 500) {
        onLoadMore();
      }
    }
  }, [onScroll, onLoadMore, loading, hasMore, posts, getItemSize, containerHeight]);
  
  // Reset heights cache when posts array changes significantly
  useEffect(() => {
    // Keep heights for posts that are still in the list
    const newHeights = new Map();
    posts.forEach((post, index) => {
      // Try to find this post's previous height
      const prevIndex = itemHeightsRef.current.get(`id:${post._id}`);
      if (prevIndex !== undefined) {
        newHeights.set(index, prevIndex);
      }
    });
    itemHeightsRef.current = newHeights;
    
    if (listRef.current) {
      listRef.current.resetAfterIndex(0, false);
    }
  }, [posts, listRef]);
  
  // Empty state
  if (!posts || posts.length === 0) {
    return emptyState || null;
  }
  
  // Calculate item count (posts + optional loading/end indicator)
  const itemCount = posts.length + (loading || (!hasMore && endOfListIndicator) ? 1 : 0);
  
  // Row renderer
  const Row = useCallback(({ index, style }) => {
    // Loading indicator at the end
    if (index >= posts.length) {
      if (loading && loadingIndicator) {
        return <div style={style}>{loadingIndicator}</div>;
      }
      if (!hasMore && endOfListIndicator) {
        return <div style={style}>{endOfListIndicator}</div>;
      }
      return null;
    }
    
    const post = posts[index];
    
    // Measure ref callback
    const measureRef = (el) => {
      if (el) {
        const height = el.getBoundingClientRect().height;
        setItemHeight(index, height);
        // Also store by post ID for persistence across reorders
        itemHeightsRef.current.set(`id:${post._id}`, height);
      }
    };
    
    return renderItem(post, index, style, measureRef);
  }, [posts, renderItem, setItemHeight, loading, loadingIndicator, hasMore, endOfListIndicator]);
  
  return (
    <div ref={containerRef} className="virtualized-feed-container">
      <List
        ref={listRef}
        height={containerHeight}
        width={width}
        itemCount={itemCount}
        itemSize={getItemSize}
        onScroll={handleScroll}
        overscanCount={OVERSCAN_COUNT}
        className="virtualized-feed-list"
      >
        {Row}
      </List>
    </div>
  );
}));

export default VirtualizedFeed;

