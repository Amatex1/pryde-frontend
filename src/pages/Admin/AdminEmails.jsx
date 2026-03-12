import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';

const STATUS_COLORS = {
  new: 'var(--color-primary)',
  read: '#6c757d',
  replied: 'var(--color-success)',
  archived: '#adb5bd',
  spam: 'var(--color-danger)'
};

const STATUS_LABELS = {
  new: '🔵 New',
  read: '👁️ Read',
  replied: '↩️ Replied',
  archived: '📦 Archived',
  spam: '🚫 Spam'
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function EmailDetail({ email, onStatusChange, onClose }) {
  const [notes, setNotes] = useState(email.adminNotes || '');
  const [saving, setSaving] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const handleStatusChange = async (newStatus) => {
    setStatusUpdating(true);
    try {
      await api.patch(`/admin/emails/${email._id}`, { status: newStatus });
      onStatusChange(email._id, newStatus, notes);
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      await api.patch(`/admin/emails/${email._id}`, { adminNotes: notes });
      onStatusChange(email._id, email.status, notes);
    } catch (err) {
      console.error('Failed to save notes:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="email-detail-panel">
      <div className="email-detail-header">
        <button className="email-detail-back" onClick={onClose}>← Back</button>
        <span
          className="email-status-badge"
          style={{ background: STATUS_COLORS[email.status] || '#6c757d' }}
        >
          {STATUS_LABELS[email.status] || email.status}
        </span>
      </div>

      <h3 className="email-detail-subject">{email.subject || '(no subject)'}</h3>

      <div className="email-detail-meta">
        <div><strong>From:</strong> {email.sender?.name ? `${email.sender.name} <${email.sender.email}>` : email.sender?.email}</div>
        <div><strong>To:</strong> {email.mailbox === 'noreply' ? 'noreply@prydeapp.com' : 'support@prydeapp.com'}</div>
        <div><strong>Received:</strong> {formatDate(email.createdAt)}</div>
        {email.attachments?.length > 0 && (
          <div><strong>Attachments:</strong> {email.attachments.length}</div>
        )}
      </div>

      <div className="email-detail-body">
        {email.bodyHtml ? (
          <div
            className="email-html-body"
            dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
          />
        ) : (
          <pre className="email-text-body">{email.bodyText || '(empty body)'}</pre>
        )}
      </div>

      <div className="email-detail-actions">
        <div className="email-action-row">
          <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Mark as:</span>
          {['replied', 'archived', 'spam'].map(s => (
            <button
              key={s}
              className={`email-action-btn ${email.status === s ? 'active' : ''}`}
              onClick={() => handleStatusChange(s)}
              disabled={statusUpdating || email.status === s}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        <div className="email-notes-section">
          <label className="email-notes-label">Admin Notes</label>
          <textarea
            className="email-notes-input"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Internal notes visible only to admins..."
            rows={3}
          />
          <button
            className="email-save-notes-btn"
            onClick={handleSaveNotes}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Notes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminEmails() {
  const [emails, setEmails] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [mailboxFilter, setMailboxFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (mailboxFilter !== 'all') params.set('mailbox', mailboxFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);

      const res = await api.get(`/admin/emails?${params}`);
      setEmails(res.data.emails);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Failed to fetch emails:', err);
    } finally {
      setLoading(false);
    }
  }, [mailboxFilter, statusFilter, search, page]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const handleSelectEmail = async (emailId) => {
    setDetailLoading(true);
    try {
      const res = await api.get(`/admin/emails/${emailId}`);
      setSelectedEmail(res.data);
      // Update status in list to 'read' if it was new
      setEmails(prev => prev.map(e => e._id === emailId && e.status === 'new' ? { ...e, status: 'read' } : e));
    } catch (err) {
      console.error('Failed to fetch email detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusChange = (emailId, newStatus, newNotes) => {
    setEmails(prev => prev.map(e => e._id === emailId ? { ...e, status: newStatus, adminNotes: newNotes } : e));
    setSelectedEmail(prev => prev ? { ...prev, status: newStatus, adminNotes: newNotes } : prev);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleFilterChange = (setter) => (val) => {
    setter(val);
    setPage(1);
  };

  if (selectedEmail || detailLoading) {
    return (
      <div className="admin-tab-content">
        <h2 className="admin-section-heading">📧 Inbound Emails</h2>
        {detailLoading ? (
          <div className="loading-state">
            <div className="shimmer" style={{ height: '200px', borderRadius: '12px' }}></div>
          </div>
        ) : (
          <EmailDetail
            email={selectedEmail}
            onStatusChange={handleStatusChange}
            onClose={() => setSelectedEmail(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="admin-tab-content">
      <h2 className="admin-section-heading">
        📧 Inbound Emails
        {pagination?.unreadCount > 0 && (
          <span className="email-unread-badge">{pagination.unreadCount} new</span>
        )}
      </h2>

      <div className="email-filters">
        <div className="email-filter-group">
          <label>Mailbox</label>
          <div className="filter-btn-group">
            {['all', 'noreply', 'support'].map(m => (
              <button
                key={m}
                className={`filter-btn ${mailboxFilter === m ? 'active' : ''}`}
                onClick={() => handleFilterChange(setMailboxFilter)(m)}
              >
                {m === 'all' ? 'All' : m === 'noreply' ? 'noreply@' : 'support@'}
              </button>
            ))}
          </div>
        </div>

        <div className="email-filter-group">
          <label>Status</label>
          <div className="filter-btn-group">
            {['all', 'new', 'read', 'replied', 'archived', 'spam'].map(s => (
              <button
                key={s}
                className={`filter-btn ${statusFilter === s ? 'active' : ''}`}
                onClick={() => handleFilterChange(setStatusFilter)(s)}
              >
                {s === 'all' ? 'All' : STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        <form className="email-search-form" onSubmit={handleSearch}>
          <input
            type="text"
            className="email-search-input"
            placeholder="Search sender or subject..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
          <button type="submit" className="email-search-btn">Search</button>
          {search && (
            <button type="button" className="email-search-btn" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}>
              Clear
            </button>
          )}
        </form>
      </div>

      {loading ? (
        <div className="loading-state">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="shimmer" style={{ height: '60px', borderRadius: '8px', marginBottom: '0.5rem' }}></div>
          ))}
        </div>
      ) : emails.length === 0 ? (
        <div className="empty-state" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</p>
          <p>No emails found</p>
        </div>
      ) : (
        <>
          <div className="email-list">
            {emails.map(email => (
              <button
                key={email._id}
                className={`email-list-item ${email.status === 'new' ? 'email-list-item--unread' : ''}`}
                onClick={() => handleSelectEmail(email._id)}
              >
                <div className="email-list-item-left">
                  <span
                    className="email-status-dot"
                    style={{ background: STATUS_COLORS[email.status] || '#6c757d' }}
                    title={email.status}
                  />
                  <div className="email-list-item-info">
                    <span className="email-list-sender">
                      {email.sender?.name || email.sender?.email || 'Unknown'}
                    </span>
                    <span className="email-list-subject">{email.subject || '(no subject)'}</span>
                  </div>
                </div>
                <div className="email-list-item-right">
                  <span className="email-mailbox-tag">
                    {email.mailbox === 'noreply' ? 'noreply@' : 'support@'}
                  </span>
                  <span className="email-list-date">{formatDate(email.createdAt)}</span>
                </div>
              </button>
            ))}
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="email-pagination">
              <button
                className="filter-btn"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                ← Prev
              </button>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Page {page} of {pagination.pages} &nbsp;·&nbsp; {pagination.total} total
              </span>
              <button
                className="filter-btn"
                disabled={page >= pagination.pages}
                onClick={() => setPage(p => p + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AdminEmails;
