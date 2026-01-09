/**
 * ProfileHeader - Profile header with avatar, name, and actions
 * 
 * RESPONSIBILITIES:
 * - Render cover photo, avatar, name, badges, bio
 * - Render action buttons (follow, message, edit)
 * - Delegate all actions to parent via handlers
 * 
 * RULES:
 * - NO layout logic (widths, grids, media queries)
 * - NO data fetching
 * - Layout-agnostic: renders the same on all platforms
 */

import { Link } from 'react-router-dom';
import OptimizedImage from '../../components/OptimizedImage';
import TieredBadgeDisplay from '../../components/TieredBadgeDisplay';
import ProfileIdentitySpine from './ProfileIdentitySpine';
import { getImageUrl } from '../../utils/imageUrl';
import { sanitizeBio, sanitizeURL, sanitizeText } from '../../utils/sanitize';
import { separateBadgesByTier } from '../../utils/badgeTiers';
import './ProfileHeader.css';

export default function ProfileHeader({
  user,
  isOwnProfile = false,
  postsCount = 0,
  // Follow/friend state
  followStatus,
  permissionsChecked = false,
  canSendMessage = false,
  isBlocked = false,
  showActionsMenu = false,
  // Handlers
  onFollow,
  onUnfollow,
  onCancelFollowRequest,
  onMessage,
  onEditProfile,
  onBlockUser,
  onUnblockUser,
  onReportUser,
  onToggleActionsMenu,
  onPhotoClick,
  // Refs
  actionsMenuRef,
}) {
  if (!user) return null;

  return (
    <div className="profile-header-content">
      {/* Cover Photo - LCP FIX: Use OptimizedImage instead of background-image */}
      <div className="cover-photo">
        {user.coverPhoto ? (
          <OptimizedImage
            src={getImageUrl(user.coverPhoto)}
            alt={`${user.displayName || user.username}'s cover photo`}
            className="cover-photo-image"
            onClick={() => onPhotoClick?.(getImageUrl(user.coverPhoto))}
            loading="eager"
            fetchPriority="high"
            aspectRatio="3/1"
            style={{ cursor: 'pointer', width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div className="cover-placeholder shimmer"></div>
        )}
        {isOwnProfile && (
          <button
            className="btn-edit-profile-cover"
            onClick={onEditProfile}
            title="Edit Profile"
          >
            ✏️ Edit Profile
          </button>
        )}
      </div>

      {/* Profile Info */}
      <div className="profile-info">
        <div className="profile-avatar">
          {user.profilePhoto ? (
            <OptimizedImage
              src={getImageUrl(user.profilePhoto)}
              alt={`${user.displayName || user.username}'s profile photo`}
              className="profile-avatar-image"
              onClick={() => onPhotoClick?.(getImageUrl(user.profilePhoto))}
              loading="eager"
              fetchPriority="high"
              aspectRatio="1/1"
              style={{ cursor: 'pointer', width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
            />
          ) : (
            <span>{user.displayName?.charAt(0).toUpperCase()}</span>
          )}
        </div>

        {/* NEW: Identity Spine - Calm, vertical layout */}
        <ProfileIdentitySpine user={user} postsCount={postsCount} />

        {/* Action Buttons Container */}
        <div className="profile-actions-container">
          {/* Own Profile Actions */}
          {isOwnProfile && (
            <div className="profile-action-buttons self-profile-actions">
              <button className="btn-notes-to-self" onClick={onMessage}>
                📝 Notes to self
              </button>
              <span className="notes-helper-text">Private notes only visible to you</span>
            </div>
          )}

          {/* Other Profile Actions */}
          {!isOwnProfile && (
            <div className="profile-action-buttons">
              <div className="friend-actions">
                {followStatus === 'none' && (
                  <button className="btn-add-friend" onClick={onFollow}>➕ Follow</button>
                )}
                {followStatus === 'pending' && (
                  <button className="btn-cancel-request" onClick={onCancelFollowRequest}>⏳ Pending</button>
                )}
                {followStatus === 'following' && (
                  <button className="btn-unfriend" onClick={onUnfollow}>✓ Following</button>
                )}

                {permissionsChecked && canSendMessage && (
                  <button className="btn-message" onClick={onMessage}>💬 Message</button>
                )}
                {permissionsChecked && !canSendMessage && followStatus !== 'following' && (
                  <button className="btn-message" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} title="You must be following to message this user">
                    🔒 Message
                  </button>
                )}
              </div>

              <div className="profile-actions-dropdown" ref={actionsMenuRef}>
                <button className="btn-actions-menu" onClick={onToggleActionsMenu}>⋮</button>
                {showActionsMenu && (
                  <div className="actions-dropdown-menu">
                    {isBlocked ? (
                      <button className="dropdown-item" onClick={onUnblockUser}>🔓 Unblock User</button>
                    ) : (
                      <button className="dropdown-item" onClick={onBlockUser}>🚫 Block User</button>
                    )}
                    <button className="dropdown-item dropdown-item-danger" onClick={onReportUser}>🚩 Report User</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Profile Meta (location, website) */}
          {(user.location || user.website) && (
            <div className="profile-meta">
              {user.location && (
                <span className="meta-item">📍 {sanitizeText(user.location)}</span>
              )}
              {user.website && (
                <a href={sanitizeURL(user.website)} target="_blank" rel="noopener noreferrer" className="meta-item">
                  🔗 {sanitizeText(user.website)}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

