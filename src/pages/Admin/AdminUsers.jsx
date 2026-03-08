import { useState } from 'react';
import OptimizedImage from '../../components/OptimizedImage';
import { getImageUrl } from '../../utils/imageUrl';

/**
 * BadgeManagementModal - Modal for managing user badges
 */
function BadgeManagementModal({ user, badges = [], onAssignBadge, onRevokeBadge, onClose }) {
  const [selectedBadge, setSelectedBadge] = useState('');
  const [reason, setReason] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [isRevoking, setIsRevoking] = useState(null);

  const userBadges = user.badges || [];
  const availableBadges = badges.filter(b => !userBadges.some(ub => {
    const userBadgeId = typeof ub === 'string' ? ub : ub.id;
    return userBadgeId === b.id;
  }));

  const selectedBadgeData = badges.find(b => b.id === selectedBadge);
  const isManualBadge = selectedBadgeData?.assignmentType === 'manual';
  const reasonValid = !isManualBadge || reason.trim().length >= 10;

  const handleAssign = async () => {
    if (!selectedBadge) return;
    if (isManualBadge && !reasonValid) return;
    setIsAssigning(true);
    try {
      await onAssignBadge(user._id, selectedBadge, reason.trim());
      setSelectedBadge('');
      setReason('');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRevoke = async (badgeId) => {
    setIsRevoking(badgeId);
    try {
      await onRevokeBadge(user._id, badgeId);
    } finally {
      setIsRevoking(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} aria-hidden="true">
      <div className="modal-content badge-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h3>Manage Badges for {user.username}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="badge-section">
            <h4>Current Badges ({userBadges.length})</h4>
            {userBadges.length === 0 ? (
              <p className="empty-badges">No badges assigned</p>
            ) : (
              <div className="badge-list">
                {userBadges.map(badge => (
                  <div key={badge.id} className="badge-item">
                    <span className="badge-icon">{badge.icon}</span>
                    <span className="badge-label">{badge.label}</span>
                    <button 
                      className="badge-revoke-btn" 
                      onClick={() => handleRevoke(badge.id)} 
                      disabled={isRevoking === badge.id}
                    >
                      {isRevoking === badge.id ? '...' : '×'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="badge-section">
            <h4>Assign New Badge</h4>
            {availableBadges.length === 0 ? (
              <p className="empty-badges">All badges already assigned</p>
            ) : (
              <div className="badge-assign-form">
                <select 
                  value={selectedBadge} 
                  onChange={(e) => setSelectedBadge(e.target.value)} 
                  className="badge-select"
                >
                  <option value="">Select a badge...</option>
                  {availableBadges.map(badge => (
                    <option key={badge.id} value={badge.id}>
                      {badge.icon} {badge.label} {badge.assignmentType === 'manual' ? '(requires reason)' : ''}
                    </option>
                  ))}
                </select>

                {selectedBadge && isManualBadge && (
                  <div className="badge-reason-input">
                    <label>Reason for assignment (min 10 chars):</label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Why is this badge being assigned?"
                      rows="2"
                      className="badge-reason-textarea"
                    />
                    <small className={reason.trim().length >= 10 ? 'valid' : 'invalid'}>
                      {reason.trim().length}/10 characters minimum
                    </small>
                  </div>
                )}

                <button 
                  className="badge-assign-btn" 
                  onClick={handleAssign} 
                  disabled={!selectedBadge || isAssigning || !reasonValid}
                >
                  {isAssigning ? 'Assigning...' : 'Assign Badge'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * AdminUsers - User management component
 */
function AdminUsers({
  users,
  badges = [],
  onSuspend,
  onBan,
  onUnsuspend,
  onUnban,
  onChangeRole,
  onSendPasswordReset,
  onUpdateEmail,
  onAssignBadge,
  onRevokeBadge
}) {
  const [badgeModalUser, setBadgeModalUser] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  const toggleActionMenu = (id) => {
    setOpenMenuId(prev => prev === id ? null : id);
  };

  return (
    <div className="users-list">
      <h2>User Management ({users.length} total users)</h2>
      {users.length === 0 ? (
        <p className="empty-state">No users found</p>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Full Name</th>
                <th>Identity</th>
                <th>Email</th>
                <th>Role</th>
                <th>Badges</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td data-label="Username">{user.username}</td>
                  <td data-label="Full Name">
                    {user.fullName || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Not provided</span>}
                  </td>
                  <td data-label="Identity">
                    {user.identity ? (
                      <span className={`identity-badge ${user.identity === 'LGBTQ+' ? 'identity-lgbtq' : 'identity-ally'}`}>
                        {user.identity === 'LGBTQ+' ? '🌈 LGBTQ+' : '🤝 Ally'}
                      </span>
                    ) : user.isAlly ? (
                      <span className="identity-muted">Ally (legacy)</span>
                    ) : (
                      <span className="identity-muted">Not set</span>
                    )}
                  </td>
                  <td data-label="Email">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>{user.email}</span>
                      <button 
                        className="btn-action btn-small" 
                        onClick={() => onUpdateEmail(user._id, user.email, user.username)} 
                        title="Update email"
                      >
                        ✏️ Edit
                      </button>
                    </div>
                  </td>
                  <td data-label="Role">
                    {user.role?.toLowerCase() === 'super_admin' ? (
                      <span className={`role-badge role-${user.role}`}>{user.role}</span>
                    ) : (
                      <select 
                        className={`role-select role-${user.role}`} 
                        value={user.role} 
                        onChange={(e) => onChangeRole(user._id, e.target.value)}
                      >
                        <option value="user">user</option>
                        <option value="moderator">moderator</option>
                        <option value="admin">admin</option>
                        <option value="super_admin">super_admin</option>
                      </select>
                    )}
                  </td>
                  <td data-label="Badges" className="col-badges">
                    <div className="badge-cell">
                      <div className="badge-preview">
                        {user.badges && user.badges.length > 0 ? (
                          <>
                            {user.badges.slice(0, 2).map(badge => (
                              <span key={badge.id} className="badge-icon-preview" title={badge.tooltip || badge.label}>
                                {badge.icon}
                              </span>
                            ))}
                            {user.badges.length > 2 && <span className="badge-count">+{user.badges.length - 2}</span>}
                          </>
                        ) : (
                          <span className="no-badges">—</span>
                        )}
                      </div>
                      <button className="badge-manage-btn" onClick={() => setBadgeModalUser(user)}>Manage</button>
                    </div>
                  </td>
                  <td data-label="Status">
                    {user.isBanned && <span className="status-badge banned">Banned</span>}
                    {user.isSuspended && <span className="status-badge suspended">Suspended</span>}
                    {!user.isBanned && !user.isSuspended && user.isActive && <span className="status-badge active">Active</span>}
                    {!user.isActive && !user.isBanned && <span className="status-badge inactive">Inactive</span>}
                  </td>
                  <td data-label="Joined">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td data-label="Actions" className="actions-cell">
                    {user.role?.toLowerCase() === 'super_admin' ? (
                      <span style={{ color: '#6C5CE7', fontWeight: 'bold' }}>🛡️ Platform Owner</span>
                    ) : (
                      <div className="admin-actions">
                        <button className="admin-action-trigger" onClick={() => toggleActionMenu(user._id)}>⋯</button>
                        {openMenuId === user._id && (
                          <div className="admin-action-menu">
                            <button onClick={() => { onSendPasswordReset(user._id, user.email, user.username); setOpenMenuId(null); }}>
                              🔑 Reset Password
                            </button>
                            {user.isSuspended ? (
                              <button onClick={() => { onUnsuspend(user._id); setOpenMenuId(null); }}>
                                🔓 Unsuspend
                              </button>
                            ) : (
                              <button onClick={() => { onSuspend(user._id); setOpenMenuId(null); }}>
                                ⏸️ Suspend
                              </button>
                            )}
                            {user.isBanned ? (
                              <button onClick={() => { onUnban(user._id); setOpenMenuId(null); }}>
                                ✅ Unban
                              </button>
                            ) : (
                              <button onClick={() => { onBan(user._id); setOpenMenuId(null); }}>
                                🚫 Ban
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {badgeModalUser && (
        <BadgeManagementModal
          user={badgeModalUser}
          badges={badges}
          onAssignBadge={async (userId, badgeId, reason) => {
            await onAssignBadge(userId, badgeId, reason);
            const updatedUser = users.find(u => u._id === userId);
            if (updatedUser) setBadgeModalUser(updatedUser);
          }}
          onRevokeBadge={async (userId, badgeId) => {
            await onRevokeBadge(userId, badgeId);
            const updatedUser = users.find(u => u._id === userId);
            if (updatedUser) setBadgeModalUser(updatedUser);
          }}
          onClose={() => setBadgeModalUser(null)}
        />
      )}
    </div>
  );
}

export default AdminUsers;

