import { describe, expect, it, vi } from 'vitest';
import { buildCommentContextValue } from './buildCommentContextValue';

describe('buildCommentContextValue', () => {
  it('maps comment thread state and handlers into CommentContext shape', () => {
    const handleEditComment = vi.fn();
    const toggleReplies = vi.fn();
    const contextValue = buildCommentContextValue({
      currentUser: { id: 'user-1' },
      postId: 'post-1',
      viewerRole: 'member',
      editingCommentId: 'comment-1',
      editCommentText: 'editing',
      showReplies: { 'comment-1': true },
      showReactionPicker: 'comment-1',
      commentRefs: { current: {} },
      getUserReactionEmoji: vi.fn(),
      handleEditComment,
      handleSaveEditComment: vi.fn(),
      handleCancelEditComment: vi.fn(),
      handleDeleteComment: vi.fn(),
      handleCommentReaction: vi.fn(),
      toggleReplies,
      handleReplyToComment: vi.fn(),
      setShowReactionPicker: vi.fn(),
      setReactionDetailsModal: vi.fn(),
      setReportModal: vi.fn(),
    });

    expect(contextValue.postId).toBe('post-1');
    expect(contextValue.viewerRole).toBe('member');
    expect(contextValue.handleEditComment).toBe(handleEditComment);
    expect(contextValue.toggleReplies).toBe(toggleReplies);
    expect(contextValue.showReplies['comment-1']).toBe(true);
  });
});