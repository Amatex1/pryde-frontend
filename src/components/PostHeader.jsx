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
import TieredBadgeDisplay from './TieredBadgeDisplay';
import { getImageUrl } from '../utils/imageUrl';
import './PostHeader.isolated.css'; // ISOLATED: No external dependencies

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

  // Format timestamp - Facebook style
  const formatTimestamp = (date) => {
    if (!date) return '';

    const postDate = new Date(date);
    const now = new Date();
    const diffMs = now - postDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    // Less than 1 minute
    if (diffMins < 1) return 'Just now';

    // Less than 1 hour - show minutes
    if (diffMins < 60) return `${diffMins}m`;

    // Less than 24 hours - show hours
    if (diffHours < 24) return `${diffHours}h`;

    // Less than 7 days - show days
    if (diffDays < 7) return `${diffDays}d`;

    // Less than 1 year - show "Month Day"
    if (postDate.getFullYear() === now.getFullYear()) {
      return postDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    // Over 1 year - show "Month Day, Year"
    return postDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formattedDate = formatTimestamp(createdAt);

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
      className="ph-avatar-img"
      imageSize="avatar"
    />
  ) : (
    <span className="ph-avatar-fallback">{avatarInitial}</span>
  );

  const Avatar = linkToProfile ? (
    <Link
      to={profileUrl}
      className="ph-avatar"
      onClick={onAvatarClick}
      aria-label={`View ${displayName}'s profile`}
    >
      {avatarContent}
    </Link>
  ) : (
    <div className="ph-avatar" onClick={onAvatarClick}>
      {avatarContent}
    </div>
  );

  // Author name element
  const AuthorName = linkToProfile ? (
    <Link to={profileUrl} className="ph-name-link">
      <span className="ph-name">{displayName}</span>
    </Link>
  ) : (
    <span className="ph-name">{displayName}</span>
  );

  return (
    <div className="ph-post-header">
      {/* Column 1: Avatar (fixed 40px) */}
      <div className="ph-avatar-wrapper">
        {Avatar}
      </div>

      {/* Column 2: Author info (flexible width) */}
      <div className="ph-author-info">
        {/* Row 1: Display Name (bold, prominent) + Badges */}
        <div className="ph-name-row">
          {AuthorName}

          {/* System account badge - non-removable, always visible for system accounts */}
          {isSystem && (
            <span
              className="ph-system-badge"
              title={systemDescription}
              aria-label="System account"
            >
              System account
            </span>
          )}

          {/* INTENTIONAL MINIMALISM: Only show badges for System bots, Founder/Creator, Admin/Moderator */}
          {author.badges?.length > 0 && !isSystem && (() => {
            const allowedBadges = author.badges.filter(badge =>
              badge.id === 'founder' ||
              badge.id === 'creator' ||
              badge.id === 'admin' ||
              badge.id === 'moderator' ||
              badge.category === 'CORE_ROLE'
            );
            return allowedBadges.length > 0 ? (
              <TieredBadgeDisplay badges={allowedBadges} context="post" authorId={author._id} />
            ) : null;
          })()}
        </div>

        {/* Row 2: Username · Timestamp · (edited) · Privacy - all on same line */}
        <div className="ph-meta-row">
          {/* Username */}
          <span className="ph-username">@{author.username}</span>
          <span className="ph-separator">·</span>

          {/* Timestamp */}
          <time className="ph-timestamp" dateTime={createdAt}>
            {formattedDate}
          </time>

          {/* Edited indicator */}
          {edited && (
            <>
              <span className="ph-separator">·</span>
              <span className="ph-edited">(edited)</span>
            </>
          )}

          {/* Privacy icon */}
          <span className="ph-separator">·</span>
          <span className="ph-privacy" title={privacyTitle}>
            {privacyIcon}
          </span>
        </div>
      </div>

      {/* Column 3: Actions (fixed 32px) */}
      {children && (
        <div className="ph-actions">
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

