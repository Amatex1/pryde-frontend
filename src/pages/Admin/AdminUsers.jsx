import { useState, useEffect, useRef } from 'react';
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

// Actions that require the CONFIRM modal
const DESTRUCTIVE_ACTIONS = new Set(['ban', 'suspend', 'changeRole']);

const ACTION_LABELS = {
  ban: { verb: 'Ban', icon: '🚫', description: (u) => `Permanently ban @${u.username}. They will not be able to log in.` },
  suspend: { verb: 'Suspend', icon: '⏸️', description: (u) => `Suspend @${u.username} for 7 days.` },
  changeRole: { verb: 'Change Role', icon: '🔄', description: (u, extra) => `Change @${u.username}'s role from ${u.role} to ${extra.newRole}.` },
};

const OVERRIDE_ACTIONS = [
  { value: 'DEMOTE_SUPER_ADMIN', label: '⬇️ Demote to Admin', description: 'Remove super_admin role and assign admin role instead.' },
  { value: 'RESET_ADMIN_PASSWORD', label: '🔑 Reset Password', description: 'Send a password reset link to their email address.' },
  { value: 'LOCK_ADMIN_ACCOUNT', label: '🔒 Lock Account (30 days)', description: 'Suspend this account for 30 days. Manually reversible.' },
];

/**
 * OverrideModal — break-glass modal for acting on super_admin accounts.
 *
 * Step 1: Select action + write reason + type OVERRIDE → sends verification code via email
 * Step 2: Enter the 6-digit code received → confirms and executes the action
 */
