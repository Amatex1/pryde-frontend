import { renderHook, act, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useCommentThreadState } from '../useCommentThreadState';

function useCommentThreadStateHarness({
  fetchComments = vi.fn(async () => []),
  fetchReplies = vi.fn(async () => []),
  isSheetMobile = false,
}) {
  const [postComments, setPostComments] = useState({});
  const [commentReplies, setCommentReplies] = useState({});
  const [showReplies, setShowReplies] = useState({});
  const [showCommentBox, setShowCommentBox] = useState({});
  const [commentSheetOpen, setCommentSheetOpen] = useState(null);

  const actions = useCommentThreadState({
    fetchComments,
    fetchReplies,
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

  return {
    ...actions,
    postComments,
    commentReplies,
    showReplies,
    showCommentBox,
    commentSheetOpen,
  };
}

describe('useCommentThreadState', () => {
  it('opens inline comments and loads them on desktop', async () => {
    const fetchComments = vi.fn(async () => [{ _id: 'comment-1' }]);
    const { result } = renderHook(() => useCommentThreadStateHarness({ fetchComments }));

    await act(async () => {
      await result.current.openComments('post-1');
    });

    await waitFor(() => {
      expect(result.current.showCommentBox['post-1']).toBe(true);
      expect(result.current.postComments['post-1']).toEqual([{ _id: 'comment-1' }]);
    });

    expect(fetchComments).toHaveBeenCalledWith('post-1');
    expect(result.current.commentSheetOpen).toBeNull();
  });

  it('opens the mobile sheet instead of the inline box', async () => {
    const fetchComments = vi.fn(async () => []);
    const { result } = renderHook(() => useCommentThreadStateHarness({
      fetchComments,
      isSheetMobile: true,
    }));

    await act(async () => {
      await result.current.openComments('post-2');
    });

    await waitFor(() => {
      expect(result.current.commentSheetOpen).toBe('post-2');
    });

    expect(result.current.showCommentBox['post-2']).toBeUndefined();
  });

  it('fetches replies only the first time a thread is opened', async () => {
    const fetchReplies = vi.fn(async () => [{ _id: 'reply-1' }]);
    const { result } = renderHook(() => useCommentThreadStateHarness({ fetchReplies }));

    await act(async () => {
      await result.current.toggleReplies('comment-1');
    });

    await waitFor(() => {
      expect(result.current.showReplies['comment-1']).toBe(true);
      expect(result.current.commentReplies['comment-1']).toEqual([{ _id: 'reply-1' }]);
    });

    await act(async () => {
      await result.current.toggleReplies('comment-1');
      await result.current.toggleReplies('comment-1');
    });

    expect(fetchReplies).toHaveBeenCalledTimes(1);
  });
});