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
import BadgeContainer from '../../components/BadgeContainer';
import { getImageUrl } from '../../utils/imageUrl';
import { sanitizeBio, sanitizeURL, sanitizeText } from '../../utils/sanitize';
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
      {/* Cover Photo */}
      <div className="cover-photo">
        {user.coverPhoto ? (
          <div
            className="cover-photo-image"
            onClick={() => onPhotoClick?.(getImageUrl(user.coverPhoto))}
            style={{
              backgroundImage: `url(${getImageUrl(user.coverPhoto)})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              cursor: 'pointer'
            }}
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
            <div
              className="profile-avatar-image"
              onClick={() => onPhotoClick?.(getImageUrl(user.profilePhoto))}
              style={{
                backgroundImage: `url(${getImageUrl(user.profilePhoto)})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                cursor: 'pointer'
              }}
            />
          ) : (
            <span>{user.displayName?.charAt(0).toUpperCase()}</span>
          )}
        </div>

        <div className="profile-details">
          <h1 className="profile-name text-shadow">
            {user.displayName || user.fullName || user.username}
            {user.badges?.length > 0 && (
              <BadgeContainer badges={user.badges} showLabels />
            )}
            {user.nickname && user.nickname !== user.displayName && user.nickname !== user.username && (
              <span className="nickname"> "{user.nickname}"</span>
            )}
          </h1>
          <p className="profile-username">@{user.username}</p>

          <div className="profile-badges">
            {user.pronouns && (
              <span className="badge">{user.pronouns.charAt(0).toUpperCase() + user.pronouns.slice(1)}</span>
            )}
            {user.gender && (
              <span className="badge">{user.gender.charAt(0).toUpperCase() + user.gender.slice(1)}</span>
            )}
            {user.sexualOrientation && (
              <span className="badge">{user.sexualOrientation.charAt(0).toUpperCase() + user.sexualOrientation.slice(1)}</span>
            )}
            {user.birthday && (
              <span className="badge">🎂 {new Date().getFullYear() - new Date(user.birthday).getFullYear()} years old</span>
            )}
          </div>

          {user.bio && <p className="profile-bio">{sanitizeBio(user.bio)}</p>}

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

          {/* Profile Meta */}
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

          {/* Profile Stats */}
          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-value">{postsCount}</span>
              <span className="stat-label">Posts</span>
            </div>
            <Link to={`/profile/${user.username}/followers`} className="stat-item" style={{ textDecoration: 'none', color: 'inherit' }}>
              <span className="stat-value">{user.followers?.length || 0}</span>
              <span className="stat-label">Followers</span>
            </Link>
            <Link to={`/profile/${user.username}/following`} className="stat-item" style={{ textDecoration: 'none', color: 'inherit' }}>
              <span className="stat-value">{user.following?.length || 0}</span>
              <span className="stat-label">Following</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

