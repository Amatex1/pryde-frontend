/**
 * GroupHeader - Group title, description, and membership actions
 * 
 * RESPONSIBILITIES:
 * - Display group name, description, member count
 * - Show ownership/moderator badges
 * - Join/Leave/Pending buttons
 * - Settings and moderation controls
 * 
 * RULES:
 * - NO layout logic (widths, grids, media queries)
 * - NO data fetching
 * - Layout-agnostic: renders the same on all platforms
 */

import React from 'react';
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
}) {
  if (!group) return null;

  return (
    <div className="group-header-content glossy">
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
  );
}

