import { useState, useEffect, useCallback, useRef } from 'react';
import './InfiniteScrollImprovements.css';

/**
 * InfiniteScrollImprovements - Enhanced infinite scroll with new posts banner
 * 
 * Usage:
 * <InfiniteScrollImprovements
 *   loadMore={loadMorePosts}
 *   hasMore={hasMorePosts}
 *   isLoading={isLoading}
 *   newPostsAvailable={newPostsCount > 0}
 *   onLoadNewPosts={scrollToTop}
 * >
 *   {posts.map(post => <Post key={post.id} post={post} />)}
 * </InfiniteScrollImprovements>
 */
export function InfiniteScrollImprovements({
  children,
  loadMore,
  hasMore = true,
  isLoading = false,
  newPostsAvailable = false,
  onLoadNewPosts,
  threshold = 300, // pixels from bottom to trigger load
  loadingComponent,
  endComponent,
  className = ''
}) {
  const containerRef = useRef(null);
  const [showNewPostsBanner, setShowNewPostsBanner] = useState(false);
  const [bannerPostCount, setBannerPostCount] = useState(0);

  // Show banner when new posts are available
  useEffect(() => {
    if (newPostsAvailable) {
      setShowNewPostsBanner(true);
    }
  }, [newPostsAvailable]);

  // Hide banner when user scrolls to top
  const handleLoadNewPosts = useCallback(() => {
    setShowNewPostsBanner(false);
    onLoadNewPosts?.();
  }, [onLoadNewPosts]);

  // Infinite scroll handler
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isLoading || !hasMore) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      
      // Check if near bottom
      if (scrollHeight - scrollTop - clientHeight < threshold) {
        loadMore?.();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [loadMore, isLoading, hasMore, threshold]);

  return (
    <div 
      ref={containerRef}
      className={`infinite-scroll-container ${className}`}
    >
      {/* New posts banner */}
      {showNewPostsBanner && (
        <button 
          className="new-posts-banner"
          onClick={handleLoadNewPosts}
        >
          <span className="new-posts-icon">⬆️</span>
          <span className="new-posts-text">New posts available</span>
          <span className="new-posts-action">View</span>
        </button>
      )}

      {/* Content */}
      <div className="infinite-scroll-content">
        {children}
      </div>

      {/* Loading state */}
      {isLoading && (
        loadingComponent || (
          <div className="infinite-scroll-loading">
            <div className="loading-spinner" />
            <span>Loading more...</span>
          </div>
        )
      )}

      {/* End of content */}
      {!hasMore && !isLoading && endComponent && (
        <div className="infinite-scroll-end">
          {endComponent}
        </div>
      )}
    </div>
  );
}

/**
 * useInfiniteScroll - Hook for infinite scroll functionality
 * 
 * Usage:
 * const { containerRef, isNearBottom } = useInfiniteScroll({
 *   threshold: 300,
 *   onNearBottom: loadMore
 * });
 */
export function useInfiniteScroll({
  threshold = 300,
  onNearBottom,
  enabled = true
}) {
  const containerRef = useRef(null);
  const [isNearBottom, setIsNearBottom] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const nearBottom = distanceFromBottom < threshold;
      
      setIsNearBottom(nearBottom);
      
      if (nearBottom) {
        onNearBottom?.();
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial check
    handleScroll();
    
    return () => container.removeEventListener('scroll', handleScroll);
  }, [threshold, onNearBottom, enabled]);

  return {
    containerRef,
    isNearBottom
  };
}

export default InfiniteScrollImprovements;
