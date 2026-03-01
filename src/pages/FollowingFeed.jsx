/**
 * PHASE 2: Following Feed - Chronological feed of posts from followed users
 * Slow, calm UX with no algorithmic ranking
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Trash2, Flag, MoreVertical } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUrl';
import PostHeader from '../components/PostHeader';
import './Feed.css';

/**
 * Helper function to compare IDs safely
 * Handles MongoDB ObjectId comparison and various ID formats
 */
const compareIds = (id1, id2) => {
  if (!id1 || !id2) return false;
  return String(id1) === String(id2);
};

function FollowingFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const { user: currentUser } = useAuth();

  // Dropdown / edit state
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editPostText, setEditPostText] = useState('');
  const [editPostVisibility, setEditPostVisibility] = useState('followers');
  const editTextareaRef = useRef(null);

  useEffect(() => {
    fetchFollowingFeed();
  }, []);

  // Auto-resize edit textarea
  useEffect(() => {
    if (editTextareaRef.current && editingPostId) {
      const ta = editTextareaRef.current;
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 'px';
    }
  }, [editPostText, editingPostId]);

  const fetchFollowingFeed = async (before = null) => {
    try {
      setLoading(true);
      const params = { limit: 20 };
      if (before) params.before = before;

      const response = await api.get('/feed/following', { params });
      const newPosts = response.data;

      if (before) {
        setPosts(prev => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }

      setHasMore(newPosts.length === 20);
    } catch (error) {
      console.error('Failed to fetch following feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (posts.length > 0 && hasMore && !loading) {
      const lastPost = posts[posts.length - 1];
      fetchFollowingFeed(lastPost.createdAt);
    }
  };

  const handleLike = async (postId) => {
    try {
      await api.post(`/posts/${postId}/like`);
      setPosts(posts.map(post =>
        post._id === postId
          ? { ...post, hasLiked: !post.hasLiked }
          : post
      ));
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const toggleDropdown = useCallback((postId) => {
    setOpenDropdownId(prev => prev === postId ? null : postId);
  }, []);

  const handleEditPost = useCallback((post) => {
    setEditingPostId(post._id);
    setEditPostText(post.content);
    setEditPostVisibility(post.visibility || 'followers');
    setOpenDropdownId(null);
  }, []);

  const handleSaveEditPost = useCallback(async (postId) => {
    if (!editPostText.trim()) return;
    try {
      const response = await api.put(`/posts/${postId}`, {
        content: editPostText,
        visibility: editPostVisibility,
      });
      setPosts(prev => prev.map(p => p._id === postId ? response.data : p));
      setEditingPostId(null);
      setEditPostText('');
    } catch (error) {
      console.error('Failed to edit post:', error);
    }
  }, [editPostText, editPostVisibility]);

  const handleCancelEditPost = useCallback(() => {
    setEditingPostId(null);
    setEditPostText('');
  }, []);

  const handleEditPostKeyDown = useCallback((e, postId) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSaveEditPost(postId);
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEditPost();
    }
  }, [handleSaveEditPost, handleCancelEditPost]);

  const handleDeletePost = useCallback(async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`/posts/${postId}`);
      setPosts(prev => prev.filter(p => p._id !== postId));
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  }, []);

  if (loading && posts.length === 0) {
    return (
      <div className="feed-container">
        <div className="feed-header">
          <h1>Following Feed</h1>
          <p className="feed-subtitle">Posts from people you follow</p>
        </div>
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="feed-container">
      <div className="feed-header">
        <h1>Following Feed</h1>
        <p className="feed-subtitle">Posts from people you follow</p>
      </div>

      {posts.length === 0 ? (
        <div className="empty-state">
          <p>No posts yet from people you follow.</p>
          <p>Start following people to see their posts here!</p>
        </div>
      ) : (
        <>
          <div className="posts-list">
            {posts.map(post => {
              // Compare IDs safely - handles MongoDB ObjectId comparison and various ID formats
              const isOwnPost = (() => { if (!post.author || !currentUser) return false; if (typeof post.author === 'object' && post.author.username && currentUser.username && post.author.username === currentUser.username) return true; const aId = typeof post.author === 'object' ? String(post.author._id || '') : String(post.author); const uId = String(currentUser.id || currentUser._id || ''); if (aId && uId && aId === uId) return true; return false; })();
              const isEditing = editingPostId === post._id;
              const isDropdownOpen = openDropdownId === post._id;

              return (
                <div key={post._id} className="post-card glossy fade-in">
                  <PostHeader
                    author={post.author}
                    createdAt={post.createdAt}
                    visibility={post.visibility}
                    edited={post.edited}
                  >
                    <FollowingFeedDropdown
                      postId={post._id}
                      isOwnPost={isOwnPost}
                      isDropdownOpen={isDropdownOpen}
                      authorId={post.author?._id}
                      post={post}
                      onToggleDropdown={toggleDropdown}
                      onEditPost={handleEditPost}
                      onDeletePost={handleDeletePost}
                    />
                  </PostHeader>

                  <div className="post-content">
                    {isEditing ? (
                      <div className="post-edit-box">
                        <textarea
                          ref={editTextareaRef}
                          value={editPostText}
                          onChange={(e) => {
                            setEditPostText(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                          }}
                          onKeyDown={(e) => handleEditPostKeyDown(e, post._id)}
                          className="post-edit-textarea"
                          autoFocus
                        />
                        <div className="post-edit-privacy">
                          <div className="post-edit-privacy-label">Privacy:</div>
                          <select
                            value={editPostVisibility}
                            onChange={(e) => setEditPostVisibility(e.target.value)}
                          >
                            <option value="public">Public</option>
                            <option value="followers">Connections</option>
                            <option value="private">Private</option>
                          </select>
                        </div>
                        <div className="post-edit-actions">
                          <button onClick={() => handleSaveEditPost(post._id)} className="btn-save-post">Save</button>
                          <button onClick={handleCancelEditPost} className="btn-cancel-post">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p>{post.content}</p>
                        {post.media && post.media.length > 0 && (
                          <div className="post-media">
                            {post.media.map((item, index) => (
                              item.type === 'video' ? (
                                <video key={index} src={getImageUrl(item.url)} controls />
                              ) : (
                                <img key={index} src={getImageUrl(item.url)} alt="Post media" />
                              )
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="post-actions">
                    <button
                      className={`btn-action ${post.hasLiked ? 'liked' : ''}`}
                      onClick={() => handleLike(post._id)}
                    >
                      {post.hasLiked ? '❤️' : '🤍'} React
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {hasMore && (
            <button onClick={loadMore} className="btn-load-more" disabled={loading}>
              {loading ? 'Loading...' : 'Load More'}
            </button>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Inline dropdown for FollowingFeed posts.
 * Handles click-outside closing and shows Edit/Delete for own posts,
 * Report for others.
 */
function FollowingFeedDropdown({ postId, isOwnPost, isDropdownOpen, authorId, post, onToggleDropdown, onEditPost, onDeletePost }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onToggleDropdown(postId);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen, postId, onToggleDropdown]);

  return (
    <div className="post-dropdown-container" ref={containerRef}>
      <button
        className="btn-dropdown"
        onClick={() => onToggleDropdown(postId)}
        aria-label="More options"
      >
        <MoreVertical size={18} strokeWidth={1.75} aria-hidden="true" />
      </button>
      {isDropdownOpen && (
        <div className="dropdown-menu">
          {isOwnPost ? (
            <>
              <button
                className="dropdown-item"
                onClick={() => onEditPost(post)}
              >
                <Pencil size={14} strokeWidth={1.75} aria-hidden="true" /> Edit
              </button>
              <button
                className="dropdown-item delete"
                onClick={() => onDeletePost(postId)}
              >
                <Trash2 size={14} strokeWidth={1.75} aria-hidden="true" /> Delete
              </button>
            </>
          ) : (
            <button className="dropdown-item report">
              <Flag size={14} strokeWidth={1.75} aria-hidden="true" /> Report
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default FollowingFeed;
