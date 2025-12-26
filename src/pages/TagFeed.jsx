/**
 * PHASE 4: Tag Feed Page
 * Shows posts for a specific community tag
 *
 * Migration Phase: TAGS → GROUPS (Phase 0 - Foundation)
 * NOTE: Tags are still legacy-active. This page now detects if a tag
 * has been migrated to a group and shows a banner with CTA.
 * Posting is disabled for migrated tags.
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import OptimizedImage from '../components/OptimizedImage';
import api from '../utils/api';
import { getCurrentUser } from '../utils/auth';
import { getImageUrl } from '../utils/imageUrl';
import { saveDraft, loadDraft, clearDraft } from '../utils/draftStore';
import './TagFeed.css';

function TagFeed() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [tag, setTag] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const currentUser = getCurrentUser();

  // Migration Phase: TAGS → GROUPS - Track if tag is migrated
  const [groupMapping, setGroupMapping] = useState(null);

  // Check if user is admin (can edit/delete any post)
  const isAdmin = currentUser && ['moderator', 'admin', 'super_admin'].includes(currentUser.role);

  useEffect(() => {
    fetchTagAndPosts();
  }, [slug]);

  // Restore localStorage draft on mount
  useEffect(() => {
    const draftKey = `tag-feed-${slug}`;
    const localDraft = loadDraft(draftKey);
    if (localDraft) {
      setNewPost(localDraft);
    }
  }, [slug]);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (newPost) {
      const draftKey = `tag-feed-${slug}`;
      saveDraft(draftKey, newPost);
    }
  }, [newPost, slug]);

  const fetchTagAndPosts = async () => {
    try {
      setLoading(true);

      // Migration Phase: Check if this tag has been migrated to a group
      try {
        const mappingResponse = await api.get(`/tags/${slug}/group-mapping`);
        if (mappingResponse.data.hasMigrated) {
          setGroupMapping(mappingResponse.data.group);
        }
      } catch (mappingError) {
        // Ignore mapping errors - tag might not exist or API not available
        console.debug('Group mapping check failed:', mappingError);
      }

      // Fetch tag details
      const tagResponse = await api.get(`/tags/${slug}`);
      setTag(tagResponse.data);

      // Fetch posts with this tag
      const postsResponse = await api.get(`/tags/${slug}/posts`);
      setPosts(postsResponse.data);
    } catch (error) {
      console.error('Failed to fetch tag feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      await api.post(`/posts/${postId}/like`);

      // Update local state
      setPosts(posts.map(post => {
        if (post._id === postId) {
          return { ...post, hasLiked: !post.hasLiked };
        }
        return post;
      }));
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    setPosting(true);
    try {
      const response = await api.post('/posts', {
        content: newPost,
        tags: [tag.slug], // Use slug instead of _id
        visibility: 'public',
        tagOnly: true // Mark as tag-only post (won't appear in main feed or profile)
      });

      // The response should have populated author and tags
      setPosts([response.data, ...posts]);

      // Update tag post count
      setTag(prev => prev ? { ...prev, postCount: prev.postCount + 1 } : prev);

      // Clear localStorage draft
      const draftKey = `tag-feed-${slug}`;
      clearDraft(draftKey);

      setNewPost('');
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      await api.delete(`/posts/${postId}`);

      // Remove post from state
      setPosts(prev => prev.filter(p => p._id !== postId));

      // Update tag post count
      setTag(prev => prev ? { ...prev, postCount: Math.max(0, prev.postCount - 1) } : prev);
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('Failed to delete post. Please try again.');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!tag) {
    return <div className="error">Tag not found</div>;
  }

  return (
    <div className="page-container">
      <Navbar />
      <div className="tag-feed-container">
        {/* Migration Phase: TAGS → GROUPS - Show banner if tag is migrated */}
        {groupMapping && (
          <div className="migration-banner glossy">
            <div className="migration-banner-icon">🚀</div>
            <div className="migration-banner-content">
              <h3>This topic now lives as a private group</h3>
              <p>Join the <strong>{groupMapping.name}</strong> group for new discussions and posts.</p>
            </div>
            <Link to={`/groups/${groupMapping.slug}`} className="btn-go-to-group">
              Go to Group →
            </Link>
          </div>
        )}

        <div className="tag-feed-header glossy">
          <div className="tag-feed-icon">{tag.icon}</div>
          <h1>{tag.label}</h1>
          <p className="tag-feed-description">{tag.description}</p>
          <div className="tag-feed-stats">
            <span>{tag.postCount} post{tag.postCount !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Create Post Box - Hidden if tag is migrated to group */}
        {!groupMapping && (
          <div className="create-post glossy">
            <h2 className="section-title">✨ Share with {tag.label}</h2>
            <form onSubmit={handlePostSubmit}>
              <textarea
                value={newPost}
                onChange={(e) => {
                  const el = e.target;
                  el.style.height = 'auto';
                  el.style.height = el.scrollHeight + 'px';
                  setNewPost(el.value);
                }}
                placeholder={`What would you like to share with ${tag.label}?`}
                className="post-input"
                rows="1"
                style={{ overflow: 'hidden', resize: 'none' }}
              />
              <button
                type="submit"
                disabled={posting || !newPost.trim()}
                className="btn-post"
              >
                {posting ? 'Posting...' : 'Post ✨'}
              </button>
            </form>
          </div>
        )}

      <div className="tag-feed-posts">
        {posts.length === 0 ? (
          <div className="empty-state">
            <p>No posts in this community yet. Be the first to post!</p>
          </div>
        ) : (
          posts.map(post => (
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
                        {post.author?.displayName?.charAt(0).toUpperCase() || post.author?.username?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  <div className="author-info">
                    <span className="author-name">
                      {post.author?.displayName || post.author?.username || 'Unknown User'}
                      {post.author?.isVerified && <span className="verified-badge">✓</span>}
                    </span>
                    <span className="post-date">{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                </Link>
              </div>

              <div className="post-content">
                <p>{post.content}</p>
                {post.images && post.images.length > 0 && (
                  <div className="post-images">
                    {post.images.map((img, idx) => (
                      <OptimizedImage
                        key={idx}
                        src={img}
                        alt="Post"
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="post-actions">
                <button
                  className={`btn-action ${post.hasLiked ? 'liked' : ''}`}
                  onClick={() => handleLike(post._id)}
                >
                  {post.hasLiked ? '❤️' : '🤍'} Appreciate
                </button>
                <button
                  className="btn-action"
                  onClick={() => navigate(`/feed?post=${post._id}`)}
                >
                  💬 Comment
                </button>
                {/* Allow delete if user is post author OR admin */}
                {currentUser && (post.author._id === currentUser.id || isAdmin) && (
                  <button
                    className="btn-action delete"
                    onClick={() => handleDelete(post._id)}
                  >
                    🗑️ Delete
                  </button>
                )}
              </div>

              {/* Tags Display - Only render tags with valid slugs */}
              {post.tags && post.tags.length > 0 && post.tags.some(t => t?.slug) && (
                <div className="post-tags">
                  {post.tags
                    .filter(t => t && t.slug && t._id)
                    .map(t => (
                      <Link key={t._id} to={`/tags/${t.slug}`} className="post-tag">
                        {t.icon} {t.label || t.slug}
                      </Link>
                    ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      </div>
    </div>
  );
}

export default TagFeed;

