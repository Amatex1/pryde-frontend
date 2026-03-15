import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useSearchParams, useNavigate, useOutletContext } from 'react-router-dom';
import { safeKeys, safeEntries } from '../utils/safeObject';
import FormattedText from '../components/FormattedText';
import ReactionButton from '../components/ReactionButton';
import PollCreator from '../components/PollCreator';
import Poll from '../components/Poll';
import PinnedPostBadge from '../components/PinnedPostBadge';
import PostHeader from '../components/PostHeader';
import PausableGif from '../components/PausableGif';
import FeedPost from '../components/feed/FeedPost';
import FeedCommentSurfaces from '../components/feed/FeedCommentSurfaces';
import FeedComposer from '../components/feed/FeedComposer';
import FeedFilterTabs from '../components/feed/FeedFilterTabs';
import FeedList from '../components/feed/FeedList';
import FeedOverlayStack from '../components/feed/FeedOverlayStack';
import FeedPageHeader from '../components/feed/FeedPageHeader';
import FeedPullToRefresh from '../components/feed/FeedPullToRefresh';
import FeedScrollTopButton from '../components/feed/FeedScrollTopButton';
import FeedSidebar from '../components/feed/FeedSidebar';
import CommunityBanner from '../components/CommunityBanner';
import { buildCommentContextValue } from '../components/comments/buildCommentContextValue';
import {
  appendUniqueCommentToBucket,
  mapCommentsInBuckets,
  removeBucket,
  removeCommentFromAllBuckets,
  removeCommentFromBucket,
  removeCommentsFromAllBuckets,
  replaceCommentInBuckets,
  replaceCommentsInBuckets,
} from '../components/comments/commentBucketState';
import { useBadges } from '../hooks/useBadges';
import { useCommentThreadState } from '../hooks/useCommentThreadState';
import DraftManager from '../components/DraftManager';
import { useModal } from '../hooks/useModal';
import { useOnlineUsers } from '../hooks/useOnlineUsers';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useBreakpoint } from '../layouts/useBreakpoint';
import { useFeedPosts } from '../hooks/useFeedPosts';
import { useUnreadMessages } from '../hooks/useUnreadMessages'; // ✅ Use singleton hook
import { useToast } from '../hooks/useToast';
import { useAuth } from '../context/AuthContext'; // ✅ Use auth context (single source of truth)
import api, { getCsrfToken } from '../utils/api';
import { getSocket, setupSocketListeners } from '../utils/socketHelpers';
import { convertEmojiShortcuts } from '../utils/textFormatting';
import logger from '../utils/logger';
import { compressPostMedia } from '../utils/compressImage';
import { uploadMultipleWithProgress } from '../utils/uploadWithProgress';
import { saveDraft, loadDraft, clearDraft } from '../utils/draftStore';
import { withOptimisticUpdate } from '../utils/consistencyGuard';
import { createEventBatcher, createKeyedBatcher } from '../utils/socketBatcher';
import { quietCopy } from '../config/uiCopy';
import { getQuietMode } from '../utils/themeManager';
import { getCachedPosts } from '../utils/resourcePreloader';
import './Feed.css';
import './Feed.calm.css'; // PHASE C: Calm mode overrides
import './Mobile.calm.css'; // PHASE D: Mobile-first calm mode

