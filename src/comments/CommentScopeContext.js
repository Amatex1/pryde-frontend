/**
 * CommentScopeContext — per-post scope for the /src/comments/ module.
 *
 * Provides postId + a handful of values that cannot come from the global
 * CommentContext (currentUser, getUserReactionEmoji, onToggleGifPicker,
 * setReactionDetailsModal, setReportModal, isFullSheet).
 *
 * commentRefs and showGifPicker ARE read from the global CommentContext so
 * they do NOT need to be props on the per-post CommentProvider.
 */
import { createContext, useContext } from 'react';

export const CommentScopeContext = createContext(null);

export function useCommentScope() {
  const ctx = useContext(CommentScopeContext);
  if (!ctx) throw new Error('useCommentScope must be used within a comments/CommentProvider');
  return ctx;
}
