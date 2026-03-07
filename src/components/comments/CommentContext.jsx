import { createContext, useContext } from 'react';

const CommentContext = createContext(null);

const EMPTY_CONTEXT = {
  currentUser: null,
  postId: null,
  viewerRole: null,
  editingCommentId: null,
  editCommentText: '',
  showReplies: {},
  showReactionPicker: null,
  commentRefs: { current: {} },
  getUserReactionEmoji: () => null,
  handleEditComment: () => {},
  handleSaveEditComment: () => {},
  handleCancelEditComment: () => {},
  handleDeleteComment: () => {},
  handleCommentReaction: () => {},
  toggleReplies: () => {},
  handleReplyToComment: () => {},
  setShowReactionPicker: () => {},
  setReactionDetailsModal: () => {},
  setReportModal: () => {},
};

export function useCommentContext() {
  return useContext(CommentContext) ?? EMPTY_CONTEXT;
}

export function CommentProvider({ children, value }) {
  return <CommentContext.Provider value={value}>{children}</CommentContext.Provider>;
}
