/**
 * CommunitySidebar - Sidebar components for community features
 * 
 * Shows:
 * - Member Spotlight
 * - Weekly Themes
 * - Active Members
 * 
 * Used in FeedSidebar
 */

import { Link } from 'react-router-dom';
import { useCommunity } from '../../hooks/useCommunity';
import OptimizedImage from '../OptimizedImage';
import { getImageUrl } from '../../utils/imageUrl';
import './CommunitySpotlight.css';

/**
 * Member Spotlight Card
 */
export function CommunitySpotlight({ onDismiss }) {
  const { spotlight, loading } = useCommunity();

  if (loading) {
    return (
      <div className="community-spotlight-card loading">
        <div className="spotlight-skeleton">
          <div className="skeleton-avatar"></div>
          <div className="skeleton-lines">
            <div className="skeleton-line"></div>
            <div className="skeleton-line short"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!spotlight) {
    return null;
  }

  const { user, post, featuredAt } = spotlight;

  return (
    <div className="community-spotlight-card">
      <div className="spotlight-header">
        <span className="spotlight-badge">🌟 Member Spotlight</span>
        {onDismiss && (
          <button 
            className="spotlight-dismiss"
            onClick={onDismiss}
            aria-label="Dismiss"
          >
            ✕
          </button>
        )}
      </div>

      <Link to={`/profile/${user?.username}`} className="spotlight-content">
        <div className="spotlight-avatar">
          {user?.profilePhoto ? (
            <OptimizedImage
              src={getImageUrl(user.profilePhoto)}
              alt={user.username}
              imageSize="avatar"
            />
          ) : (
            <span className="avatar-fallback">
              {(user?.displayName || user?.username || '?').charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="spotlight-info">
          <span className="spotlight-name">
            {user?.displayName || user?.username}
          </span>
          <span className="spotlight-username">@{user?.username}</span>
          
          {user?.bio && (
            <p className="spotlight-bio">
              {user.bio.length > 80 ? `${user.bio.substring(0, 80)}...` : user.bio}
            </p>
          )}
        </div>
      </Link>

      {post && (
        <div className="spotlight-post-preview">
          <p>"{post.content?.substring(0, 100)}..."</p>
        </div>
      )}

      <Link to={`/profile/${user?.username}`} className="spotlight-cta">
        View Profile
      </Link>
    </div>
  );
}

/**
 * Weekly Themes Display
 */
export function CommunityThemes() {
  const { themes, loading } = useCommunity();

  if (loading || !themes || themes.length === 0) {
    return null;
  }

  return (
    <div className="community-themes-card">
      <h3 className="themes-title">📝 This Week's Themes</h3>
      
      <div className="themes-list">
        {themes.map((theme, index) => (
          <div key={index} className="theme-item">
            <span className="theme-emoji">{theme.emoji || '💭'}</span>
            <span className="theme-text">{theme.topic}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Active Members Display
 */
export function ActiveMembers() {
  const { activeMembers, loading } = useCommunity();

  if (loading || !activeMembers || activeMembers.length === 0) {
    return null;
  }

  return (
    <div className="active-members-card">
      <h3 className="active-title">
        <span className="online-dot"></span>
        Online Now
      </h3>
      
      <div className="active-members-list">
        {activeMembers.map(member => (
          <Link 
            key={member._id || member.id} 
            to={`/profile/${member.username}`}
            className="active-member-item"
          >
            <div className="member-avatar">
              {member.profilePhoto ? (
                <OptimizedImage
                  src={getImageUrl(member.profilePhoto)}
                  alt={member.username}
                  imageSize="avatar"
                />
              ) : (
                <span className="avatar-fallback small">
                  {(member.displayName || member.username || '?').charAt(0).toUpperCase()}
                </span>
              )}
              <span className="online-indicator"></span>
            </div>
            <span className="member-name">
              {member.displayName || member.username}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/**
 * Combined Community Sidebar Component
 */
export default function CommunitySidebar({ showSpotlight = true }) {
  const { spotlight, dismissSpotlight } = useCommunity();

  return (
    <div className="community-sidebar">
      {/* Member Spotlight - only show if not dismissed */}
      {showSpotlight && (
        <CommunitySpotlight 
          onDismiss={spotlight ? dismissSpotlight : null}
        />
      )}

      {/* Weekly Themes */}
      <CommunityThemes />

      {/* Active Members */}
      <ActiveMembers />
    </div>
  );
}

