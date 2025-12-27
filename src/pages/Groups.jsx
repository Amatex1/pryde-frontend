/**
 * Phase 2: Group-only posting
 * Phase 4A: Group Ownership & Moderation
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
 * ISOLATION:
 * - Group posts are intentionally isolated from global feeds
 * - Posts created here use visibility: 'group' and groupId
 * - These posts NEVER appear in /feed, /profile, bookmarks, etc.
 *
 * Tags are legacy entry points only.
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import OptimizedImage from '../components/OptimizedImage';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import api from '../utils/api';
import { getCurrentUser } from '../utils/auth';
import { getImageUrl } from '../utils/imageUrl';
import './Groups.css';

function Groups() {
  const { slug } = useParams();
  const navigate = useNavigate();
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
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(null);

  useEffect(() => {
    fetchGroup();
  }, [slug]);

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
   * Phase 2C: Join group with instant feedback
   * - Button switches to "Leave Group"
   * - Member count updates immediately
   * - Toast notification confirms action
   */
  const handleJoin = async () => {
    if (joining) return;

    try {
      setJoining(true);
      const response = await api.post(`/groups/${slug}/join`);

      // Use the response data directly to update state (faster UX)
      if (response.data.success || response.data.isMember) {
        setGroup(prev => ({
          ...prev,
          ...response.data,
          isMember: true,
          isOwner: response.data.isOwner || prev.isOwner
        }));
        // Set posts from response (empty array initially)
        setPosts(response.data.posts || []);

        // Phase 2C: Toast notification for join success
        const groupName = response.data.name || group?.name || 'this group';
        showToast(`You joined ${groupName}`, 'success');
      } else {
        // Fallback: refetch if response doesn't contain full data
        await fetchGroup();
        showToast('Joined successfully', 'success');
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
      const uploadedUrls = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (response.data.url) {
          uploadedUrls.push(response.data.url);
        }
      }

      setPostMedia(prev => [...prev, ...uploadedUrls]);
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
      const message = err.response?.data?.message || 'Failed to create post. Please try again.';
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

  // Phase 4A: Fetch member list for moderation
  const fetchMembers = async () => {
    try {
      setLoadingMembers(true);
      const response = await api.get(`/groups/${slug}/members`);
      setMembers(response.data.members || []);
      setModerators(response.data.moderators || []);
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

  if (loading) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="group-container">
          <div className="loading">Loading group...</div>
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="page-container">
        <Navbar />
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
      <Navbar />
      <div className="group-container">
        {/* Group Header - Always visible */}
        <div className="group-header glossy">
          <div className="group-icon">👥</div>
          <h1>{group.name}</h1>
          <p className="group-description">{group.description}</p>
          <div className="group-stats">
            <span>{group.memberCount} member{group.memberCount !== 1 ? 's' : ''}</span>
            {group.visibility === 'private' && <span className="visibility-badge">🔒 Private</span>}
          </div>

          {/* Phase 2C: Role badge + Join/Leave CTA */}
          <div className="group-actions">
            {!group.isMember ? (
              <button
                className="btn-join"
                onClick={handleJoin}
                disabled={joining}
              >
                {joining ? 'Joining...' : '✨ Join Group'}
              </button>
            ) : isOwner ? (
              <>
                <span className="ownership-badge">👑 Owner</span>
                <button
                  className="btn-manage-members"
                  onClick={openMemberModal}
                  title="Manage members"
                >
                  Manage Members
                </button>
              </>
            ) : isModerator ? (
              <>
                <span className="role-badge moderator">🛡️ Moderator</span>
                <button
                  className="btn-manage-members"
                  onClick={openMemberModal}
                  title="Manage members"
                >
                  Members
                </button>
                <button
                  className="btn-leave"
                  onClick={handleLeave}
                  disabled={leaving}
                >
                  {leaving ? 'Leaving...' : 'Leave Group'}
                </button>
              </>
            ) : (
              <>
                <span className="role-badge member">✓ Member</span>
                <button
                  className="btn-leave"
                  onClick={handleLeave}
                  disabled={leaving}
                >
                  {leaving ? 'Leaving...' : 'Leave Group'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Phase 2C: Non-member private group message */}
        {!group.isMember && (
          <div className="join-prompt glossy">
            {group.visibility === 'private' ? (
              <p>🔒 This is a private group — join to see posts and participate.</p>
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
                      <div className="post-header">
                        <Link to={`/profile/${post.author?._id}`} className="post-author">
                          <div className="author-avatar">
                            {post.author?.profilePhoto ? (
                              <OptimizedImage
                                src={getImageUrl(post.author.profilePhoto)}
                                alt={`${post.author?.username || 'User'} avatar`}
                                className="avatar-image"
                                loading="lazy"
                              />
                            ) : (
                              <span className="avatar-fallback">
                                {post.author?.displayName?.charAt(0).toUpperCase() ||
                                 post.author?.username?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            )}
                          </div>
                          <div className="author-info">
                            <span className="author-name">
                              {post.author?.displayName || post.author?.username || 'Unknown'}
                            </span>
                            <span className="post-date">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </Link>

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
                          </div>
                        )}
                      </div>

                      <div className="post-content">
                        {post.content && <p>{post.content}</p>}

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
                        <span className="member-role">Member</span>
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

