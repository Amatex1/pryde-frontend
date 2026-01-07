/**
 * PostHeader - Canonical post header component (GRID-BASED)
 *
 * STRUCTURE (NON-NEGOTIABLE - CSS GRID):
 * <div class="post-header">                    <!-- grid: auto 1fr auto -->
 *   <Avatar />                                 <!-- Column 1: 40px fixed -->
 *   <div class="post-header-text">             <!-- Column 2: flexible -->
 *     <div class="post-author-row">
 *       <span class="post-author-name">Name</span>
 *       [Badges]
 *     </div>
 *     <div class="post-meta">
 *       [Pronouns] · [Timestamp] · [(edited)] · [Privacy Icon]
 *     </div>
 *   </div>
 *   <div class="post-header-actions">          <!-- Column 3: 32px fixed -->
 *     {children - menu button}
 *   </div>
 * </div>
 *
 * RULES:
 * - Uses CSS Grid (NOT Flex) for cross-platform consistency
 * - Header height is FIXED: 64px desktop, 56px mobile
 * - No conditional layout logic
 * - No alternative markup
 * - Header NEVER wraps into multiple rows
 * - Only text truncates - layout does not reflow
 * - Privacy icon in meta row, NOT inline with name
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
  isSystemAccount = false, // System posts (pryde_prompts, pryde_guide, etc.)
  children, // Menu button slot
  onAvatarClick,
  linkToProfile = true,
}) {
  if (!author) return null;

  // Detect system account from either prop or author field
  const isSystem = isSystemAccount || author.isSystemAccount;
  const systemDescription = author.systemDescription || 'This is an automated system account operated by Pryde Social.';

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
      {/* Column 1: Avatar (fixed 40px) */}
      {Avatar}

      {/* Column 2: Author info (flexible width) */}
      <div className="post-author">
        <div className="author-line">
          {/* Author name */}
          {AuthorName}

          {/* System account badge - non-removable, always visible for system accounts */}
          {isSystem && (
            <span
              className="system-account-badge"
              title={systemDescription}
              aria-label="System account"
            >
              System account
            </span>
          )}

          {/* Regular badges only shown for non-system accounts */}
          {author.badges?.length > 0 && !isSystem && (
            <BadgeContainer badges={author.badges} />
          )}

          {/* Author meta: pronouns · date · (edited) · privacy */}
          <span className="author-meta">
            {author.pronouns && <>{author.pronouns} · </>}
            <time className="post-timestamp" dateTime={createdAt}>
              {formattedDate}
            </time>
            {edited && <> · (edited)</>}
            {' · '}
            <span className="post-privacy" title={privacyTitle}>
              {privacyIcon}
            </span>
          </span>
        </div>
      </div>

      {/* Column 3: Actions (fixed 32px) */}
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
    isSystemAccount: PropTypes.bool,
    systemRole: PropTypes.oneOf(['PROMPTS', 'GUIDE', 'MODERATION', 'ANNOUNCEMENTS', null]),
    systemDescription: PropTypes.string,
  }).isRequired,
  createdAt: PropTypes.string,
  visibility: PropTypes.oneOf(['public', 'followers', 'private']),
  edited: PropTypes.bool,
  isPinned: PropTypes.bool,
  isSystemAccount: PropTypes.bool,
  children: PropTypes.node,
  onAvatarClick: PropTypes.func,
  linkToProfile: PropTypes.bool,
};

export default PostHeader;

