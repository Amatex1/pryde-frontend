/**
 * useMutation Hook - Usage Examples
 *
 * This file demonstrates how to use the unified mutation handler
 * in various scenarios throughout the application.
 *
 * NOTE: These are examples, not actual components.
 */

import { useState, useEffect } from 'react';
import { useMutation } from '../hooks/useMutation';
import { withOptimisticUpdate } from '../utils/consistencyGuard';
import { saveDraft, clearDraft } from '../utils/draftStore';
import api from '../utils/api';

// ═══════════════════════════════════════════════════════════════════
// EXAMPLE 1: Simple Like Toggle (No Optimistic Update)
// ═══════════════════════════════════════════════════════════════════

function LikeButtonExample({ postId, posts, setPosts }) {
  const likeMutation = useMutation({
    mutationKey: 'likePost',
    mutationFn: async () => {
      const response = await api.post(`/posts/${postId}/like`);
      return response.data;
    },
    onSuccess: (updatedPost) => {
      // Update state with server response (source of truth)
      setPosts(prev => prev.map(p => p._id === postId ? updatedPost : p));
    },
    onError: (error) => {
      console.error('Failed to like post:', error);
      alert('Failed to like post. Please try again.');
    },
  });

  return (
    <button 
      onClick={() => likeMutation.mutate()}
      disabled={likeMutation.isLoading}
    >
      {likeMutation.isLoading ? '...' : '❤️ Like'}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════
// EXAMPLE 2: Delete with Confirmation (Wait for API, then update)
// ═══════════════════════════════════════════════════════════════════

function DeletePostExample({ postId, posts, setPosts, showConfirm }) {
  const deleteMutation = useMutation({
    mutationKey: 'deletePost',
    mutationFn: async () => {
      await api.delete(`/posts/${postId}`);
      return { postId };
    },
    onSuccess: ({ postId }) => {
      // Only remove from state AFTER API confirms deletion
      setPosts(prev => prev.filter(p => p._id !== postId));
    },
    onError: (error) => {
      console.error('Failed to delete post:', error);
      alert('Failed to delete post. Please try again.');
    },
  });

  const handleDelete = async () => {
    const confirmed = await showConfirm('Are you sure?', 'Delete Post');
    if (confirmed) {
      deleteMutation.mutate();
    }
  };

  return (
    <button onClick={handleDelete} disabled={deleteMutation.isLoading}>
      {deleteMutation.isLoading ? 'Deleting...' : '🗑️ Delete'}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════
// EXAMPLE 3: Optimistic Update with Rollback (Reaction)
// ═══════════════════════════════════════════════════════════════════

function ReactionExample({ commentId, emoji, currentUser, postComments, setPostComments }) {
  const reactionMutation = useMutation({
    mutationKey: 'commentReaction',
    mutationFn: async () => {
      const response = await api.post(`/comments/${commentId}/react`, { emoji });
      return response.data;
    },
    // This runs BEFORE the API call - must return a rollback function
    onOptimisticUpdate: () => {
      // Save current state for rollback
      const savedComments = { ...postComments };
      
      // Apply optimistic update
      setPostComments(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(postId => {
          updated[postId] = updated[postId].map(comment => {
            if (comment._id !== commentId) return comment;
            
            const reactions = { ...comment.reactions };
            // Toggle reaction logic...
            if (!reactions[emoji]) reactions[emoji] = [];
            reactions[emoji].push(currentUser.id);
            
            return { ...comment, reactions };
          });
        });
        return updated;
      });
      
      // Return rollback function
      return () => setPostComments(savedComments);
    },
    onSuccess: (serverComment) => {
      // Reconcile with server response
      setPostComments(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(postId => {
          updated[postId] = updated[postId].map(c =>
            c._id === commentId ? serverComment : c
          );
        });
        return updated;
      });
    },
    onError: (error) => {
      // Rollback is automatic! Just show error message
      alert('Failed to add reaction. Please try again.');
    },
  });

  return (
    <button onClick={() => reactionMutation.mutate()}>
      {emoji}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════
// EXAMPLE 4: Using withOptimisticUpdate helper
// ═══════════════════════════════════════════════════════════════════

function FriendAcceptExample({ requestId, setUser, user }) {
  const handleAcceptFriend = async () => {
    await withOptimisticUpdate({
      name: 'acceptFriend',
      getState: () => user,
      setState: setUser,
      optimisticFn: (prev) => ({
        ...prev,
        friendCount: prev.friendCount + 1,
      }),
      mutationFn: async () => {
        const response = await api.post(`/friends/${requestId}/accept`);
        return response.data;
      },
      reconcileFn: (response) => (prev) => ({
        ...prev,
        friendCount: response.newFriendCount || prev.friendCount,
      }),
      onError: (error) => {
        alert('Failed to accept friend request');
      },
    });
  };

  return <button onClick={handleAcceptFriend}>Accept</button>;
}

// ═══════════════════════════════════════════════════════════════════
// EXAMPLE 5: Using mutateAsync for sequential operations
// ═══════════════════════════════════════════════════════════════════

function CreatePostWithMediaExample({ setPosts }) {
  const uploadMutation = useMutation({
    mutationKey: 'uploadMedia',
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('media', file);
      const response = await api.post('/upload/post-media', formData);
      // post-media returns { media: [{ url, type }] }
      return response.data.media?.[0]?.url;
    },
  });

  const createPostMutation = useMutation({
    mutationKey: 'createPost',
    mutationFn: async ({ content, mediaUrls }) => {
      const response = await api.post('/posts', { content, media: mediaUrls });
      return response.data;
    },
    onSuccess: (newPost) => {
      // Socket will handle adding to feed, but we can also add optimistically
      setPosts(prev => [newPost, ...prev]);
    },
  });

  const handleSubmit = async (content, files) => {
    try {
      // Upload all media first
      const mediaUrls = await Promise.all(
        files.map(file => uploadMutation.mutateAsync(file))
      );

      // Then create post with media URLs
      await createPostMutation.mutateAsync({ content, mediaUrls });
    } catch (error) {
      alert('Failed to create post');
    }
  };

  return null; // UI implementation
}

// ═══════════════════════════════════════════════════════════════════
// EXAMPLE 6: Handling loading/error states in UI
// ═══════════════════════════════════════════════════════════════════

function SendMessageExample({ recipientId, setMessages }) {
  const [text, setText] = useState('');

  const sendMutation = useMutation({
    mutationKey: 'sendMessage',
    mutationFn: async (content) => {
      const response = await api.post('/messages', {
        recipientId,
        content,
      });
      return response.data;
    },
    onSuccess: (message) => {
      setMessages(prev => [...prev, message]);
      setText(''); // Clear input on success
    },
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      if (text.trim()) sendMutation.mutate(text);
    }}>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={sendMutation.isLoading}
        placeholder={sendMutation.isError ? 'Failed to send. Try again.' : 'Type a message...'}
        className={sendMutation.isError ? 'error' : ''}
      />
      <button type="submit" disabled={sendMutation.isLoading || !text.trim()}>
        {sendMutation.isLoading ? 'Sending...' : 'Send'}
      </button>
    </form>
  );
}

// ═══════════════════════════════════════════════════════════════════
// EXAMPLE 7: Edit with draft saving
// ═══════════════════════════════════════════════════════════════════

function EditPostExample({ post, setPosts, onClose }) {
  const [content, setContent] = useState(post.content);

  const editMutation = useMutation({
    mutationKey: 'editPost',
    mutationFn: async () => {
      const response = await api.put(`/posts/${post._id}`, { content });
      return response.data;
    },
    onSuccess: (updatedPost) => {
      // Update with server response
      setPosts(prev => prev.map(p => p._id === post._id ? updatedPost : p));
      // Clear draft
      clearDraft(`edit-post-${post._id}`);
      onClose();
    },
    onError: () => {
      alert('Failed to save changes');
    },
  });

  // Auto-save draft
  useEffect(() => {
    saveDraft(`edit-post-${post._id}`, { content });
  }, [content, post._id]);

  return (
    <div>
      <textarea value={content} onChange={(e) => setContent(e.target.value)} />
      <button onClick={() => editMutation.mutate()} disabled={editMutation.isLoading}>
        {editMutation.isLoading ? 'Saving...' : 'Save'}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PATTERNS SUMMARY
// ═══════════════════════════════════════════════════════════════════
/*
 * 1. SIMPLE MUTATIONS (no optimistic update):
 *    - Use mutationFn + onSuccess + onError
 *    - State updates in onSuccess with server response
 *
 * 2. DESTRUCTIVE ACTIONS (delete):
 *    - ALWAYS wait for API success before updating state
 *    - Show confirmation dialog first
 *    - Never use optimistic updates for deletes
 *
 * 3. OPTIMISTIC UPDATES (reactions, toggles):
 *    - Use onOptimisticUpdate that returns a rollback function
 *    - Rollback is automatic on error
 *    - Reconcile with server response in onSuccess
 *
 * 4. SEQUENTIAL OPERATIONS:
 *    - Use mutateAsync for async/await pattern
 *    - Chain multiple mutations with try/catch
 *
 * 5. FORM SUBMISSIONS:
 *    - Clear form only in onSuccess
 *    - Show error state in UI using isError
 *    - Disable submit while isLoading
 */

export {
  LikeButtonExample,
  DeletePostExample,
  ReactionExample,
  FriendAcceptExample,
  CreatePostWithMediaExample,
  SendMessageExample,
  EditPostExample,
};

