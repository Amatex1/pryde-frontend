import { useState } from 'react';

/**
 * AdminSecurity - Security logs component
 */
function AdminSecurity({ logs, stats, onResolve }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [openMenuId, setOpenMenuId] = useState(null);

  const toggleActionMenu = (id) => {
    setOpenMenuId(prev => prev === id ? null : id);
  };

  const filteredLogs = logs.filter(log => {
    let passesStatusFilter = true;
    if (statusFilter === 'unresolved') {
      passesStatusFilter = !log.resolved;
    } else if (statusFilter === 'resolved') {
      passesStatusFilter = log.resolved;
    }
    if (!passesStatusFilter) return false;

    if (typeFilter === 'all') return true;
    if (typeFilter === 'underage') return log.type && log.type.includes('underage');
    if (typeFilter === 'failed_login') return log.type === 'failed_login' || log.type === 'account_locked';
    if (typeFilter === 'account_changes') return ['password_changed', 'email_changed', 'email_verified', 'two_factor_enabled', 'two_factor_disabled', 'passkey_added', 'passkey_removed', 'account_deleted', 'profile_updated', 'privacy_settings_changed'].includes(log.type);
    if (typeFilter === 'attacks') return ['suspicious_activity', 'rate_limit_exceeded', 'injection_attempt', 'xss_attempt'].includes(log.type);
    if (typeFilter === 'invites') return log.type && log.type.includes('invite');
    return log.type === typeFilter;
  });

  const handleResolveAll = async () => {
    const unresolvedLogs = filteredLogs.filter(log => !log.resolved);
    if (unresolvedLogs.length === 0) {
      alert('No unresolved logs to resolve');
      return;
    }

    if (!confirm(`Are you sure you want to resolve all ${unresolvedLogs.length} unresolved logs?`)) {
      return;
    }

    for (const log of unresolvedLogs) {
      await onResolve(log._id);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'var(--color-danger)';
      case 'high': return 'var(--color-warning)';
      case 'medium': return 'var(--color-warning)';
      case 'low': return 'var(--color-success)';
      default: return '#6c757d';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'underage_registration': return '🚫 Underage Registration';
      case 'underage_login': return '🔒 Underage Login';
      case 'underage_access': return '⚠️ Underage Access';
      case 'failed_login': return '❌ Failed Login';
      case 'account_locked': return '🔐 Account Locked';
      case 'suspicious_activity': return '🔍 Suspicious Activity';
      case 'rate_limit_exceeded': return '⏱️ Rate Limit Exceeded';
      case 'injection_attempt': return '💉 Injection Attempt';
      case 'xss_attempt': return '🕷️ XSS Attempt';
      case 'password_changed': return '🔑 Password Changed';
      case 'email_changed': return '✉️ Email Changed';
      case 'email_verified': return '✅ Email Verified';
      case 'two_factor_enabled': return '🛡️ 2FA Enabled';
      case 'two_factor_disabled': return '⚠️ 2FA Disabled';
      case 'passkey_added': return '🔏 Passkey Added';
      case 'passkey_removed': return '🗑️ Passkey Removed';
      case 'account_deleted': return '🗑️ Account Deleted';
      case 'profile_updated': return '✏️ Profile Updated';
      case 'privacy_settings_changed': return '🔒 Privacy Settings Changed';
      case 'account_recovery_2fa_reset': return '🔄 2FA Reset via Recovery';
      case 'recovery_contact_notified': return '📧 Recovery Contact Notified';
      case 'login_after_inactivity': return '⏰ Login After Inactivity';
      case 'invite_created': return '📨 Invite Created';
      case 'invite_used': return '🎟️ Invite Used';
      case 'invite_revoked': return '🚫 Invite Revoked';
      default: return type;
    }
  };

  return (
    <div className="security-container">
      <h2>🔒 Security Logs</h2>

      {stats && (
        <div className="security-stats">
          <div className="stat-card">
            <h3>Total Logs</h3>
            <p className="stat-number">{stats.total}</p>
          </div>
          <div className="stat-card">
            <h3>Unresolved</h3>
            <p className="stat-number" style={{ color: 'var(--color-warning)' }}>{stats.unresolved}</p>
          </div>
          <div className="stat-card">
            <h3>Underage Attempts</h3>
            <p className="stat-number" style={{ color: 'var(--color-danger)' }}>
              {stats.byType.underage_registration + stats.byType.underage_login + stats.byType.underage_access}
            </p>
          </div>
          <div className="stat-card">
            <h3>Critical</h3>
            <p className="stat-number" style={{ color: 'var(--color-danger)' }}>{stats.bySeverity.critical}</p>
          </div>
        </div>
      )}

      <div className="security-filters">
        <div className="filter-group">
          <label className="filter-label">Status:</label>
          <button className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>
            All ({logs.length})
          </button>
          <button className={`filter-btn ${statusFilter === 'unresolved' ? 'active' : ''}`} onClick={() => setStatusFilter('unresolved')}>
            Unresolved ({logs.filter(l => !l.resolved).length})
          </button>
          <button className={`filter-btn ${statusFilter === 'resolved' ? 'active' : ''}`} onClick={() => setStatusFilter('resolved')}>
            Resolved ({logs.filter(l => l.resolved).length})
          </button>
        </div>

        <div className="filter-group">
          <label className="filter-label">Type:</label>
          <button className={`filter-btn ${typeFilter === 'all' ? 'active' : ''}`} onClick={() => setTypeFilter('all')}>
            All Types
          </button>
          <button className={`filter-btn ${typeFilter === 'underage' ? 'active' : ''}`} onClick={() => setTypeFilter('underage')}>
            🚫 Underage ({logs.filter(l => l.type && l.type.includes('underage')).length})
          </button>
          <button className={`filter-btn ${typeFilter === 'failed_login' ? 'active' : ''}`} onClick={() => setTypeFilter('failed_login')}>
            ❌ Failed Logins ({logs.filter(l => l.type === 'failed_login' || l.type === 'account_locked').length})
          </button>
          <button className={`filter-btn ${typeFilter === 'attacks' ? 'active' : ''}`} onClick={() => setTypeFilter('attacks')}>
            🕷️ Attacks ({logs.filter(l => ['suspicious_activity', 'rate_limit_exceeded', 'injection_attempt', 'xss_attempt'].includes(l.type)).length})
          </button>
          <button className={`filter-btn ${typeFilter === 'account_changes' ? 'active' : ''}`} onClick={() => setTypeFilter('account_changes')}>
            🔑 Account Changes ({logs.filter(l => ['password_changed', 'email_changed', 'email_verified', 'two_factor_enabled', 'two_factor_disabled', 'passkey_added', 'passkey_removed', 'account_deleted', 'profile_updated', 'privacy_settings_changed'].includes(l.type)).length})
          </button>
          <button className={`filter-btn ${typeFilter === 'invites' ? 'active' : ''}`} onClick={() => setTypeFilter('invites')}>
            📨 Invites ({logs.filter(l => l.type && l.type.includes('invite')).length})
          </button>
        </div>

        <div className="filter-group">
          <button className="btn-resolve-all" onClick={handleResolveAll} disabled={filteredLogs.filter(l => !l.resolved).length === 0}>
            ✅ Resolve All ({filteredLogs.filter(l => !l.resolved).length})
          </button>
        </div>
      </div>

      <div className="security-logs-list">
        {filteredLogs.length === 0 ? (
          <div className="empty-state">No security logs found</div>
        ) : (
          filteredLogs.map(log => (
            <div key={log._id} className={`security-log-item ${log.resolved ? 'resolved' : 'unresolved'}`}>
              <div className="log-header">
                <span className="log-type">{getTypeLabel(log.type)}</span>
                <span className="log-severity" style={{ background: getSeverityColor(log.severity), color: 'white', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  {log.severity.toUpperCase()}
                </span>
                <span className="log-date">{new Date(log.createdAt).toLocaleString()}</span>
              </div>

              <div className="log-details">
                {log.username && <p><strong>Username:</strong> {log.username}</p>}
                {log.email && <p><strong>Email:</strong> {log.email}</p>}
                {log.calculatedAge !== null && <p><strong>Age:</strong> {log.calculatedAge} years old</p>}
                {log.birthday && <p><strong>Birthday:</strong> {new Date(log.birthday).toLocaleDateString()}</p>}
                {log.ipAddress && <p><strong>IP:</strong> {log.ipAddress}</p>}
                {log.details && <p><strong>Details:</strong> {log.details}</p>}
                {log.action && (
                  <p>
                    <strong>Action:</strong>
                    <span style={{ marginLeft: '0.5rem', padding: '0.25rem 0.5rem', background: log.action === 'banned' ? 'var(--color-danger)' : log.action === 'blocked' ? 'var(--color-warning)' : 'var(--color-text-secondary)', color: 'var(--color-surface)', borderRadius: '4px', fontSize: '0.875rem' }}>
                      {log.action.toUpperCase()}
                    </span>
                  </p>
                )}
              </div>

              {log.resolved ? (
                <div className="log-resolved">
                  ✅ Resolved by {log.resolvedBy?.username || 'Admin'} on {new Date(log.resolvedAt).toLocaleString()}
                  {log.notes && <p className="log-notes"><strong>Notes:</strong> {log.notes}</p>}
                </div>
              ) : (
                <div className="admin-actions">
                  <button className="admin-action-trigger" onClick={() => toggleActionMenu(log._id)}>⋯</button>
                  {openMenuId === log._id && (
                    <div className="admin-action-menu">
                      <button onClick={() => { onResolve(log._id); setOpenMenuId(null); }}>
                        ✅ Mark as Resolved
                      </button>
                      <button onClick={() => {
                        const details = `Type: ${log.type}\nEmail: ${log.email || 'N/A'}\nIP: ${log.ipAddress || 'N/A'}\nDate: ${new Date(log.createdAt).toLocaleString()}`;
                        navigator.clipboard.writeText(details);
                        setOpenMenuId(null);
                      }}>
                        📋 Copy Details
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminSecurity;

