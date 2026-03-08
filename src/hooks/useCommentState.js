import { useState, useCallback } from 'react';
import api from '../utils/api';

/**
 * useCommentState - Hook for managing comment state
 * 
 * Handles:
 * - Comment text state
 * - Reply state
 * - Editing state
 * - GIF selection
 * - Comment CRUD operations
 * 
 * @param {Object} options
 * @param {string} options.postId - Current post ID
 * @param {Object} options.currentUser - Current user object
 * @returns {Object} Comment state and handlers
 */
export function useCommentState({ postId, currentUser }) {
  const [commentText, setCommentText] = useState('');
  const [commentGif, setCommentGif] = useState(null);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [replyingToComment, setReplyingToComment] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyGif, setReplyGif] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCommentBox, setShowCommentBox] = useState({});

  // Toggle comment box visibility
  const toggleCommentBox = useCallback((id) => {
    setShowCommentBox(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }, []);

  // Handle comment text change
  const handleCommentChange = useCallback((postId, text) => {
    setCommentText(text);
  }, []);

  // Handle reply text change
  const handleReplyTextChange = useCallback((commentId, text) => {
    setReplyText(text);
  }, []);

  // Select GIF for comment
  const handleCommentGifSelect = useCallback((postId, gif) => {
    setCommentGif(gif);
  }, []);

  // Select GIF for reply
  const handleReplyGifSelect = useCallback((commentId, gif) => {
    setReplyGif(gif);
  }, []);

  // Toggle GIF picker
  const toggleGifPicker = useCallback((commentId) => {
    setShowGifPicker(prev => !prev);
  }, []);

  // Submit a new comment
  const submitComment = useCallback(async (targetPostId, text, gif = null, isAnonymous = false) => {
    if (!text?.trim() && !gif) return null;
    
    setIsSubmitting(true);
    try {
      // Backend expects: POST /api/posts/:postId/comments
      const response = await api.post(`/posts/${targetPostId}/comments`, {
        content: text.trim(),
        gifUrl: gif,
        isAnonymous
      });
      return response.data;
    } catch (error) {
      console.error('Failed to submit comment:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // Submit a reply
  const submitReply = useCallback(async (targetPostId, parentCommentId, text, gif = null, isAnonymous = false) => {
    if (!text?.trim() && !gif) return null;
    
    setIsSubmitting(true);
    try {
      // Backend expects: POST /api/posts/:postId/comments (with parentCommentId for replies)
      const response = await api.post(`/posts/${targetPostId}/comments`, {
        content: text.trim(),
        parentCommentId,
        gifUrl: gif,
        isAnonymous
      });
      return response.data;
    } catch (error) {
      console.error('Failed to submit reply:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // Edit a comment
  const editComment = useCallback((commentId, content) => {
    setEditingCommentId(commentId);
    setEditCommentText(content);
  }, []);

  // Save edited comment
  const saveEditComment = useCallback(async (commentId, newContent) => {
    if (!newContent?.trim()) return;
    
    setIsSubmitting(true);
    try {
      const response = await api.put(`/comments/${commentId}`, {
        content: newContent.trim()
      });
      setEditingCommentId(null);
      setEditCommentText('');
      return response.data;
    } catch (error) {
      console.error('Failed to edit comment:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // Cancel edit
  const cancelEditComment = useCallback(() => {
    setEditingCommentId(null);
    setEditCommentText('');
  }, []);

  // Delete a comment
  const deleteComment = useCallback(async (postId, commentId, isReply = false) => {
    try {
      await api.delete(`/comments/${commentId}`);
      return true;
    } catch (error) {
      console.error('Failed to delete comment:', error);
      throw error;
    }
  }, []);

  // Reply to comment
  const replyToComment = useCallback((commentId, username) => {
    setReplyingToComment({ commentId, username });
  }, []);

  // Cancel reply
  const cancelReply = useCallback(() => {
    setReplyingToComment(null);
    setReplyText('');
    setReplyGif(null);
  }, []);

  // Reset all state
  const resetState = useCallback(() => {
    setCommentText('');
    setCommentGif(null);
    setReplyingToComment(null);
    setReplyText('');
    setReplyGif(null);
    setEditingCommentId(null);
    setEditCommentText('');
  }, []);

  return {
    // State
    commentText,
    commentGif,
    showGifPicker,
    replyingToComment,
    replyText,
    replyGif,
    editingCommentId,
    editCommentText,
    isSubmitting,
    showCommentBox,
    
    // Setters
    setCommentText,
    setCommentGif,
    setShowGifPicker,
    setReplyText,
    setReplyGif,
    setEditCommentText,
    
    // Handlers
    toggleCommentBox,
    handleCommentChange,
    handleReplyTextChange,
    handleCommentGifSelect,
    handleReplyGifSelect,
    toggleGifPicker,
    submitComment,
    submitReply,
    editComment,
    saveEditComment,
    cancelEditComment,
    deleteComment,
    replyToComment,
    cancelReply,
    resetState,
  };
}

export default useCommentState;

