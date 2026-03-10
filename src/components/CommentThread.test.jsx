import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import CommentThread from './CommentThread';

const mockUseCommentContext = vi.fn();
const mockUseMediaQuery = vi.fn();

vi.mock('./comments/CommentContext', () => ({
  useCommentContext: () => mockUseCommentContext(),
}));

vi.mock('../hooks/useMediaQuery', () => ({
  useMediaQuery: (...args) => mockUseMediaQuery(...args),
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, ...props }) => <a {...props}>{children}</a>,
}));

vi.mock('./OptimizedImage', () => ({ default: () => <div /> }));
vi.mock('./ReactionButton', () => ({ default: () => <div /> }));
vi.mock('./TieredBadgeDisplay', () => ({ default: () => <div /> }));
vi.mock('./PausableGif', () => ({ default: () => <div /> }));
vi.mock('./FormattedText', () => ({ default: ({ text }) => <span>{text}</span> }));

function makeContext(overrides = {}) {
  return {
    currentUser: { id: 'user-1' },
    viewerRole: 'member',
    postId: 'post-1',
    editingCommentId: null,
    editCommentText: '',
    commentRefs: { current: {} },
    showReplies: {},
    handleEditComment: vi.fn(),
    handleSaveEditComment: vi.fn(),
    handleCancelEditComment: vi.fn(),
    handleDeleteComment: vi.fn(),
    toggleReplies: vi.fn(),
    handleReplyToComment: vi.fn(),
    setReactionDetailsModal: vi.fn(),
    setReportModal: vi.fn(),
    ...overrides,
  };
}

function makeComment(overrides = {}) {
  return {
    _id: 'comment-1',
    content: 'Root',
    parentCommentId: null,
    replyCount: 3,
    createdAt: '2024-01-01T00:00:00.000Z',
    authorId: { _id: 'user-2', username: 'bob', displayName: 'Bob' },
    ...overrides,
  };
}

describe('CommentThread', () => {
  beforeEach(() => {
    mockUseCommentContext.mockReturnValue(makeContext());
    mockUseMediaQuery.mockReturnValue(false);
  });

  it('shows clearer reply toggle copy', () => {
    const toggleReplies = vi.fn();
    mockUseCommentContext.mockReturnValue(makeContext({ toggleReplies }));

    render(<CommentThread comment={makeComment()} replies={[]} />);

    fireEvent.click(screen.getByRole('button', { name: /view replies \(3\)/i }));
    expect(toggleReplies).toHaveBeenCalledWith('comment-1');
  });

  it('shows a mobile affordance for hidden inline replies', () => {
    mockUseMediaQuery.mockReturnValue(true);
    mockUseCommentContext.mockReturnValue(
      makeContext({ showReplies: { 'comment-1': true } })
    );

    render(
      <CommentThread
        comment={makeComment()}
        replies={[
          makeComment({ _id: 'r1', content: 'Reply 1' }),
          makeComment({ _id: 'r2', content: 'Reply 2' }),
          makeComment({ _id: 'r3', content: 'Reply 3' }),
        ]}
      />
    );

    expect(screen.getByRole('button', { name: 'Show 1 more reply' })).toBeInTheDocument();
    expect(screen.queryByText('Reply 3')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Show 1 more reply' }));

    expect(screen.getByText('Reply 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show fewer replies' })).toBeInTheDocument();
  });
});