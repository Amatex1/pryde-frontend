import { useCallback } from 'react';

export function useCommentThreadState({
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
}) {
  const fetchCommentsForPost = useCallback(async (postId) => {
    const comments = await fetchComments(postId);
    setPostComments((prev) => ({
      ...prev,
      [postId]: comments || [],
    }));
    return comments || [];
  }, [fetchComments, setPostComments]);

  const ensureCommentsLoaded = useCallback(async (postId) => {
    if (!postComments[postId]) {
      await fetchCommentsForPost(postId);
    }
  }, [fetchCommentsForPost, postComments]);

  const fetchRepliesForComment = useCallback(async (commentId) => {
    const replies = await fetchReplies(commentId);
    setCommentReplies((prev) => ({
      ...prev,
      [commentId]: replies || [],
    }));
    return replies || [];
  }, [fetchReplies, setCommentReplies]);

  const toggleReplies = useCallback(async (commentId) => {
    const isCurrentlyShown = Boolean(showReplies[commentId]);

    setShowReplies((prev) => ({
      ...prev,
      [commentId]: !isCurrentlyShown,
    }));

    if (!isCurrentlyShown && !commentReplies[commentId]) {
      await fetchRepliesForComment(commentId);
    }
  }, [commentReplies, fetchRepliesForComment, setShowReplies, showReplies]);

  const openComments = useCallback(async (postId) => {
    if (isSheetMobile) {
      setCommentSheetOpen(postId);
    } else {
      setShowCommentBox((prev) => ({ ...prev, [postId]: true }));
    }

    await ensureCommentsLoaded(postId);
  }, [ensureCommentsLoaded, isSheetMobile, setCommentSheetOpen, setShowCommentBox]);

  const toggleCommentBox = useCallback(async (postId) => {
    if (isSheetMobile) {
      await openComments(postId);
      return;
    }

    const isCurrentlyShown = Boolean(showCommentBox[postId]);

    setShowCommentBox((prev) => ({
      ...prev,
      [postId]: !isCurrentlyShown,
    }));

    if (!isCurrentlyShown) {
      await ensureCommentsLoaded(postId);
    }
  }, [ensureCommentsLoaded, isSheetMobile, openComments, setShowCommentBox, showCommentBox]);

  return {
    fetchCommentsForPost,
    ensureCommentsLoaded,
    fetchRepliesForComment,
    toggleReplies,
    openComments,
    toggleCommentBox,
  };
}