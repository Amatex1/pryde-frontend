/**
 * Phase 2: Group-only posting
 * Phase 4A: Group Ownership & Moderation
 * Phase 4B: Group Notifications (Quiet, Opt-in)
 *
 * Groups Page - Private, join-gated community groups
 *
 * Behavior:
 * - Shows name + description to everyone
 * - Non-members: "Join Group" CTA, NO posts visible
 * - Members: Post composer + group feed
 *
 * MODERATION (Phase 4A):
 * - Owner: Can manage members, promote/demote moderators, delete any post
 * - Moderator: Can remove members, delete any post
 * - Regular member: No moderation controls
 *
 * NOTIFICATIONS (Phase 4B):
 * - New posts: OFF by default (opt-in)
 * - Mentions: ON by default
 * - Respects Quiet Mode
 *
 * ISOLATION:
 * - Group posts are intentionally isolated from global feeds
 * - Posts created here use visibility: 'group' and groupId
 * - These posts NEVER appear in /feed, /profile, bookmarks, etc.
 *
 * Tags are legacy entry points only.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate, useOutletContext } from 'react-router-dom';
import Navbar from '../components/Navbar';
import OptimizedImage from '../components/OptimizedImage';
import PostHeader from '../components/PostHeader';
import Toast from '../components/Toast';
import FormattedText from '../components/FormattedText';
import CommentThread from '../components/CommentThread';
import GifPicker from '../components/GifPicker';
import { useToast } from '../hooks/useToast';
import { useModal } from '../hooks/useModal';
import api from '../utils/api';
import { getCurrentUser } from '../utils/auth';
import { getImageUrl } from '../utils/imageUrl';
import './Groups.css';

function Groups() {
  const { slug } = useParams();
  const navigate = useNavigate();
  // Get menu handler from AppLayout outlet context
  const { onMenuOpen } = useOutletContext() || {};
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState(null);
  const currentUser = getCurrentUser();

  // Phase 2C: Toast notifications for UX feedback
  const { toasts, showToast, removeToast } = useToast();

  // Phase 2: Group post composer state
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const [postMedia, setPostMedia] = useState([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const fileInputRef = useRef(null);

  // Edit post state
  const [editingPost, setEditingPost] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editMedia, setEditMedia] = useState([]);
  const [saving, setSaving] = useState(false);

  // Phase 4A: Member management state
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [members, setMembers] = useState([]);
  const [moderators, setModerators] = useState([]);
  const [mutedMembers, setMutedMembers] = useState([]); // Phase 6A: Muted member IDs
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(null);

  // Phase 4B: Notification settings state
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    notifyOnNewPost: false,  // OFF by default (opt-in)
    notifyOnMention: true     // ON by default
  });
  const [loadingNotificationSettings, setLoadingNotificationSettings] = useState(false);
  const [savingNotificationSettings, setSavingNotificationSettings] = useState(false);

  // Phase 6A: Moderation log state
  const [showModLog, setShowModLog] = useState(false);
  const [modLogs, setModLogs] = useState([]);
  const [loadingModLogs, setLoadingModLogs] = useState(false);

  // Cover photo state
  const coverInputRef = useRef(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Comment system state
  const { modalState, closeModal, showAlert, showConfirm } = useModal();
  const [showCommentBox, setShowCommentBox] = useState({});
  const [commentText, setCommentText] = useState({});
  const [commentGif, setCommentGif] = useState({});
  const [showGifPicker, setShowGifPicker] = useState(null);
  const [postComments, setPostComments] = useState({});
  const [commentReplies, setCommentReplies] = useState({});
  const [showReplies, setShowReplies] = useState({});
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [replyingToComment, setReplyingToComment] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyGif, setReplyGif] = useState(null);
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const commentRefs = useRef({});

  // Phase 5B: AbortController to prevent double-fetch in StrictMode
  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    const fetchGroupData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get(`/groups/${slug}`, {
          signal: abortController.signal
        });

        // Only update state if component is still mounted
        if (isMounted) {
          setGroup(response.data);

          // Posts are only returned if user is a member
          if (response.data.posts) {
            setPosts(response.data.posts);
          } else {
            setPosts([]);
          }
        }
      } catch (err) {
        // Ignore aborted requests
        if (err.name === 'AbortError' || err.name === 'CanceledError') return;

        if (isMounted) {
          console.error('Failed to fetch group:', err);
          if (err.response?.status === 404) {
            setError('Group not found');
          } else {
            setError('Failed to load group');
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchGroupData();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [slug]);

  // Refetch group data (for after join/leave actions)
  const fetchGroup = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/groups/${slug}`);
      setGroup(response.data);

      // Posts are only returned if user is a member
      if (response.data.posts) {
        setPosts(response.data.posts);
      } else {
        setPosts([]);
      }
    } catch (err) {
      console.error('Failed to fetch group:', err);
      if (err.response?.status === 404) {
        setError('Group not found');
      } else {
        setError('Failed to load group');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Phase 5A: Join group with approval-aware feedback
   * - joinMode = 'auto': Immediate join, button switches to "Leave Group"
   * - joinMode = 'approval': Request sent, button shows "Request Pending"
   */
  const handleJoin = async () => {
    if (joining) return;

    try {
      setJoining(true);
      const response = await api.post(`/groups/${slug}/join`);

      // Update state based on ACTUAL response (not optimistic)
      setGroup(prev => ({
        ...prev,
        ...response.data,
        // Use backend's isMember value - don't override!
        isMember: response.data.isMember === true,
        hasPendingRequest: response.data.hasPendingRequest === true,
        isOwner: response.data.isOwner || prev.isOwner
      }));

      // Only set posts if actually a member now
      if (response.data.isMember && response.data.posts) {
        setPosts(response.data.posts);
      }

      // Show appropriate toast based on join mode
      const groupName = response.data.name || group?.name || 'this group';
      if (response.data.hasPendingRequest) {
        showToast(`Request sent to join ${groupName}. You'll be notified when approved.`, 'info');
      } else if (response.data.isMember) {
        showToast(`You joined ${groupName}`, 'success');
      }
    } catch (err) {
      console.error('Failed to join group:', err);
      showToast(err.response?.data?.message || 'Failed to join group', 'error');
    } finally {
      setJoining(false);
    }
  };

  /**
   * Phase 2C: Leave group with instant feedback
   * - Button switches to "Join Group"
   * - Member count decrements immediately
   * - Toast notification confirms action
   */
  const handleLeave = async () => {
    if (leaving) return;

    if (!window.confirm('Are you sure you want to leave this group?')) {
      return;
    }

    try {
      setLeaving(true);
      const response = await api.post(`/groups/${slug}/leave`);

      // Update state immediately on success
      if (response.data.success || response.data.isMember === false) {
        // Use memberCount from response for accuracy, with fallback
        const newMemberCount = response.data.memberCount ?? Math.max(0, (group?.memberCount || 1) - 1);

        setGroup(prev => ({
          ...prev,
          isMember: false,
          isOwner: false,
          role: null,
          memberCount: newMemberCount
        }));
        setPosts([]); // Clear posts since no longer a member

        // Phase 2C: Toast notification for leave success
        const groupName = response.data.name || group?.name || 'this group';
        showToast(`You left ${groupName}`, 'info');
      } else {
        // Fallback: refetch
        await fetchGroup();
        showToast('Left group', 'info');
      }
    } catch (err) {
      console.error('Failed to leave group:', err);
      // Phase 2C: Show specific message for owner trying to leave
      const message = err.response?.data?.message || 'Failed to leave group';
      const isOwnerError = err.response?.data?.isOwner;
      showToast(message, isOwnerError ? 'warning' : 'error');
    } finally {
      setLeaving(false);
    }
  };

  /**
   * Handle image upload for posts
   */
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      setUploadingMedia(true);

      // Upload all files at once using post-media endpoint
      const formData = new FormData();
      files.forEach(file => formData.append('media', file));

      const response = await api.post('/upload/post-media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // post-media returns { media: [...] }
      if (response.data.media && response.data.media.length > 0) {
        const uploadedUrls = response.data.media.map(m => m.url);
        setPostMedia(prev => [...prev, ...uploadedUrls]);
      }
    } catch (err) {
      console.error('Failed to upload image:', err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingMedia(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeMedia = (index) => {
    setPostMedia(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * Phase 2: Group-only posting
   * Submit post scoped to this group via POST /api/groups/:slug/posts
   * Group posts are intentionally isolated from global feeds.
   */
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if ((!newPost.trim() && postMedia.length === 0) || posting) return;

    try {
      setPosting(true);
      const response = await api.post(`/groups/${slug}/posts`, {
        content: newPost.trim(),
        media: postMedia
      });

      if (response.data.success && response.data.post) {
        // Add new post to top of feed
        setPosts(prev => [response.data.post, ...prev]);
        setNewPost('');
        setPostMedia([]);
      }
    } catch (err) {
      console.error('Failed to create post:', err);

      // Extract more helpful error message for debugging
      let message = 'Failed to create post. Please try again.';

      if (err.response?.status === 403) {
        // CSRF or permission error
        if (err.response?.data?.code === 'CSRF_MISSING' || err.response?.data?.code === 'CSRF_MISMATCH') {
          message = 'Security token expired. Please refresh the page and try again.';
        } else if (err.response?.data?.message) {
          message = err.response.data.message;
        }
      } else if (err.response?.status === 401) {
        message = 'Your session has expired. Please log in again.';
      } else if (err.response?.status === 429) {
        message = 'Too many posts. Please wait a moment before trying again.';
      } else if (err.response?.data?.message) {
        message = err.response.data.message;
      }

      alert(message);
    } finally {
      setPosting(false);
    }
  };

  /**
   * Edit post handlers
   */
  const openEditModal = (post) => {
    setEditingPost(post);
    setEditContent(post.content || '');
    setEditMedia(post.media || []);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if ((!editContent.trim() && editMedia.length === 0) || saving || !editingPost) return;

    try {
      setSaving(true);
      const response = await api.patch(`/groups/${slug}/posts/${editingPost._id}`, {
        content: editContent.trim(),
        media: editMedia
      });

      if (response.data.success && response.data.post) {
        // Update post in local state
        setPosts(prev => prev.map(p =>
          p._id === editingPost._id ? response.data.post : p
        ));
        setEditingPost(null);
      }
    } catch (err) {
      console.error('Failed to edit post:', err);
      alert(err.response?.data?.message || 'Failed to update post');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await api.delete(`/groups/${slug}/posts/${postId}`);
      setPosts(prev => prev.filter(p => p._id !== postId));
      showToast('Post deleted', 'success');
    } catch (err) {
      console.error('Failed to delete post:', err);
      showToast(err.response?.data?.message || 'Failed to delete post', 'error');
    }
  };

  // Phase 6A: Lock a post (disable replies)
  const handleLockPost = async (postId) => {
    try {
      await api.post(`/groups/${slug}/posts/${postId}/lock`);
      setPosts(prev => prev.map(p =>
        p._id === postId ? { ...p, isLocked: true } : p
      ));
      showToast('Post locked - replies disabled', 'success');
    } catch (err) {
      console.error('Failed to lock post:', err);
      showToast(err.response?.data?.message || 'Failed to lock post', 'error');
    }
  };

  // Phase 6A: Unlock a post (enable replies)
  const handleUnlockPost = async (postId) => {
    try {
      await api.post(`/groups/${slug}/posts/${postId}/unlock`);
      setPosts(prev => prev.map(p =>
        p._id === postId ? { ...p, isLocked: false } : p
      ));
      showToast('Post unlocked - replies enabled', 'success');
    } catch (err) {
      console.error('Failed to unlock post:', err);
      showToast(err.response?.data?.message || 'Failed to unlock post', 'error');
    }
  };

  // ============================================
  // COMMENT SYSTEM FUNCTIONS
  // ============================================

  // Fetch comments for a post
  const fetchCommentsForPost = useCallback(async (postId) => {
    try {
      const response = await api.get(`/posts/${postId}/comments`);
      const comments = response.data || [];
      setPostComments(prev => ({
        ...prev,
        [postId]: comments
      }));

      // Auto-fetch replies for comments that have them
      const commentsWithReplies = comments.filter(c => c.replyCount > 0);
      if (commentsWithReplies.length > 0) {
        const replyPromises = commentsWithReplies.map(async (comment) => {
          try {
            const replyResponse = await api.get(`/comments/${comment._id}/replies`);
            return { commentId: comment._id, replies: replyResponse.data || [] };
          } catch (err) {
            console.error(`Failed to fetch replies for comment ${comment._id}:`, err);
            return { commentId: comment._id, replies: [] };
          }
        });

        const replyResults = await Promise.all(replyPromises);
        setCommentReplies(prev => {
          const updated = { ...prev };
          replyResults.forEach(({ commentId, replies }) => {
            updated[commentId] = replies;
          });
          return updated;
        });

        setShowReplies(prev => {
          const updated = { ...prev };
          commentsWithReplies.forEach(comment => {
            updated[comment._id] = true;
          });
          return updated;
        });
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  }, []);

  // Toggle comment box visibility
  const toggleCommentBox = async (postId) => {
    const isCurrentlyShown = showCommentBox[postId];
    setShowCommentBox(prev => ({
      ...prev,
      [postId]: !isCurrentlyShown
    }));

    if (!isCurrentlyShown && !postComments[postId]) {
      await fetchCommentsForPost(postId);
    }
  };

  // Handle comment submission
  const handleCommentSubmit = async (postId, e) => {
    e.preventDefault();
    const content = commentText[postId];
    const gifUrl = commentGif[postId];

    if ((!content || !content.trim()) && !gifUrl) return;

    try {
      const response = await api.post(`/posts/${postId}/comments`, {
        content: content || '',
        gifUrl: gifUrl || null,
        parentCommentId: null
      });

      // Add new comment to state
      setPostComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), response.data]
      }));

      // Update post comment count
      setPosts(prev => prev.map(p =>
        p._id === postId
          ? { ...p, commentCount: (p.commentCount || 0) + 1 }
          : p
      ));

      setCommentText(prev => ({ ...prev, [postId]: '' }));
      setCommentGif(prev => ({ ...prev, [postId]: null }));
    } catch (error) {
      console.error('Failed to create comment:', error);
      showToast('Failed to post comment', 'error');
    }
  };

  // Toggle replies visibility
  const toggleReplies = async (commentId) => {
    const isCurrentlyShown = showReplies[commentId];
    setShowReplies(prev => ({
      ...prev,
      [commentId]: !isCurrentlyShown
    }));

    if (!isCurrentlyShown && !commentReplies[commentId]) {
      try {
        const response = await api.get(`/comments/${commentId}/replies`);
        setCommentReplies(prev => ({
          ...prev,
          [commentId]: response.data
        }));
      } catch (error) {
        console.error('Failed to fetch replies:', error);
      }
    }
  };

  // Handle comment editing
  const handleEditComment = (commentId, content) => {
    setEditingCommentId(commentId);
    setEditCommentText(content);
  };

  const handleSaveEditComment = async (commentId) => {
    if (!editCommentText.trim()) return;

    try {
      const response = await api.put(`/comments/${commentId}`, {
        content: editCommentText
      });

      const updatedComment = response.data;

      setPostComments(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(postId => {
          updated[postId] = updated[postId].map(c =>
            c._id === commentId ? updatedComment : c
          );
        });
        return updated;
      });

      setCommentReplies(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(parentId => {
          updated[parentId] = updated[parentId].map(c =>
            c._id === commentId ? updatedComment : c
          );
        });
        return updated;
      });

      setEditingCommentId(null);
      setEditCommentText('');
    } catch (error) {
      console.error('Failed to edit comment:', error);
      showToast('Failed to save comment', 'error');
    }
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditCommentText('');
  };

  // Handle comment deletion
  const handleDeleteComment = async (postId, commentId, isReply = false) => {
    const confirmed = await showConfirm('Are you sure you want to delete this comment?', 'Delete Comment', 'Delete', 'Cancel');
    if (!confirmed) return;

    try {
      await api.delete(`/comments/${commentId}`);

      if (isReply) {
        setCommentReplies(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(parentId => {
            updated[parentId] = updated[parentId].filter(c => c._id !== commentId);
          });
          return updated;
        });
      } else {
        setPostComments(prev => ({
          ...prev,
          [postId]: (prev[postId] || []).filter(c => c._id !== commentId)
        }));
        setCommentReplies(prev => {
          const updated = { ...prev };
          delete updated[commentId];
          return updated;
        });
      }

      setPosts(prev => prev.map(p =>
        p._id === postId
          ? { ...p, commentCount: Math.max(0, (p.commentCount || 0) - 1) }
          : p
      ));
    } catch (error) {
      console.error('Failed to delete comment:', error);
      showToast('Failed to delete comment', 'error');
    }
  };

  // Handle comment reactions
  const handleCommentReaction = async (commentId, emoji) => {
    try {
      const response = await api.post(`/comments/${commentId}/react`, { emoji });
      const serverComment = response.data;

      setPostComments(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(postId => {
          updated[postId] = updated[postId].map(c =>
            c._id === commentId ? serverComment : c
          );
        });
        return updated;
      });

      setCommentReplies(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(parentId => {
          updated[parentId] = updated[parentId].map(c =>
            c._id === commentId ? serverComment : c
          );
        });
        return updated;
      });

      setShowReactionPicker(null);
    } catch (error) {
      console.error('Failed to react to comment:', error);
      showToast('Failed to add reaction', 'error');
    }
  };

  // Handle reply to comment
  const handleReplyToComment = (postId, commentId) => {
    setReplyingToComment({ postId, commentId });
    setReplyText('');
    setReplyGif(null);
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if ((!replyText || !replyText.trim()) && !replyGif) return;
    if (!replyingToComment) return;

    try {
      const { postId, commentId } = replyingToComment;
      const response = await api.post(`/posts/${postId}/comments`, {
        content: replyText || '',
        gifUrl: replyGif || null,
        parentCommentId: commentId
      });

      setCommentReplies(prev => ({
        ...prev,
        [commentId]: [...(prev[commentId] || []), response.data]
      }));

      setReplyingToComment(null);
      setReplyText('');
      setReplyGif(null);
      setShowReplies(prev => ({
        ...prev,
        [commentId]: true
      }));
    } catch (error) {
      console.error('Failed to reply to comment:', error);
      showToast('Failed to post reply', 'error');
    }
  };

  const handleCancelReply = () => {
    setReplyingToComment(null);
    setReplyText('');
    setReplyGif(null);
  };

  // Get user's current reaction emoji for a comment
  const getUserReactionEmoji = (reactions) => {
    if (!reactions || !currentUser) return null;
    for (const [emoji, userIds] of Object.entries(reactions)) {
      if (userIds.some(id => id?.toString() === currentUser.id?.toString())) {
        return emoji;
      }
    }
    return null;
  };

  // Phase 4A: Fetch member list for moderation
  const fetchMembers = async () => {
    try {
      setLoadingMembers(true);
      const response = await api.get(`/groups/${slug}/members`);
      setMembers(response.data.members || []);
      setModerators(response.data.moderators || []);
      // Phase 6A: Extract muted member IDs
      const mutedIds = (response.data.mutedMembers || []).map(m => m.user || m);
      setMutedMembers(mutedIds);
    } catch (err) {
      console.error('Failed to fetch members:', err);
      showToast('Failed to load members', 'error');
    } finally {
      setLoadingMembers(false);
    }
  };

  const openMemberModal = () => {
    setShowMemberModal(true);
    fetchMembers();
  };

  // Phase 4A: Remove a member (owner/moderator only)
  const handleRemoveMember = async (userId, displayName) => {
    if (!confirm(`Remove ${displayName} from this group?`)) return;

    try {
      setActionInProgress(userId);
      await api.post(`/groups/${slug}/remove-member`, { userId });
      setMembers(prev => prev.filter(m => m._id !== userId));
      setModerators(prev => prev.filter(m => m._id !== userId));
      setGroup(prev => ({ ...prev, memberCount: (prev.memberCount || 1) - 1 }));
      showToast(`${displayName} removed from group`, 'success');
    } catch (err) {
      console.error('Failed to remove member:', err);
      showToast(err.response?.data?.message || 'Failed to remove member', 'error');
    } finally {
      setActionInProgress(null);
    }
  };

  // Phase 4A: Promote to moderator (owner only)
  const handlePromoteModerator = async (userId, displayName) => {
    if (!confirm(`Promote ${displayName} to moderator?`)) return;

    try {
      setActionInProgress(userId);
      await api.post(`/groups/${slug}/promote-moderator`, { userId });
      // Move from members to moderators
      const member = members.find(m => m._id === userId);
      if (member) {
        setMembers(prev => prev.filter(m => m._id !== userId));
        setModerators(prev => [...prev, member]);
      }
      showToast(`${displayName} is now a moderator`, 'success');
    } catch (err) {
      console.error('Failed to promote moderator:', err);
      showToast(err.response?.data?.message || 'Failed to promote', 'error');
    } finally {
      setActionInProgress(null);
    }
  };

  // Phase 4A: Demote from moderator (owner only)
  const handleDemoteModerator = async (userId, displayName) => {
    if (!confirm(`Remove moderator role from ${displayName}?`)) return;

    try {
      setActionInProgress(userId);
      await api.post(`/groups/${slug}/demote-moderator`, { userId });
      // Move from moderators to members
      const moderator = moderators.find(m => m._id === userId);
      if (moderator) {
        setModerators(prev => prev.filter(m => m._id !== userId));
        setMembers(prev => [...prev, moderator]);
      }
      showToast(`${displayName} is now a regular member`, 'success');
    } catch (err) {
      console.error('Failed to demote moderator:', err);
      showToast(err.response?.data?.message || 'Failed to demote', 'error');
    } finally {
      setActionInProgress(null);
    }
  };

  // Phase 6A: Mute a member (owner/moderator only)
  const handleMuteMember = async (userId, displayName) => {
    try {
      setActionInProgress(userId);
      await api.post(`/groups/${slug}/mute-member`, { userId });
      setMutedMembers(prev => [...prev, userId]);
      showToast(`${displayName} has been muted`, 'success');
    } catch (err) {
      console.error('Failed to mute member:', err);
      showToast(err.response?.data?.message || 'Failed to mute member', 'error');
    } finally {
      setActionInProgress(null);
    }
  };

  // Phase 6A: Unmute a member (owner/moderator only)
  const handleUnmuteMember = async (userId, displayName) => {
    try {
      setActionInProgress(userId);
      await api.post(`/groups/${slug}/unmute-member`, { userId });
      setMutedMembers(prev => prev.filter(id => id !== userId));
      showToast(`${displayName} has been unmuted`, 'success');
    } catch (err) {
      console.error('Failed to unmute member:', err);
      showToast(err.response?.data?.message || 'Failed to unmute member', 'error');
    } finally {
      setActionInProgress(null);
    }
  };

  // Phase 6A: Fetch moderation log
  const fetchModLogs = async () => {
    try {
      setLoadingModLogs(true);
      const response = await api.get(`/groups/${slug}/moderation-log?limit=50`);
      setModLogs(response.data.logs || []);
    } catch (err) {
      console.error('Failed to fetch moderation log:', err);
      showToast('Failed to load moderation log', 'error');
    } finally {
      setLoadingModLogs(false);
    }
  };

  const openModLog = () => {
    setShowModLog(true);
    fetchModLogs();
  };

  // Cover photo handlers
  const handleCoverPhotoUpload = async (file) => {
    if (!file) return;

    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append('coverPhoto', file);

      const response = await api.post(`/groups/${slug}/cover-photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setGroup(prev => ({ ...prev, coverPhoto: response.data.coverPhoto }));
      showToast('Cover photo updated!', 'success');
    } catch (err) {
      console.error('Failed to upload cover photo:', err);
      showToast(err.response?.data?.message || 'Failed to upload cover photo', 'error');
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) {
        coverInputRef.current.value = '';
      }
    }
  };

  const handleCoverPhotoRemove = async () => {
    if (!confirm('Remove the cover photo?')) return;

    setUploadingCover(true);
    try {
      await api.delete(`/groups/${slug}/cover-photo`);
      setGroup(prev => ({ ...prev, coverPhoto: null }));
      showToast('Cover photo removed', 'success');
    } catch (err) {
      console.error('Failed to remove cover photo:', err);
      showToast(err.response?.data?.message || 'Failed to remove cover photo', 'error');
    } finally {
      setUploadingCover(false);
    }
  };

  // Phase 4B: Fetch notification settings for this group
  const fetchNotificationSettings = async () => {
    try {
      setLoadingNotificationSettings(true);
      const response = await api.get(`/groups/${slug}/notification-settings`);
      if (response.data.settings) {
        setNotificationSettings(response.data.settings);
      }
    } catch (err) {
      console.error('Failed to fetch notification settings:', err);
    } finally {
      setLoadingNotificationSettings(false);
    }
  };

  // Phase 4B: Open notification settings panel
  const openNotificationSettings = () => {
    setShowNotificationSettings(true);
    fetchNotificationSettings();
  };

  // Phase 4B: Update a notification setting
  const handleNotificationToggle = async (setting, value) => {
    try {
      setSavingNotificationSettings(true);
      const newSettings = { ...notificationSettings, [setting]: value };

      await api.put(`/groups/${slug}/notification-settings`, newSettings);
      setNotificationSettings(newSettings);

      // Calm feedback
      const message = value
        ? `You'll receive ${setting === 'notifyOnNewPost' ? 'new post' : 'mention'} updates`
        : `${setting === 'notifyOnNewPost' ? 'New post' : 'Mention'} updates turned off`;
      showToast(message, 'success');
    } catch (err) {
      console.error('Failed to update notification settings:', err);
      showToast('Failed to update settings', 'error');
    } finally {
      setSavingNotificationSettings(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <Navbar onMenuClick={onMenuOpen} />
        <div className="group-container">
          <div className="loading">Loading group...</div>
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="page-container">
        <Navbar onMenuClick={onMenuOpen} />
        <div className="group-container">
          <div className="error">{error || 'Group not found'}</div>
        </div>
      </div>
    );
  }

  // Phase 2C: Use role info from API response, with fallback to local check
  const isOwner = group.isOwner || group.owner?._id === currentUser?.id;
  const isModerator = group.isModerator || group.moderators?.some(m => m._id === currentUser?.id);

  return (
    <div className="page-container">
      <Navbar onMenuClick={onMenuOpen} />
      <div className="group-container">
        {/* Group Header - Always visible */}
        <div
          className={`group-header glossy ${group.coverPhoto ? 'has-cover' : ''}`}
          style={group.coverPhoto ? { backgroundImage: `url(${getImageUrl(group.coverPhoto)})` } : {}}
        >
          {/* Cover photo overlay for readability */}
          {group.coverPhoto && <div className="cover-overlay" />}

          {/* Hidden file input for cover upload */}
          {isOwner && (
            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => handleCoverPhotoUpload(e.target.files?.[0])}
              style={{ display: 'none' }}
              aria-label="Upload cover photo"
            />
          )}

          {/* Cover photo edit controls (owner only) */}
          {isOwner && (
            <div className="cover-controls">
              <button
                className="cover-edit-btn"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
                aria-label={group.coverPhoto ? 'Change cover photo' : 'Add cover photo'}
              >
                {uploadingCover ? '⏳' : '📷'} {group.coverPhoto ? 'Change Cover' : 'Add Cover'}
              </button>
              {group.coverPhoto && (
                <button
                  className="cover-remove-btn"
                  onClick={handleCoverPhotoRemove}
                  disabled={uploadingCover}
                  aria-label="Remove cover photo"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          <div className="group-header-body">
            <div className="group-icon">👥</div>
            <h1>{group.name}</h1>
            <p className="group-description">{group.description}</p>
            <div className="group-stats">
              <span>{group.memberCount} member{group.memberCount !== 1 ? 's' : ''}</span>
              {group.visibility === 'private' && <span className="visibility-badge">🔒 Private</span>}
            </div>
          </div>

          {/* Phase 5A: Role badge + Join/Leave CTA (approval-aware) */}
          <div className="group-actions" role="group" aria-label="Group membership actions">
            {group.hasPendingRequest ? (
              /* Pending request state - user waiting for approval */
              <button
                className="btn-pending"
                disabled
                aria-label="Your join request is pending approval"
              >
                <span aria-hidden="true">⏳</span> Request Pending
              </button>
            ) : !group.isMember ? (
              <button
                className="btn-join"
                onClick={handleJoin}
                disabled={joining}
                aria-label={joining ? 'Joining group...' : `Join ${group.name}`}
                aria-busy={joining}
              >
                <span aria-hidden="true">✨</span> {joining ? 'Joining...' : 'Join Group'}
              </button>
            ) : isOwner ? (
              <>
                <span className="ownership-badge" role="status" aria-label="You are the owner of this group">
                  <span aria-hidden="true">👑</span> Owner
                </span>
                <button
                  className="btn-manage-members"
                  onClick={openMemberModal}
                  aria-label="Manage group members"
                >
                  Manage Members
                </button>
                <button
                  className="btn-mod-log"
                  onClick={openModLog}
                  aria-label="View moderation log"
                >
                  📋 Mod Log
                </button>
              </>
            ) : isModerator ? (
              <>
                <span className="role-badge moderator" role="status" aria-label="You are a moderator of this group">
                  <span aria-hidden="true">🛡️</span> Moderator
                </span>
                <button
                  className="btn-manage-members"
                  onClick={openMemberModal}
                  aria-label="View group members"
                >
                  Members
                </button>
                <button
                  className="btn-mod-log"
                  onClick={openModLog}
                  aria-label="View moderation log"
                >
                  📋 Mod Log
                </button>
                <button
                  className="btn-leave"
                  onClick={handleLeave}
                  disabled={leaving}
                  aria-label={leaving ? 'Leaving group...' : `Leave ${group.name}`}
                  aria-busy={leaving}
                >
                  {leaving ? 'Leaving...' : 'Leave Group'}
                </button>
              </>
            ) : (
              <>
                <span className="role-badge member" role="status" aria-label="You are a member of this group">
                  <span aria-hidden="true">✓</span> Member
                </span>
                <button
                  className="btn-leave"
                  onClick={handleLeave}
                  disabled={leaving}
                  aria-label={leaving ? 'Leaving group...' : `Leave ${group.name}`}
                  aria-busy={leaving}
                >
                  {leaving ? 'Leaving...' : 'Leave Group'}
                </button>
              </>
            )}

            {/* Phase 4B: Notification settings button (members only) */}
            {group.isMember && (
              <button
                className="btn-notification-settings"
                onClick={openNotificationSettings}
                title="Notification preferences"
              >
                🔔
              </button>
            )}
          </div>
        </div>

        {/* Phase 5A: Non-member / pending request message */}
        {!group.isMember && (
          <div className="join-prompt glossy">
            {group.hasPendingRequest ? (
              <p>⏳ Your request to join is pending. The group owner will review it soon.</p>
            ) : group.visibility === 'private' ? (
              <p>🔒 This is a private group — join to see posts and participate.</p>
            ) : group.joinMode === 'approval' ? (
              <p>This group requires approval to join. Request access to see posts and participate.</p>
            ) : (
              <p>Join this group to see posts and participate in discussions.</p>
            )}
          </div>
        )}

        {/* Member-only content */}
        {group.isMember && (
          <>
            {/* Phase 2: Group Post Composer */}
            <div className="group-composer glossy">
              <h2 className="section-title">✨ Posting to {group.name}</h2>
              <form onSubmit={handlePostSubmit}>
                <textarea
                  value={newPost}
                  onChange={(e) => {
                    const el = e.target;
                    el.style.height = 'auto';
                    el.style.height = el.scrollHeight + 'px';
                    setNewPost(el.value);
                  }}
                  placeholder={`What would you like to share with ${group.name}?`}
                  className="post-input"
                  rows="1"
                  style={{ overflow: 'hidden', resize: 'none' }}
                  disabled={posting || uploadingMedia}
                />

                {/* Image previews */}
                {postMedia.length > 0 && (
                  <div className="media-preview-grid">
                    {postMedia.map((url, index) => (
                      <div key={index} className="media-preview-item">
                        <OptimizedImage src={getImageUrl(url)} alt="Upload preview" />
                        <button
                          type="button"
                          className="remove-media-btn"
                          onClick={() => removeMedia(index)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="composer-actions">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    className="btn-add-image"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={posting || uploadingMedia}
                    title="Add image"
                  >
                    {uploadingMedia ? '⏳' : '📷'}
                  </button>
                  <button
                    type="submit"
                    disabled={posting || uploadingMedia || (!newPost.trim() && postMedia.length === 0)}
                    className="btn-post"
                  >
                    {posting ? 'Posting...' : 'Post ✨'}
                  </button>
                </div>
              </form>
            </div>

            {/* Phase 2: Group Posts Feed */}
            <div className="group-posts">
              {posts.length === 0 ? (
                <div className="empty-state glossy">
                  <p>This group is ready when you are.</p>
                  <p className="empty-hint">Share what's on your mind to get the conversation started.</p>
                </div>
              ) : (
                posts.map(post => {
                  const isAuthor = post.author?._id === currentUser?.id;
                  // Phase 4A: Owner and moderators can delete any post
                  const canDelete = isAuthor || isOwner || isModerator;

                  return (
                    <div key={post._id} className="post-card glossy">
                      <PostHeader
                        author={post.author}
                        createdAt={post.createdAt}
                        visibility="group"
                        edited={post.edited}
                      >
                        {/* Post actions (edit/delete) */}
                        {(isAuthor || canDelete) && (
                          <div className="post-actions">
                            {isAuthor && (
                              <button
                                className="btn-edit-post"
                                onClick={() => openEditModal(post)}
                                title="Edit post"
                              >
                                ✏️
                              </button>
                            )}
                            {canDelete && (
                              <button
                                className="btn-delete-post"
                                onClick={() => handleDeletePost(post._id)}
                                title="Delete post"
                              >
                                🗑️
                              </button>
                            )}
                            {/* Phase 6A: Lock/Unlock button for moderators */}
                            {(isOwner || isModerator) && (
                              post.isLocked ? (
                                <button
                                  className="btn-unlock-post"
                                  onClick={() => handleUnlockPost(post._id)}
                                  title="Unlock post (enable replies)"
                                >
                                  🔓
                                </button>
                              ) : (
                                <button
                                  className="btn-lock-post"
                                  onClick={() => handleLockPost(post._id)}
                                  title="Lock post (disable replies)"
                                >
                                  🔒
                                </button>
                              )
                            )}
                          </div>
                        )}
                      </PostHeader>

                      {/* Phase 6A: Locked post indicator */}
                      {post.isLocked && (
                        <div className="post-locked-badge">🔒 Replies disabled</div>
                      )}

                      <div className="post-content">
                        {post.content && (
                          <p><FormattedText text={post.content} /></p>
                        )}

                        {/* Display post media */}
                        {post.media && post.media.length > 0 && (
                          <div className="post-media-grid">
                            {post.media.map((url, index) => (
                              <OptimizedImage
                                key={index}
                                src={getImageUrl(url)}
                                alt="Post media"
                                className="post-media-image"
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Comment/Reply Section */}
                      {!post.isLocked && (
                        <div className="post-actions-bar">
                          <button
                            className="action-btn subtle"
                            onClick={() => toggleCommentBox(post._id)}
                            title="Reply to this post"
                          >
                            <span>💬</span>
                            <span className="action-text">
                              Reply {post.commentCount > 0 && `(${post.commentCount})`}
                            </span>
                          </button>
                        </div>
                      )}

                      {/* Comments Section */}
                      {postComments[post._id] && postComments[post._id].length > 0 && (
                        <div className="post-comments">
                          {postComments[post._id]
                            .filter(comment => comment.parentCommentId === null || comment.parentCommentId === undefined)
                            .map((comment) => (
                              <CommentThread
                                key={comment._id}
                                comment={comment}
                                replies={commentReplies[comment._id] || []}
                                currentUser={currentUser}
                                postId={post._id}
                                showReplies={showReplies}
                                editingCommentId={editingCommentId}
                                editCommentText={editCommentText}
                                showReactionPicker={showReactionPicker}
                                commentRefs={commentRefs}
                                getUserReactionEmoji={getUserReactionEmoji}
                                handleEditComment={handleEditComment}
                                handleSaveEditComment={handleSaveEditComment}
                                handleCancelEditComment={handleCancelEditComment}
                                handleDeleteComment={handleDeleteComment}
                                handleCommentReaction={handleCommentReaction}
                                toggleReplies={toggleReplies}
                                handleReplyToComment={handleReplyToComment}
                                setShowReactionPicker={setShowReactionPicker}
                              />
                            ))}
                        </div>
                      )}

                      {/* Reply Input Box */}
                      {replyingToComment?.postId === post._id && (
                        <form onSubmit={handleSubmitReply} className="reply-input-box">
                          <div className="reply-input-wrapper">
                            <input
                              type="text"
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Write a reply..."
                              className="reply-input"
                              autoFocus
                            />
                            <button type="button" onClick={handleCancelReply} className="btn-cancel-reply">
                              ✕
                            </button>
                            <button type="submit" className="reply-submit-btn" disabled={!replyText?.trim() && !replyGif}>
                              ➤
                            </button>
                          </div>
                        </form>
                      )}

                      {/* Comment Input Box */}
                      {showCommentBox[post._id] && (
                        <form onSubmit={(e) => handleCommentSubmit(post._id, e)} className="comment-input-box">
                          <div className="comment-input-wrapper">
                            <input
                              type="text"
                              value={commentText[post._id] || ''}
                              onChange={(e) => setCommentText(prev => ({ ...prev, [post._id]: e.target.value }))}
                              placeholder="Write a comment..."
                              className="comment-input"
                            />
                            <button
                              type="button"
                              onClick={() => setShowGifPicker(showGifPicker === `comment-${post._id}` ? null : `comment-${post._id}`)}
                              className="btn-gif"
                              title="Add GIF"
                            >
                              GIF
                            </button>
                            <button type="submit" className="comment-submit-btn" disabled={!commentText[post._id]?.trim() && !commentGif[post._id]}>
                              ➤
                            </button>
                          </div>
                          {commentGif[post._id] && (
                            <div className="comment-gif-preview">
                              <img src={commentGif[post._id]} alt="Selected GIF" />
                              <button
                                type="button"
                                className="btn-remove-gif"
                                onClick={() => setCommentGif(prev => ({ ...prev, [post._id]: null }))}
                              >
                                ✕
                              </button>
                            </div>
                          )}
                          {showGifPicker === `comment-${post._id}` && (
                            <GifPicker
                              onGifSelect={(gifUrl) => {
                                setCommentGif(prev => ({ ...prev, [post._id]: gifUrl }));
                                setShowGifPicker(null);
                              }}
                              onClose={() => setShowGifPicker(null)}
                            />
                          )}
                        </form>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* Edit Post Modal */}
        {editingPost && (
          <div className="modal-overlay" onClick={() => setEditingPost(null)}>
            <div className="edit-post-modal glossy" onClick={e => e.stopPropagation()}>
              <h2>Edit Post</h2>
              <form onSubmit={handleEditSubmit}>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="What's on your mind?"
                  rows={4}
                  disabled={saving}
                />

                {/* Edit media preview */}
                {editMedia.length > 0 && (
                  <div className="media-preview-grid">
                    {editMedia.map((url, index) => (
                      <div key={index} className="media-preview-item">
                        <OptimizedImage src={getImageUrl(url)} alt="Media preview" />
                        <button
                          type="button"
                          className="remove-media-btn"
                          onClick={() => setEditMedia(prev => prev.filter((_, i) => i !== index))}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="modal-buttons">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setEditingPost(null)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={saving || (!editContent.trim() && editMedia.length === 0)}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Phase 4A: Member Management Modal */}
        {showMemberModal && (
          <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
            <div className="member-modal glossy" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Members</h2>
                <button className="btn-close" onClick={() => setShowMemberModal(false)}>✕</button>
              </div>

              {loadingMembers ? (
                <div className="loading-members">Loading members...</div>
              ) : (
                <div className="member-list">
                  {/* Owner (always first) */}
                  {group.owner && (
                    <div className="member-item owner">
                      <div className="member-avatar">
                        {group.owner.profilePhoto ? (
                          <OptimizedImage
                            src={getImageUrl(group.owner.profilePhoto)}
                            alt={group.owner.username}
                            className="avatar-image"
                          />
                        ) : (
                          <span className="avatar-fallback">
                            {group.owner.displayName?.charAt(0) || group.owner.username?.charAt(0) || 'O'}
                          </span>
                        )}
                      </div>
                      <div className="member-info">
                        <span className="member-name">{group.owner.displayName || group.owner.username}</span>
                        <span className="member-role">👑 Owner</span>
                      </div>
                    </div>
                  )}

                  {/* Moderators */}
                  {moderators.map(mod => (
                    <div key={mod._id} className="member-item moderator">
                      <div className="member-avatar">
                        {mod.profilePhoto ? (
                          <OptimizedImage src={getImageUrl(mod.profilePhoto)} alt={mod.username} className="avatar-image" />
                        ) : (
                          <span className="avatar-fallback">{mod.displayName?.charAt(0) || mod.username?.charAt(0) || 'M'}</span>
                        )}
                      </div>
                      <div className="member-info">
                        <span className="member-name">{mod.displayName || mod.username}</span>
                        <span className="member-role">🛡️ Moderator</span>
                      </div>
                      {isOwner && (
                        <div className="member-actions">
                          <button
                            className="btn-demote"
                            onClick={() => handleDemoteModerator(mod._id, mod.displayName || mod.username)}
                            disabled={actionInProgress === mod._id}
                            title="Demote to member"
                          >
                            {actionInProgress === mod._id ? '...' : '↓'}
                          </button>
                          <button
                            className="btn-remove"
                            onClick={() => handleRemoveMember(mod._id, mod.displayName || mod.username)}
                            disabled={actionInProgress === mod._id}
                            title="Remove from group"
                          >
                            {actionInProgress === mod._id ? '...' : '✕'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Regular Members */}
                  {members.map(member => (
                    <div key={member._id} className="member-item">
                      <div className="member-avatar">
                        {member.profilePhoto ? (
                          <OptimizedImage src={getImageUrl(member.profilePhoto)} alt={member.username} className="avatar-image" />
                        ) : (
                          <span className="avatar-fallback">{member.displayName?.charAt(0) || member.username?.charAt(0) || 'U'}</span>
                        )}
                      </div>
                      <div className="member-info">
                        <span className="member-name">{member.displayName || member.username}</span>
                        <span className="member-role">
                          {mutedMembers.includes(member._id) ? '🔇 Muted' : 'Member'}
                        </span>
                      </div>
                      {(isOwner || isModerator) && (
                        <div className="member-actions">
                          {isOwner && (
                            <button
                              className="btn-promote"
                              onClick={() => handlePromoteModerator(member._id, member.displayName || member.username)}
                              disabled={actionInProgress === member._id}
                              title="Promote to moderator"
                            >
                              {actionInProgress === member._id ? '...' : '↑'}
                            </button>
                          )}
                          {/* Phase 6A: Mute/Unmute button */}
                          {mutedMembers.includes(member._id) ? (
                            <button
                              className="btn-unmute"
                              onClick={() => handleUnmuteMember(member._id, member.displayName || member.username)}
                              disabled={actionInProgress === member._id}
                              title="Unmute member"
                            >
                              {actionInProgress === member._id ? '...' : '🔊'}
                            </button>
                          ) : (
                            <button
                              className="btn-mute"
                              onClick={() => handleMuteMember(member._id, member.displayName || member.username)}
                              disabled={actionInProgress === member._id}
                              title="Mute member"
                            >
                              {actionInProgress === member._id ? '...' : '🔇'}
                            </button>
                          )}
                          <button
                            className="btn-remove"
                            onClick={() => handleRemoveMember(member._id, member.displayName || member.username)}
                            disabled={actionInProgress === member._id}
                            title="Remove from group"
                          >
                            {actionInProgress === member._id ? '...' : '✕'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {members.length === 0 && moderators.length === 0 && (
                    <p className="no-members">No other members yet.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Phase 6A: Moderation Log Modal */}
        {showModLog && (
          <div className="modal-overlay" onClick={() => setShowModLog(false)}>
            <div className="mod-log-modal glossy" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>📋 Moderation Log</h2>
                <button className="btn-close" onClick={() => setShowModLog(false)}>✕</button>
              </div>

              {loadingModLogs ? (
                <div className="loading-members">Loading log...</div>
              ) : modLogs.length === 0 ? (
                <div className="no-logs">
                  <p>No moderation actions recorded yet.</p>
                  <p className="log-privacy-note">This log is private and only visible to owner and moderators.</p>
                </div>
              ) : (
                <div className="mod-log-list">
                  <p className="log-privacy-note">🔒 Private - only visible to owner and moderators</p>
                  {modLogs.map(log => (
                    <div key={log._id} className="log-entry">
                      <div className="log-action">
                        {log.action === 'member_removed' && '👋'}
                        {log.action === 'member_muted' && '🔇'}
                        {log.action === 'member_unmuted' && '🔊'}
                        {log.action === 'member_blocked' && '🚫'}
                        {log.action === 'member_unblocked' && '✅'}
                        {log.action === 'post_locked' && '🔒'}
                        {log.action === 'post_unlocked' && '🔓'}
                        {log.action === 'post_deleted' && '🗑️'}
                        {log.action === 'join_approved' && '✓'}
                        {log.action === 'join_declined' && '✗'}
                        {log.action === 'moderator_promoted' && '⬆️'}
                        {log.action === 'moderator_demoted' && '⬇️'}
                        {' '}
                        {log.action.replace(/_/g, ' ')}
                      </div>
                      <div className="log-details">
                        <span className="log-actor">{log.actor?.displayName || log.actor?.username || 'Unknown'}</span>
                        {log.targetUser && (
                          <span className="log-target">→ {log.targetUser?.displayName || log.targetUser?.username}</span>
                        )}
                      </div>
                      <div className="log-time">
                        {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Phase 4B: Notification Settings Modal */}
        {showNotificationSettings && (
          <div className="modal-overlay" onClick={() => setShowNotificationSettings(false)}>
            <div className="notification-settings-modal glossy" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Updates</h2>
                <button className="btn-close" onClick={() => setShowNotificationSettings(false)}>✕</button>
              </div>

              {loadingNotificationSettings ? (
                <div className="loading-settings">Loading preferences...</div>
              ) : (
                <div className="notification-options">
                  <p className="settings-intro">
                    Choose what you'd like to hear about. All updates are optional.
                  </p>

                  <label className="notification-toggle">
                    <input
                      type="checkbox"
                      checked={notificationSettings.notifyOnNewPost}
                      onChange={(e) => handleNotificationToggle('notifyOnNewPost', e.target.checked)}
                      disabled={savingNotificationSettings}
                    />
                    <span className="toggle-label">
                      <span className="toggle-icon">📝</span>
                      <span className="toggle-text">
                        <strong>New posts</strong>
                        <small>Get notified when someone posts in this group</small>
                      </span>
                    </span>
                  </label>

                  <label className="notification-toggle">
                    <input
                      type="checkbox"
                      checked={notificationSettings.notifyOnMention}
                      onChange={(e) => handleNotificationToggle('notifyOnMention', e.target.checked)}
                      disabled={savingNotificationSettings}
                    />
                    <span className="toggle-label">
                      <span className="toggle-icon">💬</span>
                      <span className="toggle-text">
                        <strong>Mentions</strong>
                        <small>Get notified when someone @mentions you</small>
                      </span>
                    </span>
                  </label>

                  <p className="settings-note">
                    These preferences only apply to this group. Quiet Mode will pause all updates.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Phase 2C: Toast Notifications */}
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default Groups;

