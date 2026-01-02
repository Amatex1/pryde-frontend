import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './InviteManagement.css';

/**
 * InviteManagement Component (Phase 7B)
 *
 * Allows admins and super_admins to create and manage invite codes.
 * Calm, non-gamified interface with no tracking of invited user activity.
 *
 * NOTE: This component should only be rendered for admin/super_admin users.
 * It includes an additional safety check to prevent API calls for non-admin users.
 */
function InviteManagement() {
  const { user: currentUser } = useAuth();
  const [invites, setInvites] = useState([]);
  const [canCreate, setCanCreate] = useState({ allowed: false, reason: '' });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [note, setNote] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);

  // Safety check: only admins should use this component
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  const fetchInvites = useCallback(async () => {
    // Extra safety: don't call API if not admin
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    try {
      const response = await api.get('/invites/my-invites');
      setInvites(response.data.invites || []);
      setCanCreate(response.data.canCreateNew || { allowed: false });
    } catch (err) {
      if (err.response?.status !== 403) {
        setError('Unable to load invites.');
      }
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  const handleCreateInvite = async () => {
    setError('');
    setSuccess('');
    setCreating(true);

    try {
      const response = await api.post('/invites/create', { note: note.trim() });
      setSuccess('Invite created successfully!');
      setNote('');
      fetchInvites();
      
      // Auto-copy to clipboard
      if (response.data.invite?.code) {
        await navigator.clipboard.writeText(response.data.invite.inviteUrl);
        setCopiedCode(response.data.invite.code);
        setTimeout(() => setCopiedCode(null), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to create invite.');
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeInvite = async (code) => {
    if (!window.confirm('Revoke this invite? It will no longer be usable.')) return;
    
    try {
      await api.delete(`/invites/${code}`);
      setSuccess('Invite revoked.');
      fetchInvites();
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to revoke invite.');
    }
  };

  const copyToClipboard = async (url, code) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 3000);
    } catch {
      setError('Unable to copy to clipboard.');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Don't render anything if not admin (safety check)
  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="invite-management">
        <div className="invite-loading">Loading invites...</div>
      </div>
    );
  }

  return (
    <div className="invite-management">
      <div className="invite-header">
        <h3>Invite Friends</h3>
        <p className="invite-description">
          Pryde grows through trust. Share an invite with someone you believe will contribute positively to our community.
        </p>
      </div>

      {error && <div className="invite-error">{error}</div>}
      {success && <div className="invite-success">{success}</div>}

      {/* Create Invite Section */}
      <div className="invite-create-section">
        {canCreate.allowed ? (
          <>
            <div className="invite-note-input">
              <label htmlFor="invite-note">Personal note (optional)</label>
              <input
                type="text"
                id="invite-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g., For my friend Alex"
                maxLength={100}
                disabled={creating}
              />
            </div>
            <button
              className="btn-primary invite-create-btn"
              onClick={handleCreateInvite}
              disabled={creating}
            >
              {creating ? 'Creating...' : 'Create Invite'}
            </button>
          </>
        ) : (
          <div className="invite-cooldown-notice">
            {canCreate.reason === 'active_invite_exists' && (
              <p>You already have an active invite. Share it or wait for it to be used.</p>
            )}
            {canCreate.reason === 'cooldown' && (
              <p>You can create another invite after {formatDate(canCreate.cooldownEndsAt)}.</p>
            )}
            {canCreate.reason === 'not_eligible' && (
              <p>Invite creation is available to admins and super admins.</p>
            )}
          </div>
        )}
      </div>

      {/* Invites List */}
      {invites.length > 0 && (
        <div className="invite-list">
          <h4>Your Invites</h4>
          {invites.map((invite) => (
            <div key={invite.code} className={`invite-item invite-${invite.status}`}>
              <div className="invite-item-main">
                <div className="invite-code-display">
                  <code>{invite.code}</code>
                  {invite.note && <span className="invite-note">{invite.note}</span>}
                </div>
                <div className="invite-status-badge">{invite.status}</div>
              </div>

              <div className="invite-item-meta">
                <span>Created: {formatDate(invite.createdAt)}</span>
                {invite.expiresAt && <span>Expires: {formatDate(invite.expiresAt)}</span>}
                {invite.usedAt && <span>Used: {formatDate(invite.usedAt)}</span>}
              </div>

              {invite.status === 'active' && invite.inviteUrl && (
                <div className="invite-item-actions">
                  <button
                    className="btn-secondary btn-sm"
                    onClick={() => copyToClipboard(invite.inviteUrl, invite.code)}
                  >
                    {copiedCode === invite.code ? '✓ Copied!' : 'Copy Link'}
                  </button>
                  <button
                    className="btn-ghost btn-sm"
                    onClick={() => handleRevokeInvite(invite.code)}
                  >
                    Revoke
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {invites.length === 0 && (
        <div className="invite-empty">
          <p>You haven't created any invites yet.</p>
        </div>
      )}
    </div>
  );
}

export default InviteManagement;