function Feed() {
  const [searchParams] = useSearchParams();
  const { modalState, closeModal, showAlert, showConfirm } = useModal();
  const { onlineUsers, isUserOnline } = useOnlineUsers();
  const { isAuthReady, isAuthenticated, user: currentUser, role } = useAuth(); // ✅ Single source of truth for auth
  const { toasts, showToast, removeToast } = useToast();

  // Get menu handler from AppLayout outlet context
  const outletContext = useOutletContext() || {};
  const { onMenuOpen } = outletContext;
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { isSheetMobile } = useBreakpoint();

  // ── Feed data: posts, pagination, secondary data, pull-to-refresh ─────────
  const {
    posts, setPosts,
    fetchingPosts,
    hasMore,
    page, setPage,
    feedFilter, setFeedFilter,
    loadedPostIds, setLoadedPostIds,
    blockedUsers, setBlockedUsers,
    bookmarkedPosts, setBookmarkedPosts,
    friends, setFriends,
    isPulling,
    pullDistance,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    fetchPosts,
    loadMorePosts,
    fetchBlockedUsers,
    fetchBookmarkedPosts,
    fetchFriends,
  } = useFeedPosts();

  // 🚀 LCP OPTIMIZATION: getCachedPosts still used in initial data fetch effect
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [reportModal, setReportModal] = useState({ isOpen: false, type: '', contentId: null, userId: null });
  const [photoViewerImage, setPhotoViewerImage] = useState(null);
  const [showCommentBox, setShowCommentBox] = useState({});
  const [commentText, setCommentText] = useState({});
  const [commentGif, setCommentGif] = useState({});
  const [showGifPicker, setShowGifPicker] = useState(null);
  const [selectedPostGif, setSelectedPostGif] = useState(null); // GIF for main post creation
  const [commentModalOpen, setCommentModalOpen] = useState(null); // Track which post's comment modal is open
  const [commentSheetOpen, setCommentSheetOpen] = useState(null); // Mobile-only full comment sheet (stores postId)
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [replyingToComment, setReplyingToComment] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyGif, setReplyGif] = useState(null);
  const [replyIsAnonymous, setReplyIsAnonymous] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editPostText, setEditPostText] = useState('');
  const [openCommentDropdownId, setOpenCommentDropdownId] = useState(null);
  const [postVisibility, setPostVisibility] = useState('followers');
  const defaultPostVisibilityRef = useRef('followers'); // Stores user's default from settings
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [hiddenFromUsers, setHiddenFromUsers] = useState([]);
  const [contentWarning, setContentWarning] = useState('');
  const [showContentWarning, setShowContentWarning] = useState(false);
  const [revealedPosts, setRevealedPosts] = useState({});
  const [expandedPosts, setExpandedPosts] = useState({}); // Track which posts have expanded text ("See more")
  const [showReplies, setShowReplies] = useState({}); // Track which comments have replies visible
  const [showReactionPicker, setShowReactionPicker] = useState(null); // Track which comment shows reaction picker
  const [postComments, setPostComments] = useState({}); // Store comments by postId { postId: [comments] }
  const [commentReplies, setCommentReplies] = useState({}); // Store replies by commentId { commentId: [replies] }
  const [editPostVisibility, setEditPostVisibility] = useState('followers');
  const [editHiddenFromUsers, setEditHiddenFromUsers] = useState([]);
  const [editPostMedia, setEditPostMedia] = useState([]); // Current media for post being edited
  const [deletedMedia, setDeletedMedia] = useState([]); // Track media marked for deletion
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  // REMOVED 2025-12-26: trending state removed (Phase 5)

  // ✅ Use singleton hook for unread message counts
  const { unreadByUser } = useUnreadMessages();

  // Convert unreadByUser array to map format { userId: count }
  const unreadMessageCounts = unreadByUser.reduce((acc, item) => {
    acc[item.userId] = item.count;
    return acc;
  }, {});

  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [reactionDetailsModal, setReactionDetailsModal] = useState({ isOpen: false, targetType: null, targetId: null });
  const [poll, setPoll] = useState(null); // Poll data for new post
  const [showPollCreator, setShowPollCreator] = useState(false); // Show/hide poll creator
  // NOTE: EditHistory state removed 2025-12-26 - backend returns 410 Gone
  const [hideMetrics, setHideMetrics] = useState(false); // Hide metrics for new post
  const [isAnonymous, setIsAnonymous] = useState(false); // Anonymous posting toggle
  const [autoHideContentWarnings, setAutoHideContentWarnings] = useState(false);
  const [quietMode, setQuietMode] = useState(document.documentElement.getAttribute('data-quiet') === 'true');
  const [initializing, setInitializing] = useState(true); // Track initial load
  const [showDraftManager, setShowDraftManager] = useState(false); // Show/hide draft manager
  const [currentDraftId, setCurrentDraftId] = useState(null); // Track current draft being edited
  const [draftSaveStatus, setDraftSaveStatus] = useState(''); // 'saving', 'saved', or ''
  const [showMobileComposer, setShowMobileComposer] = useState(false); // Mobile composer bottom sheet
  const [isTyping, setIsTyping] = useState(false); // Track typing state for floating UI hiding
  const [linkPreview, setLinkPreview] = useState(null); // Link preview for new post

  // QUIET MODE: Collapse advanced posting options
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const isQuietMode = getQuietMode();

  // Scroll-to-top state
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Ref for edit post textarea auto-resize
  const editPostTextareaRef = useRef(null);

  // Reaction picker timeout ref
  const reactionPickerTimeoutRef = useRef(null);

  // currentUser is now from useAuth() above - no direct localStorage call
  const postRefs = useRef({});
  const commentRefs = useRef({});
  const listenersSetUpRef = useRef(false);
  const autoSaveTimerRef = useRef(null); // Auto-save timer
  const scrollHandledRef = useRef(false); // Track if we've already scrolled to a post from URL params
  const scrollLockYRef = useRef(null); // Saves window.scrollY before body scroll-lock so it survives effect cleanup
  const commentFetchInFlightRef = useRef(new Set()); // Track in-flight comment fetches to prevent duplicate API calls

  const loadCommentsForPost = useCallback(async (postId) => {
    try {
      logger.debug(`📥 Fetching comments for post: ${postId}`);
      const response = await api.get(`/posts/${postId}/comments`);
      const comments = response.data || [];
      logger.debug(`✅ Fetched ${comments.length} comments for post ${postId}`);
      return comments;
    } catch (error) {
      logger.error('❌ Failed to fetch comments:', error);
      return [];
    }
  }, []);

  const loadRepliesForComment = useCallback(async (commentId) => {
    try {
      const response = await api.get(`/comments/${commentId}/replies`);
      return response.data || [];
    } catch (error) {
      logger.error('Failed to fetch replies:', error);
      return [];
    }
  }, []);

  const {
    fetchCommentsForPost,
    toggleReplies,
    openComments,
    toggleCommentBox,
  } = useCommentThreadState({
    fetchComments: loadCommentsForPost,
    fetchReplies: loadRepliesForComment,
    postComments,
    commentReplies,
    showReplies,
    showCommentBox,
    isSheetMobile,
    setPostComments,
    setCommentReplies,
    setShowReplies,
    setShowCommentBox,
    setCommentSheetOpen,
  });

  // ⚡ PHASE 2C: Socket event batchers for performance
  // These batch multiple socket events within 100ms to reduce React re-renders
  const socketBatchersRef = useRef(null);

  // Handler to block Enter key submission when GIF picker is open
  const handleKeyDown = useCallback((e) => {
    // If GIF picker is open, block Enter from submitting form
    if (showGifPicker !== null && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
  }, [showGifPicker]);

  // fetchPosts, fetchBlockedUsers, fetchFriends, fetchBookmarkedPosts, loadMorePosts
  // are now provided by useFeedPosts() above.

  const fetchPrivacySettings = useCallback(async () => {
    try {
      const response = await api.get('/privacy/settings');
      setAutoHideContentWarnings(response.data.autoHideContentWarnings || false);
      // Set default post visibility from user's privacy settings
      const defaultVisibility = response.data.defaultPostVisibility || 'followers';
      defaultPostVisibilityRef.current = defaultVisibility; // Store for reset after posting
      setPostVisibility(defaultVisibility);
    } catch (error) {
      logger.error('Failed to fetch privacy settings:', error);
    }
  }, []);

  // Scroll to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFeedFilterChange = useCallback((nextFilter) => {
    if (nextFilter === feedFilter) {
      return;
    }

    setFeedFilter(nextFilter);
    setPage(1);
    setLoadedPostIds(new Set());
    setPosts([]);
  }, [feedFilter, setFeedFilter, setLoadedPostIds, setPage, setPosts]);

  // Auto-fetch comments for posts that have comments
  // Uses a ref to track in-flight fetches so we don't fire duplicate requests
  // when postComments updates (which would cascade into O(N²) API calls)
  useEffect(() => {
    posts.forEach(post => {
      if (
        post.commentCount > 0 &&
        !postComments[post._id] &&
        !commentFetchInFlightRef.current.has(post._id)
      ) {
        commentFetchInFlightRef.current.add(post._id);
        logger.debug(`📥 Auto-fetching ${post.commentCount} comments for post ${post._id}`);
        fetchCommentsForPost(post._id).finally(() => {
          commentFetchInFlightRef.current.delete(post._id);
        });
      }
    });
  }, [fetchCommentsForPost, posts, postComments]);

  // Scroll lock when mobile comment sheet is open
  useEffect(() => {
    if (commentSheetOpen) {
      // Save scroll position in a ref so it survives effect cleanup
      scrollLockYRef.current = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollLockYRef.current}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else if (scrollLockYRef.current !== null) {
      // Restore scroll position from the ref (body.style.top is already cleared by cleanup)
      const y = scrollLockYRef.current;
      scrollLockYRef.current = null;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      window.scrollTo(0, y);
    }
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [commentSheetOpen]);

  // Memoize the URL params to prevent unnecessary effect runs
  const targetPostId = useMemo(() => searchParams.get('post'), [searchParams]);
  const targetCommentId = useMemo(() => searchParams.get('comment'), [searchParams]);

  // Reset scroll handled flag when URL params change
  useEffect(() => {
    if (targetPostId) {
      scrollHandledRef.current = false;
    }
  }, [targetPostId, targetCommentId]);

  // Handle scrolling to specific post/comment from query parameters (e.g., from notifications)
  // Only scroll ONCE when posts load and URL params are present
  useEffect(() => {
    // Skip if no target post, already handled, or still fetching
    if (!targetPostId || scrollHandledRef.current || fetchingPosts || posts.length === 0) {
      return;
    }

    // Check if the target post exists in our loaded posts
    const targetPostExists = posts.some(p => p._id === targetPostId);
    if (!targetPostExists) {
      return; // Wait for the post to be loaded
    }

    // Mark as handled BEFORE scrolling to prevent duplicate scrolls
    scrollHandledRef.current = true;

    // Wait for DOM to update
    setTimeout(() => {
      const postElement = postRefs.current[targetPostId];
      if (postElement) {
        postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        postElement.classList.add('highlighted-post');

        // Remove highlight after 3 seconds
        setTimeout(() => {
          postElement.classList.remove('highlighted-post');
        }, 3000);

        // If there's a specific comment, scroll to it after the post scroll settles
        if (targetCommentId) {
          setTimeout(() => {
            const commentElement = commentRefs.current[targetCommentId];
            if (commentElement) {
              commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              commentElement.classList.add('highlighted-comment');

              // Remove highlight after 3 seconds
              setTimeout(() => {
                commentElement.classList.remove('highlighted-comment');
              }, 3000);
            }
          }, 500);
        }
      }
    }, 500);
  }, [targetPostId, targetCommentId, fetchingPosts, posts]);

  // Handle scroll detection for scroll-to-top button and infinite scroll
  // QUIET MODE: Disable auto-fetch on scroll - require explicit "Load more" click
  useEffect(() => {
    const isQuietMode = getQuietMode();

    const handleScroll = () => {
      // Show/hide scroll-to-top button
      setShowScrollTop(window.scrollY > 500);

      // QUIET MODE: No infinite scroll - enforce finite page with clear stopping point
      if (isQuietMode) {
        return; // User must click "Load more" button manually
      }

      // Infinite scroll detection (only when NOT in quiet mode)
      // Using document.documentElement.clientHeight for scroll detection (architecture-compliant)
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const viewportHeight = document.documentElement.clientHeight;

      if (scrollHeight - scrollTop - viewportHeight < 300 && hasMore && !fetchingPosts) {
        loadMorePosts();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, fetchingPosts, loadMorePosts]);

  // handleTouchStart, handleTouchMove, handleTouchEnd are now from useFeedPosts().

  useEffect(() => {
    // 🔥 AUTH READY GATE: Wait for auth to be ready before fetching data
    if (!isAuthReady) {
      logger.debug('[Feed] Waiting for auth to be ready...');
      return;
    }

    // Skip fetching if not authenticated
    if (!isAuthenticated) {
      logger.debug('[Feed] Not authenticated - skipping data fetch');
      setInitializing(false);
      return;
    }

    logger.debug('[Feed] Auth ready - fetching initial data');

    // 🚀 LCP OPTIMIZATION: Prioritize posts fetch for faster LCP
    // Only fetch posts if we don't have cached data
    const cachedData = getCachedPosts();
    const hasCachedPosts = cachedData?.posts?.length > 0;

    // Start posts fetch immediately (critical for LCP)
    const postsFetch = hasCachedPosts
      ? Promise.resolve() // Skip if we already have cached posts displayed
      : fetchPosts();

    // Defer secondary data fetching with requestIdleCallback
    // This reduces main thread blocking during initial render
    const fetchSecondaryData = () => {
      Promise.allSettled([
        fetchBlockedUsers(),
        fetchFriends(),
        fetchBookmarkedPosts(),
        fetchPrivacySettings()
      ]).then(results => {
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            const names = ['blocked users', 'friends', 'bookmarks', 'privacy settings'];
            logger.warn(`Failed to load ${names[index]}:`, result.reason);
          }
        });
      });
    };

    // Fetch posts first, then secondary data
    postsFetch.then(() => {
      setInitializing(false);

      // Use requestIdleCallback for non-critical data (or setTimeout fallback)
      if ('requestIdleCallback' in window) {
        requestIdleCallback(fetchSecondaryData, { timeout: 2000 });
      } else {
        setTimeout(fetchSecondaryData, 100);
      }
    }).catch(error => {
      logger.error('Error loading posts:', error);
      setInitializing(false);
      // Still try to load secondary data
      fetchSecondaryData();
    });

    // If we have cached posts, refresh in background after a short delay
    if (hasCachedPosts) {
      setInitializing(false);
      setTimeout(() => {
        fetchPosts(); // Refresh cached data in background
      }, 1000);
    }
  }, [isAuthReady, isAuthenticated]); // ✅ Run when auth state changes

  // Restore localStorage draft on mount (fallback if backend draft fails)
  useEffect(() => {
    const localDraft = loadDraft('feed-create-post');
    if (localDraft && !currentDraftId) {
      // Only restore if there's no backend draft loaded
      setNewPost(localDraft.content || '');
      // CRITICAL: Do NOT restore media from localStorage
      // Media should only come from backend drafts to prevent ghost media
      // localStorage media URLs may reference deleted files
      if (localDraft.media && localDraft.media.length > 0) {
        if (import.meta.env.DEV) {
          console.warn('[Pryde] Local draft had media but it was NOT restored');
          console.warn('[Pryde] Media should only be loaded from backend drafts to prevent ghost media');
          console.warn('[Pryde] The media may have been deleted or never persisted properly');
        }
        // Clear media from localStorage draft to prevent future confusion
        saveDraft('feed-create-post', { ...localDraft, media: [] });
      }
      // setSelectedMedia([]); // Explicitly don't restore media
      setPostVisibility(localDraft.visibility || 'followers');
      setContentWarning(localDraft.contentWarning || '');
      setHideMetrics(localDraft.hideMetrics || false);
      // Normalize poll options: backend stores as [{text: "...", votes: []}] but PollCreator expects strings
      const restoredPoll = localDraft.poll || null;
      if (restoredPoll && restoredPoll.options) {
        restoredPoll.options = restoredPoll.options.map(opt =>
          typeof opt === 'object' && opt.text ? opt.text : opt
        );
      }
      setPoll(restoredPoll);
      setShowContentWarning(!!localDraft.contentWarning);
      setShowPollCreator(!!restoredPoll);
      logger.debug('📝 Restored draft from localStorage (without media)');
    }
  }, []); // Only run on mount

  // Listen for quiet mode changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const quiet = document.documentElement.getAttribute('data-quiet') === 'true';
      setQuietMode(quiet);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-quiet']
    });

    return () => observer.disconnect();
  }, []);

  // Note: filter-change refetch is handled inside useFeedPosts (feedFilter useEffect).
  // Note: Auto-fetch comments merged into scroll-to-post effect above (lines 224-269)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.post-dropdown-container') && !event.target.closest('.comment-dropdown-container')) {
        setOpenDropdownId(null);
        setOpenCommentDropdownId(null);
      }
      // Close reaction picker when clicking outside (but not when clicking on the picker itself)
      if (!event.target.closest('.reaction-container') && !event.target.closest('.reaction-picker')) {
        setShowReactionPicker(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Socket listeners for online/offline status
  useEffect(() => {
    // Check if listeners are already set up (prevents duplicate setup in Strict Mode)
    if (listenersSetUpRef.current) {
      logger.debug('⚠️ Feed listeners already initialized, skipping setup');
      return;
    }

    let cleanupFunctions = [];

    // ⚡ PHASE 2C: Create batchers for socket events
    // These batch multiple events within 100ms to reduce React re-renders
    const BATCH_DELAY = 100; // ms

    // Keyed batcher for post reactions - only keep latest per postId
    const postReactionBatcher = createKeyedBatcher(
      (eventsMap) => {
        logger.debug(`⚡ Batched ${eventsMap.size} post reactions`);
        setPosts(prevPosts => {
          let updated = [...prevPosts];
          eventsMap.forEach((data) => {
            updated = updated.map(p => p._id === data.postId ? data.post : p);
          });
          return updated;
        });
      },
      (data) => data.postId,
      BATCH_DELAY
    );

    // Keyed batcher for comment reactions - only keep latest per commentId
    const commentReactionBatcher = createKeyedBatcher(
      (eventsMap) => {
        logger.debug(`⚡ Batched ${eventsMap.size} comment reactions`);
        const updatedComments = Array.from(eventsMap.values()).map(d => d.comment);

        setPostComments(prev => replaceCommentsInBuckets(prev, updatedComments));
        setCommentReplies(prev => replaceCommentsInBuckets(prev, updatedComments));
      },
      (data) => data.comment._id,
      BATCH_DELAY
    );

    // Event batcher for new comments
    const commentAddedBatcher = createEventBatcher(
      (events) => {
        logger.debug(`⚡ Batched ${events.length} new comments`);
        const replies = events.filter(e => e.comment.parentCommentId);
        const topLevel = events.filter(e => !e.comment.parentCommentId);

        if (replies.length > 0) {
          setCommentReplies(prev => {
            let updated = prev;
            replies.forEach(({ comment }) => {
              updated = appendUniqueCommentToBucket(updated, comment.parentCommentId, comment);
            });
            return updated;
          });
        }

        if (topLevel.length > 0) {
          setPostComments(prev => {
            let updated = prev;
            topLevel.forEach(({ comment, postId }) => {
              updated = appendUniqueCommentToBucket(updated, postId, comment);
            });
            return updated;
          });

          // Update comment counts
          const countsByPost = {};
          topLevel.forEach(({ postId }) => {
            countsByPost[postId] = (countsByPost[postId] || 0) + 1;
          });
          setPosts(prevPosts =>
            prevPosts.map(p => {
              if (countsByPost[p._id]) {
                return { ...p, commentCount: (p.commentCount || 0) + countsByPost[p._id] };
              }
              return p;
            })
          );
        }
      },
      BATCH_DELAY
    );

    // Keyed batcher for comment updates - only keep latest per commentId
    const commentUpdatedBatcher = createKeyedBatcher(
      (eventsMap) => {
        logger.debug(`⚡ Batched ${eventsMap.size} comment updates`);
        const updatedComments = Array.from(eventsMap.values()).map(d => d.comment);

        setPostComments(prev => replaceCommentsInBuckets(prev, updatedComments));
        setCommentReplies(prev => replaceCommentsInBuckets(prev, updatedComments));
      },
      (data) => data.comment._id,
      BATCH_DELAY
    );

    // Event batcher for comment deletions
    const commentDeletedBatcher = createEventBatcher(
      (events) => {
        logger.debug(`⚡ Batched ${events.length} comment deletions`);
        const deletedIds = new Set(events.map(e => e.commentId));
        const countsByPost = {};
        events.forEach(({ postId }) => {
          countsByPost[postId] = (countsByPost[postId] || 0) + 1;
        });

        setPostComments(prev => removeCommentsFromAllBuckets(prev, deletedIds));

        setCommentReplies(prev => {
          let updated = removeCommentsFromAllBuckets(prev, deletedIds);
          deletedIds.forEach(id => {
            updated = removeBucket(updated, id);
          });
          return updated;
        });

        setPosts(prevPosts =>
          prevPosts.map(p => {
            if (countsByPost[p._id]) {
              return { ...p, commentCount: Math.max(0, (p.commentCount || 0) - countsByPost[p._id]) };
            }
            return p;
          })
        );
      },
      BATCH_DELAY
    );

    // Event batcher for new posts
    const postCreatedBatcher = createEventBatcher(
      (events) => {
        logger.debug(`⚡ Batched ${events.length} new posts`);
        const newPosts = events.map(e => e.post);
        setPosts(prevPosts => {
          const existingIds = new Set(prevPosts.map(p => p._id));
          const uniqueNew = newPosts.filter(p => !existingIds.has(p._id));
          return [...uniqueNew, ...prevPosts];
        });
      },
      BATCH_DELAY
    );

    // Keyed batcher for post updates - only keep latest per postId
    const postUpdatedBatcher = createKeyedBatcher(
      (eventsMap) => {
        logger.debug(`⚡ Batched ${eventsMap.size} post updates`);
        setPosts(prevPosts => {
          let updated = [...prevPosts];
          eventsMap.forEach((data) => {
            const updatedPost = data.post;
            updated = updated.map(p =>
              p._id === updatedPost.postId || p._id === updatedPost._id ? updatedPost : p
            );
          });
          return updated;
        });
      },
      (data) => data.post._id || data.post.postId,
      BATCH_DELAY
    );

    // Event batcher for post deletions
    const postDeletedBatcher = createEventBatcher(
      (events) => {
        logger.debug(`⚡ Batched ${events.length} post deletions`);
        const deletedIds = new Set(events.map(e => e.postId));
        setPosts(prevPosts => prevPosts.filter(p => !deletedIds.has(p._id)));
      },
      BATCH_DELAY
    );

    // Store batchers for cleanup
    socketBatchersRef.current = {
      postReactionBatcher,
      commentReactionBatcher,
      commentAddedBatcher,
      commentUpdatedBatcher,
      commentDeletedBatcher,
      postCreatedBatcher,
      postUpdatedBatcher,
      postDeletedBatcher,
    };

    const setupListeners = (socket) => {
      logger.debug('🔌 Setting up socket listeners in Feed (with batching)');
      // Note: Online user presence is now managed by useOnlineUsers hook

      // Listen for real-time post reactions
      if (socket && typeof socket.on === 'function' && typeof socket.off === 'function') {
        const handlePostReaction = (data) => {
          logger.debug('💜 Real-time post reaction received:', data);
          postReactionBatcher.add(data);
        };
        socket.on('post_reaction_added', handlePostReaction);
        cleanupFunctions.push(() => socket.off('post_reaction_added', handlePostReaction));

        // Listen for real-time comment reactions
        const handleCommentReactionRT = (data) => {
          logger.debug('💜 Real-time comment reaction received:', data);
          commentReactionBatcher.add(data);
        };
        socket.on('comment_reaction_added', handleCommentReactionRT);
        cleanupFunctions.push(() => socket.off('comment_reaction_added', handleCommentReactionRT));

        // Listen for real-time comments
        const handleCommentAddedRT = (data) => {
          logger.debug('💬 Real-time comment received:', data);
          commentAddedBatcher.add(data);
        };
        socket.on('comment_added', handleCommentAddedRT);
        cleanupFunctions.push(() => socket.off('comment_added', handleCommentAddedRT));

        // Listen for comment updates
        const handleCommentUpdatedRT = (data) => {
          logger.debug('✏️ Real-time comment update received:', data);
          commentUpdatedBatcher.add(data);
        };
        socket.on('comment_updated', handleCommentUpdatedRT);
        cleanupFunctions.push(() => socket.off('comment_updated', handleCommentUpdatedRT));

        // Listen for comment deletions
        const handleCommentDeletedRT = (data) => {
          logger.debug('🗑️ Real-time comment deletion received:', data);
          commentDeletedBatcher.add(data);
        };
        socket.on('comment_deleted', handleCommentDeletedRT);
        cleanupFunctions.push(() => socket.off('comment_deleted', handleCommentDeletedRT));

        // ✅ Listen for new posts
        const handlePostCreatedRT = (data) => {
          logger.debug('📝 Real-time post created:', data);
          postCreatedBatcher.add(data);
        };
        socket.on('post_created', handlePostCreatedRT);
        cleanupFunctions.push(() => socket.off('post_created', handlePostCreatedRT));

        // ✅ Listen for post updates
        const handlePostUpdatedRT = (data) => {
          logger.debug('✏️ Real-time post updated:', data);
          postUpdatedBatcher.add(data);
        };
        socket.on('post_updated', handlePostUpdatedRT);
        cleanupFunctions.push(() => socket.off('post_updated', handlePostUpdatedRT));

        // ✅ Listen for post deletions
        const handlePostDeletedRT = (data) => {
          logger.debug('🗑️ Real-time post deleted:', data);
          postDeletedBatcher.add(data);
        };
        socket.on('post_deleted', handlePostDeletedRT);
        cleanupFunctions.push(() => socket.off('post_deleted', handlePostDeletedRT));
      }
    };

    // Mark as set up immediately to prevent duplicate setup
    listenersSetUpRef.current = true;

    // Use shared socket helper with retry logic
    const cancelSocketRetry = setupSocketListeners((socket) => {
      setupListeners(socket);

      // ✅ Listen for friend update events (NO POLLING!)
      const handleFriendAdded = () => {
        logger.debug('👥 Friend added - refreshing friend list');
        fetchFriends();
      };

      const handleFriendRemoved = () => {
        logger.debug('👥 Friend removed - refreshing friend list');
        fetchFriends();
      };

      const handleFriendRequestReceived = () => {
        logger.debug('👥 Friend request received - refreshing friend list');
        fetchFriends();
      };

      socket.on('friend:added', handleFriendAdded);
      socket.on('friend:removed', handleFriendRemoved);
      socket.on('friend:request_received', handleFriendRequestReceived);

      // Add cleanup for friend events
      cleanupFunctions.push(() => {
        socket.off('friend:added', handleFriendAdded);
        socket.off('friend:removed', handleFriendRemoved);
        socket.off('friend:request_received', handleFriendRequestReceived);
      });
    });

    // ✅ REMOVED: Friend list polling interval - now using Socket.IO events!

    return () => {
      // Cancel pending socket retries
      cancelSocketRetry();

      // Clean up all socket listeners
      cleanupFunctions.forEach(cleanup => cleanup?.());

      // ⚡ PHASE 2C: Destroy batchers to prevent memory leaks
      if (socketBatchersRef.current) {
        Object.values(socketBatchersRef.current || {}).forEach(batcher => batcher?.destroy?.());
        socketBatchersRef.current = null;
      }

      // DON'T reset the flag - keep it true to prevent duplicate setup in React Strict Mode
    };
  }, [fetchFriends]);

  // Note: Scroll-to-post/comment effect merged with auto-fetch comments (lines 224-269)

  // Helper function to format time since last seen
  const getTimeSince = (date) => {
    if (!date) return 'Unknown';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'A moment ago';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const handleMediaSelect = useCallback(async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/ogg'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));

    if (invalidFiles.length > 0) {
      showAlert('Please select only images (JPEG, PNG, GIF, WebP) or videos (MP4, WebM, OGG)', 'Invalid File Type');
      return;
    }

    // Limit to 3 files - check current state
    setSelectedMedia(prev => {
      if (prev.length + files.length > 3) {
        showAlert('You can only upload up to 3 media files per post', 'Upload Limit Reached');
        return prev;
      }
      // Trigger upload in effect
      return prev;
    });

    // Check limit before proceeding
    if (selectedMedia.length + files.length > 3) {
      return;
    }

    setUploadingMedia(true);
    setUploadProgress(0);
    try {
      // Compress images before upload
      const compressedFiles = await Promise.all(
        files.map(async (file) => {
          if (file.type.startsWith('image/')) {
            try {
              const compressed = await compressPostMedia(file);
              return compressed;
            } catch (error) {
              logger.warn('Image compression failed, using original:', error);
              return file;
            }
          }
          return file; // Return videos/other files as-is
        })
      );

      // Upload with progress tracking
      const response = await uploadMultipleWithProgress({
        url: `${api.defaults.baseURL}/upload/post-media`,
        files: compressedFiles,
        fieldName: 'media',
        onProgress: (percent) => {
          setUploadProgress(percent);
        }
      });

      // Validate response - uploadMultipleWithProgress returns the JSON directly, not wrapped in .data
      if (!response || !response.media || response.media.length === 0) {
        throw new Error('Upload succeeded but no media URLs returned');
      }

      setSelectedMedia(prev => [...prev, ...response.media]);
      showToast('Media uploaded successfully', 'success');
    } catch (error) {
      logger.error('Media upload failed:', error);

      // Extract user-friendly error message
      const errorMessage = error.message ||
                          'Image upload failed. Please try again or use a smaller image.';

      showAlert(errorMessage, 'Upload Failed');
    } finally {
      setUploadingMedia(false);
      setUploadProgress(0);
    }
  }, [selectedMedia.length, showAlert, showToast]);

  // Handle paste events for images and image URLs
  const handlePaste = useCallback(async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    // Check if we've hit the media limit
    if (selectedMedia.length >= 3) {
      showAlert('You can only upload up to 3 media files per post', 'Upload Limit Reached');
      return;
    }

    // Check for pasted images (direct image paste)
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Handle direct image paste
      if (item.type.startsWith('image/')) {
        e.preventDefault(); // Prevent default paste behavior

        const file = item.getAsFile();
        if (!file) continue;

        setUploadingMedia(true);
        setUploadProgress(0);

        try {
          // Compress image before upload
          const compressed = await compressPostMedia(file);

          // Upload with progress tracking
          const response = await uploadMultipleWithProgress({
            url: `${api.defaults.baseURL}/upload/post-media`,
            files: [compressed],
            fieldName: 'media',
            onProgress: (percent) => {
              setUploadProgress(percent);
            }
          });

          if (response?.media?.length > 0) {
            setSelectedMedia(prev => [...prev, ...response.media]);
            showToast('Image pasted successfully', 'success');
          }
        } catch (error) {
          logger.error('Pasted image upload failed:', error);
          showAlert('Failed to upload pasted image. Please try again.', 'Upload Failed');
        } finally {
          setUploadingMedia(false);
          setUploadProgress(0);
        }
        return; // Exit after handling image
      }
    }

    // Check for pasted text that might be an image URL
    const text = e.clipboardData?.getData('text');
    if (text) {
      // Check if text is an image URL
      const imageUrlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i;
      if (imageUrlPattern.test(text.trim())) {
        e.preventDefault(); // Prevent pasting the URL as text

        setUploadingMedia(true);
        setUploadProgress(0);

        try {
          // Fetch the image from URL and convert to blob
          const response = await fetch(text.trim());
          if (!response.ok) throw new Error('Failed to fetch image from URL');

          const blob = await response.blob();
          const file = new File([blob], 'pasted-image.jpg', { type: blob.type });

          // Compress and upload
          const compressed = await compressPostMedia(file);
          const uploadResponse = await uploadMultipleWithProgress({
            url: `${api.defaults.baseURL}/upload/post-media`,
            files: [compressed],
            fieldName: 'media',
            onProgress: (percent) => {
              setUploadProgress(percent);
            }
          });

          if (uploadResponse?.media?.length > 0) {
            setSelectedMedia(prev => [...prev, ...uploadResponse.media]);
            showToast('Image URL pasted successfully', 'success');
          }
        } catch (error) {
          logger.error('Pasted image URL upload failed:', error);
          showAlert('Failed to upload image from URL. Please try uploading directly.', 'Upload Failed');
        } finally {
          setUploadingMedia(false);
          setUploadProgress(0);
        }
      }
    }
  }, [selectedMedia.length, showAlert, showToast]);

  const removeMedia = useCallback(async (index) => {
    // Get media item at index from current state
    setSelectedMedia(prev => {
      const mediaToRemove = prev[index];
      if (!mediaToRemove) return prev;

      // CRITICAL: Delete from backend FIRST, then update UI
      // This prevents ghost media that reappears after refresh
      (async () => {
        try {
          // Try to delete by tempMediaId first (preferred)
          if (mediaToRemove.tempMediaId) {
            await api.delete(`/upload/post-media/${mediaToRemove.tempMediaId}`);
            logger.debug('[TEMP MEDIA] Deleted by ID:', mediaToRemove.tempMediaId);
          } else if (mediaToRemove.url) {
            // Fallback: delete by URL for legacy uploads
            await api.delete('/upload/post-media/by-url', { data: { url: mediaToRemove.url } });
            logger.debug('[TEMP MEDIA] Deleted by URL:', mediaToRemove.url);
          }
        } catch (error) {
          logger.error('[TEMP MEDIA] Delete failed:', error);

          // Dev mode warning
          if (import.meta.env.DEV) {
            console.warn('[Pryde] Temporary media removed in UI but still exists server-side');
            console.warn('[Pryde] This media will reappear after refresh');
          }

          // Don't show error to user for non-critical failures (404 means already deleted)
          if (error.response?.status !== 404) {
            showToast('Media removed locally. May reappear on refresh.', 'warning');
          }
        }
      })();

      // Remove from UI immediately for responsive UX
      return prev.filter((_, i) => i !== index);
    });
  }, [showToast]);



  // Auto-save draft
  const autoSaveDraft = useCallback(async () => {
    // CRITICAL: Check if user is authenticated before attempting autosave
    // currentUser is from useAuth() context - no localStorage call needed
    if (!currentUser || !isAuthenticated) {
      logger.debug('⏸️ Skipping autosave - user not authenticated');
      setDraftSaveStatus('');
      return;
    }

    // CRITICAL: Check if CSRF token exists before attempting autosave
    // This prevents CSRF mismatch errors on page load or before auth is ready
    const csrfToken = getCsrfToken();
    if (!csrfToken) {
      logger.debug('⏸️ Skipping autosave - CSRF token not yet available');
      setDraftSaveStatus('');
      return;
    }

    // CRITICAL: Don't save empty drafts - prevents ghost drafts after posting
    const hasContent = newPost && newPost.trim().length > 0;
    const hasMedia = selectedMedia && selectedMedia.length > 0;
    const hasGif = selectedPostGif !== null;
    const hasPoll = poll !== null;

    if (!hasContent && !hasMedia && !hasGif && !hasPoll) {
      logger.debug('⏸️ Skipping autosave - no content to save');
      // Clear any existing draft since there's no content
      clearDraft('feed-create-post');
      setDraftSaveStatus('');
      return;
    }

    try {
      setDraftSaveStatus('saving');

      // Always update existing draft if we have one, or create new if we don't
      const draftData = {
        draftId: currentDraftId,
        draftType: 'post',
        content: newPost,
        media: selectedMedia,
        visibility: postVisibility,
        contentWarning: contentWarning,
        hideMetrics: hideMetrics,
        poll: poll,
        gifUrl: selectedPostGif // Include GIF in draft
      };

      // Save to localStorage as backup (works offline)
      saveDraft('feed-create-post', draftData);

      const response = await api.post('/drafts', draftData);

      // CRITICAL: Only set draft ID after backend confirms creation
      // This prevents ghost drafts that only exist client-side
      if (response.data?._id) {
        // Only update if different (new draft or updated ID)
        if (!currentDraftId || currentDraftId !== response.data._id) {
          setCurrentDraftId(response.data._id);
          if (import.meta.env.DEV) {
            logger.debug('✅ Draft confirmed by backend:', response.data._id);
          }
        }
      }

      setDraftSaveStatus('saved');

      // Clear "saved" status after 2 seconds
      setTimeout(() => setDraftSaveStatus(''), 2000);
    } catch (error) {
      logger.error('Failed to auto-save draft:', error);

      // DEV-MODE WARNING: Draft creation failed
      if (import.meta.env.DEV) {
        console.warn('[Pryde] Draft creation failed - draft only exists locally');
        console.warn('Dependent actions (delete, edit) will fail on this draft.');
      }

      // CRITICAL: Do NOT set currentDraftId on failure
      // This prevents ghost entity issues
      // Even if backend fails, localStorage backup is already saved
      setDraftSaveStatus('');
    }
  }, [newPost, selectedMedia, postVisibility, contentWarning, hideMetrics, poll, selectedPostGif, currentDraftId]);

  // Auto-save on content change (debounced - not too aggressive)
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      autoSaveDraft();
    }, 2000); // Auto-save after 2 seconds of inactivity (less aggressive)

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [newPost, selectedMedia, postVisibility, contentWarning, hideMetrics, poll, autoSaveDraft]);

  // Restore draft - ONLY restore drafts that were confirmed by backend
  const handleRestoreDraft = useCallback((draft) => {
    // CRITICAL: Only restore drafts that have a valid _id (confirmed by backend)
    if (!draft._id) {
      if (import.meta.env.DEV) {
        console.warn('[Pryde] Attempted to restore draft without valid ID');
        console.warn('This draft was never confirmed by the backend.');
      }
      return;
    }

    setNewPost(draft.content || '');

    // Restore media from backend draft - this is the authoritative source
    // Media in backend drafts has been properly tracked and persisted
    const draftMedia = draft.media || [];
    setSelectedMedia(draftMedia);

    if (import.meta.env.DEV && draftMedia.length > 0) {
      console.log(`[Pryde] Restored ${draftMedia.length} media item(s) from backend draft`);
      // Verify media has tempMediaId for proper tracking
      const missingIds = draftMedia.filter(m => !m.tempMediaId);
      if (missingIds.length > 0) {
        console.warn('[Pryde] Some media missing tempMediaId - may be legacy uploads');
        console.warn('[Pryde] Deletion may fall back to URL-based cleanup');
      }
    }

    setPostVisibility(draft.visibility || 'followers');
    setContentWarning(draft.contentWarning || '');
    setHideMetrics(draft.hideMetrics || false);
    // Normalize poll options: backend stores as [{text: "...", votes: []}] but PollCreator expects strings
    const restoredPoll = draft.poll ? { ...draft.poll } : null;
    if (restoredPoll && restoredPoll.options) {
      restoredPoll.options = restoredPoll.options.map(opt =>
        typeof opt === 'object' && opt.text ? opt.text : opt
      );
    }
    setPoll(restoredPoll);
    setSelectedPostGif(draft.gifUrl || null); // Restore GIF from draft
    setCurrentDraftId(draft._id);
    setShowContentWarning(!!draft.contentWarning);
    setShowPollCreator(!!restoredPoll);
  }, []);

  // Delete draft after successful post (fire-and-forget, non-blocking)
  const deleteDraft = (draftId) => {
    // CRITICAL: Only attempt delete if draft ID exists (backend confirmed)
    if (!draftId) {
      if (import.meta.env.DEV) {
        setTimeout(() => {
          console.warn('[Pryde] Attempted DELETE on draft with no ID (ghost entity)');
          console.warn('This action would fail. Skipping.');
        }, 0);
      }
      return;
    }

    // Fire-and-forget: Schedule delete in background, don't block main flow
    setTimeout(async () => {
      try {
        await api.delete(`/drafts/${draftId}`);
        if (import.meta.env.DEV) {
          console.log(`[Pryde] Draft ${draftId} deleted after successful post`);
        }
      } catch (error) {
        // Handle 404 gracefully - draft may have already been deleted
        if (error.response?.status === 404) {
          if (import.meta.env.DEV) {
            console.warn(`[Pryde] DELETE 404: Draft ${draftId} not found on server`);
            console.warn('Draft may have been already deleted or never persisted.');
          }
          return;
        }
        logger.error('Failed to delete draft:', error);
      }
    }, 0);
  };

  const handlePostSubmit = useCallback(async (e) => {
    e.preventDefault();
    // Allow posting with just a poll, content, media, or GIF
    // Check if content is empty (only whitespace) but preserve actual spaces/newlines
    const hasContent = newPost && newPost.length > 0 && newPost.trim().length > 0;
    if (!hasContent && selectedMedia.length === 0 && !poll && !selectedPostGif) {
      showAlert('Please add some content, media, GIF, or a poll to your post', 'Empty Post');
      return;
    }

    // If poll is present, require at least 2 options with text
    if (poll && poll.options) {
      const validOptions = poll.options.filter(opt => opt.trim() !== '');
      if (validOptions.length < 2) {
        showAlert('Poll must have at least 2 options', 'Invalid Poll');
        return;
      }
    }

    setLoading(true);
    try {
      // Convert emoji shortcuts before posting
      const contentWithEmojis = convertEmojiShortcuts(newPost);

      const postData = {
        content: contentWithEmojis,
        media: selectedMedia,
        visibility: postVisibility,
        contentWarning: contentWarning,
        poll: poll, // Include poll data if present
        hideMetrics: hideMetrics, // Include hideMetrics setting
        isAnonymous: isAnonymous, // Include anonymous flag
        gifUrl: selectedPostGif, // Include GIF if selected
        linkPreview: linkPreview || undefined, // Include link preview if present
      };

      // PHASE 1 REFACTOR: Custom privacy removed
      // if (postVisibility === 'custom') {
      //   if (hiddenFromUsers.length > 0) {
      //     postData.hiddenFrom = hiddenFromUsers;
      //   }
      // }

      const response = await api.post('/posts', postData);
      setPosts(prev => [response.data, ...prev]);

      // CRITICAL: Clear auto-save timer FIRST to prevent race conditions
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }

      // Delete draft after successful post to prevent duplicates
      if (currentDraftId) {
        deleteDraft(currentDraftId);
        setCurrentDraftId(null);
      }

      // Clear localStorage draft
      clearDraft('feed-create-post');

      setNewPost('');
      setSelectedMedia([]);
      setSelectedPostGif(null); // Clear GIF
      setPostVisibility(defaultPostVisibilityRef.current); // Reset to user's default, not hardcoded
      setHiddenFromUsers([]);
      setContentWarning('');
      setShowContentWarning(false);
      setPoll(null);
      setShowPollCreator(false);
      setHideMetrics(false);
      setIsAnonymous(false);
      setLinkPreview(null);

      // Mobile UX: Close composer and scroll to top to see the new post
      if (showMobileComposer) {
        setShowMobileComposer(false);
        setIsTyping(false);
        // Scroll to top after a brief delay to let the composer close
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      }
    } catch (error) {
      logger.error('Post creation failed:', error);

      // Extract more helpful error message for debugging
      let errorMessage = 'This didn\'t post properly. You can try again in a moment.';

      if (error.response?.status === 403) {
        // CSRF or permission error
        if (error.response?.data?.code === 'CSRF_MISSING' || error.response?.data?.code === 'CSRF_MISMATCH') {
          errorMessage = 'Security token expired. Please refresh the page and try again.';
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.response?.status === 401) {
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (error.response?.status === 429) {
        if (error.response?.data?.code === 'ANON_COOLDOWN') {
          showToast(
            error.response.data.message || "You've shared a lot anonymously. You can post again soon.",
            'info'
          );
          return;
        }
        errorMessage = 'Too many posts. Please wait a moment before trying again.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      showAlert(errorMessage, 'Post issue');
    } finally {
      setLoading(false);
    }
  }, [newPost, selectedMedia, poll, selectedPostGif, postVisibility, contentWarning, hideMetrics, currentDraftId, showMobileComposer, showAlert, showToast]);

  const handleLike = useCallback(async (postId) => {
    try {
      const response = await api.post(`/posts/${postId}/like`);
      setPosts(prev => prev.map(p => p._id === postId ? response.data : p));
    } catch (error) {
      logger.error('Failed to like post:', error);
    }
  }, []);

  // Helper function to get user's selected emoji from reactions
  // Handles both array format [{user, emoji}] and object format {emoji: [userIds]}
  const getUserReactionEmoji = useCallback((reactions) => {
    if (!reactions || !currentUser?.id) {
      return null;
    }

    // Handle array format (Post reactions)
    if (Array.isArray(reactions)) {
      const userReaction = reactions.find(r => {
        const userId = r.user?._id || r.user;
        return userId?.toString() === currentUser.id?.toString();
      });
      return userReaction?.emoji || null;
    }

    // Handle object format (Comment reactions)
    if (typeof reactions !== 'object') return null;
    for (const [emoji, userIds] of safeEntries(reactions)) {
      if (Array.isArray(userIds) && userIds.some(id => id?.toString() === currentUser.id?.toString())) {
        return emoji;
      }
    }
    return null;
  }, [currentUser?.id]);

  const handlePostReaction = useCallback(async (postId, emoji) => {
    try {
      const response = await api.post(`/posts/${postId}/react`, { emoji });
      console.log('[Pryde] Reaction response:', response.data);
      console.log('[Pryde] Updated reactions:', response.data.reactions);
      console.log('[Pryde] Current user ID:', currentUser?.id);

      // Force a new array reference to trigger re-render
      // Create completely new objects to ensure React detects the change
      setPosts(prevPosts => {
        const newPosts = prevPosts.map(p => {
          if (p._id === postId) {
            // Create a deep copy with new references
            const updatedPost = {
              ...response.data,
              reactions: [...(response.data.reactions || [])]
            };
            console.log('[Pryde] Updated post:', updatedPost);
            console.log('[Pryde] User reaction emoji:', getUserReactionEmoji(updatedPost.reactions));
            return updatedPost;
          }
          return p;
        });
        console.log('[Pryde] Updated posts array, post found:', newPosts.some(p => p._id === postId));
        return newPosts;
      });

      setShowReactionPicker(null); // Hide picker after reaction

      // Force a small delay to ensure state update completes
      setTimeout(() => {
        console.log('[Pryde] State update complete');
      }, 100);
    } catch (error) {
      logger.error('Failed to react to post:', error);
    }
  }, [currentUser?.id, getUserReactionEmoji]);

  const handleCommentReaction = useCallback(async (commentId, emoji) => {
    // Save original state for rollback
    const originalPostComments = { ...postComments };
    const originalCommentReplies = { ...commentReplies };

    try {
      // Optimistic update
      const updateCommentReaction = (comment) => {
        if (comment._id !== commentId) return comment;

        const reactions = { ...comment.reactions };
        const currentUserId = currentUser?.id;

        // Remove user from all emoji arrays (defensive: skip non-array values)
        Object.keys(reactions).forEach(key => {
          if (Array.isArray(reactions[key])) {
            reactions[key] = reactions[key].filter(uid => uid !== currentUserId);
          }
        });

        // Add user to selected emoji array (or remove if clicking same emoji)
        const emojiList = comment.reactions?.[emoji];
        const hadThisReaction = Array.isArray(emojiList) && emojiList.includes(currentUserId);
        if (!hadThisReaction) {
          if (!reactions[emoji]) reactions[emoji] = [];
          reactions[emoji].push(currentUserId);
        }

        return { ...comment, reactions };
      };

      // Update in postComments
      setPostComments(prev => mapCommentsInBuckets(prev, updateCommentReaction));

      // Update in commentReplies
      setCommentReplies(prev => mapCommentsInBuckets(prev, updateCommentReaction));

      // Make API call
      const response = await api.post(`/comments/${commentId}/react`, { emoji });

      // Update with server response (source of truth)
      const serverComment = response.data;
      setPostComments(prev => replaceCommentInBuckets(prev, serverComment));
      setCommentReplies(prev => replaceCommentInBuckets(prev, serverComment));

      setShowReactionPicker(null);
    } catch (error) {
      logger.error('Failed to react to comment:', error);
      // Rollback optimistic update on error
      setPostComments(originalPostComments);
      setCommentReplies(originalCommentReplies);
      showAlert('Failed to add reaction. Please try again.', 'Reaction Failed');
    }
  }, [postComments, commentReplies, currentUser?.id, showAlert]);

  const handleCommentSubmit = useCallback(async (postId, e) => {
    e.preventDefault();

    // Block submission if GIF picker is open
    if (showGifPicker !== null) {
      return;
    }

    const content = commentText[postId];
    const gifUrl = commentGif[postId];

    // Either content or GIF must be provided
    if ((!content || !content.trim()) && !gifUrl) return;

    try {
      // Convert emoji shortcuts before posting
      const contentWithEmojis = content ? convertEmojiShortcuts(content) : '';

      logger.debug('💬 Submitting comment:', { postId, content: contentWithEmojis, gifUrl });

      const response = await api.post(`/posts/${postId}/comments`, {
        content: contentWithEmojis,
        gifUrl: gifUrl || null,
        parentCommentId: null // Top-level comment
      });

      logger.debug('✅ Comment created:', response.data);

      // Socket event will add the comment to state - no optimistic update needed
      // This prevents duplicate comments from appearing

      // Clear localStorage draft
      const draftKey = `comment-${postId}`;
      clearDraft(draftKey);

      setCommentText(prev => ({ ...prev, [postId]: '' }));
      setCommentGif(prev => ({ ...prev, [postId]: null }));
    } catch (error) {
      if (error.response?.status === 429 && error.response?.data?.code === 'ANON_COOLDOWN') {
        showToast(
          error.response.data.message || "You've shared a lot anonymously. You can post again soon.",
          'info'
        );
        return;
      }
      logger.error('❌ Failed to create comment:', error);
      logger.error('Error details:', error.response?.data);
      showAlert('This didn\'t post properly. You can try again in a moment.', 'Reply issue');
    }
  }, [showGifPicker, commentText, commentGif, showAlert, showToast]);

  const handleCommentChange = useCallback((postId, value) => {
    setCommentText(prev => ({ ...prev, [postId]: value }));

    // Auto-save comment draft
    if (value) {
      const draftKey = `comment-${postId}`;
      saveDraft(draftKey, value);
    }
  }, []);

  // Restore comment drafts on mount
  useEffect(() => {
    posts.forEach(post => {
      const draftKey = `comment-${post._id}`;
      const localDraft = loadDraft(draftKey);
      if (localDraft) {
        setCommentText(prev => ({ ...prev, [post._id]: localDraft }));
      }
    });
  }, [posts.length]); // Only run when posts are loaded

  const handleEditComment = useCallback((commentId, content) => {
    // If already editing this comment, just update the text (typing/backspace)
    if (editingCommentId === commentId) {
      setEditCommentText(content);
      return;
    }

    // Initialize the edit (clicked Edit button) - restore draft if available
    setEditingCommentId(commentId);
    const draftKey = `edit-comment-${commentId}`;
    const localDraft = loadDraft(draftKey);
    setEditCommentText(localDraft || content);
  }, [editingCommentId]);

  // Auto-save comment edit draft
  useEffect(() => {
    if (editingCommentId && editCommentText) {
      const draftKey = `edit-comment-${editingCommentId}`;
      saveDraft(draftKey, editCommentText);
    }
  }, [editCommentText, editingCommentId]);

  const handleSaveEditComment = useCallback(async (commentId) => {
    if (!editCommentText.trim()) return;

    try {
      const response = await api.put(`/comments/${commentId}`, {
        content: editCommentText
      });

      const updatedComment = response.data;

      // Update in postComments
      setPostComments(prev => replaceCommentInBuckets(prev, updatedComment));

      // Update in commentReplies
      setCommentReplies(prev => replaceCommentInBuckets(prev, updatedComment));

      // Clear localStorage draft
      const draftKey = `edit-comment-${commentId}`;
      clearDraft(draftKey);

      setEditingCommentId(null);
      setEditCommentText('');
    } catch (error) {
      logger.error('Failed to edit comment:', error);
      showAlert('This didn\'t save properly. You can try again in a moment.', 'Edit issue');
    }
  }, [editCommentText, showAlert]);

  const handleCancelEditComment = useCallback(() => {
    setEditingCommentId(prev => {
      if (prev) {
        const draftKey = `edit-comment-${prev}`;
        clearDraft(draftKey);
      }
      return null;
    });

    setEditCommentText('');
  }, []);

  const toggleDropdown = useCallback((postId) => {
    setOpenDropdownId(prev => prev === postId ? null : postId);
  }, []);

  const handleEditPost = useCallback((post) => {
    setEditingPostId(post._id);

    // Try to restore draft first, otherwise use original content
    const draftKey = `edit-post-${post._id}`;
    const localDraft = loadDraft(draftKey);

    if (localDraft) {
      setEditPostText(localDraft.content || post.content);
      setEditPostVisibility(localDraft.visibility || post.visibility || 'followers');
      setEditHiddenFromUsers(localDraft.hiddenFrom || post.hiddenFrom?.map(u => u._id || u) || []);
      // Restore media from draft if available, otherwise from post
      setEditPostMedia(localDraft.media || post.media || []);
      setDeletedMedia(localDraft.deletedMedia || []);
    } else {
      setEditPostText(post.content);
      setEditPostVisibility(post.visibility || 'followers');
      setEditHiddenFromUsers(post.hiddenFrom?.map(u => u._id || u) || []);
      // Load existing media for editing
      setEditPostMedia(post.media || []);
      setDeletedMedia([]);
    }

    setOpenDropdownId(null);
  }, []);

  // Handle removing media during edit
  const handleRemoveEditMedia = useCallback((mediaUrl) => {
    // Add to deleted list for backend cleanup
    setDeletedMedia(prev => [...prev, mediaUrl]);
    // Remove from current media list
    setEditPostMedia(prev => prev.filter(m => m.url !== mediaUrl));
  }, []);

  // Auto-resize edit post textarea
  useEffect(() => {
    if (editPostTextareaRef.current && editingPostId) {
      const textarea = editPostTextareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }, [editPostText, editingPostId]);

  // Auto-save edit post draft
  useEffect(() => {
    if (editingPostId && (editPostText || editPostMedia.length > 0)) {
      const draftKey = `edit-post-${editingPostId}`;
      const draftData = {
        content: editPostText,
        visibility: editPostVisibility,
        hiddenFrom: editHiddenFromUsers,
        media: editPostMedia,
        deletedMedia: deletedMedia
      };
      saveDraft(draftKey, draftData);
    }
  }, [editPostText, editPostVisibility, editHiddenFromUsers, editingPostId, editPostMedia, deletedMedia]);

  const handleSaveEditPost = useCallback(async (postId) => {
    // Allow saving if there's content OR media remaining
    if (!editPostText.trim() && editPostMedia.length === 0) return;

    try {
      const updateData = {
        content: editPostText,
        visibility: editPostVisibility,
        media: editPostMedia
      };

      // Add deleted media for backend cleanup
      if (deletedMedia.length > 0) {
        updateData.deletedMedia = deletedMedia;
      }

      // Add custom privacy settings if applicable
      if (editPostVisibility === 'custom') {
        if (editHiddenFromUsers.length > 0) {
          updateData.hiddenFrom = editHiddenFromUsers;
        }
      } else {
        // Clear custom privacy if not using custom visibility
        updateData.hiddenFrom = [];
      }

      const response = await api.put(`/posts/${postId}`, updateData);
      setPosts(prev => prev.map(p => p._id === postId ? response.data : p));

      // Clear localStorage draft
      const draftKey = `edit-post-${postId}`;
      clearDraft(draftKey);

      setEditingPostId(null);
      setEditPostText('');
      setEditPostVisibility('followers');
      setEditHiddenFromUsers([]);
      setEditPostMedia([]);
      setDeletedMedia([]);
      showAlert('Post updated successfully!', 'Success');
    } catch (error) {
      logger.error('Failed to edit post:', error);
      showAlert('This didn\'t save properly. You can try again in a moment.', 'Edit issue');
    }
  }, [editPostText, editPostMedia, editPostVisibility, deletedMedia, editHiddenFromUsers, showAlert]);

  const handleCancelEditPost = useCallback(() => {
    setEditingPostId(prev => {
      if (prev) {
        const draftKey = `edit-post-${prev}`;
        clearDraft(draftKey);
      }
      return null;
    });

    setEditPostText('');
    setEditPostVisibility('followers');
    setEditHiddenFromUsers([]);
    setEditPostMedia([]);
    setDeletedMedia([]);
  }, []);

  // Keyboard shortcuts for edit post
  const handleEditPostKeyDown = useCallback((e, postId) => {
    // Save: Cmd/Ctrl + Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSaveEditPost(postId);
    }

    // Cancel: Esc
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEditPost();
    }
  }, [handleSaveEditPost, handleCancelEditPost]);

  const handleDeleteComment = useCallback(async (postId, commentId, isReply = false) => {
    const confirmed = await showConfirm('Are you sure you want to delete this comment?', 'Delete Comment', 'Delete', 'Cancel');
    if (!confirmed) return;

    try {
      await api.delete(`/comments/${commentId}`);

      if (isReply) {
        // Remove from commentReplies
        setCommentReplies(prev => removeCommentFromAllBuckets(prev, commentId));
      } else {
        // Remove from postComments (and all its replies will be deleted by backend)
        setPostComments(prev => removeCommentFromBucket(prev, postId, commentId));

        // Remove replies from state
        setCommentReplies(prev => removeBucket(prev, commentId));
      }

      // Update post comment count
      setPosts(prev => prev.map(p =>
        p._id === postId
          ? { ...p, commentCount: Math.max(0, (p.commentCount || 0) - 1) }
          : p
      ));
    } catch (error) {
      logger.error('Failed to delete comment:', error);
      showAlert('This didn\'t delete properly. You can try again in a moment.', 'Delete issue');
    }
  }, [showConfirm, showAlert]);

  const handleReplyToComment = useCallback((postId, commentId, mentionUsername = null) => {
    setReplyingToComment({ postId, commentId });
    setReplyText(mentionUsername ? `@${mentionUsername} ` : '');
  }, []);

  const handleSubmitReply = useCallback(async (e) => {
    e.preventDefault();

    // Block submission if GIF picker is open
    if (showGifPicker !== null) {
      return;
    }

    // Either text or GIF must be provided
    if ((!replyText || !replyText.trim()) && !replyGif) return;
    if (!replyingToComment) return;

    try {
      const { postId, commentId } = replyingToComment;
      // Convert emoji shortcuts before posting
      const contentWithEmojis = replyText ? convertEmojiShortcuts(replyText) : '';

      await api.post(`/posts/${postId}/comments`, {
        content: contentWithEmojis,
        gifUrl: replyGif || null,
        parentCommentId: commentId, // This makes it a reply
        isAnonymous: replyIsAnonymous
      });

      // Socket event will add the reply to state - no optimistic update needed
      // This prevents duplicate replies from appearing

      setReplyingToComment(null);
      setReplyText('');
      setReplyGif(null);
      setReplyIsAnonymous(false);

      // Auto-show replies after adding one
      setShowReplies(prev => ({
        ...prev,
        [commentId]: true
      }));
    } catch (error) {
      if (error.response?.status === 429 && error.response?.data?.code === 'ANON_COOLDOWN') {
        showToast(
          error.response.data.message || "You've shared a lot anonymously. You can post again soon.",
          'info'
        );
        return;
      }
      logger.error('Failed to reply to comment:', error);
      showAlert('This didn\'t post properly. You can try again in a moment.', 'Reply issue');
    }
  }, [showGifPicker, replyText, replyGif, replyingToComment, replyIsAnonymous, showAlert, showToast]);

  const handleCancelReply = useCallback(() => {
    setReplyingToComment(null);
    setReplyText('');
    setReplyGif(null);
    setReplyIsAnonymous(false);
  }, []);

  const handleBookmark = useCallback(async (postId) => {
    setBookmarkedPosts(prev => {
      const isBookmarked = prev.includes(postId);
      // Optimistic update
      if (isBookmarked) {
        api.delete(`/bookmarks/${postId}`).catch(error => {
          logger.error('Failed to unbookmark post:', error);
          showAlert(error.response?.data?.message || 'This didn\'t save properly. You can try again in a moment.', 'Save issue');
          setBookmarkedPosts(p => [...p, postId]); // Rollback
        });
        return prev.filter(id => id !== postId);
      } else {
        api.post(`/bookmarks/${postId}`).catch(error => {
          logger.error('Failed to bookmark post:', error);
          showAlert(error.response?.data?.message || 'This didn\'t save properly. You can try again in a moment.', 'Save issue');
          setBookmarkedPosts(p => p.filter(id => id !== postId)); // Rollback
        });
        return [...prev, postId];
      }
    });
  }, [showAlert]);

  const handleDelete = useCallback(async (postId) => {
    const confirmed = await showConfirm('Are you sure you want to delete this post?', 'Delete Post', 'Delete', 'Cancel');
    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/posts/${postId}`);
      setPosts(prev => prev.filter(p => p._id !== postId));
    } catch (error) {
      logger.error('Failed to delete post:', error);
      showAlert('This didn\'t delete properly. You can try again in a moment.', 'Delete issue');
    }
  }, [showConfirm, showAlert]);

  // ============================================
  // FeedPost Handler Wrappers
  // These wrap inline functions for FeedPost component
  // ============================================

  const handlePinPost = useCallback(async (postId, isPinned) => {
    try {
      const response = await api.post(`/posts/${postId}/pin`);
      setPosts(prev => prev.map(p => p._id === postId ? response.data : p));
      setOpenDropdownId(null);
    } catch (error) {
      logger.error('Failed to toggle pin:', error);
    }
  }, []);

  const handleDeletePost = useCallback(async (postId) => {
    await handleDelete(postId);
    setOpenDropdownId(null);
  }, [handleDelete]);

  const handleReportPost = useCallback((postId, authorId) => {
    setReportModal({ isOpen: true, type: 'post', contentId: postId, userId: authorId });
    setOpenDropdownId(null);
  }, []);

  const handlePostReactionChange = useCallback((postId, reactions, userReaction) => {
    setPosts(prevPosts =>
      prevPosts.map(p =>
        p._id === postId
          ? { ...p, _reactionsUpdated: Date.now() }
          : p
      )
    );
  }, []);

  const handleReactionCountClick = useCallback((postId) => {
    setReactionDetailsModal({
      isOpen: true,
      targetType: 'post',
      targetId: postId
    });
  }, []);

  const handleRepost = useCallback(async (postId, type, quoteContent) => {
    try {
      if (type === 'undo') {
        await api.delete(`/posts/${postId}/repost`);
        setPosts(prev => prev.map(p =>
          p._id === postId ? { ...p, repostCount: Math.max(0, (p.repostCount || 0) - 1), _hasReposted: false } : p
        ));
      } else if (type === 'repost') {
        const { data } = await api.post(`/posts/${postId}/repost`, { quote: false });
        setPosts(prev => [data, ...prev.map(p =>
          p._id === postId ? { ...p, repostCount: (p.repostCount || 0) + 1, _hasReposted: true } : p
        )]);
      } else if (type === 'quote') {
        const { data } = await api.post(`/posts/${postId}/repost`, { quote: true, content: quoteContent });
        setPosts(prev => [data, ...prev.map(p =>
          p._id === postId ? { ...p, repostCount: (p.repostCount || 0) + 1 } : p
        )]);
      }
    } catch (err) {
      logger.error('Repost failed:', err);
    }
  }, []);

  const handleEditPostTextChange = useCallback((value) => {
    setEditPostText(value);
  }, []);

  const handleEditPostVisibilityChange = useCallback((value) => {
    setEditPostVisibility(value);
  }, []);

  const handleExpandPost = useCallback((postId) => {
    setExpandedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
  }, []);

  const handleRevealPost = useCallback((postId) => {
    setRevealedPosts(prev => ({ ...prev, [postId]: true }));
  }, []);

  const handlePhotoClick = useCallback((url) => {
    setPhotoViewerImage(url);
  }, []);

  const handlePollVote = useCallback((postId, updatedPoll) => {
    setPosts(prevPosts =>
      prevPosts.map(p =>
        p._id === postId ? { ...p, poll: updatedPoll } : p
      )
    );
  }, []);

  const handleCommentGifSelect = useCallback((postId, gifUrl) => {
    setCommentGif(prev => ({ ...prev, [postId]: gifUrl }));
  }, []);

  const handleToggleGifPicker = useCallback((pickerId) => {
    setShowGifPicker(pickerId);
  }, []);

  const handleSetShowReactionPicker = useCallback((value) => {
    setShowReactionPicker(value);
  }, []);

  const handleSetReactionDetailsModal = useCallback((value) => {
    setReactionDetailsModal(value);
  }, []);

  const handleSetReportModal = useCallback((value) => {
    setReportModal(value);
  }, []);

  const handleReplyTextChange = useCallback((value) => {
    setReplyText(value);
  }, []);

  const handleReplyGifSelect = useCallback((gifUrl) => {
    setReplyGif(gifUrl);
  }, []);

  const activeReplyTarget = replyingToComment?.postId === commentSheetOpen
    ? postComments[commentSheetOpen]?.find(
      (comment) => String(comment._id) === String(replyingToComment.commentId)
    ) ?? Object.values(commentReplies).flat().find(
      (reply) => String(reply._id) === String(replyingToComment.commentId)
    )
    : null;

  const activeReplyTargetName =
    activeReplyTarget?.authorId?.displayName
    || activeReplyTarget?.authorId?.username
    || 'comment';

  const commentSheetContextValue = buildCommentContextValue({
    currentUser,
    postId: commentSheetOpen,
    viewerRole: role,
    editingCommentId,
    editCommentText,
    showReplies,
    showReactionPicker,
    commentRefs,
    getUserReactionEmoji,
    handleEditComment,
    handleSaveEditComment,
    handleCancelEditComment,
    handleDeleteComment,
    handleCommentReaction,
    toggleReplies,
    handleReplyToComment,
    setShowReactionPicker,
    setReactionDetailsModal,
    setReportModal,
  });

  return (
    <div
      className="page-container feed-page"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <FeedPageHeader onMenuOpen={onMenuOpen} />

      <FeedPullToRefresh isPulling={isPulling} pullDistance={pullDistance} />

      <FeedScrollTopButton
        visible={showScrollTop && !showMobileComposer && !isTyping}
        onClick={scrollToTop}
      />

      <div className={`feed-layout ${isMobile ? 'feed-mobile' : 'feed-desktop'}`}>
        <main className="feed-main">
          <FeedFilterTabs
            activeFilter={feedFilter}
            onChange={handleFeedFilterChange}
          />

          <CommunityBanner />

          {/* FeedComposer - Desktop only (mobile has FAB + bottom sheet below) */}
          <FeedComposer
            isMobile={isMobile}
            isQuietMode={isQuietMode}
            newPost={newPost}
            selectedMedia={selectedMedia}
            uploadingMedia={uploadingMedia}
            uploadProgress={uploadProgress}
            postVisibility={postVisibility}
            contentWarning={contentWarning}
            showContentWarning={showContentWarning}
            selectedPostGif={selectedPostGif}
            showGifPicker={showGifPicker}
            poll={poll}
            showPollCreator={showPollCreator}
            hideMetrics={hideMetrics}
            isAnonymous={isAnonymous}
            showDraftManager={showDraftManager}
            draftSaveStatus={draftSaveStatus}
            showMobileComposer={showMobileComposer}
            isTyping={isTyping}
            showAdvancedOptions={showAdvancedOptions}
            loading={loading}
            onPostSubmit={handlePostSubmit}
            onPostTextChange={setNewPost}
            onMediaSelect={handleMediaSelect}
            onRemoveMedia={removeMedia}
            onPaste={handlePaste}
            onSetIsTyping={setIsTyping}
            onSetPostVisibility={setPostVisibility}
            onSetContentWarning={setContentWarning}
            onSetShowContentWarning={setShowContentWarning}
            onSetSelectedPostGif={setSelectedPostGif}
            onSetShowGifPicker={setShowGifPicker}
            onSetPoll={setPoll}
            onSetShowPollCreator={setShowPollCreator}
            onSetHideMetrics={setHideMetrics}
            onSetIsAnonymous={setIsAnonymous}
            onSetShowDraftManager={setShowDraftManager}
            onRestoreDraft={handleRestoreDraft}
            onSetShowMobileComposer={setShowMobileComposer}
            onSetShowAdvancedOptions={setShowAdvancedOptions}
            linkPreview={linkPreview}
            onLinkPreviewChange={setLinkPreview}
          />

          <FeedList
            posts={posts}
            blockedUsers={blockedUsers}
            fetchingPosts={fetchingPosts}
            hasMore={hasMore}
            quietMode={quietMode}
            postRefs={postRefs}
            commentRefs={commentRefs}
            currentUser={currentUser}
            openDropdownId={openDropdownId}
            editingPostId={editingPostId}
            editPostText={editPostText}
            editPostVisibility={editPostVisibility}
            editPostMedia={editPostMedia}
            editPostTextareaRef={editPostTextareaRef}
            expandedPosts={expandedPosts}
            revealedPosts={revealedPosts}
            autoHideContentWarnings={autoHideContentWarnings}
            bookmarkedPosts={bookmarkedPosts}
            postComments={postComments}
            commentReplies={commentReplies}
            showReplies={showReplies}
            showCommentBox={showCommentBox}
            commentText={commentText}
            commentGif={commentGif}
            showGifPicker={showGifPicker}
            replyingToComment={replyingToComment}
            replyText={replyText}
            replyGif={replyGif}
            editingCommentId={editingCommentId}
            editCommentText={editCommentText}
            showReactionPicker={showReactionPicker}
            onLoadMore={loadMorePosts}
            onToggleDropdown={toggleDropdown}
            onPinPost={handlePinPost}
            onEditPost={handleEditPost}
            onDeletePost={handleDeletePost}
            onReportPost={handleReportPost}
            onBookmark={handleBookmark}
            onRepost={handleRepost}
            onReactionChange={handlePostReactionChange}
            onReactionCountClick={handleReactionCountClick}
            onEditPostTextChange={handleEditPostTextChange}
            onEditPostVisibilityChange={handleEditPostVisibilityChange}
            onRemoveEditMedia={handleRemoveEditMedia}
            onSaveEditPost={handleSaveEditPost}
            onCancelEditPost={handleCancelEditPost}
            onEditPostKeyDown={handleEditPostKeyDown}
            onExpandPost={handleExpandPost}
            onRevealPost={handleRevealPost}
            onPhotoClick={handlePhotoClick}
            onPollVote={handlePollVote}
            onToggleCommentBox={toggleCommentBox}
            onOpenComments={openComments}
            onCommentChange={handleCommentChange}
            onCommentSubmit={handleCommentSubmit}
            onCommentGifSelect={handleCommentGifSelect}
            onToggleGifPicker={handleToggleGifPicker}
            onEditComment={handleEditComment}
            onSaveEditComment={handleSaveEditComment}
            onCancelEditComment={handleCancelEditComment}
            onDeleteComment={handleDeleteComment}
            onCommentReaction={handleCommentReaction}
            onToggleReplies={toggleReplies}
            onReplyToComment={handleReplyToComment}
            onSetShowReactionPicker={handleSetShowReactionPicker}
            onSetReactionDetailsModal={handleSetReactionDetailsModal}
            onSetReportModal={handleSetReportModal}
            onReplyTextChange={handleReplyTextChange}
            onReplyGifSelect={handleReplyGifSelect}
            onSubmitReply={handleSubmitReply}
            onCancelReply={handleCancelReply}
            getUserReactionEmoji={getUserReactionEmoji}
            viewerRole={role}
            replyIsAnonymous={replyIsAnonymous}
            onReplyIsAnonymousChange={setReplyIsAnonymous}
          />

          {/* Mobile FAB + Composer handled by FeedComposer component above */}
        </main>

        <FeedSidebar showMobileSidebar={showMobileSidebar} />
      </div>

      <FeedOverlayStack
        reportModal={reportModal}
        onCloseReportModal={() => setReportModal({ isOpen: false, type: '', contentId: null, userId: null })}
        photoViewerImage={photoViewerImage}
        onClosePhotoViewer={() => setPhotoViewerImage(null)}
        showPrivacyModal={showPrivacyModal}
        friends={friends}
        hiddenFromUsers={hiddenFromUsers}
        onHiddenUsersChange={setHiddenFromUsers}
        onClosePrivacyModal={() => setShowPrivacyModal(false)}
        modalState={modalState}
        onCloseModal={closeModal}
        reactionDetailsModal={reactionDetailsModal}
        onCloseReactionDetails={() => setReactionDetailsModal({ isOpen: false, targetType: null, targetId: null })}
        toasts={toasts}
        onRemoveToast={removeToast}
      />

      <FeedCommentSurfaces
        commentModalOpen={commentModalOpen}
        commentSheetOpen={commentSheetOpen}
        currentUser={currentUser}
        commentText={commentText}
        commentGif={commentGif}
        showGifPicker={showGifPicker}
        setCommentModalOpen={setCommentModalOpen}
        setCommentSheetOpen={setCommentSheetOpen}
        setShowGifPicker={setShowGifPicker}
        setCommentGif={setCommentGif}
        handleCommentSubmit={handleCommentSubmit}
        handleCommentChange={handleCommentChange}
        handleKeyDown={handleKeyDown}
        replyingToComment={replyingToComment}
        setReplyingToComment={setReplyingToComment}
        activeReplyTargetName={activeReplyTargetName}
        replyIsAnonymous={replyIsAnonymous}
        setReplyIsAnonymous={setReplyIsAnonymous}
        handleCancelReply={handleCancelReply}
        replyText={replyText}
        handleReplyTextChange={handleReplyTextChange}
        handleSubmitReply={handleSubmitReply}
        replyGif={replyGif}
        handleReplyGifSelect={handleReplyGifSelect}
        setReplyGif={setReplyGif}
        commentSheetContextValue={commentSheetContextValue}
        postComments={postComments}
        commentReplies={commentReplies}
      />

    </div>
  );
}

export default Feed;

