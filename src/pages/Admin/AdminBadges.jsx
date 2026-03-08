import { useState } from 'react';
import api from '../../utils/api';

/**
 * AdminBadges - Badge management component
 */
function AdminBadges({ badges, onRefresh }) {
  const [newBadge, setNewBadge] = useState({
    id: '',
    label: '',
    type: 'community',
    assignmentType: 'manual',
    icon: '⭐',
    tooltip: '',
    description: '',
    priority: 100,
    color: 'default'
  });
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [auditLog, setAuditLog] = useState([]);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const handleCreateBadge = async (e) => {
    e.preventDefault();
    if (!newBadge.id || !newBadge.label || !newBadge.tooltip) {
      return;
    }

    try {
      setCreating(true);
      await api.post('/badges/admin/create', newBadge);
      setNewBadge({
        id: '',
        label: '',
        type: 'community',
        assignmentType: 'manual',
        icon: '⭐',
        tooltip: '',
        description: '',
        priority: 100,
        color: 'default'
      });
      setShowForm(false);
      onRefresh();
    } catch (error) {
      console.error('Create badge error:', error);
      alert(error.response?.data?.message || 'Failed to create badge');
    } finally {
      setCreating(false);
    }
  };

  const loadAuditLog = async () => {
    try {
      setLoadingAudit(true);
      const response = await api.get('/badges/admin/audit-log?limit=50');
      setAuditLog(response.data.logs || []);
    } catch (error) {
      console.error('Load audit log error:', error);
    } finally {
      setLoadingAudit(false);
    }
  };

  const handleSeedAutoBadges = async () => {
    try {
      const response = await api.post('/badges/admin/seed');
      alert(`Seeded ${response.data.results.created} new badges (${response.data.results.existing} already existed)`);
      onRefresh();
    } catch (error) {
      console.error('Seed badges error:', error);
      alert(error.response?.data?.message || 'Failed to seed badges');
    }
  };

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2>🏅 Badge Management</h2>
        <p className="tab-subtitle">Create and manage platform badges. Assign badges to users in the Users tab.</p>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <button
            className="btn-create-badge"
            onClick={() => setShowForm(!showForm)}
            style={{ padding: '0.75rem 1.5rem', background: 'var(--gradient-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
          >
            {showForm ? '✕ Cancel' : '+ Create Badge'}
          </button>
          <button
            onClick={handleSeedAutoBadges}
            style={{ padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
          >
            🌱 Seed Auto Badges
          </button>
          <button
            onClick={() => { setShowAuditLog(!showAuditLog); if (!showAuditLog) loadAuditLog(); }}
            style={{ padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
          >
            {showAuditLog ? '✕ Hide Log' : '📋 Audit Log'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleCreateBadge} className="badge-form" style={{ background: 'var(--card-surface)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Badge ID</label>
              <input
                type="text"
                value={newBadge.id}
                onChange={(e) => setNewBadge({ ...newBadge, id: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                placeholder="early_member"
                required
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Label</label>
              <input
                type="text"
                value={newBadge.label}
                onChange={(e) => setNewBadge({ ...newBadge, label: e.target.value })}
                placeholder="Early Member"
                required
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Icon (emoji)</label>
              <input
                type="text"
                value={newBadge.icon}
                onChange={(e) => setNewBadge({ ...newBadge, icon: e.target.value })}
                placeholder="⭐"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Type</label>
              <select
                value={newBadge.type}
                onChange={(e) => setNewBadge({ ...newBadge, type: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}
              >
                <option value="platform">Platform (Official)</option>
                <option value="community">Community</option>
                <option value="activity">Activity</option>
              </select>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Tooltip</label>
              <input
                type="text"
                value={newBadge.tooltip}
                onChange={(e) => setNewBadge({ ...newBadge, tooltip: e.target.value })}
                placeholder="Joined during beta launch"
                required
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={creating}
            style={{ marginTop: '1rem', padding: '0.75rem 2rem', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: '8px', cursor: creating ? 'not-allowed' : 'pointer', fontWeight: '600', opacity: creating ? 0.6 : 1 }}
          >
            {creating ? 'Creating...' : 'Create Badge'}
          </button>
        </form>
      )}

      {showAuditLog && (
        <div style={{ background: 'var(--card-surface)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid var(--border-light)' }}>
          <h3 style={{ marginBottom: '1rem' }}>📋 Badge Assignment Audit Log</h3>
          {loadingAudit ? (
            <p>Loading audit log...</p>
          ) : auditLog.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No badge assignments recorded yet.</p>
          ) : (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {auditLog.map((log, index) => (
                <div key={log._id || index} style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                  <div>
                    <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', background: log.action === 'assigned' ? '#10b981' : '#ef4444', color: 'white', marginRight: '0.5rem' }}>
                      {log.action}
                    </span>
                    <strong>{log.badgeLabel}</strong> → @{log.username}
                    {log.isAutomatic && (
                      <span style={{ marginLeft: '0.5rem', padding: '2px 6px', background: '#6366f1', color: 'white', borderRadius: '4px', fontSize: '0.7rem' }}>
                        AUTO
                      </span>
                    )}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {new Date(log.createdAt).toLocaleString()}
                    {log.assignedBy && ` by @${log.assignedByUsername}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="badges-list" style={{ display: 'grid', gap: '1rem' }}>
        {badges.length === 0 ? (
          <div className="no-data">
            <p>No badges created yet. Create your first badge above!</p>
          </div>
        ) : (
          badges.map(badge => (
            <div key={badge._id || badge.id} className="badge-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem', background: 'var(--card-surface)', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: '2rem' }}>{badge.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>
                  {badge.label}
                  {badge.assignmentType === 'automatic' && (
                    <span style={{ marginLeft: '0.5rem', padding: '2px 6px', background: '#6366f1', color: 'white', borderRadius: '4px', fontSize: '0.7rem' }}>
                      AUTO
                    </span>
                  )}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{badge.tooltip}</div>
                {badge.description && (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    {badge.description}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ padding: '2px 8px', background: badge.type === 'platform' ? 'var(--pryde-purple)' : badge.type === 'community' ? '#10b981' : '#f59e0b', color: 'white', borderRadius: '4px', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    {badge.type}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>ID: {badge.id}</span>
                  {badge.automaticRule && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      Rule: {badge.automaticRule}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminBadges;

