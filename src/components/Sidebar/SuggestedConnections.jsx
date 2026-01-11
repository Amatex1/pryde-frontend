/**
 * SuggestedConnections - Shows suggested users to follow
 *
 * Displays users the current user might want to connect with,
 * based on shared interests, location, or mutual connections.
 *
 * QUIET MODE: Component is completely hidden to enforce
 * "No algorithmic discovery" contract.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { getImageUrl } from '../../utils/imageUrl';
import { getDisplayName } from '../../utils/getDisplayName';
import { getQuietMode } from '../../utils/themeManager';
import OptimizedImage from '../OptimizedImage';
import './SuggestedConnections.css';

export default function SuggestedConnections() {
  // QUIET MODE: Fully disappear - no placeholder, no empty container
  const isQuietMode = getQuietMode();
  if (isQuietMode) {
    return null;
  }

  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState(new Set());

  const fetchSuggestions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/suggested');
      // Take top 5 suggestions for sidebar
      setSuggestions((response.data || []).slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const handleFollow = async (userId) => {
    try {
      // Optimistic update
      setFollowingIds(prev => new Set([...prev, userId]));
      await api.post(`/follow/${userId}`);
    } catch (error) {
      console.error('Failed to follow user:', error);
      // Revert on error
      setFollowingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleDismiss = (userId) => {
    setSuggestions(prev => prev.filter(user => user._id !== userId));
  };

  if (loading) {
    return (
      <div className="suggested-connections">
        <h3 className="sidebar-title">Suggested Connections</h3>
        <div className="suggested-loading">
          <div className="suggested-skeleton" />
          <div className="suggested-skeleton" />
          <div className="suggested-skeleton" />
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="suggested-connections">
        <h3 className="sidebar-title">Suggested Connections</h3>
        <p className="suggested-empty">
          No suggestions right now. Check back later!
        </p>
      </div>
    );
  }

  return (
    <div className="suggested-connections">
      <h3 className="sidebar-title">Suggested Connections</h3>
      <p className="suggested-subtitle">People you might want to know</p>
      
      <div className="suggested-list">
        {suggestions.map((user) => {
          const isFollowing = followingIds.has(user._id);
          
          return (
            <div key={user._id} className="suggested-item">
              <Link to={`/profile/${user._id}`} className="suggested-avatar">
                {user.profilePhoto ? (
                  <OptimizedImage
                    src={getImageUrl(user.profilePhoto)}
                    alt={getDisplayName(user)}
                    className="avatar-image"
                  />
                ) : (
                  <span>{getDisplayName(user).charAt(0).toUpperCase()}</span>
                )}
              </Link>
              
              <div className="suggested-info">
                <Link to={`/profile/${user._id}`} className="suggested-name">
                  {getDisplayName(user)}
                </Link>
                {user.bio && (
                  <p className="suggested-bio">{user.bio}</p>
                )}
                {user.interests?.length > 0 && (
                  <div className="suggested-interests">
                    {user.interests.slice(0, 2).map((interest, idx) => (
                      <span key={idx} className="interest-tag">{interest}</span>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="suggested-actions">
                {isFollowing ? (
                  <span className="following-badge">Following</span>
                ) : (
                  <button
                    className="btn-follow"
                    onClick={() => handleFollow(user._id)}
                    aria-label={`Follow ${getDisplayName(user)}`}
                  >
                    Follow
                  </button>
                )}
                <button
                  className="btn-dismiss"
                  onClick={() => handleDismiss(user._id)}
                  aria-label="Dismiss suggestion"
                  title="Not interested"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      <Link to="/discover" className="suggested-see-more">
        Discover more people →
      </Link>
    </div>
  );
}

