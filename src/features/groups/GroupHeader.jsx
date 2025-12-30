/**
 * GroupHeader - Group title, description, and membership actions
 *
 * RESPONSIBILITIES:
 * - Display group name, description, member count
 * - Display cover photo with upload capability for owners
 * - Show ownership/moderator badges
 * - Join/Leave/Pending buttons
 * - Settings and moderation controls
 *
 * RULES:
 * - NO layout logic (widths, grids, media queries)
 * - NO data fetching
 * - Layout-agnostic: renders the same on all platforms
 */

import React, { useRef, useState } from 'react';
import './GroupHeader.css';

export default function GroupHeader({
  // Data
  group,
  currentUser,

  // Permissions
  isOwner = false,
  isModerator = false,
  isMember = false,
  hasPendingRequest = false,

  // Loading states
  joining = false,
  leaving = false,

  // Handlers
  onJoin,
  onLeave,
  onOpenSettings,
  onOpenMembers,
  onOpenNotifications,
  onOpenModLog,
  onCoverPhotoUpload,
  onCoverPhotoRemove,
}) {
  const fileInputRef = useRef(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  if (!group) return null;

  const handleCoverClick = () => {
    if (isOwner && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !onCoverPhotoUpload) return;

    setUploadingCover(true);
    try {
      await onCoverPhotoUpload(file);
    } finally {
      setUploadingCover(false);
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveCover = async (e) => {
    e.stopPropagation();
    if (!onCoverPhotoRemove) return;

    setUploadingCover(true);
    try {
      await onCoverPhotoRemove();
    } finally {
      setUploadingCover(false);
    }
  };

  const coverStyle = group.coverPhoto
    ? { backgroundImage: `url(${group.coverPhoto})` }
    : {};

  return (
    <div className={`group-header-content glossy ${group.coverPhoto ? 'has-cover' : ''}`} style={coverStyle}>
      {/* Cover photo overlay for readability */}
      {group.coverPhoto && <div className="cover-overlay" />}

      {/* Hidden file input for cover upload */}
      {isOwner && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          aria-label="Upload cover photo"
        />
      )}

      {/* Cover photo edit controls (owner only) */}
      {isOwner && (
        <div className="cover-controls">
          <button
            className="cover-edit-btn"
            onClick={handleCoverClick}
            disabled={uploadingCover}
            aria-label={group.coverPhoto ? 'Change cover photo' : 'Add cover photo'}
          >
            {uploadingCover ? '⏳' : '📷'} {group.coverPhoto ? 'Change Cover' : 'Add Cover'}
          </button>
          {group.coverPhoto && (
            <button
              className="cover-remove-btn"
              onClick={handleRemoveCover}
              disabled={uploadingCover}
              aria-label="Remove cover photo"
            >
              ✕
            </button>
          )}
        </div>
      )}

      <div className="group-header-body">
        <div className="group-icon">👥</div>
        <h1>{group.name}</h1>
        <p className="group-description">{group.description}</p>

        <div className="group-stats">
          <span>{group.memberCount} member{group.memberCount !== 1 ? 's' : ''}</span>
          {group.visibility === 'unlisted' && (
            <span className="visibility-badge">🔗 Unlisted</span>
          )}
          {group.joinMode === 'approval' && (
            <span className="join-mode-badge">🔒 Approval Required</span>
          )}
          {group.joinMode === 'auto' && (
            <span className="join-mode-badge open">✨ Open</span>
          )}
        </div>

        {/* Membership actions */}
        <div className="group-actions" role="group" aria-label="Group membership actions">
          {hasPendingRequest ? (
            <button
              className="btn-pending"
              disabled
              aria-label="Your join request is pending approval"
            >
              <span aria-hidden="true">⏳</span> Request Pending
            </button>
          ) : !isMember ? (
            <button
              className="btn-join"
              onClick={onJoin}
              disabled={joining}
              aria-label={joining ? 'Joining group...' : `Join ${group.name}`}
              aria-busy={joining}
            >
              <span aria-hidden="true">✨</span> {joining ? 'Joining...' : 'Join Group'}
            </button>
          ) : isOwner ? (
            <>
              <span className="ownership-badge" role="status">
                <span aria-hidden="true">👑</span> Owner
              </span>
              <button className="btn-secondary" onClick={onOpenSettings}>
                ⚙️ Settings
              </button>
              <button className="btn-secondary" onClick={onOpenMembers}>
                👥 Members
              </button>
              <button className="btn-secondary" onClick={onOpenModLog}>
                📋 Mod Log
              </button>
            </>
          ) : isModerator ? (
            <>
              <span className="moderator-badge" role="status">
                <span aria-hidden="true">🛡️</span> Moderator
              </span>
              <button className="btn-secondary" onClick={onOpenMembers}>
                👥 Members
              </button>
              <button className="btn-secondary" onClick={onOpenModLog}>
                📋 Mod Log
              </button>
              <button
                className="btn-leave"
                onClick={onLeave}
                disabled={leaving}
                aria-label={leaving ? 'Leaving group...' : 'Leave group'}
              >
                {leaving ? 'Leaving...' : 'Leave Group'}
              </button>
            </>
          ) : (
            <>
              <button className="btn-secondary" onClick={onOpenNotifications}>
                🔔 Notifications
              </button>
              <button
                className="btn-leave"
                onClick={onLeave}
                disabled={leaving}
                aria-label={leaving ? 'Leaving group...' : 'Leave group'}
              >
                {leaving ? 'Leaving...' : 'Leave Group'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