function OverrideModal({ user, onInitiate, onConfirm, onCancel }) {
  const [step, setStep] = useState(1); // 1 = details, 2 = verify code
  const [selectedAction, setSelectedAction] = useState('');
  const [reason, setReason] = useState('');
  const [confirmInput, setConfirmInput] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selectedConfig = OVERRIDE_ACTIONS.find(a => a.value === selectedAction);
  const isStep1Valid = selectedAction && reason.trim().length >= 10 && confirmInput === 'OVERRIDE';
  const isStep2Valid = verifyCode.trim().length === 6;

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    if (!isStep1Valid || isSubmitting) return;
    setIsSubmitting(true);
    setError('');
    try {
      await onInitiate({ userId: user._id, action: selectedAction, reason: reason.trim() });
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to send verification code. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    if (!isStep2Valid || isSubmitting) return;
    setIsSubmitting(true);
    setError('');
    try {
      await onConfirm({ code: verifyCode.trim() });
    } catch (err) {
      setError(err.message || 'Invalid or expired code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel} aria-hidden="true">
      <div
        className="modal-content override-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="override-modal-title"
      >
        <div className="modal-header">
          <h3 id="override-modal-title">🚨 Emergency Override {step === 2 ? '— Verify' : ''}</h3>
          <button className="modal-close" onClick={onCancel} aria-label="Cancel">×</button>
        </div>

        <div className="modal-body">
          <div className="override-warning-banner">
            Super admin accounts are protected. This override is a break-glass action and will be fully logged.
          </div>

          <p className="override-target">
            Target: <strong>@{user.username}</strong> &nbsp;
            <span className="role-badge role-super_admin">super_admin</span>
          </p>

          {error && <p className="override-error">{error}</p>}

          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="override-form">
              <div className="override-field">
                <label>Action</label>
                <select
                  value={selectedAction}
                  onChange={e => setSelectedAction(e.target.value)}
                  className="override-select"
                >
                  <option value="">Select an action…</option>
                  {OVERRIDE_ACTIONS.map(a => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
                {selectedConfig && (
                  <p className="override-action-description">{selectedConfig.description}</p>
                )}
              </div>

              <div className="override-field">
                <label>Reason <span className="override-required">(min 10 chars)</span></label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Describe why this override is necessary (e.g. suspected account compromise)"
                  rows="3"
                  className="override-textarea"
                />
                <small className={reason.trim().length >= 10 ? 'valid' : 'invalid'}>
                  {reason.trim().length}/10 minimum
                </small>
              </div>

              <div className="override-field">
                <label htmlFor="override-confirm">
                  Type <strong>OVERRIDE</strong> to proceed:
                </label>
                <input
                  id="override-confirm"
                  type="text"
                  value={confirmInput}
                  onChange={e => setConfirmInput(e.target.value)}
                  placeholder="OVERRIDE"
                  autoComplete="off"
                  className={`confirm-action-input ${confirmInput === 'OVERRIDE' ? 'is-valid' : ''}`}
                />
              </div>

              <div className="confirm-action-buttons">
                <button type="button" className="btn-cancel" onClick={onCancel}>Cancel</button>
                <button
                  type="submit"
                  className="btn-override-destructive"
                  disabled={!isStep1Valid || isSubmitting}
                >
                  {isSubmitting ? 'Sending code…' : '🚨 Send Verification Code'}
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleStep2Submit} className="override-form">
              <p className="override-code-instructions">
                A 6-digit verification code was sent to your admin email address. Enter it below to execute the override. The code expires in 5 minutes.
              </p>

              <div className="override-field">
                <label htmlFor="override-code">Verification Code</label>
                <input
                  id="override-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={verifyCode}
                  onChange={e => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  autoFocus
                  autoComplete="one-time-code"
                  className={`override-code-input confirm-action-input ${isStep2Valid ? 'is-valid' : ''}`}
                />
              </div>

              <div className="confirm-action-buttons">
                <button type="button" className="btn-cancel" onClick={() => { setStep(1); setVerifyCode(''); setError(''); }}>
                  ← Back
                </button>
                <button
                  type="submit"
                  className="btn-override-destructive"
                  disabled={!isStep2Valid || isSubmitting}
                >
                  {isSubmitting ? 'Executing…' : '🚨 Execute Override'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * ConfirmActionModal - Requires typing "CONFIRM" before executing destructive actions.
 */
function ConfirmActionModal({ pending, onConfirm, onCancel }) {
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const config = ACTION_LABELS[pending.type];
  const isValid = input === 'CONFIRM';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onConfirm(pending);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel} aria-hidden="true">
      <div
        className="modal-content confirm-action-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <div className="modal-header">
          <h3 id="confirm-modal-title">{config.icon} Confirm: {config.verb}</h3>
          <button className="modal-close" onClick={onCancel} aria-label="Cancel">×</button>
        </div>

        <div className="modal-body">
          <p className="confirm-action-description">
            {config.description(pending.user, pending.extra || {})}
          </p>

          <p className="confirm-action-warning">
            This action will be logged in the admin audit trail.
          </p>

          <form onSubmit={handleSubmit} className="confirm-action-form">
            <label htmlFor="confirm-input" className="confirm-action-label">
              Type <strong>CONFIRM</strong> to proceed:
            </label>
            <input
              id="confirm-input"
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="CONFIRM"
              autoComplete="off"
              autoFocus
              className={`confirm-action-input ${isValid ? 'is-valid' : ''}`}
            />

            <div className="confirm-action-buttons">
              <button type="button" className="btn-cancel" onClick={onCancel}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn-confirm-destructive"
                disabled={!isValid || isSubmitting}
              >
                {isSubmitting ? 'Processing...' : `${config.icon} ${config.verb}`}
              </button>
            </div>
          </form>
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
  onUnlock,
  onChangeRole,
  onSendPasswordReset,
  onUpdateEmail,
  onAssignBadge,
  onRevokeBadge,
  onSuperAdminOverride,
  onSuperAdminOverrideConfirm,
  currentUserRole
}) {
  const [badgeModalUser, setBadgeModalUser] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const [pendingAction, setPendingAction] = useState(null);
  const [overrideTarget, setOverrideTarget] = useState(null);

  const toggleActionMenu = (id, e) => {
    if (openMenuId === id) {
      setOpenMenuId(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + 4,
      right: window.innerWidth - rect.right,
    });
    setOpenMenuId(id);
  };

  // Close menu on outside click or scroll
  useEffect(() => {
    if (!openMenuId) return;
    const close = () => setOpenMenuId(null);
    document.addEventListener('click', close, true);
    window.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('click', close, true);
      window.removeEventListener('scroll', close, true);
    };
  }, [openMenuId]);

  // Queue a destructive action for confirmation
  const requestConfirm = (type, user, extra = {}) => {
    setOpenMenuId(null);
    setPendingAction({ type, user, extra });
  };

  // Execute confirmed action
  const handleConfirmed = async (pending) => {
    const { type, user, extra } = pending;
    if (type === 'ban') await onBan(user._id);
    else if (type === 'suspend') await onSuspend(user._id);
    else if (type === 'changeRole') await onChangeRole(user._id, extra.newRole);
    setPendingAction(null);
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
                        onChange={(e) => requestConfirm('changeRole', user, { newRole: e.target.value })}
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
                    {user.lockoutUntil && new Date(user.lockoutUntil) > new Date() && <span className="status-badge suspended">Locked</span>}
                    {!user.isBanned && !user.isSuspended && user.isActive && <span className="status-badge active">Active</span>}
                    {!user.isActive && !user.isBanned && <span className="status-badge inactive">Inactive</span>}
                  </td>
                  <td data-label="Joined">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td data-label="Actions" className="actions-cell">
                    {user.role?.toLowerCase() === 'super_admin' ? (
                      <div className="super-admin-actions">
                        <span className="super-admin-protected-label">🛡️ Super Admin (Protected)</span>
                        {currentUserRole === 'super_admin' && onSuperAdminOverride && (
                          <button
                            className="btn-override-trigger"
                            onClick={() => setOverrideTarget(user)}
                            title="Emergency override (break-glass)"
                          >
                            🚨 Override
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="admin-actions">
                        <button className="admin-action-trigger" onClick={(e) => { e.stopPropagation(); toggleActionMenu(user._id, e); }}>⋯</button>
                        {openMenuId === user._id && (
                          <div className="admin-action-menu" style={{ position: 'fixed', top: menuPos.top, right: menuPos.right, left: 'auto' }}>
                            <button onClick={() => { onSendPasswordReset(user._id, user.email, user.username); setOpenMenuId(null); }}>
                              🔑 Reset Password
                            </button>
                            {user.isSuspended ? (
                              <button onClick={() => { onUnsuspend(user._id); setOpenMenuId(null); }}>
                                🔓 Unsuspend
                              </button>
                            ) : (
                              <button onClick={() => requestConfirm('suspend', user)}>
                                ⏸️ Suspend
                              </button>
                            )}
                            {user.lockoutUntil && new Date(user.lockoutUntil) > new Date() && (
                              <button onClick={() => { onUnlock(user._id); setOpenMenuId(null); }}>
                                🔓 Unlock Account
                              </button>
                            )}
                            {user.isBanned ? (
                              <button onClick={() => { onUnban(user._id); setOpenMenuId(null); }}>
                                ✅ Unban
                              </button>
                            ) : (
                              <button onClick={() => requestConfirm('ban', user)}>
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

      {pendingAction && (
        <ConfirmActionModal
          pending={pendingAction}
          onConfirm={handleConfirmed}
          onCancel={() => setPendingAction(null)}
        />
      )}

      {overrideTarget && (
        <OverrideModal
          user={overrideTarget}
          onInitiate={({ userId, action, reason }) => onSuperAdminOverride(userId, action, reason)}
          onConfirm={async ({ code }) => {
            await onSuperAdminOverrideConfirm(code);
            setOverrideTarget(null);
          }}
          onCancel={() => setOverrideTarget(null)}
        />
      )}
    </div>
  );
}

export default AdminUsers;
