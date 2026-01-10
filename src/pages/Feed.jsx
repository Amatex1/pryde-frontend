import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams, useNavigate, useOutletContext } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PasskeyBanner from '../components/PasskeyBanner';
import EmailVerificationBanner from '../components/EmailVerificationBanner';
import ReportModal from '../components/ReportModal';
import PhotoViewer from '../components/PhotoViewer';
import CustomModal from '../components/CustomModal';
import ReactionDetailsModal from '../components/ReactionDetailsModal';
import FormattedText from '../components/FormattedText';
import PostSkeleton from '../components/PostSkeleton';
import OptimizedImage from '../components/OptimizedImage';
import CommentThread from '../components/CommentThread';
import ReactionButton from '../components/ReactionButton';
import GifPicker from '../components/GifPicker';
import PollCreator from '../components/PollCreator';
import Poll from '../components/Poll';
import PinnedPostBadge from '../components/PinnedPostBadge';
import PostHeader from '../components/PostHeader';
import PausableGif from '../components/PausableGif';
import { useBadges } from '../hooks/useBadges';
// DEPRECATED: EditHistoryModal import removed 2025-12-26
import DraftManager from '../components/DraftManager';
import Toast from '../components/Toast';
import { useModal } from '../hooks/useModal';
import { useOnlineUsers } from '../hooks/useOnlineUsers';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useUnreadMessages } from '../hooks/useUnreadMessages'; // ✅ Use singleton hook
import { useToast } from '../hooks/useToast';
import { useAuth } from '../context/AuthContext'; // ✅ Use auth context (single source of truth)
import api, { getCsrfToken } from '../utils/api';
import { getImageUrl } from '../utils/imageUrl';
import { getSocket, setupSocketListeners } from '../utils/socketHelpers';
import { convertEmojiShortcuts } from '../utils/textFormatting';
import { getDisplayName } from '../utils/getDisplayName';
import logger from '../utils/logger';
import { compressPostMedia } from '../utils/compressImage';
import { uploadMultipleWithProgress } from '../utils/uploadWithProgress';
import { saveDraft, loadDraft, clearDraft } from '../utils/draftStore';
import { withOptimisticUpdate } from '../utils/consistencyGuard';
import { quietCopy } from '../config/uiCopy';
import PageTitle from '../components/PageTitle';
import CommunityResources from '../components/Sidebar/CommunityResources';
import './Feed.css';
import './Feed.calm.css'; // PHASE C: Calm mode overrides
import './Mobile.calm.css'; // PHASE D: Mobile-first calm mode

