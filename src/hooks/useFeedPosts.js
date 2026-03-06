import { useState, useCallback, useEffect } from 'react';
import api from '../utils/api';
import logger from '../utils/logger';
import { getCachedPosts } from '../utils/resourcePreloader';

/**
 * useFeedPosts — encapsulates post-fetching state and side-effects.
 * Extracted from Feed.jsx (Phase 3 reorganisation). No logic changes.
 *
 * fetchPrivacySettings (which needs setPostVisibility / defaultPostVisibilityRef) and
 * autoHideContentWarnings remain in Feed.jsx because they depend on composer state.
 */
export function useFeedPosts() {
  // ── Post data ────────────────────────────────────────────────────────────
  const cachedPosts = getCachedPosts();
  const initialPosts = cachedPosts?.posts || [];

  const [posts, setPosts] = useState(initialPosts);
  const [fetchingPosts, setFetchingPosts] = useState(initialPosts.length === 0);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [feedFilter, setFeedFilter] = useState('followers');
  const [loadedPostIds, setLoadedPostIds] = useState(new Set(initialPosts.map(p => p._id)));
  
  // CALM FEED: Header for conversation section
  const [feedHeader, setFeedHeader] = useState(null);

  // ── Secondary data ───────────────────────────────────────────────────────
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [friends, setFriends] = useState([]);

  // ── Pull-to-refresh ──────────────────────────────────────────────────────
  const [pullStartY, setPullStartY] = useState(null);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  // ── Fetch callbacks ──────────────────────────────────────────────────────
  const fetchPosts = useCallback(async (pageNum = 1, append = false) => {
    try {
      setFetchingPosts(true);
      const response = await api.get(`/posts?filter=${feedFilter}&page=${pageNum}&limit=20`);
      const newPosts = response.data.posts || [];

      // CALM FEED: Extract feed header from response
      const header = response.data.feedHeader || null;
      setFeedHeader(header);

      if (append) {
        // Prevent duplicates using Set
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p._id));
          const filteredPosts = newPosts.filter(post => !existingIds.has(post._id));
          return [...prev, ...filteredPosts];
        });
      } else {
        setPosts(newPosts);
        setLoadedPostIds(new Set(newPosts.map(p => p._id)));
      }

      // Update loaded post IDs
      if (append) {
        setLoadedPostIds(prev => new Set([...prev, ...newPosts.map(p => p._id)]));
      }

      // Check if there are more posts
      setHasMore(newPosts.length === 20);
    } catch (error) {
      logger.error('Failed to fetch posts:', error);
    } finally {
      setFetchingPosts(false);
      setIsPulling(false);
      setPullDistance(0);
    }
  }, [feedFilter]); // REMOVED loadedPostIds dependency to prevent infinite loop

  const fetchBlockedUsers = useCallback(async () => {
    try {
      const response = await api.get('/blocks');
      const blockedIds = response.data.map(block => block.blocked._id);
      setBlockedUsers(blockedIds);
    } catch (error) {
      logger.error('Failed to fetch blocked users:', error);
    }
  }, []);

  const fetchFriends = useCallback(async () => {
    try {
      const response = await api.get('/friends');
      setFriends(response.data);
    } catch (error) {
      logger.error('Failed to fetch friends:', error);
    }
  }, []);

  const fetchBookmarkedPosts = useCallback(async () => {
    try {
      const response = await api.get('/bookmarks');
      setBookmarkedPosts(response.data.bookmarks.map(post => post._id));
    } catch (error) {
      logger.error('Failed to fetch bookmarks:', error);
    }
  }, []);

  const loadMorePosts = useCallback(() => {
    if (hasMore && !fetchingPosts) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage, true);
    }
  }, [hasMore, fetchingPosts, page, fetchPosts]);

  // ── Pull-to-refresh handlers ─────────────────────────────────────────────
  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      setPullStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (pullStartY !== null && window.scrollY === 0) {
      const currentY = e.touches[0].clientY;
      const distance = currentY - pullStartY;

      if (distance > 0) {
        setIsPulling(true);
        setPullDistance(Math.min(distance, 100)); // Cap at 100px
      }
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 60) {
      // Trigger refresh
      setPage(1);
      setLoadedPostIds(new Set());
      fetchPosts(1, false);
    } else {
      setIsPulling(false);
      setPullDistance(0);
    }
    setPullStartY(null);
  };

  // ── Refetch posts when filter changes ────────────────────────────────────
  useEffect(() => {
    setPage(1);
    setLoadedPostIds(new Set());
    fetchPosts(1, false);
  }, [feedFilter]); // Only depend on feedFilter, not fetchPosts

  // ── Public API ───────────────────────────────────────────────────────────
  return {
    // Post data
    posts, setPosts,
    fetchingPosts,
    hasMore,
    page, setPage,
    feedFilter, setFeedFilter,
    loadedPostIds, setLoadedPostIds,

    // CALM FEED: Conversation header
    feedHeader,

    // Secondary data
    blockedUsers, setBlockedUsers,
    bookmarkedPosts, setBookmarkedPosts,
    friends, setFriends,

    // Pull-to-refresh
    isPulling,
    pullDistance,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,

    // Fetch callbacks (used by Feed.jsx for orchestration and socket events)
    fetchPosts,
    loadMorePosts,
    fetchBlockedUsers,
    fetchBookmarkedPosts,
    fetchFriends,
  };
}
