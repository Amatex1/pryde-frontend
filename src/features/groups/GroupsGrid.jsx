/**
 * GroupsGrid - Grid display of group cards
 * 
 * RESPONSIBILITIES:
 * - Display groups in a grid layout
 * - Group card with name, description, member count
 * - Empty state
 * 
 * RULES:
 * - NO data fetching
 * - Layout-agnostic grid (CSS handles responsiveness)
 */

import React from 'react';
import './GroupsGrid.css';

export default function GroupsGrid({
  groups = [],
  emptyMessage = 'No groups found',
  onGroupClick,
}) {
  if (groups.length === 0) {
    return (
      <div className="groups-grid-empty glossy">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="groups-grid">
      {groups.map(group => (
        <GroupCard
          key={group._id}
          group={group}
          onClick={() => onGroupClick?.(group)}
        />
      ))}
    </div>
  );
}

function GroupCard({ group, onClick }) {
  return (
    <article className="group-card glossy" onClick={onClick}>
      <div className="group-card-icon">👥</div>
      <h3 className="group-card-name">{group.name}</h3>
      <p className="group-card-description">
        {group.description?.slice(0, 100) || 'No description'}
        {group.description?.length > 100 ? '...' : ''}
      </p>
      <div className="group-card-meta">
        <span className="member-count">
          {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
        </span>
        {group.visibility === 'private' && (
          <span className="private-badge">🔒</span>
        )}
      </div>
    </article>
  );
}

