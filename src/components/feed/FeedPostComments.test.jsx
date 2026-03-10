import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import FeedPostComments from './FeedPostComments';

vi.mock('../../hooks/useAutoResize', () => ({
  useAutoResize: vi.fn(),
}));

vi.mock('../CommentThread', () => ({
  default: ({ comment }) => <div data-testid="comment-thread">{comment.content}</div>,
}));

describe('FeedPostComments', () => {
  const baseProps = {
    post: { _id: 'post-1' },
    currentUser: { displayName: 'Alice' },
    comments: [],
    commentReplies: {},
    showReplies: {},
    showCommentBox: {},
    commentText: {},
    commentGif: {},
    showGifPicker: null,
    replyingToComment: null,
    replyText: '',
    replyGif: null,
    editingCommentId: null,
    editCommentText: '',
    showReactionPicker: null,
    commentRefs: { current: {} },
    onEditComment: vi.fn(),
    onSaveEditComment: vi.fn(),
    onCancelEditComment: vi.fn(),
    onDeleteComment: vi.fn(),
    onCommentReaction: vi.fn(),
    onToggleReplies: vi.fn(),
    onReplyToComment: vi.fn(),
    onOpenComments: vi.fn(),
    onSetShowReactionPicker: vi.fn(),
    onSetReactionDetailsModal: vi.fn(),
    onSetReportModal: vi.fn(),
    onReplyTextChange: vi.fn(),
    onReplyGifSelect: vi.fn(),
    onSubmitReply: vi.fn(),
    onCancelReply: vi.fn(),
    onCommentChange: vi.fn(),
    onCommentGifSelect: vi.fn(),
    onCommentSubmit: vi.fn(),
    onToggleGifPicker: vi.fn(),
    getUserReactionEmoji: vi.fn(),
    viewerRole: 'member',
    replyIsAnonymous: false,
    onReplyIsAnonymousChange: vi.fn(),
  };

  const topLevelComments = [
    { _id: 'c1', content: 'one', parentCommentId: null },
    { _id: 'c2', content: 'two', parentCommentId: null },
    { _id: 'c3', content: 'three', parentCommentId: null },
    { _id: 'c4', content: 'four', parentCommentId: null },
  ];

  it('opens the full discussion from the view-all button', () => {
    const onOpenComments = vi.fn();
    const onReplyToComment = vi.fn();

    render(
      <FeedPostComments
        {...baseProps}
        comments={topLevelComments}
        onOpenComments={onOpenComments}
        onReplyToComment={onReplyToComment}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'View all 4 comments' }));

    expect(onOpenComments).toHaveBeenCalledWith('post-1');
    expect(onReplyToComment).not.toHaveBeenCalled();
  });

  it('shows all top-level comments when the discussion is expanded inline', () => {
    render(
      <FeedPostComments
        {...baseProps}
        comments={topLevelComments}
        showCommentBox={{ 'post-1': true }}
      />
    );

    expect(screen.getAllByTestId('comment-thread')).toHaveLength(4);
    expect(screen.queryByRole('button', { name: 'View all 4 comments' })).toBeNull();
  });
});