function Feed() {
  const [searchParams] = useSearchParams();
  const { modalState, closeModal, showAlert, showConfirm } = useModal();
  const { onlineUsers, isUserOnline } = useOnlineUsers();
  const { authReady, isAuthenticated, user: currentUser } = useAuth(); // ✅ Single source of truth for auth
  const { toasts, showToast, removeToast } = useToast();

  // Get menu handler from AppLayout outlet context
  const outletContext = useOutletContext() || {};
  const { onMenuOpen } = outletContext;
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingPosts, setFetchingPosts] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [reportModal, setReportModal] = useState({ isOpen: false, type: '', contentId: null, userId: null });
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [photoViewerImage, setPhotoViewerImage] = useState(null);
  const [showCommentBox, setShowCommentBox] = useState({});
  const [commentText, setCommentText] = useState({});
  const [commentGif, setCommentGif] = useState({});
  const [showGifPicker, setShowGifPicker] = useState(null);
  const [selectedPostGif, setSelectedPostGif] = useState(null); // GIF for main post creation
  const [commentModalOpen, setCommentModalOpen] = useState(null); // Track which post's comment modal is open
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [replyingToComment, setReplyingToComment] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyGif, setReplyGif] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editPostText, setEditPostText] = useState('');
  const [openCommentDropdownId, setOpenCommentDropdownId] = useState(null);
  const [postVisibility, setPostVisibility] = useState('followers');
  const defaultPostVisibilityRef = useRef('followers'); // Stores user's default from settings
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [hiddenFromUsers, setHiddenFromUsers] = useState([]);
  const [sharedWithUsers, setSharedWithUsers] = useState([]);
  const [contentWarning, setContentWarning] = useState('');
  const [showContentWarning, setShowContentWarning] = useState(false);
  const [revealedPosts, setRevealedPosts] = useState({});
  const [showReplies, setShowReplies] = useState({}); // Track which comments have replies visible
  const [showReactionPicker, setShowReactionPicker] = useState(null); // Track which comment shows reaction picker
  const [postComments, setPostComments] = useState({}); // Store comments by postId { postId: [comments] }
  const [commentReplies, setCommentReplies] = useState({}); // Store replies by commentId { commentId: [replies] }
  const [editPostVisibility, setEditPostVisibility] = useState('followers');
  const [editHiddenFromUsers, setEditHiddenFromUsers] = useState([]);
  const [editSharedWithUsers, setEditSharedWithUsers] = useState([]);
  const [editPostMedia, setEditPostMedia] = useState([]); // Current media for post being edited
  const [deletedMedia, setDeletedMedia] = useState([]); // Track media marked for deletion
  const [friends, setFriends] = useState([]);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  // REMOVED 2025-12-26: trending state removed (Phase 5)

  // ✅ Use singleton hook for unread message counts
  const { unreadByUser } = useUnreadMessages();

  // Convert unreadByUser array to map format { userId: count }
  const unreadMessageCounts = unreadByUser.reduce((acc, item) => {
    acc[item.userId] = item.count;
    return acc;
  }, {});

  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [reactionDetailsModal, setReactionDetailsModal] = useState({ isOpen: false, targetType: null, targetId: null });
  const [feedFilter, setFeedFilter] = useState('followers'); // 'followers', 'public'
  const [poll, setPoll] = useState(null); // Poll data for new post
  const [showPollCreator, setShowPollCreator] = useState(false); // Show/hide poll creator
  const [showEditHistory, setShowEditHistory] = useState(false);
  const [editHistoryPostId, setEditHistoryPostId] = useState(null);
  const [hideMetrics, setHideMetrics] = useState(false); // Hide metrics for new post
  const [autoHideContentWarnings, setAutoHideContentWarnings] = useState(false);
  const [quietMode, setQuietMode] = useState(document.documentElement.getAttribute('data-quiet') === 'true');
  const [initializing, setInitializing] = useState(true); // Track initial load
  const [showDraftManager, setShowDraftManager] = useState(false); // Show/hide draft manager
  const [currentDraftId, setCurrentDraftId] = useState(null); // Track current draft being edited
  const [draftSaveStatus, setDraftSaveStatus] = useState(''); // 'saving', 'saved', or ''
  const [showMobileComposer, setShowMobileComposer] = useState(false); // Mobile composer bottom sheet
  const [isTyping, setIsTyping] = useState(false); // Track typing state for floating UI hiding

  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadedPostIds, setLoadedPostIds] = useState(new Set());

  // Scroll-to-top state
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Ref for edit post textarea auto-resize
  const editPostTextareaRef = useRef(null);

  // Pull-to-refresh state
  const [pullStartY, setPullStartY] = useState(null);
  const [isPulling, setIsPulling] = useState(false);

  // Reaction picker timeout ref
  const reactionPickerTimeoutRef = useRef(null);
  const [pullDistance, setPullDistance] = useState(0);

  // currentUser is now from useAuth() above - no direct localStorage call
  const postRefs = useRef({});
  const commentRefs = useRef({});
  const listenersSetUpRef = useRef(false);
  const autoSaveTimerRef = useRef(null); // Auto-save timer

  // Handler to block Enter key submission when GIF picker is open
  const handleKeyDown = useCallback((e) => {
    // If GIF picker is open, block Enter from submitting form
    if (showGifPicker !== null && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
  }, [showGifPicker]);

  // Define all fetch functions BEFORE useEffects that use them
  const fetchPosts = useCallback(async (pageNum = 1, append = false) => {
    try {
      setFetchingPosts(true);
      const response = await api.get(`/posts?filter=${feedFilter}&page=${pageNum}&limit=20`);
      const newPosts = response.data.posts || [];

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

  // REMOVED 2025-12-26: Trending hashtags removed (Phase 5)
  // const fetchTrending = useCallback(async () => {
  //   try {
  //     const response = await api.get('/search/trending');
  //     setTrending(response.data);
  //   } catch (error) {
  //     logger.error('Failed to fetch trending:', error);
  //   }
  // }, []);

  const fetchBookmarkedPosts = useCallback(async () => {
    try {
      const response = await api.get('/bookmarks');
      setBookmarkedPosts(response.data.bookmarks.map(post => post._id));
    } catch (error) {
      logger.error('Failed to fetch bookmarks:', error);
    }
  }, []);

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

  // Load more posts (infinite scroll)
  const loadMorePosts = useCallback(() => {
    if (hasMore && !fetchingPosts) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage, true);
    }
  }, [hasMore, fetchingPosts, page, fetchPosts]);

  // Scroll to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Merged: Handle scrolling to specific post/comment from query parameters and auto-fetch comments
  useEffect(() => {
    // Auto-fetch comments for posts that have comments
    posts.forEach(post => {
      if (post.commentCount > 0 && !postComments[post._id]) {
        logger.debug(`📥 Auto-fetching ${post.commentCount} comments for post ${post._id}`);
        fetchCommentsForPost(post._id);
      }
    });

    // Handle scrolling to specific post/comment from notifications
    const postId = searchParams.get('post');
    const commentId = searchParams.get('comment');

    if (postId && posts.length > 0 && !fetchingPosts) {
      // Wait for DOM to update
      setTimeout(() => {
        const postElement = postRefs.current[postId];
        if (postElement) {
          postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          postElement.classList.add('highlighted-post');

          // Remove highlight after 3 seconds
          setTimeout(() => {
            postElement.classList.remove('highlighted-post');
          }, 3000);

          // If there's a specific comment, scroll to it
          if (commentId) {
            setTimeout(() => {
              const commentElement = commentRefs.current[commentId];
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
    }
  }, [posts, searchParams, fetchingPosts, postComments]);

  // Handle scroll detection for scroll-to-top button and infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      // Show/hide scroll-to-top button
      setShowScrollTop(window.scrollY > 500);

      // Infinite scroll detection
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const clientHeight = window.innerHeight;

      if (scrollHeight - scrollTop - clientHeight < 300 && hasMore && !fetchingPosts) {
        loadMorePosts();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, fetchingPosts, loadMorePosts]);

  // Pull-to-refresh handlers
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

  useEffect(() => {
    // 🔥 AUTH READY GATE: Wait for auth to be ready before fetching data
    if (!authReady) {
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

    // Fetch all data in parallel for faster initial load
    // Use Promise.allSettled to continue even if some requests fail
    // REMOVED 2025-12-26: fetchTrending removed (Phase 5)
    Promise.allSettled([
      fetchPosts(),
      fetchBlockedUsers(),
      fetchFriends(),
      fetchBookmarkedPosts(),
      fetchPrivacySettings()
    ]).then(results => {
      // Log any failures but don't block the app
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const names = ['posts', 'blocked users', 'friends', 'bookmarks', 'privacy settings'];
          logger.warn(`Failed to load ${names[index]}:`, result.reason);
        }
      });

      // Mark initialization as complete
      setInitializing(false);
    }).catch(error => {
      logger.error('Error loading initial data:', error);
      // Don't throw - let the app continue with partial data
      setInitializing(false);
    });
  }, [authReady, isAuthenticated]); // ✅ Run when auth state changes

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
          console.warn('⚠️ Local draft had media but it was NOT restored');
          console.warn('⚠️ Media should only be loaded from backend drafts to prevent ghost media');
          console.warn('⚠️ The media may have been deleted or never persisted properly');
        }
        // Clear media from localStorage draft to prevent future confusion
        saveDraft('feed-create-post', { ...localDraft, media: [] });
      }
      // setSelectedMedia([]); // Explicitly don't restore media
      setPostVisibility(localDraft.visibility || 'followers');
      setContentWarning(localDraft.contentWarning || '');
      setHideMetrics(localDraft.hideMetrics || false);
      setPoll(localDraft.poll || null);
      setShowContentWarning(!!localDraft.contentWarning);
      setShowPollCreator(!!localDraft.poll);
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

  // Refetch posts when filter changes
  useEffect(() => {
    // Reset pagination and fetch new posts
    setPage(1);
    setLoadedPostIds(new Set());
    fetchPosts(1, false);
  }, [feedFilter]); // Only depend on feedFilter, not fetchPosts

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

    const setupListeners = (socket) => {
      logger.debug('🔌 Setting up socket listeners in Feed');
      // Note: Online user presence is now managed by useOnlineUsers hook

      // Listen for real-time post reactions
      if (socket && typeof socket.on === 'function' && typeof socket.off === 'function') {
        const handlePostReaction = (data) => {
          logger.debug('💜 Real-time post reaction received:', data);
          setPosts((prevPosts) =>
            prevPosts.map(p => p._id === data.postId ? data.post : p)
          );
        };
        socket.on('post_reaction_added', handlePostReaction);
        cleanupFunctions.push(() => socket.off('post_reaction_added', handlePostReaction));

        // Listen for real-time comment reactions
        const handleCommentReactionRT = (data) => {
          logger.debug('💜 Real-time comment reaction received:', data);
          const updatedComment = data.comment;

          // Update in postComments
          setPostComments(prev => {
            const updated = { ...prev };
            Object.keys(updated).forEach(postId => {
              updated[postId] = updated[postId].map(c =>
                c._id === updatedComment._id ? updatedComment : c
              );
            });
            return updated;
          });

          // Update in commentReplies
          setCommentReplies(prev => {
            const updated = { ...prev };
            Object.keys(updated).forEach(parentId => {
              updated[parentId] = updated[parentId].map(c =>
                c._id === updatedComment._id ? updatedComment : c
              );
            });
            return updated;
          });
        };
        socket.on('comment_reaction_added', handleCommentReactionRT);
        cleanupFunctions.push(() => socket.off('comment_reaction_added', handleCommentReactionRT));

        // Listen for real-time comments
        const handleCommentAddedRT = (data) => {
          logger.debug('💬 Real-time comment received:', data);
          const newComment = data.comment;
          const postId = data.postId;

          if (newComment.parentCommentId) {
            // It's a reply
            setCommentReplies(prev => {
              const existing = prev[newComment.parentCommentId] || [];
              // ✅ Check if comment already exists to prevent duplicates
              if (existing.some(c => c._id === newComment._id)) {
                logger.debug('⚠️ Reply already exists, skipping duplicate:', newComment._id);
                return prev;
              }
              return {
                ...prev,
                [newComment.parentCommentId]: [...existing, newComment]
              };
            });
          } else {
            // It's a top-level comment
            setPostComments(prev => {
              const existing = prev[postId] || [];
              // ✅ Check if comment already exists to prevent duplicates
              if (existing.some(c => c._id === newComment._id)) {
                logger.debug('⚠️ Comment already exists, skipping duplicate:', newComment._id);
                return prev;
              }
              return {
                ...prev,
                [postId]: [...existing, newComment]
              };
            });

            // ✅ Only update post comment count if comment was actually added (not a duplicate)
            setPosts(prevPosts =>
              prevPosts.map(p => {
                if (p._id === postId) {
                  // Check if this comment is already in our local state
                  const currentComments = postComments[postId] || [];
                  if (!currentComments.some(c => c._id === newComment._id)) {
                    return { ...p, commentCount: (p.commentCount || 0) + 1 };
                  }
                }
                return p;
              })
            );
          }
        };
        socket.on('comment_added', handleCommentAddedRT);
        cleanupFunctions.push(() => socket.off('comment_added', handleCommentAddedRT));

        // Listen for comment updates
        const handleCommentUpdatedRT = (data) => {
          logger.debug('✏️ Real-time comment update received:', data);
          const updatedComment = data.comment;

          // Update in postComments
          setPostComments(prev => {
            const updated = { ...prev };
            Object.keys(updated).forEach(postId => {
              updated[postId] = updated[postId].map(c =>
                c._id === updatedComment._id ? updatedComment : c
              );
            });
            return updated;
          });

          // Update in commentReplies
          setCommentReplies(prev => {
            const updated = { ...prev };
            Object.keys(updated).forEach(parentId => {
              updated[parentId] = updated[parentId].map(c =>
                c._id === updatedComment._id ? updatedComment : c
              );
            });
            return updated;
          });
        };
        socket.on('comment_updated', handleCommentUpdatedRT);
        cleanupFunctions.push(() => socket.off('comment_updated', handleCommentUpdatedRT));

        // Listen for comment deletions
        const handleCommentDeletedRT = (data) => {
          logger.debug('🗑️ Real-time comment deletion received:', data);
          const { commentId, postId } = data;

          // Remove from postComments
          setPostComments(prev => ({
            ...prev,
            [postId]: (prev[postId] || []).filter(c => c._id !== commentId)
          }));

          // Remove from commentReplies
          setCommentReplies(prev => {
            const updated = { ...prev };
            Object.keys(updated).forEach(parentId => {
              updated[parentId] = updated[parentId].filter(c => c._id !== commentId);
            });
            // Also remove if it was a parent
            delete updated[commentId];
            return updated;
          });

          // Update post comment count
          setPosts(prevPosts =>
            prevPosts.map(p =>
              p._id === postId
                ? { ...p, commentCount: Math.max(0, (p.commentCount || 0) - 1) }
                : p
            )
          );
        };
        socket.on('comment_deleted', handleCommentDeletedRT);
        cleanupFunctions.push(() => socket.off('comment_deleted', handleCommentDeletedRT));

        // ✅ Listen for new posts
        const handlePostCreatedRT = (data) => {
          logger.debug('📝 Real-time post created:', data);
          const newPost = data.post;

          // Only add if not already in feed (prevent duplicates)
          setPosts(prevPosts => {
            if (prevPosts.some(p => p._id === newPost._id)) {
              logger.debug('⚠️ Post already exists, skipping duplicate:', newPost._id);
              return prevPosts;
            }
            // Add to top of feed
            return [newPost, ...prevPosts];
          });
        };
        socket.on('post_created', handlePostCreatedRT);
        cleanupFunctions.push(() => socket.off('post_created', handlePostCreatedRT));

        // ✅ Listen for post updates
        const handlePostUpdatedRT = (data) => {
          logger.debug('✏️ Real-time post updated:', data);
          const updatedPost = data.post;

          setPosts(prevPosts =>
            prevPosts.map(p => p._id === updatedPost.postId || p._id === updatedPost._id ? updatedPost : p)
          );
        };
        socket.on('post_updated', handlePostUpdatedRT);
        cleanupFunctions.push(() => socket.off('post_updated', handlePostUpdatedRT));

        // ✅ Listen for post deletions
        const handlePostDeletedRT = (data) => {
          logger.debug('🗑️ Real-time post deleted:', data);
          const { postId } = data;

          setPosts(prevPosts => prevPosts.filter(p => p._id !== postId));
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

  const handleMediaSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/ogg'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));

    if (invalidFiles.length > 0) {
      showAlert('Please select only images (JPEG, PNG, GIF, WebP) or videos (MP4, WebM, OGG)', 'Invalid File Type');
      return;
    }

    // Limit to 3 files
    if (selectedMedia.length + files.length > 3) {
      showAlert('You can only upload up to 3 media files per post', 'Upload Limit Reached');
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

      setSelectedMedia([...selectedMedia, ...response.media]);
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
  };

  // Handle paste events for images and image URLs
  const handlePaste = async (e) => {
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
            setSelectedMedia([...selectedMedia, ...response.media]);
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
            setSelectedMedia([...selectedMedia, ...uploadResponse.media]);
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
  };

  const removeMedia = async (index) => {
    const mediaToRemove = selectedMedia[index];

    if (!mediaToRemove) return;

    // CRITICAL: Delete from backend FIRST, then update UI
    // This prevents ghost media that reappears after refresh
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

      // Only remove from UI after successful backend delete
      setSelectedMedia(selectedMedia.filter((_, i) => i !== index));
    } catch (error) {
      logger.error('[TEMP MEDIA] Delete failed:', error);

      // Dev mode warning
      if (import.meta.env.DEV) {
        console.warn('⚠️ Temporary media removed in UI but still exists server-side');
        console.warn('⚠️ This media will reappear after refresh');
      }

      // Still remove from UI to not block the user, but warn
      setSelectedMedia(selectedMedia.filter((_, i) => i !== index));

      // Don't show error to user for non-critical failures (404 means already deleted)
      if (error.response?.status !== 404) {
        showToast('Media removed locally. May reappear on refresh.', 'warning');
      }
    }
  };



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
        console.warn('⚠️ Draft creation failed - draft only exists locally');
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
  const handleRestoreDraft = (draft) => {
    // CRITICAL: Only restore drafts that have a valid _id (confirmed by backend)
    if (!draft._id) {
      if (import.meta.env.DEV) {
        console.warn('⚠️ Attempted to restore draft without valid ID');
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
      console.log(`📷 Restored ${draftMedia.length} media item(s) from backend draft`);
      // Verify media has tempMediaId for proper tracking
      const missingIds = draftMedia.filter(m => !m.tempMediaId);
      if (missingIds.length > 0) {
        console.warn('⚠️ Some media missing tempMediaId - may be legacy uploads');
        console.warn('⚠️ Deletion may fall back to URL-based cleanup');
      }
    }

    setPostVisibility(draft.visibility || 'followers');
    setContentWarning(draft.contentWarning || '');
    setHideMetrics(draft.hideMetrics || false);
    setPoll(draft.poll || null);
    setSelectedPostGif(draft.gifUrl || null); // Restore GIF from draft
    setCurrentDraftId(draft._id);
    setShowContentWarning(!!draft.contentWarning);
    setShowPollCreator(!!draft.poll);
  };

  // Delete draft after successful post (fire-and-forget, non-blocking)
  const deleteDraft = (draftId) => {
    // CRITICAL: Only attempt delete if draft ID exists (backend confirmed)
    if (!draftId) {
      if (import.meta.env.DEV) {
        setTimeout(() => {
          console.warn('⚠️ Attempted DELETE on draft with no ID (ghost entity)');
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
          console.log(`✅ Draft ${draftId} deleted after successful post`);
        }
      } catch (error) {
        // Handle 404 gracefully - draft may have already been deleted
        if (error.response?.status === 404) {
          if (import.meta.env.DEV) {
            console.warn(`⚠️ DELETE 404: Draft ${draftId} not found on server`);
            console.warn('Draft may have been already deleted or never persisted.');
          }
          return;
        }
        logger.error('Failed to delete draft:', error);
      }
    }, 0);
  };

  const handlePostSubmit = async (e) => {
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
        gifUrl: selectedPostGif // Include GIF if selected
      };

      // PHASE 1 REFACTOR: Custom privacy removed
      // if (postVisibility === 'custom') {
      //   if (hiddenFromUsers.length > 0) {
      //     postData.hiddenFrom = hiddenFromUsers;
      //   }
      //   if (sharedWithUsers.length > 0) {
      //     postData.sharedWith = sharedWithUsers;
      //   }
      // }

      const response = await api.post('/posts', postData);
      setPosts([response.data, ...posts]);

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
      setSharedWithUsers([]);
      setContentWarning('');
      setShowContentWarning(false);
      setPoll(null);
      setShowPollCreator(false);
      setHideMetrics(false);

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
  };

  const handleLike = async (postId) => {
    try {
      const response = await api.post(`/posts/${postId}/like`);
      setPosts(posts.map(p => p._id === postId ? response.data : p));
    } catch (error) {
      logger.error('Failed to like post:', error);
    }
  };

  const handlePostReaction = async (postId, emoji) => {
    try {
      const response = await api.post(`/posts/${postId}/react`, { emoji });
      console.log('🔍 Reaction response:', response.data);
      console.log('🔍 Updated reactions:', response.data.reactions);
      console.log('🔍 Current user ID:', currentUser?.id);

      // Force a new array reference to trigger re-render
      // Create completely new objects to ensure React detects the change
      setPosts(prevPosts => {
        const newPosts = prevPosts.map(p => {
          if (p._id === postId) {
            // Create a deep copy with new references
            const updatedPost = {
              ...response.data,
              reactions: [...(response.data.reactions || [])],
              // Force timestamp update to trigger re-render
              _reactUpdateTimestamp: Date.now()
            };
            console.log('🔍 Updated post:', updatedPost);
            console.log('🔍 User reaction emoji:', getUserReactionEmoji(updatedPost.reactions));
            return updatedPost;
          }
          return p;
        });
        console.log('🔍 Updated posts array, post found:', newPosts.some(p => p._id === postId));
        return newPosts;
      });

      setShowReactionPicker(null); // Hide picker after reaction

      // Force a small delay to ensure state update completes
      setTimeout(() => {
        console.log('🔍 State update complete');
      }, 100);
    } catch (error) {
      logger.error('Failed to react to post:', error);
    }
  };

  // Helper function to get user's selected emoji from reactions
  // Handles both array format [{user, emoji}] and object format {emoji: [userIds]}
  const getUserReactionEmoji = (reactions) => {
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
    for (const [emoji, userIds] of Object.entries(reactions)) {
      if (userIds.some(id => id?.toString() === currentUser.id?.toString())) {
        return emoji;
      }
    }
    return null;
  };

  // Fetch comments for a post
  const fetchCommentsForPost = async (postId) => {
    try {
      logger.debug(`📥 Fetching comments for post: ${postId}`);
      const response = await api.get(`/posts/${postId}/comments`);
      logger.debug(`✅ Fetched ${response.data?.length || 0} comments for post ${postId}`);
      setPostComments(prev => ({
        ...prev,
        [postId]: response.data
      }));
    } catch (error) {
      logger.error('❌ Failed to fetch comments:', error);
    }
  };

  // Fetch replies for a comment
  const fetchRepliesForComment = async (commentId) => {
    try {
      const response = await api.get(`/comments/${commentId}/replies`);
      setCommentReplies(prev => ({
        ...prev,
        [commentId]: response.data
      }));
    } catch (error) {
      logger.error('Failed to fetch replies:', error);
    }
  };

  // Toggle replies visibility and fetch if needed
  const toggleReplies = async (commentId) => {
    const isCurrentlyShown = showReplies[commentId];

    setShowReplies(prev => ({
      ...prev,
      [commentId]: !isCurrentlyShown
    }));

    // Fetch replies if showing and not already loaded
    if (!isCurrentlyShown && !commentReplies[commentId]) {
      await fetchRepliesForComment(commentId);
    }
  };

  const handleCommentReaction = async (commentId, emoji) => {
    // Save original state for rollback
    const originalPostComments = { ...postComments };
    const originalCommentReplies = { ...commentReplies };

    try {
      // Optimistic update
      const updateCommentReaction = (comment) => {
        if (comment._id !== commentId) return comment;

        const reactions = { ...comment.reactions };
        const currentUserId = currentUser?.id;

        // Remove user from all emoji arrays
        Object.keys(reactions).forEach(key => {
          reactions[key] = reactions[key].filter(uid => uid !== currentUserId);
        });

        // Add user to selected emoji array (or remove if clicking same emoji)
        const hadThisReaction = comment.reactions?.[emoji]?.includes(currentUserId);
        if (!hadThisReaction) {
          if (!reactions[emoji]) reactions[emoji] = [];
          reactions[emoji].push(currentUserId);
        }

        return { ...comment, reactions };
      };

      // Update in postComments
      setPostComments(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(postId => {
          updated[postId] = updated[postId].map(updateCommentReaction);
        });
        return updated;
      });

      // Update in commentReplies
      setCommentReplies(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(parentId => {
          updated[parentId] = updated[parentId].map(updateCommentReaction);
        });
        return updated;
      });

      // Make API call
      const response = await api.post(`/comments/${commentId}/react`, { emoji });

      // Update with server response (source of truth)
      const serverComment = response.data;
      setPostComments(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(postId => {
          updated[postId] = updated[postId].map(c =>
            c._id === commentId ? serverComment : c
          );
        });
        return updated;
      });

      setCommentReplies(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(parentId => {
          updated[parentId] = updated[parentId].map(c =>
            c._id === commentId ? serverComment : c
          );
        });
        return updated;
      });

      setShowReactionPicker(null);
    } catch (error) {
      logger.error('Failed to react to comment:', error);
      // Rollback optimistic update on error
      setPostComments(originalPostComments);
      setCommentReplies(originalCommentReplies);
      showAlert('Failed to add reaction. Please try again.', 'Reaction Failed');
    }
  };

  const toggleCommentBox = async (postId) => {
    // Detect mobile: check width AND touch support for better Samsung Galaxy detection
    const isMobile = window.innerWidth <= 768 ||
                     ('ontouchstart' in window) ||
                     (navigator.maxTouchPoints > 0);

    console.log('🔍 toggleCommentBox - isMobile:', isMobile, 'width:', window.innerWidth, 'touch:', 'ontouchstart' in window);

    // On mobile, open modal instead of inline comment box
    if (isMobile && window.innerWidth <= 768) {
      console.log('🔍 Opening modal for post:', postId);
      setCommentModalOpen(postId);
      // Fetch comments if not already loaded
      if (!postComments[postId]) {
        await fetchCommentsForPost(postId);
      }
      return;
    }

    // Desktop: use inline comment box
    const isCurrentlyShown = showCommentBox[postId];

    setShowCommentBox(prev => ({
      ...prev,
      [postId]: !isCurrentlyShown
    }));

    // Fetch comments if opening and not already loaded
    if (!isCurrentlyShown && !postComments[postId]) {
      await fetchCommentsForPost(postId);
    }
  };

  const handleCommentSubmit = async (postId, e) => {
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
      logger.error('❌ Failed to create comment:', error);
      logger.error('Error details:', error.response?.data);
      showAlert('This didn\'t post properly. You can try again in a moment.', 'Reply issue');
    }
  };

  const handleCommentChange = (postId, value) => {
    setCommentText(prev => ({ ...prev, [postId]: value }));

    // Auto-save comment draft
    if (value) {
      const draftKey = `comment-${postId}`;
      saveDraft(draftKey, value);
    }
  };

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

  const handleEditComment = (commentId, content) => {
    setEditingCommentId(commentId);

    // Try to restore draft first, otherwise use original content
    const draftKey = `edit-comment-${commentId}`;
    const localDraft = loadDraft(draftKey);
    setEditCommentText(localDraft || content);
  };

  // Auto-save comment edit draft
  useEffect(() => {
    if (editingCommentId && editCommentText) {
      const draftKey = `edit-comment-${editingCommentId}`;
      saveDraft(draftKey, editCommentText);
    }
  }, [editCommentText, editingCommentId]);

  const handleSaveEditComment = async (commentId) => {
    if (!editCommentText.trim()) return;

    try {
      const response = await api.put(`/comments/${commentId}`, {
        content: editCommentText
      });

      const updatedComment = response.data;

      // Update in postComments
      setPostComments(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(postId => {
          updated[postId] = updated[postId].map(c =>
            c._id === commentId ? updatedComment : c
          );
        });
        return updated;
      });

      // Update in commentReplies
      setCommentReplies(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(parentId => {
          updated[parentId] = updated[parentId].map(c =>
            c._id === commentId ? updatedComment : c
          );
        });
        return updated;
      });

      // Clear localStorage draft
      const draftKey = `edit-comment-${commentId}`;
      clearDraft(draftKey);

      setEditingCommentId(null);
      setEditCommentText('');
    } catch (error) {
      logger.error('Failed to edit comment:', error);
      showAlert('This didn\'t save properly. You can try again in a moment.', 'Edit issue');
    }
  };

  const handleCancelEditComment = () => {
    // Clear localStorage draft when canceling
    if (editingCommentId) {
      const draftKey = `edit-comment-${editingCommentId}`;
      clearDraft(draftKey);
    }

    setEditingCommentId(null);
    setEditCommentText('');
  };

  const toggleDropdown = (postId) => {
    setOpenDropdownId(openDropdownId === postId ? null : postId);
  };

  const handleEditPost = (post) => {
    setEditingPostId(post._id);

    // Try to restore draft first, otherwise use original content
    const draftKey = `edit-post-${post._id}`;
    const localDraft = loadDraft(draftKey);

    if (localDraft) {
      setEditPostText(localDraft.content || post.content);
      setEditPostVisibility(localDraft.visibility || post.visibility || 'followers');
      setEditHiddenFromUsers(localDraft.hiddenFrom || post.hiddenFrom?.map(u => u._id || u) || []);
      setEditSharedWithUsers(localDraft.sharedWith || post.sharedWith?.map(u => u._id || u) || []);
      // Restore media from draft if available, otherwise from post
      setEditPostMedia(localDraft.media || post.media || []);
      setDeletedMedia(localDraft.deletedMedia || []);
    } else {
      setEditPostText(post.content);
      setEditPostVisibility(post.visibility || 'followers');
      setEditHiddenFromUsers(post.hiddenFrom?.map(u => u._id || u) || []);
      setEditSharedWithUsers(post.sharedWith?.map(u => u._id || u) || []);
      // Load existing media for editing
      setEditPostMedia(post.media || []);
      setDeletedMedia([]);
    }

    setOpenDropdownId(null);
  };

  // Handle removing media during edit
  const handleRemoveEditMedia = (mediaUrl) => {
    // Add to deleted list for backend cleanup
    setDeletedMedia(prev => [...prev, mediaUrl]);
    // Remove from current media list
    setEditPostMedia(prev => prev.filter(m => m.url !== mediaUrl));
  };

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
        sharedWith: editSharedWithUsers,
        media: editPostMedia,
        deletedMedia: deletedMedia
      };
      saveDraft(draftKey, draftData);
    }
  }, [editPostText, editPostVisibility, editHiddenFromUsers, editSharedWithUsers, editingPostId, editPostMedia, deletedMedia]);

  const handleSaveEditPost = async (postId) => {
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
        if (editSharedWithUsers.length > 0) {
          updateData.sharedWith = editSharedWithUsers;
        }
      } else {
        // Clear custom privacy if not using custom visibility
        updateData.hiddenFrom = [];
        updateData.sharedWith = [];
      }

      const response = await api.put(`/posts/${postId}`, updateData);
      setPosts(posts.map(p => p._id === postId ? response.data : p));

      // Clear localStorage draft
      const draftKey = `edit-post-${postId}`;
      clearDraft(draftKey);

      setEditingPostId(null);
      setEditPostText('');
      setEditPostVisibility('followers');
      setEditHiddenFromUsers([]);
      setEditSharedWithUsers([]);
      setEditPostMedia([]);
      setDeletedMedia([]);
      showAlert('Post updated successfully!', 'Success');
    } catch (error) {
      logger.error('Failed to edit post:', error);
      showAlert('This didn\'t save properly. You can try again in a moment.', 'Edit issue');
    }
  };

  const handleCancelEditPost = () => {
    // Clear localStorage draft when canceling
    if (editingPostId) {
      const draftKey = `edit-post-${editingPostId}`;
      clearDraft(draftKey);
    }

    setEditingPostId(null);
    setEditPostText('');
    setEditPostVisibility('followers');
    setEditHiddenFromUsers([]);
    setEditSharedWithUsers([]);
    setEditPostMedia([]);
    setDeletedMedia([]);
  };

  // Keyboard shortcuts for edit post
  const handleEditPostKeyDown = (e, postId) => {
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
  };

  const handleDeleteComment = async (postId, commentId, isReply = false) => {
    const confirmed = await showConfirm('Are you sure you want to delete this comment?', 'Delete Comment', 'Delete', 'Cancel');
    if (!confirmed) return;

    try {
      await api.delete(`/comments/${commentId}`);

      if (isReply) {
        // Remove from commentReplies
        setCommentReplies(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(parentId => {
            updated[parentId] = updated[parentId].filter(c => c._id !== commentId);
          });
          return updated;
        });
      } else {
        // Remove from postComments (and all its replies will be deleted by backend)
        setPostComments(prev => ({
          ...prev,
          [postId]: (prev[postId] || []).filter(c => c._id !== commentId)
        }));

        // Remove replies from state
        setCommentReplies(prev => {
          const updated = { ...prev };
          delete updated[commentId];
          return updated;
        });
      }

      // Update post comment count
      setPosts(posts.map(p =>
        p._id === postId
          ? { ...p, commentCount: Math.max(0, (p.commentCount || 0) - 1) }
          : p
      ));
    } catch (error) {
      logger.error('Failed to delete comment:', error);
      showAlert('This didn\'t delete properly. You can try again in a moment.', 'Delete issue');
    }
  };

  const handleReplyToComment = (postId, commentId) => {
    setReplyingToComment({ postId, commentId });
    setReplyText('');
  };

  const handleSubmitReply = async (e) => {
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
        parentCommentId: commentId // This makes it a reply
      });

      // Socket event will add the reply to state - no optimistic update needed
      // This prevents duplicate replies from appearing

      setReplyingToComment(null);
      setReplyText('');
      setReplyGif(null);

      // Auto-show replies after adding one
      setShowReplies(prev => ({
        ...prev,
        [commentId]: true
      }));
    } catch (error) {
      logger.error('Failed to reply to comment:', error);
      showAlert('This didn\'t post properly. You can try again in a moment.', 'Reply issue');
    }
  };

  const handleCancelReply = () => {
    setReplyingToComment(null);
    setReplyText('');
    setReplyGif(null);
  };

  const handleBookmark = async (postId) => {
    const isBookmarked = bookmarkedPosts.includes(postId);

    try {
      if (isBookmarked) {
        await api.delete(`/bookmarks/${postId}`);
        setBookmarkedPosts(bookmarkedPosts.filter(id => id !== postId));
      } else {
        await api.post(`/bookmarks/${postId}`);
        setBookmarkedPosts([...bookmarkedPosts, postId]);
      }
    } catch (error) {
      logger.error('Failed to bookmark post:', error);
      showAlert(error.response?.data?.message || 'This didn\'t save properly. You can try again in a moment.', 'Save issue');
    }
  };

  const handleDelete = async (postId) => {
    const confirmed = await showConfirm('Are you sure you want to delete this post?', 'Delete Post', 'Delete', 'Cancel');
    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/posts/${postId}`);
      setPosts(posts.filter(p => p._id !== postId));
    } catch (error) {
      logger.error('Failed to delete post:', error);
      showAlert('This didn\'t delete properly. You can try again in a moment.', 'Delete issue');
    }
  };

  return (
    <div
      className="page-container feed-page"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <Navbar onMenuClick={onMenuOpen} />
      <EmailVerificationBanner />
      <PasskeyBanner />

      {/* One Header Rule: quiet in-content title, first-visit only */}
      <PageTitle
        title="Feed"
        subtitle="Updates from people and spaces you follow."
        pageKey="feed"
        firstVisitOnly
      />

      {/* Pull-to-refresh indicator */}
      {isPulling && (
        <div
          className="pull-to-refresh-indicator"
          style={{
            transform: `translateY(${pullDistance}px)`,
            opacity: pullDistance / 100
          }}
        >
          <div className="refresh-spinner">
            {pullDistance > 60 ? '🔄 Release to refresh' : '⬇️ Pull to refresh'}
          </div>
        </div>
      )}

      {/* Scroll-to-top button - hidden when composer open or typing */}
      <button
        className={`scroll-to-top-btn glossy floating-layer ${
          showScrollTop && !showMobileComposer && !isTyping ? 'visible' : 'hidden'
        }`}
        onClick={scrollToTop}
        aria-label="Scroll to top"
        aria-hidden={!showScrollTop || showMobileComposer || isTyping}
      >
        ⬆️
      </button>

      <div className={`feed-layout ${isMobile ? 'feed-mobile' : 'feed-desktop'}`}>
        <main className="feed-main">
          {/* Feed Filter Tabs */}
          <div className="feed-tabs glossy">
            <button
              className={`feed-tab ${feedFilter === 'followers' ? 'active' : ''}`}
              onClick={() => {
                setFeedFilter('followers');
                setPage(1);
                setLoadedPostIds(new Set());
                setPosts([]);
              }}
            >
              <span className="tab-icon">👥</span>
              <span className="tab-label">Following</span>
            </button>
            <button
              className={`feed-tab ${feedFilter === 'public' ? 'active' : ''}`}
              onClick={() => {
                setFeedFilter('public');
                setPage(1);
                setLoadedPostIds(new Set());
                setPosts([]);
              }}
            >
              <span className="tab-icon">🌍</span>
              <span className="tab-label">Everyone</span>
            </button>
          </div>

          {/* Create Post Section - Hidden on mobile */}
          {!isMobile && (
          <div className="create-post glossy fade-in">
            <h2 className="section-title">Share something</h2>
            <form onSubmit={handlePostSubmit}>
              <textarea
                id="new-post-input"
                name="newPost"
                value={newPost}
                onChange={(e) => {
                  const el = e.target;
                  el.style.height = 'auto';
                  el.style.height = Math.max(el.scrollHeight, 120) + 'px'; // Minimum 120px
                  setNewPost(el.value);
                }}
                onPaste={handlePaste}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                placeholder={showPollCreator ? "Ask a question..." : "Share something, if you feel like it."}
                className="post-input glossy"
                rows="4"
                style={{ overflow: 'hidden', resize: 'none', minHeight: '120px' }}
              />

              {selectedMedia.length > 0 && (
                <div className="media-preview">
                  {selectedMedia.map((media, index) => (
                    <div key={index} className="media-preview-item">
                      {media.type === 'video' ? (
                        <video src={getImageUrl(media.url)} controls />
                      ) : (
                        <img src={getImageUrl(media.url)} alt={`Upload ${index + 1}`} />
                      )}
                      <button
                        type="button"
                        className="remove-media"
                        onClick={() => removeMedia(index)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {showContentWarning && (
                <div className="content-warning-input">
                  <select
                    id="content-warning-select"
                    name="contentWarning"
                    value={contentWarning}
                    onChange={(e) => setContentWarning(e.target.value)}
                    className="cw-input glossy"
                  >
                    <option value="">Select a content warning...</option>
                    <option value="Mental Health">Mental Health</option>
                    <option value="Violence">Violence</option>
                    <option value="Sexual Content">Sexual Content</option>
                    <option value="Substance Use">Substance Use</option>
                    <option value="Self-Harm">Self-Harm</option>
                    <option value="Death/Grief">Death/Grief</option>
                    <option value="Eating Disorders">Eating Disorders</option>
                    <option value="Abuse">Abuse</option>
                    <option value="Discrimination">Discrimination</option>
                    <option value="Medical Content">Medical Content</option>
                    <option value="Flashing Lights">Flashing Lights</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              )}

              {/* Poll Creator */}
              {showPollCreator && (
                <PollCreator
                  onPollChange={setPoll}
                  initialPoll={poll}
                />
              )}

              <div className="post-actions-bar">
                <label className="btn-media-upload">
                  <input
                    id="media-upload-input"
                    name="mediaUpload"
                    type="file"
                    multiple
                    accept="image/*,image/gif,video/*"
                    onChange={handleMediaSelect}
                    disabled={uploadingMedia || selectedMedia.length >= 3}
                    style={{ display: 'none' }}
                  />
                  {uploadingMedia ? `⏳ Uploading... ${uploadProgress}%` : '📷 Add Photos/Videos'}
                </label>

                <button
                  type="button"
                  className="btn-gif"
                  onClick={() => setShowGifPicker(showGifPicker === 'main-post' ? null : 'main-post')}
                  disabled={selectedPostGif !== null}
                  title="Add GIF"
                >
                  GIF
                </button>

                <button
                  type="button"
                  className={`btn-poll ${showPollCreator ? 'active' : ''}`}
                  onClick={() => setShowPollCreator(!showPollCreator)}
                  title="Add poll"
                >
                  📊 Poll
                </button>

                <button
                  type="button"
                  className={`btn-content-warning ${showContentWarning ? 'active' : ''}`}
                  onClick={() => setShowContentWarning(!showContentWarning)}
                  title="Add content warning"
                >
                  ⚠️ CW
                </button>

                <label className="hide-metrics-checkbox" title="Hide likes, comments, and shares count">
                  <input
                    id="hide-metrics-checkbox"
                    name="hideMetrics"
                    type="checkbox"
                    checked={hideMetrics}
                    onChange={(e) => setHideMetrics(e.target.checked)}
                  />
                  <span>🔇 Hide Metrics</span>
                </label>

                {/* PHASE 1 REFACTOR: Simplified privacy options */}
                <label htmlFor="post-privacy-selector" style={{ display: 'none' }}>
                  Post Privacy
                </label>
                <select
                  id="post-privacy-selector"
                  name="postPrivacy"
                  value={postVisibility}
                  onChange={(e) => setPostVisibility(e.target.value)}
                  className="privacy-selector glossy"
                  aria-label="Select post privacy"
                >
                  <option value="public">🌍 Public</option>
                  <option value="followers">👥 Connections</option>
                  <option value="private">🔒 Private</option>
                </select>

                {/* Draft save status indicator */}
                {draftSaveStatus && (
                  <span className="draft-save-status">
                    {draftSaveStatus === 'saving' ? '💾 Saving draft...' : '✅ Draft saved'}
                  </span>
                )}

                <button
                  type="button"
                  className="btn-drafts"
                  onClick={() => setShowDraftManager(true)}
                  title="View saved drafts"
                >
                  📝 Drafts
                </button>

                <button type="submit" disabled={loading || uploadingMedia} className="btn-post glossy-gold">
                  {loading ? 'Publishing...' : 'Publish ✨'}
                </button>
              </div>

              {/* GIF Preview */}
              {selectedPostGif && (
                <div className="post-gif-preview">
                  <img src={selectedPostGif} alt="Selected GIF" />
                  <button
                    type="button"
                    className="btn-remove-gif"
                    onClick={() => setSelectedPostGif(null)}
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* GIF Picker */}
              {showGifPicker === 'main-post' && (
                <GifPicker
                  onGifSelect={(gifUrl) => {
                    setSelectedPostGif(gifUrl);
                    setShowGifPicker(null);
                  }}
                  onClose={() => setShowGifPicker(null)}
                />
              )}
            </form>
          </div>
          )}

          {/* Draft Manager Modal */}
          {showDraftManager && (
            <div className="modal-overlay" onClick={() => setShowDraftManager(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <DraftManager
                  draftType="post"
                  onRestoreDraft={handleRestoreDraft}
                  onClose={() => setShowDraftManager(false)}
                />
              </div>
            </div>
          )}

          <div className="posts-list">
            {fetchingPosts ? (
              <>
                <PostSkeleton />
                <PostSkeleton />
                <PostSkeleton />
              </>
            ) : posts.length === 0 ? (
              <div className="empty-state glossy">
                <p className="empty-state-primary">
                  {quietMode ? quietCopy.emptyFeed : "There's nothing new right now — and that's okay."}
                </p>
                <p className="empty-state-secondary">When people share, you'll see it here.</p>
                <p className="empty-state-tertiary">Pryde moves at a human pace.</p>
              </div>
            ) : (
              posts
                .filter(post => !blockedUsers.includes(post.author?._id))
                .map((post, postIndex) => {
                // PHASE 1 REFACTOR: Use hasLiked boolean instead of checking likes array
                const isLiked = post.hasLiked || false;
                const isFirstPost = postIndex === 0;
                // PERFORMANCE: Lazy load images for posts after first 3
                const shouldEagerLoad = postIndex < 3;

                // Check if this is a system post (from pryde_prompts account)
                const isSystemPost = post.isSystemPost || post.author?.isSystemAccount;

                return (
                  <div
                    key={post._id}
                    id={`post-${post._id}`}
                    className={`post-card glossy fade-in ${isSystemPost ? 'system-post' : ''}`}
                    ref={(el) => postRefs.current[post._id] = el}
                  >
                    {/* Pinned Post Badge */}
                    {post.isPinned && <PinnedPostBadge />}

                    <PostHeader
                      author={post.author}
                      createdAt={post.createdAt}
                      visibility={post.visibility}
                      edited={post.edited}
                      isPinned={post.isPinned}
                      isSystemAccount={isSystemPost}
                    >
                      <div className="post-dropdown-container">
                        <button
                          className="btn-dropdown"
                          onClick={() => toggleDropdown(post._id)}
                          title="More options"
                        >
                          ⋮
                        </button>
                        {openDropdownId === post._id && (
                          <div className="dropdown-menu">
                            {(post.author?._id === currentUser?.id || post.author?._id === currentUser?._id) ? (
                              <>
                                <button
                                  className="dropdown-item"
                                  onClick={async () => {
                                    try {
                                      const response = await api.post(`/posts/${post._id}/pin`);
                                      setPosts(posts.map(p => p._id === post._id ? response.data : p));
                                      setOpenDropdownId(null);
                                    } catch (error) {
                                      logger.error('Failed to toggle pin:', error);
                                    }
                                  }}
                                >
                                  📌 {post.isPinned ? 'Unpin' : 'Pin to Profile'}
                                </button>
                                {/* DEPRECATED: View Edit History menu item removed 2025-12-26 */}
                                {!post.isShared && (
                                  <button
                                    className="dropdown-item"
                                    onClick={() => handleEditPost(post)}
                                  >
                                    ✏️ Edit
                                  </button>
                                )}
                                <button
                                  className="dropdown-item delete"
                                  onClick={() => {
                                    handleDelete(post._id);
                                    setOpenDropdownId(null);
                                  }}
                                >
                                  🗑️ Delete
                                </button>
                              </>
                            ) : (
                              <button
                                className="dropdown-item report"
                                onClick={() => {
                                  setReportModal({ isOpen: true, type: 'post', contentId: post._id, userId: post.author?._id });
                                  setOpenDropdownId(null);
                                }}
                              >
                                🚩 Report
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </PostHeader>

                    <div className="post-content">
                      {/* Show "X shared X's post" if this is a shared post */}
                      {post.isShared && post.originalPost && (
                        <div style={{
                          marginBottom: '1rem',
                          padding: '0.5rem 0.75rem',
                          background: 'var(--soft-lavender)',
                          borderRadius: '8px',
                          fontSize: '0.9rem',
                          color: 'var(--text-main)'
                        }}>
                          <strong>{post.author?.displayName || post.author?.username}</strong> shared{' '}
                          <strong>{post.originalPost.author?.displayName || post.originalPost.author?.username}'s</strong> post
                        </div>
                      )}

                      {/* Show share comment if this is a shared post */}
                      {post.isShared && post.shareComment && (
                        <p style={{ marginBottom: '1rem', fontStyle: 'italic' }}>
                          {post.shareComment}
                        </p>
                      )}

                      {/* Show original post if this is a shared post */}
                      {post.isShared && post.originalPost ? (
                        <div className="shared-post-container" style={{
                          border: '2px solid var(--soft-lavender)',
                          borderRadius: '12px',
                          padding: '1rem',
                          marginTop: '0.5rem',
                          background: 'var(--background-light)'
                        }}>
                          <div className="shared-post-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            <div className="author-avatar" style={{ width: '32px', height: '32px' }}>
                              {post.originalPost.author?.profilePhoto ? (
                                <OptimizedImage
                                  src={getImageUrl(post.originalPost.author.profilePhoto)}
                                  alt={post.originalPost.author.username}
                                  className="avatar-image"
                                />
                              ) : (
                                <span>{post.originalPost.author?.displayName?.charAt(0).toUpperCase() || 'U'}</span>
                              )}
                            </div>
                            <div>
                              <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                                {post.originalPost.author?.displayName || post.originalPost.author?.username}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {new Date(post.originalPost.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          {post.originalPost.content && <p>{post.originalPost.content}</p>}
                          {post.originalPost.media && post.originalPost.media.length > 0 && (
                            <div className={`post-media-grid ${post.originalPost.media.length === 1 ? 'single' : post.originalPost.media.length === 2 ? 'double' : 'multiple'}`}>
                              {post.originalPost.media.map((media, index) => (
                                <div key={index} className="post-media-item">
                                  {media.type === 'video' ? (
                                    <video src={getImageUrl(media.url)} controls />
                                  ) : (
                                    <OptimizedImage
                                      src={getImageUrl(media.url)}
                                      alt={`Shared post media ${index + 1}`}
                                      onClick={() => setPhotoViewerImage(getImageUrl(media.url))}
                                      style={{ cursor: 'pointer' }}
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          {editingPostId === post._id ? (
                            <div className="post-edit-box">
                              <textarea
                                id={`edit-post-${post._id}`}
                                name="editPost"
                                ref={editPostTextareaRef}
                                value={editPostText}
                                onChange={(e) => {
                                  setEditPostText(e.target.value);
                                  // Auto-resize on change
                                  e.target.style.height = 'auto';
                                  e.target.style.height = e.target.scrollHeight + 'px';
                                }}
                                onKeyDown={(e) => handleEditPostKeyDown(e, post._id)}
                                className="post-edit-textarea"
                                autoFocus
                              />
                              {/* Show existing media with delete buttons */}
                              {editPostMedia.length > 0 && (
                                <div className="edit-media-preview">
                                  {editPostMedia.map((media, index) => (
                                    <div key={index} className="edit-media-item">
                                      {media.type === 'video' ? (
                                        <video src={getImageUrl(media.url)} />
                                      ) : (
                                        <img src={getImageUrl(media.url)} alt={`Media ${index + 1}`} />
                                      )}
                                      <button
                                        type="button"
                                        className="btn-remove-media"
                                        onClick={() => handleRemoveEditMedia(media.url)}
                                        title="Remove this media"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="post-edit-privacy">
                                <div className="post-edit-privacy-label">Privacy:</div>
                                <select
                                  id="edit-post-privacy-selector"
                                  name="editPostPrivacy"
                                  value={editPostVisibility}
                                  onChange={(e) => setEditPostVisibility(e.target.value)}
                                  aria-label="Edit post privacy"
                                >
                                  <option value="public">🌍 Public</option>
                                  <option value="followers">👥 Connections</option>
                                  <option value="private">🔒 Private</option>
                                </select>
                              </div>
                              <div className="post-edit-actions">
                                <button
                                  onClick={() => handleSaveEditPost(post._id)}
                                  className="btn-save-post"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={handleCancelEditPost}
                                  className="btn-cancel-post"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* CRITICAL: Poll posts render poll UI, NOT text content */}
                              {post.poll && post.poll.question ? (
                                <Poll
                                  poll={post.poll}
                                  postId={post._id}
                                  currentUserId={currentUser?._id}
                                  onVote={(updatedPost) => {
                                    setPosts(prevPosts => prevPosts.map(p => p._id === updatedPost._id ? updatedPost : p));
                                  }}
                                />
                              ) : (
                                <>
                                  {post.contentWarning && !revealedPosts[post._id] && autoHideContentWarnings ? (
                                    <div className="content-warning-overlay">
                                      <div className="cw-header">
                                        <span className="cw-icon">⚠️</span>
                                        <span className="cw-text">Content Warning: {post.contentWarning}</span>
                                      </div>
                                      <button
                                        className="btn-reveal-content"
                                        onClick={() => setRevealedPosts({...revealedPosts, [post._id]: true})}
                                      >
                                        Show Content
                                      </button>
                                    </div>
                                  ) : (
                                    post.content && (
                                      <p>
                                        <FormattedText text={post.content} />
                                      </p>
                                    )
                                  )}

                                  {post.media && post.media.length > 0 && (!post.contentWarning || !autoHideContentWarnings || revealedPosts[post._id]) && (
                                    <div className={`post-media-grid ${post.media.length === 1 ? 'single' : post.media.length === 2 ? 'double' : 'multiple'}`}>
                                      {post.media.map((media, index) => (
                                        <div key={index} className="post-media-item">
                                          {media.type === 'video' ? (
                                            <video src={getImageUrl(media.url)} controls />
                                          ) : (
                                            <OptimizedImage
                                              src={getImageUrl(media.url)}
                                              alt={`Post media ${index + 1}`}
                                              onClick={() => setPhotoViewerImage(getImageUrl(media.url))}
                                              style={{ cursor: 'pointer' }}
                                              fetchPriority={isFirstPost && index === 0 ? 'high' : undefined}
                                              loading={shouldEagerLoad && index === 0 ? 'eager' : 'lazy'}
                                              responsiveSizes={media.sizes}
                                            />
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Display GIF if present */}
                                  {post.gifUrl && (!post.contentWarning || !autoHideContentWarnings || revealedPosts[post._id]) && (
                                    <div className="post-gif">
                                      <PausableGif src={post.gifUrl} alt="GIF" loading="lazy" />
                                    </div>
                                  )}
                                </>
                              )}
                        </>
                      )}
                    </>
                  )}
                </div>

                <div className="post-actions soft-actions">
                      <ReactionButton
                        targetType="post"
                        targetId={post._id}
                        currentUserId={currentUser?.id}
                        initialUserReaction={getUserReactionEmoji(post.reactions)}
                        onReactionChange={(reactions, userReaction) => {
                          // Update post in state with new reactions
                          setPosts(prevPosts =>
                            prevPosts.map(p =>
                              p._id === post._id
                                ? { ...p, _reactionsUpdated: Date.now() }
                                : p
                            )
                          );
                        }}
                        onCountClick={() => setReactionDetailsModal({
                          isOpen: true,
                          targetType: 'post',
                          targetId: post._id
                        })}
                      />
                      <button
                        className="action-btn subtle"
                        onClick={() => toggleCommentBox(post._id)}
                        aria-label={`Reply to post${!post.hideMetrics ? ` (${post.commentCount || 0} replies)` : ''}`}
                        title="Reply to this post"
                      >
                        <span>💬</span>
                        <span className="action-text">
                          Reply {!post.hideMetrics && `(${post.commentCount || 0})`}
                        </span>
                      </button>
                      {/* REMOVED: Share button - backend support incomplete (relies on deprecated Friends system) */}
                      {/* TODO: Reimplement when backend is updated to work with Followers system */}
                      {/* <button
                        className="action-btn"
                        onClick={() => handleShare(post)}
                        aria-label={`Share post${!post.hideMetrics ? ` (${post.shares?.length || 0} shares)` : ''}`}
                      >
                        <span>🔗</span>
                        <span className="action-text">
                          Share {!post.hideMetrics && `(${post.shares?.length || 0})`}
                        </span>
                      </button> */}
                      <button
                        className={`action-btn ghost ${bookmarkedPosts.includes(post._id) ? 'bookmarked' : ''}`}
                        onClick={() => handleBookmark(post._id)}
                        title={bookmarkedPosts.includes(post._id) ? 'Remove save' : 'Keep this for later'}
                        aria-label={bookmarkedPosts.includes(post._id) ? 'Remove save from post' : 'Save post'}
                      >
                        <span>{bookmarkedPosts.includes(post._id) ? '🔖' : '🔖'}</span>
                        <span className="action-text">{bookmarkedPosts.includes(post._id) ? 'Saved' : 'Save'}</span>
                      </button>
                    </div>

                    {/* Tags Display - Only render tags with valid slugs */}
                    {post.tags && post.tags.length > 0 && post.tags.some(tag => tag?.slug) && (
                      <div className="post-tags">
                        {post.tags
                          .filter(tag => tag && tag.slug && tag._id)
                          .map(tag => (
                            <Link
                              key={tag._id}
                              to={`/tags/${tag.slug}`}
                              className="post-tag"
                            >
                              {tag.icon} {tag.label || tag.slug}
                            </Link>
                          ))}
                      </div>
                    )}

                    {/* Comments Section - Facebook Style */}
                    {postComments[post._id] && postComments[post._id].length > 0 && (
                      <div className="post-comments">
                        {postComments[post._id]
                          .filter(comment => comment.parentCommentId === null || comment.parentCommentId === undefined)
                          .slice(-3)
                          .map((comment) => (
                            <CommentThread
                              key={comment._id}
                              comment={comment}
                              replies={commentReplies[comment._id] || []}
                              currentUser={currentUser}
                              postId={post._id}
                              showReplies={showReplies}
                              editingCommentId={editingCommentId}
                              editCommentText={editCommentText}
                              showReactionPicker={showReactionPicker}
                              commentRefs={commentRefs}
                              getUserReactionEmoji={getUserReactionEmoji}
                              handleEditComment={handleEditComment}
                              handleSaveEditComment={handleSaveEditComment}
                              handleCancelEditComment={handleCancelEditComment}
                              handleDeleteComment={handleDeleteComment}
                              handleCommentReaction={handleCommentReaction}
                              toggleReplies={toggleReplies}
                              handleReplyToComment={handleReplyToComment}
                              setShowReactionPicker={setShowReactionPicker}
                              setReactionDetailsModal={setReactionDetailsModal}
                              setReportModal={setReportModal}
                            />
                          ))}
                      </div>
                    )}

                    {/* Reply Input Box - Shown when replying to a comment */}
                    {replyingToComment?.postId === post._id && (
                      <form onSubmit={handleSubmitReply} className="reply-input-box">
                        <div className="reply-input-wrapper">
                          <div className="reply-user-avatar">
                            {currentUser?.profilePhoto ? (
                              <OptimizedImage
                                src={getImageUrl(currentUser.profilePhoto)}
                                alt="You"
                                className="avatar-image"
                              />
                            ) : (
                              <span>{currentUser?.displayName?.charAt(0).toUpperCase() || 'U'}</span>
                            )}
                          </div>
                          <input
                            id={`feed-reply-${replyingToComment.commentId}`}
                            name="reply"
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={replyGif ? "Caption, if you'd like" : "Write a reply..."}
                            className="reply-input"
                            autoFocus
                          />
                        </div>
                        <div className="reply-composer-actions">
                          <button
                            type="button"
                            onClick={handleCancelReply}
                            className="btn-cancel-reply"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowGifPicker(showGifPicker === `reply-${replyingToComment._id}` ? null : `reply-${replyingToComment._id}`)}
                            className="btn-gif"
                            title="Add GIF"
                          >
                            GIF
                          </button>
                          <button
                            type="submit"
                            className="reply-submit-btn"
                            disabled={!replyText.trim() && !replyGif}
                          >
                            ➤
                          </button>
                        </div>
                        {replyGif && (
                          <div className="reply-gif-preview">
                            <img src={replyGif} alt="Selected GIF" />
                            <button
                              type="button"
                              className="btn-remove-gif"
                              onClick={() => setReplyGif(null)}
                            >
                              ✕
                            </button>
                          </div>
                        )}
                        {showGifPicker === `reply-${replyingToComment._id}` && (
                          <GifPicker
                            onGifSelect={(gifUrl) => {
                              setReplyGif(gifUrl);
                              setShowGifPicker(null);
                            }}
                            onClose={() => setShowGifPicker(null)}
                          />
                        )}
                      </form>
                    )}

                    {/* Comment Input Box */}
                    {showCommentBox[post._id] && (
                      <form onSubmit={(e) => handleCommentSubmit(post._id, e)} className="comment-input-box">
                        <div className="comment-input-wrapper">
                          <div className="comment-user-avatar">
                            {currentUser?.profilePhoto ? (
                              <OptimizedImage
                                src={getImageUrl(currentUser.profilePhoto)}
                                alt="You"
                                className="avatar-image"
                              />
                            ) : (
                              <span>{currentUser?.displayName?.charAt(0).toUpperCase() || 'U'}</span>
                            )}
                          </div>
                          <input
                            id={`comment-input-${post._id}`}
                            name="comment"
                            type="text"
                            value={commentText[post._id] || ''}
                            onChange={(e) => handleCommentChange(post._id, e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Reply, if you feel like it."
                            className="comment-input glossy"
                          />
                          <button
                            type="button"
                            onClick={() => setShowGifPicker(showGifPicker === `comment-${post._id}` ? null : `comment-${post._id}`)}
                            className="btn-gif"
                            title="Add GIF"
                          >
                            GIF
                          </button>
                          <button
                            type="submit"
                            className="comment-submit-btn"
                            disabled={!commentText[post._id]?.trim() && !commentGif[post._id]}
                          >
                            ➤
                          </button>
                        </div>
                        {commentGif[post._id] && (
                          <div className="comment-gif-preview">
                            <img src={commentGif[post._id]} alt="Selected GIF" />
                            <button
                              type="button"
                              className="btn-remove-gif"
                              onClick={() => setCommentGif(prev => ({ ...prev, [post._id]: null }))}
                            >
                              ✕
                            </button>
                          </div>
                        )}
                        {showGifPicker === `comment-${post._id}` && (
                          <GifPicker
                            onGifSelect={(gifUrl) => {
                              setCommentGif(prev => ({ ...prev, [post._id]: gifUrl }));
                              setShowGifPicker(null);
                            }}
                            onClose={() => setShowGifPicker(null)}
                          />
                        )}
                      </form>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Load More Button */}
          {!fetchingPosts && hasMore && posts.length > 0 && (
            <div className="load-more-container">
              <button
                className="btn-load-more glossy"
                onClick={loadMorePosts}
                disabled={fetchingPosts}
              >
                {fetchingPosts ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}

          {/* End of Feed Message */}
          {!fetchingPosts && !hasMore && posts.length > 0 && (
            <div className="end-of-feed">
              <p className="end-of-feed-primary">🎉 You're all caught up!</p>
              <p className="end-of-feed-secondary">Take a break, or check back later.</p>
            </div>
          )}

          {/* Mobile Floating Create Post Button - hidden when typing */}
          {isMobile && (
            <button
              className={`mobile-create-post floating-layer ${
                !isTyping && !showMobileComposer ? 'visible' : 'hidden'
              }`}
              onClick={() => setShowMobileComposer(true)}
              aria-label="Create post"
              aria-hidden={isTyping || showMobileComposer}
            >
              ＋
            </button>
          )}

          {/* Mobile Composer Bottom Sheet */}
          {isMobile && showMobileComposer && (
            <div className="mobile-composer-sheet">
              <div className="mobile-composer-header">
                <button
                  className="mobile-composer-close"
                  onClick={() => {
                    setShowMobileComposer(false);
                    setIsTyping(false);
                  }}
                  aria-label="Close composer"
                >
                  ✕
                </button>
                <h2 className="mobile-composer-title">Share something</h2>
                <button
                  type="button"
                  onClick={handlePostSubmit}
                  disabled={loading || uploadingMedia}
                  className="mobile-composer-post"
                >
                  {loading ? 'Publishing...' : 'Publish'}
                </button>
              </div>

              <div className="mobile-composer-content">
                <form onSubmit={handlePostSubmit}>
                  <textarea
                    id="mobile-post-input"
                    name="mobileNewPost"
                    value={newPost}
                    onChange={(e) => {
                      const el = e.target;
                      el.style.height = 'auto';
                      el.style.height = el.scrollHeight + 'px';
                      setNewPost(el.value);
                    }}
                    onPaste={handlePaste}
                    onFocus={() => setIsTyping(true)}
                    onBlur={() => setIsTyping(false)}
                    placeholder={showPollCreator ? "Ask a question..." : "Share something, if you feel like it."}
                    className="mobile-post-input"
                    rows="3"
                    autoFocus
                    style={{ overflow: 'hidden', resize: 'none' }}
                  />

                  {selectedMedia.length > 0 && (
                    <div className="media-preview">
                      {selectedMedia.map((media, index) => (
                        <div key={index} className="media-preview-item">
                          {media.type === 'video' ? (
                            <video src={getImageUrl(media.url)} controls />
                          ) : (
                            <img src={getImageUrl(media.url)} alt={`Upload ${index + 1}`} />
                          )}
                          <button
                            type="button"
                            className="remove-media"
                            onClick={() => removeMedia(index)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {showContentWarning && (
                    <div className="content-warning-input">
                      <select
                        id="mobile-content-warning-select"
                        name="mobileContentWarning"
                        value={contentWarning}
                        onChange={(e) => setContentWarning(e.target.value)}
                        className="cw-input"
                      >
                        <option value="">Select a content warning...</option>
                        <option value="Mental Health">Mental Health</option>
                        <option value="Violence">Violence</option>
                        <option value="Sexual Content">Sexual Content</option>
                        <option value="Substance Use">Substance Use</option>
                        <option value="Self-Harm">Self-Harm</option>
                        <option value="Death/Grief">Death/Grief</option>
                        <option value="Eating Disorders">Eating Disorders</option>
                        <option value="Abuse">Abuse</option>
                        <option value="Discrimination">Discrimination</option>
                        <option value="Medical Content">Medical Content</option>
                        <option value="Flashing Lights">Flashing Lights</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  )}

                  {showPollCreator && (
                    <PollCreator
                      onPollChange={setPoll}
                      initialPoll={poll}
                    />
                  )}

                  <div className="mobile-composer-actions">
                    <label className="mobile-btn-media">
                      <input
                        id="mobile-media-upload-input"
                        name="mobileMediaUpload"
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        onChange={handleMediaSelect}
                        disabled={uploadingMedia || selectedMedia.length >= 3}
                        style={{ display: 'none' }}
                      />
                      📷
                    </label>

                    <button
                      type="button"
                      className={`mobile-btn-action ${showPollCreator ? 'active' : ''}`}
                      onClick={() => setShowPollCreator(!showPollCreator)}
                      title="Add poll"
                    >
                      📊
                    </button>

                    <button
                      type="button"
                      className={`mobile-btn-action ${showContentWarning ? 'active' : ''}`}
                      onClick={() => setShowContentWarning(!showContentWarning)}
                      title="Add content warning"
                    >
                      ⚠️
                    </button>

                    <select
                      id="mobile-post-privacy-selector"
                      name="mobilePostPrivacy"
                      value={postVisibility}
                      onChange={(e) => setPostVisibility(e.target.value)}
                      className="mobile-privacy-selector"
                      aria-label="Select post privacy"
                    >
                      <option value="public">🌍 Public</option>
                      <option value="followers">👥 Connections</option>
                      <option value="private">🔒 Private</option>
                    </select>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>

        <aside className={`feed-sidebar ${showMobileSidebar ? 'mobile-visible' : ''}`}>
          {/* REMOVED 2025-12-26: Featured Tags / Trending removed (Phase 5) */}

          {/* =========================================
              Explore Pryde — Feature Discovery
             ========================================= */}
          <div className="sidebar-card explore-pryde glossy">
            <h3 className="sidebar-title">Explore Pryde</h3>
            <p className="sidebar-subtitle">
              Take your time. These spaces are here when you need them.
            </p>
            <nav className="explore-links">
              <Link to="/groups" className="explore-link">
                <strong>👥 Groups</strong>
                <span>Join shared spaces built around interests, support, and identity.</span>
              </Link>
              <Link to="/journal" className="explore-link">
                <strong>📔 Journal</strong>
                <span>A quiet place to write — just for you, or gently shared.</span>
              </Link>
              <Link to="/longform" className="explore-link">
                <strong>📖 Stories</strong>
                <span>Short moments people choose to share, nothing more.</span>
              </Link>
              <Link to="/photo-essay" className="explore-link">
                <strong>📸 Photos</strong>
                <span>Images, memories, and small glimpses of life.</span>
              </Link>
              <Link to="/lounge" className="explore-link">
                <strong>✨ Lounge</strong>
                <span>A shared space for open conversation, without urgency.</span>
              </Link>
            </nav>
          </div>

          {/* Need Support */}
          <div className="sidebar-card support-card glossy">
            <h3 className="sidebar-title support-title">Need support?</h3>
            <p className="support-description">
              If you're going through something, help is available.
            </p>
            <Link
              to="/helplines"
              className="support-link"
            >
              View helplines
            </Link>
          </div>

          {/* Subtle divider between support and resources */}
          <div className="sidebar-divider" aria-hidden="true" />

          {/* Community & Resources - Curated LGBTQ+ links */}
          <div className="sidebar-card glossy">
            <CommunityResources />
          </div>

          {/* Friends List */}
          <div className="sidebar-card glossy">
            <h3 className="sidebar-title">Recent Conversations</h3>

            {/* Search Bar */}
            <div className="friends-search-bar">
              <input
                id="friends-search-input"
                name="friendSearch"
                type="text"
                placeholder="Search friends..."
                value={friendSearchQuery}
                onChange={(e) => setFriendSearchQuery(e.target.value)}
                className="friends-search-input"
              />
            </div>

            <div className="friends-sidebar-list">
              {/* All Friends - Unified List */}
              {friends
                .filter(friend =>
                  getDisplayName(friend).toLowerCase().includes(friendSearchQuery.toLowerCase())
                )
                .map((friend) => {
                  const isOnline = onlineUsers.includes(friend._id);
                  logger.debug(`Friend ${getDisplayName(friend)} (${friend._id}):`, {
                    isOnline,
                    onlineUsers,
                    friendId: friend._id
                  });
                  const unreadCount = unreadMessageCounts[friend._id] || 0;
                  return (
                    <div key={friend._id} className="friend-sidebar-item">
                      <div className="friend-sidebar-main">
                        <div className="friend-sidebar-avatar">
                          {friend.profilePhoto ? (
                            <OptimizedImage
                              src={getImageUrl(friend.profilePhoto)}
                              alt={getDisplayName(friend)}
                              className="avatar-image"
                            />
                          ) : (
                            <span>{getDisplayName(friend).charAt(0).toUpperCase()}</span>
                          )}
                          <span className={`status-dot ${isOnline ? 'online' : 'offline'}`}></span>
                        </div>
                        <div className="friend-sidebar-info">
                          <div className="friend-sidebar-name">{getDisplayName(friend)}</div>
                          <div className={`friend-sidebar-status ${isOnline ? 'online-status' : 'offline-status'}`}>
                            {isOnline ? 'Online' : getTimeSince(friend.lastSeen)}
                          </div>
                        </div>
                        <div className="friend-sidebar-actions-top">
                          <Link
                            to={`/messages?chat=${friend._id}`}
                            className="btn-friend-action"
                            title="Chat"
                          >
                            💬
                            {unreadCount > 0 && (
                              <span className="friend-message-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                            )}
                          </Link>
                          <Link
                            to={`/profile/${friend._id}`}
                            className="btn-friend-action"
                            title="View Profile"
                          >
                            👤
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              {friends.filter(f =>
                getDisplayName(f).toLowerCase().includes(friendSearchQuery.toLowerCase())
              ).length === 0 && friends.length > 0 && (
                <div className="no-friends">
                  <p>No matching friends</p>
                </div>
              )}

              {/* No Friends at All */}
              {friends.length === 0 && (
                <div className="no-friends">
                  <p>No friends yet</p>
                  <p className="friends-hint">Add friends to start chatting!</p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      <ReportModal
        isOpen={reportModal.isOpen}
        onClose={() => setReportModal({ isOpen: false, type: '', contentId: null, userId: null })}
        reportType={reportModal.type}
        contentId={reportModal.contentId}
        userId={reportModal.userId}
      />

      {photoViewerImage && (
        <PhotoViewer
          imageUrl={photoViewerImage}
          onClose={() => setPhotoViewerImage(null)}
        />
      )}

      {/* Privacy Settings Modal */}
      {showPrivacyModal && (
        <div className="modal-overlay" onClick={() => setShowPrivacyModal(false)}>
          <div className="modal-content privacy-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Custom Privacy Settings</h2>
              <button className="btn-close" onClick={() => setShowPrivacyModal(false)}>×</button>
            </div>

            <div className="privacy-modal-body">
              <div className="privacy-section">
                <h3>Hide from specific friends</h3>
                <p className="privacy-description">Select friends who won't see this post</p>
                <div className="friends-checklist">
                  {friends.map(friend => (
                    <label key={friend._id} className="friend-checkbox-item">
                      <input
                        id={`hide-from-${friend._id}`}
                        name={`hideFrom-${friend._id}`}
                        type="checkbox"
                        checked={hiddenFromUsers.includes(friend._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setHiddenFromUsers([...hiddenFromUsers, friend._id]);
                            setSharedWithUsers(sharedWithUsers.filter(id => id !== friend._id));
                          } else {
                            setHiddenFromUsers(hiddenFromUsers.filter(id => id !== friend._id));
                          }
                        }}
                      />
                      <div className="friend-info">
                        <div className="friend-avatar-small">
                          {friend.profilePhoto ? (
                            <OptimizedImage
                              src={getImageUrl(friend.profilePhoto)}
                              alt={getDisplayName(friend)}
                              className="avatar-image"
                            />
                          ) : (
                            <span>{getDisplayName(friend).charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <span>{getDisplayName(friend)}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="privacy-divider">OR</div>

              <div className="privacy-section">
                <h3>Share with specific friends only</h3>
                <p className="privacy-description">Only selected friends will see this post</p>
                <div className="friends-checklist">
                  {friends.map(friend => (
                    <label key={friend._id} className="friend-checkbox-item">
                      <input
                        id={`share-with-${friend._id}`}
                        name={`shareWith-${friend._id}`}
                        type="checkbox"
                        checked={sharedWithUsers.includes(friend._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSharedWithUsers([...sharedWithUsers, friend._id]);
                            setHiddenFromUsers(hiddenFromUsers.filter(id => id !== friend._id));
                          } else {
                            setSharedWithUsers(sharedWithUsers.filter(id => id !== friend._id));
                          }
                        }}
                      />
                      <div className="friend-info">
                        <div className="friend-avatar-small">
                          {friend.profilePhoto ? (
                            <OptimizedImage
                              src={getImageUrl(friend.profilePhoto)}
                              alt={getDisplayName(friend)}
                              className="avatar-image"
                            />
                          ) : (
                            <span>{getDisplayName(friend).charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <span>{getDisplayName(friend)}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => {
                setHiddenFromUsers([]);
                setSharedWithUsers([]);
                setShowPrivacyModal(false);
              }}>
                Clear All
              </button>
              <button className="btn-primary glossy-gold" onClick={() => setShowPrivacyModal(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <CustomModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        placeholder={modalState.placeholder}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        onConfirm={modalState.onConfirm}
        inputType={modalState.inputType}
        defaultValue={modalState.defaultValue}
      />

      {reactionDetailsModal.isOpen && (
        <ReactionDetailsModal
          targetType={reactionDetailsModal.targetType}
          targetId={reactionDetailsModal.targetId}
          onClose={() => setReactionDetailsModal({ isOpen: false, targetType: null, targetId: null })}
        />
      )}

      {/* DEPRECATED: EditHistoryModal removed 2025-12-26 */}

      {/* Comment Modal for Mobile */}
      {commentModalOpen && (
        <div className="comment-modal-overlay" onClick={() => setCommentModalOpen(null)}>
          <div className="comment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="comment-modal-header">
              <h3>Reply</h3>
              <button className="btn-close-modal" onClick={() => setCommentModalOpen(null)}>✕</button>
            </div>
            <div className="comment-modal-body">
              <form onSubmit={(e) => {
                handleCommentSubmit(commentModalOpen, e);
                setCommentModalOpen(null);
              }}>
                <div className="comment-modal-input-wrapper">
                  <div className="comment-user-avatar">
                    {currentUser?.profilePhoto ? (
                      <OptimizedImage
                        src={getImageUrl(currentUser.profilePhoto)}
                        alt="You"
                        className="avatar-image"
                      />
                    ) : (
                      <span>{currentUser?.displayName?.charAt(0).toUpperCase() || 'U'}</span>
                    )}
                  </div>
                  <textarea
                    id={`modal-comment-${commentModalOpen}`}
                    name="modalComment"
                    value={commentText[commentModalOpen] || ''}
                    onChange={(e) => {
                      handleCommentChange(commentModalOpen, e.target.value);
                      // Auto-expand textarea
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Reply, if you feel like it."
                    className="comment-modal-textarea"
                    autoFocus
                    rows="3"
                  />
                </div>
                {commentGif[commentModalOpen] && (
                  <div className="comment-gif-preview">
                    <img src={commentGif[commentModalOpen]} alt="Selected GIF" />
                    <button
                      type="button"
                      className="btn-remove-gif"
                      onClick={() => setCommentGif(prev => ({ ...prev, [commentModalOpen]: null }))}
                    >
                      ✕
                    </button>
                  </div>
                )}
                {showGifPicker === `modal-comment-${commentModalOpen}` && (
                  <GifPicker
                    onGifSelect={(gifUrl) => {
                      setCommentGif(prev => ({ ...prev, [commentModalOpen]: gifUrl }));
                      setShowGifPicker(null);
                    }}
                    onClose={() => setShowGifPicker(null)}
                  />
                )}
                <div className="comment-modal-actions">
                  <button
                    type="button"
                    onClick={() => setShowGifPicker(showGifPicker === `modal-comment-${commentModalOpen}` ? null : `modal-comment-${commentModalOpen}`)}
                    className="btn-gif"
                    title="Add GIF"
                  >
                    GIF
                  </button>
                  <button
                    type="submit"
                    className="btn-submit-comment"
                    disabled={!commentText[commentModalOpen]?.trim() && !commentGif[commentModalOpen]}
                  >
                    Reply
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

export default Feed;

