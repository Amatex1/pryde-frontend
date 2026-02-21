/**
 * CommentContext — Phase 2: State Normalization
 *
 * Internal state is now a normalized entity store:
 *   commentsById   — { [commentId]: comment }
 *   commentsByPost — { [postId]: [commentId, …] }
 *   repliesByParent — { [parentCommentId]: [commentId, …] }
 *
 * Backward-compat read-only derived values (useMemo) are exposed under the
 * same names as Phase 1 so no consumer (FeedContent, FeedPost, CommentThread)
 * needs to change:
 *   postComments   — { [postId]: [comment, …] }   (derived)
 *   commentReplies — { [parentId]: [comment, …] }  (derived)
 *
 * Props required by CommentProvider:
 *   setPosts       — Feed's posts setter; used by batchers to update comment counts
 *   showAlert      — from Feed's useModal() instance
 *   showConfirm    — from Feed's useModal() instance
 *   currentUser    — from Feed's useAuth()
 *   showGifPicker  — Feed's showGifPicker value; comment handlers read it to
 *                    block submission while a GIF picker is open
 *
 * STRICT RULES (Phase 2):
 *   - No backend routes changed
 *   - No schema changes
 *   - No visual changes
 *   - Behavior is 100% identical to the Phase 1 implementation
 *   - Changes are limited to CommentContext.jsx only
 */

import { useState, useEffect, useCallback, useRef, useMemo, createContext, useContext } from 'react';
import api from '../utils/api';
import { setupSocketListeners } from '../utils/socketHelpers';
import { createEventBatcher, createKeyedBatcher } from '../utils/socketBatcher';
import { saveDraft, loadDraft, clearDraft } from '../utils/draftStore';
import { convertEmojiShortcuts } from '../utils/textFormatting';
import logger from '../utils/logger';

