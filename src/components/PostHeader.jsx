/**
 * PostHeader - Canonical post header component
 * 
 * STRUCTURE (NON-NEGOTIABLE):
 * <div class="post-header">
 *   <div class="post-header-left">
 *     <Avatar />
 *     <div class="post-header-text">
 *       <div class="post-author-name">Author Name [Badges] [Privacy]</div>
 *       <div class="post-meta">
 *         <span class="post-pronouns">He/Him</span>
 *         <span class="post-separator">·</span>
 *         <time class="post-timestamp">31/12/2025, 11:08</time>
 *         [edited indicator if applicable]
 *       </div>
 *     </div>
 *   </div>
 *   <div class="post-header-actions">
 *     {children - menu button}
 *   </div>
 * </div>
 * 
 * RULES:
 * - No conditional layout logic
 * - No alternative markup
 * - Header NEVER wraps into multiple rows
 * - Only text truncates - layout does not reflow
 */

import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import OptimizedImage from './OptimizedImage';
import BadgeContainer from './BadgeContainer';
import { getImageUrl } from '../utils/imageUrl';
import './PostHeader.css';

function PostHeader({
  author,
  createdAt,
  visibility = 'followers',
  edited = false,
  isPinned = false,
  children, // Menu button slot
  onAvatarClick,
  linkToProfile = true,
}) {
  if (!author) return null;

  const displayName = author.displayName || author.username || 'User';
  const avatarInitial = displayName.charAt(0).toUpperCase();
  const profileUrl = `/profile/${author.username}`;
  
  // Format timestamp
  const formattedDate = createdAt 
    ? new Date(createdAt).toLocaleString()
    : '';

  // Privacy icon mapping
  const privacyIcon = visibility === 'public' ? '🌍' 
    : visibility === 'private' ? '🔒' 
    : '👥';
  
  const privacyTitle = visibility === 'public' ? 'Public'
    : visibility === 'private' ? 'Only you'
    : 'Connections only';

  // Avatar element
  const avatarContent = author.profilePhoto ? (
    <OptimizedImage
      src={getImageUrl(author.profilePhoto)}
      alt={author.username}
      className="post-header-avatar-img"
    />
  ) : (
    <span className="post-header-avatar-fallback">{avatarInitial}</span>
  );

  const Avatar = linkToProfile ? (
    <Link 
      to={profileUrl} 
      className="post-header-avatar"
      onClick={onAvatarClick}
      aria-label={`View ${displayName}'s profile`}
    >
      {avatarContent}
    </Link>
  ) : (
    <div className="post-header-avatar" onClick={onAvatarClick}>
      {avatarContent}
    </div>
  );

  // Author name element
  const AuthorName = linkToProfile ? (
    <Link to={profileUrl} className="post-author-name-link">
      <span className="post-author-name">{displayName}</span>
    </Link>
  ) : (
    <span className="post-author-name">{displayName}</span>
  );

  return (
    <div className="post-header">
      <div className="post-header-left">
        {Avatar}
        <div className="post-header-text">
          {/* Row 1: Name + Badges + Privacy */}
          <div className="post-author-row">
            {AuthorName}
            {author.badges?.length > 0 && (
              <BadgeContainer badges={author.badges} />
            )}
            <span className="post-privacy" title={privacyTitle}>
              {privacyIcon}
            </span>
          </div>
          {/* Row 2: Pronouns · Timestamp · (edited) */}
          <div className="post-meta">
            {author.pronouns && (
              <>
                <span className="post-pronouns">{author.pronouns}</span>
                <span className="post-separator">·</span>
              </>
            )}
            <time className="post-timestamp" dateTime={createdAt}>
              {formattedDate}
            </time>
            {edited && (
              <>
                <span className="post-separator">·</span>
                <span className="post-edited">(edited)</span>
              </>
            )}
          </div>
        </div>
      </div>
      {children && (
        <div className="post-header-actions">
          {children}
        </div>
      )}
    </div>
  );
}

PostHeader.propTypes = {
  author: PropTypes.shape({
    _id: PropTypes.string,
    username: PropTypes.string,
    displayName: PropTypes.string,
    profilePhoto: PropTypes.string,
    pronouns: PropTypes.string,
    badges: PropTypes.array,
  }).isRequired,
  createdAt: PropTypes.string,
  visibility: PropTypes.oneOf(['public', 'followers', 'private']),
  edited: PropTypes.bool,
  isPinned: PropTypes.bool,
  children: PropTypes.node,
  onAvatarClick: PropTypes.func,
  linkToProfile: PropTypes.bool,
};

export default PostHeader;

