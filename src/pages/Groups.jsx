/**
 * Phase 2: Group-only posting
 *
 * Groups Page - Private, join-gated community groups
 *
 * Behavior:
 * - Shows name + description to everyone
 * - Non-members: "Join Group" CTA, NO posts visible
 * - Members: Post composer + group feed
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
          isMember: true
        }));
        // Set posts from response (empty array for Phase 0)
        setPosts(response.data.posts || []);
      } else {
        // Fallback: refetch if response doesn't contain full data
        await fetchGroup();
      }
    } catch (err) {
      console.error('Failed to join group:', err);
      alert('Failed to join group. Please try again.');
    } finally {
      setJoining(false);
    }
  };

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
        setGroup(prev => ({
          ...prev,
          isMember: false,
          memberCount: Math.max(0, (prev.memberCount || 1) - 1)
        }));
        setPosts([]); // Clear posts since no longer a member
      } else {
        // Fallback: refetch
        await fetchGroup();
      }
    } catch (err) {
      console.error('Failed to leave group:', err);
      alert('Failed to leave group. Please try again.');
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
    } catch (err) {
      console.error('Failed to delete post:', err);
      alert(err.response?.data?.message || 'Failed to delete post');
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

  const isOwner = group.owner?._id === currentUser?.id;
  const isModerator = group.moderators?.some(m => m._id === currentUser?.id);

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
          
          {/* Join/Leave CTA */}
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
              <span className="ownership-badge">👑 Owner</span>
            ) : (
              <button 
                className="btn-leave"
                onClick={handleLeave}
                disabled={leaving}
              >
                {leaving ? 'Leaving...' : 'Leave Group'}
              </button>
            )}
          </div>
        </div>

        {/* Non-member message */}
        {!group.isMember && (
          <div className="join-prompt glossy">
            <p>Join this group to see posts and participate in discussions.</p>
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
                  <p>No posts in this group yet.</p>
                  <p className="empty-hint">Be the first to share something!</p>
                </div>
              ) : (
                posts.map(post => {
                  const isAuthor = post.author?._id === currentUser?.id;
                  const canDelete = isAuthor || isOwner;

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
      </div>
    </div>
  );
}

export default Groups;

