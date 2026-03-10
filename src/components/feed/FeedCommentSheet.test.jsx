import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import FeedCommentSheet from './FeedCommentSheet';

vi.mock('../comments/CommentSheet', () => ({
  default: ({ children, onClose }) => (
    <div>
      <button type="button" onClick={onClose}>Close Sheet</button>
      {children}
    </div>
  ),
}));

describe('FeedCommentSheet', () => {
  const baseProps = {
    postId: 'post-1',
    currentUser: { displayName: 'Alice' },
    commentValue: 'hello',
    selectedCommentGif: null,
    isCommentGifPickerOpen: false,
    onClose: vi.fn(),
    onCommentSubmit: vi.fn((e) => e.preventDefault()),
    onCommentChange: vi.fn(),
    onCommentGifToggle: vi.fn(),
    onCommentGifSelect: vi.fn(),
    onCommentGifClear: vi.fn(),
    onCommentGifPickerClose: vi.fn(),
    replyingToComment: null,
    replyTargetName: 'comment',
    replyIsAnonymous: false,
    onReplyAnonymousChange: vi.fn(),
    onReplyCancel: vi.fn(),
    replyText: '',
    onReplyTextChange: vi.fn(),
    onReplySubmit: vi.fn((e) => e.preventDefault()),
    replyGif: null,
    isReplyGifPickerOpen: false,
    onReplyGifToggle: vi.fn(),
    onReplyGifSelect: vi.fn(),
    onReplyGifClear: vi.fn(),
    onReplyGifPickerClose: vi.fn(),
    commentContextValue: {},
    comments: [],
    commentReplies: {},
  };

  it('returns nothing when closed', () => {
    const { container } = render(
      <FeedCommentSheet {...baseProps} isOpen={false} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('wires the top comment input and submit actions', () => {
    const onCommentChange = vi.fn();
    const onCommentSubmit = vi.fn((e) => e.preventDefault());

    render(
      <FeedCommentSheet
        {...baseProps}
        isOpen
        onCommentChange={onCommentChange}
        onCommentSubmit={onCommentSubmit}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Add a comment...'), {
      target: { value: 'updated' },
    });
    expect(onCommentChange).toHaveBeenCalledWith('updated');

    fireEvent.submit(screen.getByPlaceholderText('Add a comment...').closest('form'));
    expect(onCommentSubmit).toHaveBeenCalled();
  });
});