/**
 * Migration Phase: TAGS → GROUPS (Phase 0 - Foundation)
 * 
 * Groups Page - Private, join-gated community groups
 * 
 * Behavior:
 * - Shows name + description to everyone
 * - Non-members: "Join Group" CTA, NO posts fetched
 * - Members: Posts list + post composer
 * 
 * Reuses existing Post and Feed component patterns where possible.
 * NOTE: Tags are still legacy-active. This is a new, isolated page.
 */

import { useState, useEffect } from 'react';
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
      await api.post(`/groups/${slug}/join`);
      
      // Refetch group to get posts now that we're a member
      await fetchGroup();
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
      await api.post(`/groups/${slug}/leave`);
      
      // Refetch group to update membership status
      await fetchGroup();
    } catch (err) {
      console.error('Failed to leave group:', err);
      alert('Failed to leave group. Please try again.');
    } finally {
      setLeaving(false);
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
            {/* Post Composer - Phase 0: Placeholder, posts not yet associated with groups */}
            <div className="group-composer glossy">
              <h2 className="section-title">✨ Share with {group.name}</h2>
              <p className="coming-soon">Post composer coming in Phase 1</p>
            </div>

            {/* Posts List */}
            <div className="group-posts">
              {posts.length === 0 ? (
                <div className="empty-state glossy">
                  <p>No posts in this group yet.</p>
                  <p className="coming-soon">Posting to groups coming in Phase 1</p>
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
                    </div>
                    <div className="post-content">
                      <p>{post.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Groups;

