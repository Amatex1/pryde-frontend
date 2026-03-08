/**
 * VirtualizedFeed - Virtualized list for feed posts using react-window
 * 
 * Uses VariableSizeList for dynamic height posts.
 * Measures actual heights of rendered posts and caches them.
 * 
 * PHASE 1A: Performance hardening - only renders visible posts in DOM
 */

import { useRef, useCallback, useEffect, useState, memo, forwardRef } from 'react';
import { List, useDynamicRowHeight } from 'react-window';
import './VirtualizedFeed.css';

// Default estimated height for posts (matches CSS contain-intrinsic-size)
const DEFAULT_POST_HEIGHT = 300;
// Overscan to render extra items above/below viewport for smooth scrolling
const OVERSCAN_COUNT = 3;

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
  const internalListRef = useRef(null);
  const listRef = externalListRef || internalListRef;

  const containerRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(height || 600);

  useEffect(() => {
    if (height) {
      setContainerHeight(height);
      return;
    }
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Using document.documentElement for viewport detection (architecture-compliant)
        setContainerHeight(Math.max(document.documentElement.clientHeight - rect.top, 400));
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [height]);

  // Safe array handling - prevent undefined errors
  const safePostsLength = posts?.length || 0;
  const itemCount = safePostsLength + (loading || (!hasMore && endOfListIndicator) ? 1 : 0);

  const { getRowHeight, setRowHeight } = useDynamicRowHeight({
    defaultRowHeight: DEFAULT_POST_HEIGHT,
    key: safePostsLength,
  });

  const handleRowsRendered = useCallback(({ overscanStopIndex }) => {
    if (onLoadMore && !loading && hasMore && overscanStopIndex >= safePostsLength - 1) {
      onLoadMore();
    }
  }, [onLoadMore, loading, hasMore, safePostsLength]);

  const RowComponent = useCallback(({ index, style }) => {
    if (index >= safePostsLength) {
      if (loading && loadingIndicator) return <div style={style}>{loadingIndicator}</div>;
      if (!hasMore && endOfListIndicator) return <div style={style}>{endOfListIndicator}</div>;
      return null;
    }
    const post = posts[index];
    const measureRef = (el) => {
      if (el) {
        setRowHeight(index, el.getBoundingClientRect().height);
      }
    };
    return renderItem(post, index, style, measureRef);
  }, [posts, renderItem, loading, loadingIndicator, hasMore, endOfListIndicator, setRowHeight, safePostsLength]);

  // Safe array handling - prevent undefined errors
  if (!posts || safePostsLength === 0) {
    return emptyState || null;
  }

  return (
    <div ref={containerRef} className="virtualized-feed-container">
      <List
        listRef={listRef}
        style={{ height: containerHeight, width }}
        rowCount={itemCount}
        rowHeight={getRowHeight}
        rowComponent={RowComponent}
        rowProps={{}}
        onRowsRendered={handleRowsRendered}
        overscanCount={OVERSCAN_COUNT}
        className="virtualized-feed-list"
      />
    </div>
  );
}));

export default VirtualizedFeed;
