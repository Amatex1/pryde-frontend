/**
 * GroupDetailController - Orchestrates the group detail page
 *
 * ARCHITECTURE RULE:
 * This file must not contain viewport or device detection logic.
 * Layout decisions belong exclusively in /layouts.
 * Enforced by ESLint: no-restricted-properties, no-restricted-globals
 *
 * RESPONSIBILITIES:
 * - Data fetching and state management
 * - API calls for group operations
 * - Coordinates GroupHeader, GroupFeed, GroupSidebar
 * - Handles modals (members, notifications, mod log)
 *
 * RULES:
 * - NO viewport detection (window.innerWidth, matchMedia)
 * - NO layout logic (widths, grids, media queries)
 * - Passes data and handlers to child components
 * - Layout is handled by PageLayout/GroupsLayout
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GroupHeader from './GroupHeader';
import GroupFeed from './GroupFeed';
import GroupSidebar from './GroupSidebar';
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import api from '../../utils/api';
import { getCurrentUser } from '../../utils/auth';
import './GroupDetailController.css';

export default function GroupDetailController() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const { toasts, showToast, removeToast } = useToast();

  // Core state
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Membership state
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Composer state
  const [newPost, setNewPost] = useState('');
  const [postMedia, setPostMedia] = useState([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [posting, setPosting] = useState(false);

  // Edit state
  const [editingPost, setEditingPost] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editMedia, setEditMedia] = useState([]);
  const [saving, setSaving] = useState(false);

  // Member management state
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [members, setMembers] = useState([]);
  const [moderators, setModerators] = useState([]);
  const [mutedMembers, setMutedMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Notification settings state
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    notifyOnNewPost: false,
    notifyOnMention: true
  });

  // Mod log state
  const [showModLog, setShowModLog] = useState(false);
  const [modLogs, setModLogs] = useState([]);
  const [loadingModLogs, setLoadingModLogs] = useState(false);

  // Settings modal state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    description: '',
    visibility: 'listed',
    joinMode: 'approval'
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Derived permissions
  const isOwner = group?.owner === currentUser?._id || group?.owner?._id === currentUser?._id;
  const isModerator = group?.moderators?.some(m => 
    (typeof m === 'string' ? m : m._id) === currentUser?._id
  );
  const isMember = group?.isMember || isOwner || isModerator;
  const hasPendingRequest = group?.hasPendingRequest;
  const isMuted = mutedMembers.includes(currentUser?._id);

  // Fetch group data
  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    const fetchGroupData = async () => {
      try {
        setLoading(true);
        setError(null);

        const groupResponse = await api.get(`/groups/${slug}`, {
          signal: abortController.signal
        });

        if (!isMounted) return;
        setGroup(groupResponse.data);

        // Fetch posts if member
        if (groupResponse.data.isMember) {
          const postsResponse = await api.get(`/groups/${slug}/posts`, {
            signal: abortController.signal
          });
          if (isMounted) {
            setPosts(postsResponse.data.posts || []);
          }
        }
      } catch (err) {
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
        if (isMounted) setLoading(false);
      }
    };

    fetchGroupData();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [slug]);

  // Join group handler
  const handleJoin = async () => {
    try {
      setJoining(true);
      const response = await api.post(`/groups/${slug}/join`);

      // Check if this is a pending request (approval-based group)
      if (response.data.hasPendingRequest && !response.data.isMember) {
        setGroup(prev => ({ ...prev, hasPendingRequest: true, isMember: false }));
        showToast(response.data.message || 'Join request sent! Waiting for approval.', 'success');
      } else if (response.data.isMember) {
        // Immediate join (auto-join group)
        setGroup(prev => ({
          ...prev,
          isMember: true,
          hasPendingRequest: false,
          memberCount: response.data.memberCount || (prev.memberCount || 0) + 1
        }));
        showToast(response.data.message || 'Welcome to the group!', 'success');

        // Fetch posts now that we're a member
        const postsResponse = await api.get(`/groups/${slug}/posts`);
        setPosts(postsResponse.data.posts || []);
      } else {
        // Fallback - show message from server
        showToast(response.data.message || 'Request processed', 'success');
      }
    } catch (err) {
      console.error('Failed to join group:', err);
      showToast(err.response?.data?.message || 'Failed to join group', 'error');
    } finally {
      setJoining(false);
    }
  };

  // Leave group handler
  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this group?')) return;

    try {
      setLeaving(true);
      await api.post(`/groups/${slug}/leave`);
      setGroup(prev => ({
        ...prev,
        isMember: false,
        memberCount: Math.max(0, (prev.memberCount || 1) - 1)
      }));
      setPosts([]);
      showToast('You have left the group', 'success');
    } catch (err) {
      console.error('Failed to leave group:', err);
      showToast(err.response?.data?.message || 'Failed to leave group', 'error');
    } finally {
      setLeaving(false);
    }
  };

  // Post handlers
  const handleSubmitPost = async () => {
    if (!newPost.trim() && postMedia.length === 0) return;

    try {
      setPosting(true);
      const response = await api.post(`/groups/${slug}/posts`, {
        content: newPost,
        media: postMedia.map(m => ({ url: m.url, type: m.type }))
      });
      setPosts(prev => [response.data.post, ...prev]);
      setNewPost('');
      setPostMedia([]);
      showToast('Post created!', 'success');
    } catch (err) {
      console.error('Failed to create post:', err);
      showToast(err.response?.data?.message || 'Failed to create post', 'error');
    } finally {
      setPosting(false);
    }
  };

  const handleMediaSelect = async (files) => {
    if (!files || files.length === 0) return;

    try {
      setUploadingMedia(true);
      const formData = new FormData();
      Array.from(files).forEach(file => formData.append('media', file));

      const response = await api.post('/upload/media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setPostMedia(prev => [...prev, ...response.data.files]);
    } catch (err) {
      console.error('Failed to upload media:', err);
      showToast('Failed to upload media', 'error');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleRemoveMedia = (index) => {
    setPostMedia(prev => prev.filter((_, i) => i !== index));
  };

  // Edit handlers
  const handleEditPost = (post) => {
    setEditingPost(post._id);
    setEditContent(post.content);
    setEditMedia(post.media || []);
  };

  const handleSaveEdit = async () => {
    try {
      setSaving(true);
      const response = await api.patch(`/posts/${editingPost}`, {
        content: editContent,
        media: editMedia.map(m => ({ url: m.url, type: m.type }))
      });
      setPosts(prev => prev.map(p =>
        p._id === editingPost ? response.data.post : p
      ));
      setEditingPost(null);
      setEditContent('');
      setEditMedia([]);
      showToast('Post updated!', 'success');
    } catch (err) {
      console.error('Failed to update post:', err);
      showToast(err.response?.data?.message || 'Failed to update post', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
    setEditContent('');
    setEditMedia([]);
  };

  // Delete handler
  const handleDeletePost = async (postId) => {
    if (!confirm('Delete this post?')) return;

    try {
      await api.delete(`/posts/${postId}`);
      setPosts(prev => prev.filter(p => p._id !== postId));
      showToast('Post deleted', 'success');
    } catch (err) {
      console.error('Failed to delete post:', err);
      showToast(err.response?.data?.message || 'Failed to delete post', 'error');
    }
  };

  // Lock/unlock handlers
  const handleLockPost = async (postId) => {
    try {
      await api.post(`/posts/${postId}/lock`);
      setPosts(prev => prev.map(p =>
        p._id === postId ? { ...p, isLocked: true } : p
      ));
      showToast('Post locked - replies disabled', 'success');
    } catch (err) {
      console.error('Failed to lock post:', err);
      showToast(err.response?.data?.message || 'Failed to lock post', 'error');
    }
  };

  const handleUnlockPost = async (postId) => {
    try {
      await api.post(`/posts/${postId}/unlock`);
      setPosts(prev => prev.map(p =>
        p._id === postId ? { ...p, isLocked: false } : p
      ));
      showToast('Post unlocked - replies enabled', 'success');
    } catch (err) {
      console.error('Failed to unlock post:', err);
      showToast(err.response?.data?.message || 'Failed to unlock post', 'error');
    }
  };

  // Member management
  const fetchMembers = async () => {
    try {
      setLoadingMembers(true);
      const response = await api.get(`/groups/${slug}/members`);
      setMembers(response.data.members || []);
      setModerators(response.data.moderators || []);
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

  // Mod log
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
    }
  };

  const handleCoverPhotoRemove = async () => {
    if (!confirm('Remove the cover photo?')) return;

    try {
      await api.delete(`/groups/${slug}/cover-photo`);
      setGroup(prev => ({ ...prev, coverPhoto: null }));
      showToast('Cover photo removed', 'success');
    } catch (err) {
      console.error('Failed to remove cover photo:', err);
      showToast(err.response?.data?.message || 'Failed to remove cover photo', 'error');
    }
  };

  // Settings modal handlers
  const openSettingsModal = () => {
    if (group) {
      setSettingsForm({
        name: group.name || '',
        description: group.description || '',
        visibility: group.visibility || 'listed',
        joinMode: group.joinMode || 'approval'
      });
      setShowSettingsModal(true);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (savingSettings) return;

    try {
      setSavingSettings(true);
      const response = await api.patch(`/groups/${slug}`, {
        name: settingsForm.name.trim(),
        description: settingsForm.description.trim(),
        visibility: settingsForm.visibility,
        joinMode: settingsForm.joinMode
      });

      // Update local group state
      setGroup(prev => ({
        ...prev,
        name: response.data.group?.name || settingsForm.name,
        description: response.data.group?.description || settingsForm.description,
        visibility: response.data.group?.visibility || settingsForm.visibility,
        joinMode: response.data.group?.joinMode || settingsForm.joinMode
      }));

      setShowSettingsModal(false);
      showToast('Group settings updated!', 'success');
    } catch (err) {
      console.error('Failed to save settings:', err);
      showToast(err.response?.data?.message || 'Failed to save settings', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="group-detail-loading">
        <div className="loading-spinner" />
        <p>Loading group...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="group-detail-error">
        <p>{error}</p>
        <button onClick={() => navigate('/groups')}>Back to Groups</button>
      </div>
    );
  }

  return (
    <div className="group-detail-controller">
      {/* Toast notifications */}
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <GroupHeader
        group={group}
        currentUser={currentUser}
        isOwner={isOwner}
        isModerator={isModerator}
        isMember={isMember}
        hasPendingRequest={hasPendingRequest}
        joining={joining}
        leaving={leaving}
        onJoin={handleJoin}
        onLeave={handleLeave}
        onOpenSettings={openSettingsModal}
        onOpenMembers={openMemberModal}
        onOpenNotifications={() => setShowNotificationSettings(true)}
        onOpenModLog={openModLog}
        onCoverPhotoUpload={handleCoverPhotoUpload}
        onCoverPhotoRemove={handleCoverPhotoRemove}
      />

      {/* Main content area - layout handled by parent */}
      <div className="group-detail-body">
        <div className="group-detail-main">
          <GroupFeed
            posts={posts}
            group={group}
            currentUser={currentUser}
            isMember={isMember}
            isOwner={isOwner}
            isModerator={isModerator}
            isMuted={isMuted}
            newPost={newPost}
            postMedia={postMedia}
            uploadingMedia={uploadingMedia}
            posting={posting}
            editingPost={editingPost}
            editContent={editContent}
            editMedia={editMedia}
            saving={saving}
            onNewPostChange={setNewPost}
            onSubmitPost={handleSubmitPost}
            onMediaSelect={handleMediaSelect}
            onRemoveMedia={handleRemoveMedia}
            onEditPost={handleEditPost}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={handleCancelEdit}
            onEditContentChange={setEditContent}
            onEditMediaSelect={handleMediaSelect}
            onRemoveEditMedia={(index) => setEditMedia(prev => prev.filter((_, i) => i !== index))}
            onDeletePost={handleDeletePost}
            onLockPost={handleLockPost}
            onUnlockPost={handleUnlockPost}
          />
        </div>

        <div className="group-detail-sidebar">
          <GroupSidebar
            group={group}
            owner={group?.ownerDetails}
            moderators={moderators}
            recentMembers={members.slice(0, 5)}
            isMember={isMember}
            onViewAllMembers={openMemberModal}
          />
        </div>
      </div>

      {/* Group Settings Modal */}
      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="settings-modal glossy" onClick={e => e.stopPropagation()}>
            <h2>Group Settings</h2>

            <form onSubmit={handleSaveSettings}>
              <div className="form-group">
                <label htmlFor="groupName">Group Name *</label>
                <input
                  id="groupName"
                  type="text"
                  value={settingsForm.name}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Group name"
                  maxLength={100}
                  disabled={savingSettings}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="groupDescription">Description</label>
                <textarea
                  id="groupDescription"
                  value={settingsForm.description}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What is this group about?"
                  maxLength={500}
                  rows={3}
                  disabled={savingSettings}
                />
              </div>

              <div className="form-group">
                <label htmlFor="groupVisibility">Visibility</label>
                <select
                  id="groupVisibility"
                  value={settingsForm.visibility}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, visibility: e.target.value }))}
                  disabled={savingSettings}
                  className="form-select"
                >
                  <option value="listed">Listed — Appears in group directory</option>
                  <option value="unlisted">Unlisted — Only accessible via direct link</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="groupJoinMode">Join Mode</label>
                <select
                  id="groupJoinMode"
                  value={settingsForm.joinMode}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, joinMode: e.target.value }))}
                  disabled={savingSettings}
                  className="form-select"
                >
                  <option value="approval">Approval Required — You approve each join request</option>
                  <option value="auto">Open — Anyone can join immediately</option>
                </select>
                <p className="form-hint">
                  {settingsForm.joinMode === 'auto'
                    ? '✨ New members can join instantly without approval'
                    : '🔒 You\'ll need to approve each join request'}
                </p>
              </div>

              <div className="modal-buttons">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowSettingsModal(false)}
                  disabled={savingSettings}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={savingSettings || !settingsForm.name.trim()}
                >
                  {savingSettings ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