const CommentContext = createContext(null);

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export function CommentProvider({
  children,
  setPosts,
  showAlert,
  showConfirm,
  currentUser,
  showGifPicker,
}) {
  // ── Normalized comment data ───────────────────────────────────────────────
  const [commentsById, setCommentsById] = useState({});        // { commentId: comment }
  const [commentsByPost, setCommentsByPost] = useState({});    // { postId: [commentId] }
  const [repliesByParent, setRepliesByParent] = useState({});  // { parentId: [commentId] }

  // ── Backward-compat derived values ────────────────────────────────────────
  // Shape is identical to Phase 1: { postId: [comment] } / { parentId: [comment] }
  // Consumers (FeedContent, FeedPost, CommentThread) read these — no changes needed there.
  const postComments = useMemo(() => {
    const result = {};
    Object.entries(commentsByPost).forEach(([postId, ids]) => {
      result[postId] = ids.map(id => commentsById[id]).filter(Boolean);
    });
    return result;
  }, [commentsByPost, commentsById]);

  const commentReplies = useMemo(() => {
    const result = {};
    Object.entries(repliesByParent).forEach(([parentId, ids]) => {
      result[parentId] = ids.map(id => commentsById[id]).filter(Boolean);
    });
    return result;
  }, [repliesByParent, commentsById]);

  // ── Reply / edit visibility ───────────────────────────────────────────────
  const [showReplies, setShowReplies] = useState({}); // { commentId: boolean }

  // ── Comment input ─────────────────────────────────────────────────────────
  const [commentText, setCommentText] = useState({}); // { postId: string }
  const [commentGif, setCommentGif] = useState({});   // { postId: gifUrl }

  // ── Reply input ───────────────────────────────────────────────────────────
  const [replyText, setReplyText] = useState('');
  const [replyGif, setReplyGif] = useState(null);
  const [replyingToComment, setReplyingToComment] = useState(null); // { postId, commentId }

  // ── Edit state ────────────────────────────────────────────────────────────
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');

  // ── UI visibility ─────────────────────────────────────────────────────────
  const [showCommentBox, setShowCommentBox] = useState({});       // { postId: boolean }
  const [commentSheetOpen, setCommentSheetOpen] = useState(null); // postId | null
  const [commentModalOpen, setCommentModalOpen] = useState(null); // postId | null
  const [openCommentDropdownId, setOpenCommentDropdownId] = useState(null);
  const [showReactionPicker, setShowReactionPicker] = useState(null);

  // ── Internal refs ─────────────────────────────────────────────────────────
  const socketBatchersRef = useRef(null);
  const listenersSetUpRef = useRef(false);

  // ─────────────────────────────────────────────────────────────────────────
  // Effect: Scroll lock when mobile comment sheet is open
  // (Identical to Phase 1 / original Feed.jsx)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (commentSheetOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
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

  // ─────────────────────────────────────────────────────────────────────────
  // Effect: Auto-save comment edit draft
  // (Identical to Phase 1 / original Feed.jsx)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (editingCommentId && editCommentText) {
      const draftKey = `edit-comment-${editingCommentId}`;
      saveDraft(draftKey, editCommentText);
    }
  }, [editCommentText, editingCommentId]);

  // ─────────────────────────────────────────────────────────────────────────
  // Effect: Comment socket listeners
  // All batchers now write into the normalized store instead of the old
  // postComments / commentReplies arrays.
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (listenersSetUpRef.current) {
      logger.debug('⚠️ CommentContext listeners already initialized, skipping setup');
      return;
    }

    const BATCH_DELAY = 100; // ms — matches Phase 1
    let cleanupFunctions = [];

    // ── Keyed batcher: comment reactions ─────────────────────────────────
    // Only keeps the latest event per commentId → single setCommentsById call.
    const commentReactionBatcher = createKeyedBatcher(
      (eventsMap) => {
        logger.debug(`⚡ Batched ${eventsMap.size} comment reactions`);
        const updatedComments = Array.from(eventsMap.values()).map(d => d.comment);

        setCommentsById(prev => {
          const updated = { ...prev };
          updatedComments.forEach(uc => {
            if (updated[uc._id]) {
              updated[uc._id] = uc;
            }
          });
          return updated;
        });
      },
      (data) => data.comment._id,
      BATCH_DELAY
    );

    // ── Event batcher: new comments ───────────────────────────────────────
    const commentAddedBatcher = createEventBatcher(
      (events) => {
        logger.debug(`⚡ Batched ${events.length} new comments`);
        const replies = events.filter(e => e.comment.parentCommentId);
        const topLevel = events.filter(e => !e.comment.parentCommentId);

        // Add all new comments to the entity store
        setCommentsById(prev => {
          const updated = { ...prev };
          events.forEach(({ comment }) => {
            if (!updated[comment._id]) {
              updated[comment._id] = comment;
            }
          });
          return updated;
        });

        // Wire replies into repliesByParent
        if (replies.length > 0) {
          setRepliesByParent(prev => {
            const updated = { ...prev };
            replies.forEach(({ comment }) => {
              const existing = updated[comment.parentCommentId] || [];
              if (!existing.includes(comment._id)) {
                updated[comment.parentCommentId] = [...existing, comment._id];
              }
            });
            return updated;
          });
        }

        // Wire top-level comments into commentsByPost
        if (topLevel.length > 0) {
          setCommentsByPost(prev => {
            const updated = { ...prev };
            topLevel.forEach(({ comment, postId }) => {
              const existing = updated[postId] || [];
              if (!existing.includes(comment._id)) {
                updated[postId] = [...existing, comment._id];
              }
            });
            return updated;
          });

          // Update post comment counts via the setPosts prop
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

    // ── Keyed batcher: comment updates ────────────────────────────────────
    // Only keeps the latest event per commentId → single setCommentsById call.
    const commentUpdatedBatcher = createKeyedBatcher(
      (eventsMap) => {
        logger.debug(`⚡ Batched ${eventsMap.size} comment updates`);
        const updatedComments = Array.from(eventsMap.values()).map(d => d.comment);

        setCommentsById(prev => {
          const updated = { ...prev };
          updatedComments.forEach(uc => {
            if (updated[uc._id]) {
              updated[uc._id] = uc;
            }
          });
          return updated;
        });
      },
      (data) => data.comment._id,
      BATCH_DELAY
    );

    // ── Event batcher: comment deletions ──────────────────────────────────
    const commentDeletedBatcher = createEventBatcher(
      (events) => {
        logger.debug(`⚡ Batched ${events.length} comment deletions`);
        const deletedIds = new Set(events.map(e => e.commentId));
        const countsByPost = {};
        events.forEach(({ postId }) => {
          countsByPost[postId] = (countsByPost[postId] || 0) + 1;
        });

        // Remove entities from the store
        setCommentsById(prev => {
          const updated = { ...prev };
          deletedIds.forEach(id => delete updated[id]);
          return updated;
        });

        // Remove IDs from commentsByPost
        setCommentsByPost(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(postId => {
            updated[postId] = updated[postId].filter(id => !deletedIds.has(id));
          });
          return updated;
        });

        // Remove IDs from repliesByParent; also drop deleted comment's own reply list
        setRepliesByParent(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(parentId => {
            updated[parentId] = updated[parentId].filter(id => !deletedIds.has(id));
          });
          deletedIds.forEach(id => delete updated[id]);
          return updated;
        });

        // Update post comment counts via the setPosts prop
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

    socketBatchersRef.current = {
      commentReactionBatcher,
      commentAddedBatcher,
      commentUpdatedBatcher,
      commentDeletedBatcher,
    };

    listenersSetUpRef.current = true;

    const cancelSocketRetry = setupSocketListeners((socket) => {
      if (socket && typeof socket.on === 'function' && typeof socket.off === 'function') {
        const handleCommentReactionRT = (data) => {
          logger.debug('💜 Real-time comment reaction received:', data);
          commentReactionBatcher.add(data);
        };
        socket.on('comment_reaction_added', handleCommentReactionRT);
        cleanupFunctions.push(() => socket.off('comment_reaction_added', handleCommentReactionRT));

        const handleCommentAddedRT = (data) => {
          logger.debug('💬 Real-time comment received:', data);
          commentAddedBatcher.add(data);
        };
        socket.on('comment_added', handleCommentAddedRT);
        cleanupFunctions.push(() => socket.off('comment_added', handleCommentAddedRT));

        const handleCommentUpdatedRT = (data) => {
          logger.debug('✏️ Real-time comment update received:', data);
          commentUpdatedBatcher.add(data);
        };
        socket.on('comment_updated', handleCommentUpdatedRT);
        cleanupFunctions.push(() => socket.off('comment_updated', handleCommentUpdatedRT));

        const handleCommentDeletedRT = (data) => {
          logger.debug('🗑️ Real-time comment deletion received:', data);
          commentDeletedBatcher.add(data);
        };
        socket.on('comment_deleted', handleCommentDeletedRT);
        cleanupFunctions.push(() => socket.off('comment_deleted', handleCommentDeletedRT));
      }
    });

    return () => {
      cancelSocketRetry();
      cleanupFunctions.forEach(cleanup => cleanup?.());
      if (socketBatchersRef.current) {
        Object.values(socketBatchersRef.current).forEach(batcher => batcher?.destroy?.());
        socketBatchersRef.current = null;
      }
      // DON'T reset the flag — same Strict Mode guard as Phase 1
    };
  }, [setPosts]);

  // ─────────────────────────────────────────────────────────────────────────
  // Comment handler functions
  // Internal logic updated to operate on normalized state.
  // All public signatures and behaviors are identical to Phase 1.
  // ─────────────────────────────────────────────────────────────────────────

  const fetchCommentsForPost = useCallback(async (postId) => {
    try {
      logger.debug(`📥 Fetching comments for post: ${postId}`);
      const response = await api.get(`/posts/${postId}/comments`);
      const comments = response.data || [];
      logger.debug(`✅ Fetched ${comments.length} comments for post ${postId}`);

      // Store all top-level comment entities
      setCommentsById(prev => {
        const updated = { ...prev };
        comments.forEach(c => { updated[c._id] = c; });
        return updated;
      });
      setCommentsByPost(prev => ({
        ...prev,
        [postId]: comments.map(c => c._id),
      }));

      // Auto-fetch and show replies for comments that already have replies
      const commentsWithReplies = comments.filter(c => c.replyCount > 0);
      if (commentsWithReplies.length > 0) {
        const replyPromises = commentsWithReplies.map(async (comment) => {
          try {
            const replyResponse = await api.get(`/comments/${comment._id}/replies`);
            return { commentId: comment._id, replies: replyResponse.data || [] };
          } catch (err) {
            logger.error(`Failed to fetch replies for comment ${comment._id}:`, err);
            return { commentId: comment._id, replies: [] };
          }
        });

        const replyResults = await Promise.all(replyPromises);

        // Store all reply entities
        setCommentsById(prev => {
          const updated = { ...prev };
          replyResults.forEach(({ replies }) => {
            replies.forEach(r => { updated[r._id] = r; });
          });
          return updated;
        });

        setRepliesByParent(prev => {
          const updated = { ...prev };
          replyResults.forEach(({ commentId, replies }) => {
            updated[commentId] = replies.map(r => r._id);
          });
          return updated;
        });

        setShowReplies(prev => {
          const updated = { ...prev };
          commentsWithReplies.forEach(comment => {
            updated[comment._id] = true;
          });
          return updated;
        });
      }
    } catch (error) {
      logger.error('❌ Failed to fetch comments:', error);
    }
  }, []);

  const fetchRepliesForComment = useCallback(async (commentId) => {
    try {
      const response = await api.get(`/comments/${commentId}/replies`);
      const replies = response.data || [];

      setCommentsById(prev => {
        const updated = { ...prev };
        replies.forEach(r => { updated[r._id] = r; });
        return updated;
      });
      setRepliesByParent(prev => ({
        ...prev,
        [commentId]: replies.map(r => r._id),
      }));
    } catch (error) {
      logger.error('Failed to fetch replies:', error);
    }
  }, []);

  const toggleReplies = useCallback(async (commentId) => {
    setShowReplies(prev => {
      const isCurrentlyShown = prev[commentId];
      if (!isCurrentlyShown) {
        // Fetch replies if we haven't loaded them yet
        setRepliesByParent(rp => {
          if (!rp[commentId]) {
            fetchRepliesForComment(commentId);
          }
          return rp;
        });
      }
      return { ...prev, [commentId]: !isCurrentlyShown };
    });
  }, [fetchRepliesForComment]);

  const handleCommentReaction = useCallback(async (commentId, emoji) => {
    // Snapshot for optimistic rollback
    const originalComment = commentsById[commentId];

    try {
      // Optimistic update — mutate only the entity in commentsById
      if (originalComment) {
        const reactions = { ...originalComment.reactions };
        const currentUserId = currentUser?.id;

        Object.keys(reactions).forEach(key => {
          reactions[key] = reactions[key].filter(uid => uid !== currentUserId);
        });

        const hadThisReaction = originalComment.reactions?.[emoji]?.includes(currentUserId);
        if (!hadThisReaction) {
          if (!reactions[emoji]) reactions[emoji] = [];
          reactions[emoji].push(currentUserId);
        }

        setCommentsById(prev => ({
          ...prev,
          [commentId]: { ...originalComment, reactions },
        }));
      }

      const response = await api.post(`/comments/${commentId}/react`, { emoji });
      const serverComment = response.data;

      // Reconcile with server truth
      setCommentsById(prev => ({ ...prev, [commentId]: serverComment }));
      setShowReactionPicker(null);
    } catch (error) {
      logger.error('Failed to react to comment:', error);
      // Roll back to the pre-optimistic snapshot
      if (originalComment) {
        setCommentsById(prev => ({ ...prev, [commentId]: originalComment }));
      }
      showAlert('Failed to add reaction. Please try again.', 'Reaction Failed');
    }
  }, [commentsById, currentUser?.id, showAlert]);

  const toggleCommentBox = useCallback(async (postId) => {
    const isMobileSheet = window.matchMedia("(max-width: 600px)").matches;

    console.log('🔍 toggleCommentBox - isMobileSheet:', isMobileSheet, 'width:', window.innerWidth);

    if (isMobileSheet) {
      console.log('🔍 Opening CommentSheet for post:', postId);
      setCommentSheetOpen(postId);
      setCommentsByPost(prev => {
        if (!prev[postId]) {
          fetchCommentsForPost(postId);
        }
        return prev;
      });
      return;
    }

    setShowCommentBox(prev => {
      const isCurrentlyShown = prev[postId];
      if (!isCurrentlyShown) {
        setCommentsByPost(p => {
          if (!p[postId]) {
            fetchCommentsForPost(postId);
          }
          return p;
        });
      }
      return { ...prev, [postId]: !isCurrentlyShown };
    });
  }, [fetchCommentsForPost]);

  const handleCommentSubmit = useCallback(async (postId, e) => {
    e.preventDefault();

    if (showGifPicker !== null) {
      return;
    }

    const content = commentText[postId];
    const gifUrl = commentGif[postId];

    if ((!content || !content.trim()) && !gifUrl) return;

    try {
      const contentWithEmojis = content ? convertEmojiShortcuts(content) : '';

      logger.debug('💬 Submitting comment:', { postId, content: contentWithEmojis, gifUrl });

      const response = await api.post(`/posts/${postId}/comments`, {
        content: contentWithEmojis,
        gifUrl: gifUrl || null,
        parentCommentId: null
      });

      logger.debug('✅ Comment created:', response.data);

      const draftKey = `comment-${postId}`;
      clearDraft(draftKey);

      setCommentText(prev => ({ ...prev, [postId]: '' }));
      setCommentGif(prev => ({ ...prev, [postId]: null }));
    } catch (error) {
      logger.error('❌ Failed to create comment:', error);
      logger.error('Error details:', error.response?.data);
      showAlert('This didn\'t post properly. You can try again in a moment.', 'Reply issue');
    }
  }, [showGifPicker, commentText, commentGif, showAlert]);

  const handleCommentChange = useCallback((postId, value) => {
    setCommentText(prev => ({ ...prev, [postId]: value }));

    if (value) {
      const draftKey = `comment-${postId}`;
      saveDraft(draftKey, value);
    }
  }, []);

  const handleEditComment = useCallback((commentId, content) => {
    if (editingCommentId === commentId) {
      setEditCommentText(content);
      return;
    }

    setEditingCommentId(commentId);
    const draftKey = `edit-comment-${commentId}`;
    const localDraft = loadDraft(draftKey);
    setEditCommentText(localDraft || content);
  }, [editingCommentId]);

  const handleSaveEditComment = useCallback(async (commentId) => {
    if (!editCommentText.trim()) return;

    try {
      const response = await api.put(`/comments/${commentId}`, {
        content: editCommentText
      });

      const updatedComment = response.data;

      // Single entity update — postComments and commentReplies derived values update automatically
      setCommentsById(prev => ({ ...prev, [commentId]: updatedComment }));

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

  const handleDeleteComment = useCallback(async (postId, commentId, isReply = false) => {
    const confirmed = await showConfirm('Are you sure you want to delete this comment?', 'Delete Comment', 'Delete', 'Cancel');
    if (!confirmed) return;

    try {
      await api.delete(`/comments/${commentId}`);

      if (isReply) {
        // Remove the reply ID from its parent's list
        setRepliesByParent(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(parentId => {
            updated[parentId] = updated[parentId].filter(id => id !== commentId);
          });
          return updated;
        });
      } else {
        // Remove the comment ID from its post's list
        setCommentsByPost(prev => ({
          ...prev,
          [postId]: (prev[postId] || []).filter(id => id !== commentId),
        }));

        // Drop any replies that belonged to this comment
        setRepliesByParent(prev => {
          const updated = { ...prev };
          delete updated[commentId];
          return updated;
        });
      }

      // Remove the entity itself
      setCommentsById(prev => {
        const updated = { ...prev };
        delete updated[commentId];
        return updated;
      });

      // Update post comment count via the setPosts prop
      setPosts(prev => prev.map(p =>
        p._id === postId
          ? { ...p, commentCount: Math.max(0, (p.commentCount || 0) - 1) }
          : p
      ));
    } catch (error) {
      logger.error('Failed to delete comment:', error);
      showAlert('This didn\'t delete properly. You can try again in a moment.', 'Delete issue');
    }
  }, [showConfirm, showAlert, setPosts]);

  const handleReplyToComment = useCallback((postId, commentId) => {
    setReplyingToComment({ postId, commentId });
    setReplyText('');
  }, []);

  const handleSubmitReply = useCallback(async (e) => {
    e.preventDefault();

    if (showGifPicker !== null) {
      return;
    }

    if ((!replyText || !replyText.trim()) && !replyGif) return;
    if (!replyingToComment) return;

    try {
      const { postId, commentId } = replyingToComment;
      const contentWithEmojis = replyText ? convertEmojiShortcuts(replyText) : '';

      await api.post(`/posts/${postId}/comments`, {
        content: contentWithEmojis,
        gifUrl: replyGif || null,
        parentCommentId: commentId
      });

      setReplyingToComment(null);
      setReplyText('');
      setReplyGif(null);

      setShowReplies(prev => ({
        ...prev,
        [commentId]: true
      }));
    } catch (error) {
      logger.error('Failed to reply to comment:', error);
      showAlert('This didn\'t post properly. You can try again in a moment.', 'Reply issue');
    }
  }, [showGifPicker, replyText, replyGif, replyingToComment, showAlert]);

  const handleCancelReply = useCallback(() => {
    setReplyingToComment(null);
    setReplyText('');
    setReplyGif(null);
  }, []);

  const handleCommentGifSelect = useCallback((postId, gifUrl) => {
    setCommentGif(prev => ({ ...prev, [postId]: gifUrl }));
  }, []);

  const handleReplyTextChange = useCallback((value) => {
    setReplyText(value);
  }, []);

  const handleReplyGifSelect = useCallback((gifUrl) => {
    setReplyGif(gifUrl);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Context value
  // ─────────────────────────────────────────────────────────────────────────
  //
  // Backward-compat notes:
  //   • postComments / commentReplies are useMemo derived values (same shape as Phase 1)
  //   • setPostComments / setCommentReplies are no-op shims — FeedContent destructures
  //     them but never calls them; all mutations go through handler functions.
  //   • New normalized atoms (commentsById, commentsByPost, repliesByParent) are also
  //     exposed for any future consumer that wants to bypass the derived layer.
  //
  const value = {
    // ── Backward-compat derived read values
    postComments,
    commentReplies,

    // ── Backward-compat setter shims (FeedContent destructures these; never calls them)
    setPostComments: () => {},
    setCommentReplies: () => {},

    // ── Normalized atoms (new in Phase 2)
    commentsById,      setCommentsById,
    commentsByPost,    setCommentsByPost,
    repliesByParent,   setRepliesByParent,

    // ── Other state (unchanged from Phase 1)
    showReplies,       setShowReplies,
    commentText,       setCommentText,
    commentGif,        setCommentGif,
    replyText,         setReplyText,
    replyGif,          setReplyGif,
    replyingToComment, setReplyingToComment,
    editingCommentId,  setEditingCommentId,
    editCommentText,   setEditCommentText,
    showCommentBox,    setShowCommentBox,
    commentSheetOpen,  setCommentSheetOpen,
    commentModalOpen,  setCommentModalOpen,
    openCommentDropdownId, setOpenCommentDropdownId,
    showReactionPicker,    setShowReactionPicker,

    // ── Handler functions (signatures unchanged from Phase 1)
    fetchCommentsForPost,
    fetchRepliesForComment,
    toggleReplies,
    handleCommentReaction,
    toggleCommentBox,
    handleCommentSubmit,
    handleCommentChange,
    handleEditComment,
    handleSaveEditComment,
    handleCancelEditComment,
    handleDeleteComment,
    handleReplyToComment,
    handleSubmitReply,
    handleCancelReply,
    handleCommentGifSelect,
    handleReplyTextChange,
    handleReplyGifSelect,
  };

  return (
    <CommentContext.Provider value={value}>
      {children}
    </CommentContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useComments() {
  const ctx = useContext(CommentContext);
  if (!ctx) throw new Error('useComments must be used within a CommentProvider');
  return ctx;
}
