/**
 * GroupSidebar - Group about, rules, and member summary
 * 
 * RESPONSIBILITIES:
 * - Display group description/about
 * - Show group rules
 * - Member count and preview
 * - Quick links
 * 
 * RULES:
 * - NO layout logic (widths, grids, media queries)
 * - NO data fetching
 * - Layout-agnostic: renders the same on all platforms
 */

import React from 'react';
import OptimizedImage from '../../components/OptimizedImage';
import { getImageUrl } from '../../utils/imageUrl';
import './GroupSidebar.css';

export default function GroupSidebar({
  // Data
  group,
  owner,
  moderators = [],
  recentMembers = [],
  
  // Permissions
  isMember = false,
  
  // Handlers
  onViewAllMembers,
}) {
  if (!group) return null;

  return (
    <div className="group-sidebar-content">
      {/* About section */}
      <div className="sidebar-section glossy">
        <h3>About</h3>
        <p className="about-text">{group.description || 'No description provided.'}</p>
        
        <div className="group-meta">
          <div className="meta-item">
            <span className="meta-label">Created</span>
            <span className="meta-value">
              {group.createdAt ? new Date(group.createdAt).toLocaleDateString() : 'Unknown'}
            </span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Privacy</span>
            <span className="meta-value">
              {group.visibility === 'private' ? '🔒 Private' : '🌐 Public'}
            </span>
          </div>
          {group.requireApproval && (
            <div className="meta-item">
              <span className="meta-label">Membership</span>
              <span className="meta-value">Requires approval</span>
            </div>
          )}
        </div>
      </div>

      {/* Rules section (if member and rules exist) */}
      {isMember && group.rules && group.rules.length > 0 && (
        <div className="sidebar-section glossy">
          <h3>Rules</h3>
          <ol className="rules-list">
            {group.rules.map((rule, index) => (
              <li key={index}>{rule}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Owner/Moderators section */}
      <div className="sidebar-section glossy">
        <h3>Leadership</h3>
        
        {owner && (
          <div className="leader-item">
            <div className="leader-avatar">
              {owner.profilePhoto ? (
                <OptimizedImage
                  src={getImageUrl(owner.profilePhoto)}
                  alt={owner.displayName || owner.username}
                />
              ) : (
                <span>{(owner.displayName || owner.username || '?')[0].toUpperCase()}</span>
              )}
            </div>
            <div className="leader-info">
              <span className="leader-name">{owner.displayName || owner.username}</span>
              <span className="leader-role">👑 Owner</span>
            </div>
          </div>
        )}

        {moderators.map(mod => (
          <div key={mod._id} className="leader-item">
            <div className="leader-avatar">
              {mod.profilePhoto ? (
                <OptimizedImage
                  src={getImageUrl(mod.profilePhoto)}
                  alt={mod.displayName || mod.username}
                />
              ) : (
                <span>{(mod.displayName || mod.username || '?')[0].toUpperCase()}</span>
              )}
            </div>
            <div className="leader-info">
              <span className="leader-name">{mod.displayName || mod.username}</span>
              <span className="leader-role">🛡️ Moderator</span>
            </div>
          </div>
        ))}
      </div>

      {/* Members preview section */}
      {isMember && (
        <div className="sidebar-section glossy">
          <div className="section-header">
            <h3>Members</h3>
            <span className="member-count">{group.memberCount}</span>
          </div>
          
          {recentMembers.length > 0 && (
            <div className="members-preview">
              {recentMembers.slice(0, 5).map(member => (
                <div key={member._id} className="member-avatar" title={member.displayName || member.username}>
                  {member.profilePhoto ? (
                    <OptimizedImage
                      src={getImageUrl(member.profilePhoto)}
                      alt={member.displayName || member.username}
                    />
                  ) : (
                    <span>{(member.displayName || member.username || '?')[0].toUpperCase()}</span>
                  )}
                </div>
              ))}
              {group.memberCount > 5 && (
                <div className="member-avatar more">
                  +{group.memberCount - 5}
                </div>
              )}
            </div>
          )}
          
          <button className="btn-view-all" onClick={onViewAllMembers}>
            View All Members
          </button>
        </div>
      )}
    </div>
  );
}

