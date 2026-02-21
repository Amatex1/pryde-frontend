/**
 * CommentProvider (per-post scope)
 *
 * Wraps a post's comment section with a CommentScopeContext that provides:
 *   postId               — the post this comment section belongs to
 *   currentUser          — from AuthContext (same instance as the rest of the app)
 *   commentRefs          — from global CommentContext (shared across all posts)
 *   getUserReactionEmoji — computed from currentUser; handles both array and
 *                          object reaction formats (posts and comments)
 *   showGifPicker        — from global CommentContext (no extra prop needed)
 *   onToggleGifPicker    — passed by the rendering parent (FeedPost / CommentSheet)
 *   setReactionDetailsModal — passed by the rendering parent
 *   setReportModal          — passed by the rendering parent
 *   isFullSheet          — true when rendered inside the mobile CommentSheet
 *
 * Must be rendered inside the global CommentProvider from CommentContext so
 * that useComments() calls within this tree resolve correctly.
 */
import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useComments } from '../context/CommentContext';
import { CommentScopeContext } from './CommentScopeContext';

export default function CommentProvider({
  postId,
  onToggleGifPicker,
  setReactionDetailsModal,
  setReportModal,
  isFullSheet = false,
  children,
}) {
  const { user: currentUser } = useAuth();
  // showGifPicker and commentRefs live in the global CommentContext — read
  // them here so the per-post scope has them without extra prop drilling.
  const { showGifPicker, commentRefs } = useComments();

  // Handles both array format (post reactions) and object format (comment reactions).
  // Identical logic to FeedContent's getUserReactionEmoji — defined here so
  // CommentItem / ReplyCluster / ReactionBar don't need it as a prop.
  const getUserReactionEmoji = useCallback((reactions) => {
    if (!reactions || !currentUser?.id) return null;

    if (Array.isArray(reactions)) {
      const userReaction = reactions.find(r => {
        const userId = r.user?._id || r.user;
        return userId?.toString() === currentUser.id?.toString();
      });
      return userReaction?.emoji || null;
    }

    for (const [emoji, userIds] of Object.entries(reactions)) {
      if (userIds.some(id => id?.toString() === currentUser.id?.toString())) {
        return emoji;
      }
    }
    return null;
  }, [currentUser?.id]);

  return (
    <CommentScopeContext.Provider value={{
      postId,
      currentUser,
      commentRefs,
      getUserReactionEmoji,
      showGifPicker,
      onToggleGifPicker,
      setReactionDetailsModal,
      setReportModal,
      isFullSheet,
    }}>
      {children}
    </CommentScopeContext.Provider>
  );
}
