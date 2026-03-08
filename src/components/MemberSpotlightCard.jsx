/**
 * MemberSpotlightCard
 * 
 * Displays a featured community member in the feed.
 * Shows member info, stats, and a recent post preview.
 */

import { memo } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import OptimizedImage from './OptimizedImage';
import { getImageUrl } from '../utils/imageUrl';
import './MemberSpotlightCard.css';

const MemberSpotlightCard = memo(function MemberSpotlightCard({
  member,
  onDismiss,
}) {
  if (!member) return null;

  const {
    user,
    postCount = 0,
    commentCount = 0,
    memberSince,
    recentPost
  } = member;

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="member-spotlight-card">
      <div className="spotlight-header">
        <span className="spotlight-badge">
          🌟 Meet a Member
        </span>
        {onDismiss && (
          <button 
            className="spotlight-dismiss"
            onClick={onDismiss}
            aria-label="Dismiss"
            type="button"
          >
            ✕
          </button>
        )}
      </div>

      <div className="spotlight-content">
        <Link 
          to={`/profile/${user?.username}`} 
          className="spotlight-avatar-link"
        >
          {user?.profilePhoto ? (
            <OptimizedImage
              src={getImageUrl(user.profilePhoto)}
              alt={user.username}
              className="spotlight-avatar"
              imageSize="avatar"
            />
          ) : (
            <div className="spotlight-avatar-fallback">
              {(user?.displayName || user?.username || '?').charAt(0).toUpperCase()}
            </div>
          )}
        </Link>

        <div className="spotlight-info">
          <Link 
            to={`/profile/${user?.username}`} 
            className="spotlight-name"
          >
            {user?.displayName || user?.username}
          </Link>
          
          <span className="spotlight-username">@{user?.username}</span>
          
          {user?.bio && (
            <p className="spotlight-bio">
              {user.bio.length > 100 
                ? `${user.bio.substring(0, 100)}...` 
                : user.bio}
            </p>
          )}

          <div className="spotlight-stats">
            {postCount > 0 && (
              <span className="spotlight-stat">
                📝 {postCount} posts
              </span>
            )}
            {commentCount > 0 && (
              <span className="spotlight-stat">
                💬 {commentCount} comments
              </span>
            )}
            {memberSince && (
              <span className="spotlight-stat">
                📅 Member since {formatDate(memberSince)}
              </span>
            )}
          </div>
        </div>
      </div>

      {recentPost && (
        <div className="spotlight-recent-post">
          <span className="recent-post-label">Recent post:</span>
          <p className="recent-post-content">
            "{recentPost.content?.substring(0, 120)}
            {recentPost.content?.length > 120 ? '...' : ''}"
          </p>
        </div>
      )}

      <Link 
        to={`/profile/${user?.username}`}
        className="spotlight-cta"
      >
        View Profile
      </Link>
    </div>
  );
});

MemberSpotlightCard.propTypes = {
  member: PropTypes.shape({
    user: PropTypes.shape({
      _id: PropTypes.string,
      username: PropTypes.string,
      displayName: PropTypes.string,
      profilePhoto: PropTypes.string,
      bio: PropTypes.string,
    }),
    postCount: PropTypes.number,
    commentCount: PropTypes.number,
    memberSince: PropTypes.string,
    recentPost: PropTypes.shape({
      content: PropTypes.string,
      createdAt: PropTypes.string,
    }),
  }),
  onDismiss: PropTypes.func,
};

export default MemberSpotlightCard;

