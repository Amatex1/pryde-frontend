/**
 * AdminReports.jsx — Phase 7
 *
 * Self-contained moderation dashboard. Fetches its own data so the parent
 * (AdminPage) no longer needs to pre-fetch or pass reports as props.
 * The onResolve prop is still accepted for backwards-compat but is no longer
 * required — actions are performed directly inside this component.
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import OptimizedImage from '../../components/OptimizedImage';
import { getImageUrl } from '../../utils/imageUrl';
import './AdminReports.css';

// ── Constants ─────────────────────────────────────────────────────────────────

const REASON_LABELS = {
  spam:           'Spam',
  harassment:     'Harassment',
  hate_speech:    'Hate speech',
  violence:       'Violence',
  nudity:         'Nudity / sexual',
  misinformation: 'Misinformation',
  impersonation:  'Impersonation',
  self_harm:      'Self-harm',
  other:          'Other'
};

const SEVERITY_META = {
  low:      { color: '#6b7280', bg: 'rgba(107,114,128,0.12)', label: 'Low' },
  medium:   { color: '#d97706', bg: 'rgba(217,119,6,0.12)',   label: 'Medium' },
  high:     { color: '#dc2626', bg: 'rgba(220,38,38,0.12)',   label: 'High' },
  critical: { color: '#7c3aed', bg: 'rgba(124,58,237,0.12)',  label: 'Critical' }
};

const STATUS_META = {
  pending:   { color: '#d97706', label: 'Pending' },
  reviewing: { color: '#2563eb', label: 'Reviewing' },
  resolved:  { color: '#16a34a', label: 'Resolved' },
  dismissed: { color: '#6b7280', label: 'Dismissed' }
};

const SORT_OPTIONS = [
  { value: 'severity',     label: 'Highest severity' },
  { value: 'newest',       label: 'Newest first' },
  { value: 'mostReported', label: 'Most reported' }
];

// ── Component ─────────────────────────────────────────────────────────────────

function AdminReports({ onResolve }) {
  const [reports, setReports]             = useState([]);
  const [stats, setStats]                 = useState(null);
  const [loading, setLoading]             = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [expanded, setExpanded]           = useState(null);
  const [pagination, setPagination]       = useState({ page: 1, pages: 1, total: 0 });

  const [filters, setFilters] = useState({
    status: 'pending',
    reason: '',
    reportType: '',
    sort: 'severity',
    page: 1
  });

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status)     params.set('status', filters.status);
      if (filters.reason)     params.set('reason', filters.reason);
      if (filters.reportType) params.set('reportType', filters.reportType);
      params.set('sort', filters.sort);
      params.set('page', filters.page);

      const [reportsRes, statsRes] = await Promise.all([
        api.get(`/admin/reports?${params.toString()}`),
        api.get('/admin/reports/stats')
      ]);

      setReports(reportsRes.data.reports || []);
      setPagination(reportsRes.data.pagination || { page: 1, pages: 1, total: 0 });
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const setFilter = (key, value) =>
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));

  const handleAction = async (reportId, status, action, reviewNotes = 'Reviewed by admin') => {
    setActionLoading(reportId);
    try {
      await api.put(`/admin/reports/${reportId}`, { status, action, reviewNotes });
      onResolve?.(reportId, status, action);
      await fetchReports();
    } catch (err) {
      console.error('Action failed', err);
      alert('Failed to update report. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="ar-root">
      <div className="ar-page-header">
        <h2 className="ar-page-title">Moderation Queue</h2>
        {!loading && (
          <span className="ar-total-badge">
            {pagination.total} report{pagination.total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* ── Status chips ──────────────────────────────────────────────────── */}
      {stats?.byStatus && (
        <div className="ar-status-bar">
          <button
            className={`ar-status-chip ${!filters.status ? 'ar-chip-active' : ''}`}
            onClick={() => setFilter('status', '')}
          >
            All
          </button>
          {Object.entries(stats.byStatus).map(([s, n]) => (
            <button
              key={s}
              className={`ar-status-chip ${filters.status === s ? 'ar-chip-active' : ''}`}
              style={filters.status === s ? { borderColor: STATUS_META[s]?.color } : {}}
              onClick={() => setFilter('status', filters.status === s ? '' : s)}
            >
              <span
                className="ar-status-dot"
                style={{ background: STATUS_META[s]?.color || '#999' }}
              />
              {STATUS_META[s]?.label || s}
              <span className="ar-status-n">{n}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Filter / sort toolbar ─────────────────────────────────────────── */}
      <div className="ar-toolbar">
        <div className="ar-filters">
          <select
            value={filters.reason}
            onChange={e => setFilter('reason', e.target.value)}
            className="ar-select"
          >
            <option value="">All reasons</option>
            {Object.entries(REASON_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>

          <select
            value={filters.reportType}
            onChange={e => setFilter('reportType', e.target.value)}
            className="ar-select"
          >
            <option value="">All types</option>
            {['post', 'comment', 'message', 'user'].map(t => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>

        <div className="ar-sort-group">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`ar-sort-btn ${filters.sort === opt.value ? 'ar-sort-active' : ''}`}
              onClick={() => setFilter('sort', opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── List ──────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="ar-loading">
          <div className="ar-spinner" />
          Loading reports…
        </div>
      ) : reports.length === 0 ? (
        <div className="ar-empty">
          <div className="ar-empty-icon">✓</div>
          <p>No reports match the current filters.</p>
        </div>
      ) : (
        <>
          <div className="ar-list">
            {reports.map(report => (
              <ReportCard
                key={report._id}
                report={report}
                isExpanded={expanded === report._id}
                onToggle={() => setExpanded(expanded === report._id ? null : report._id)}
                onAction={handleAction}
                loading={actionLoading === report._id}
              />
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="ar-pagination">
              <button
                className="ar-page-btn"
                disabled={pagination.page <= 1}
                onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}
              >
                ← Prev
              </button>
              <span className="ar-page-info">
                {pagination.page} / {pagination.pages}
              </span>
              <button
                className="ar-page-btn"
                disabled={pagination.page >= pagination.pages}
                onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}
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

// ── ReportCard ────────────────────────────────────────────────────────────────

function ReportCard({ report, isExpanded, onToggle, onAction, loading }) {
  const sev        = SEVERITY_META[report.severityLabel] || SEVERITY_META.low;
  const statusMeta = STATUS_META[report.status] || {};
  const isActive   = ['pending', 'reviewing'].includes(report.status);

  return (
    <div className={`ar-card ar-sev-${report.severityLabel || 'low'}`}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="ar-card-head">
        <div className="ar-badges">
          <span className="ar-badge ar-badge-type">{report.reportType}</span>

          <span
            className="ar-badge ar-badge-status"
            style={{ color: statusMeta.color, borderColor: `${statusMeta.color}44` }}
          >
            {statusMeta.label || report.status}
          </span>

          <span
            className="ar-badge ar-badge-sev"
            style={{ background: sev.bg, color: sev.color }}
          >
            {sev.label}
          </span>

          {report.targetReportCount > 1 && (
            <span
              className="ar-badge ar-badge-count"
              title={`${report.targetReportCount} active reports on this target`}
            >
              ×{report.targetReportCount} on target
            </span>
          )}
        </div>

        <time className="ar-date">
          {new Date(report.createdAt).toLocaleDateString(undefined, {
            day: 'numeric', month: 'short', year: 'numeric'
          })}
        </time>
      </div>

      {/* ── Reason row ──────────────────────────────────────────────────── */}
      <div className="ar-reason-row">
        <span className="ar-primary-reason">{REASON_LABELS[report.reason] || report.reason}</span>

        {report.groupedReasonCounts && Object.keys(report.groupedReasonCounts).length > 1 && (
          <div className="ar-reason-chips">
            {Object.entries(report.groupedReasonCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([r, n]) => (
                <span key={r} className="ar-chip">
                  {REASON_LABELS[r] || r} <strong>{n}</strong>
                </span>
              ))}
          </div>
        )}
      </div>

      {/* ── Parties ─────────────────────────────────────────────────────── */}
      {report.reportedUser && (
        <div className="ar-reported-user">
          {report.reportedUser.profilePhoto && (
            <OptimizedImage
              src={getImageUrl(report.reportedUser.profilePhoto)}
              alt={report.reportedUser.username}
              className="ar-avatar"
            />
          )}
          <div>
            <span className="ar-username">@{report.reportedUser.username}</span>
            {report.reportedUser.displayName && (
              <span className="ar-display-name"> · {report.reportedUser.displayName}</span>
            )}
            {report.reportedUser.email && (
              <span className="ar-email"> · {report.reportedUser.email}</span>
            )}
          </div>
        </div>
      )}

      {/* ── Reporter's description ───────────────────────────────────────── */}
      {report.description && (
        <blockquote className="ar-desc">"{report.description}"</blockquote>
      )}

      {/* ── Snapshot toggle ──────────────────────────────────────────────── */}
      <button className="ar-toggle" onClick={onToggle}>
        {isExpanded ? '▲ Hide snapshot' : '▼ View content snapshot'}
      </button>

      {isExpanded && <SnapshotPanel report={report} />}

      {/* ── Resolved note ────────────────────────────────────────────────── */}
      {!isActive && report.action && report.action !== 'none' && (
        <div className="ar-resolved-note">
          Action: <strong>{report.action.replace(/_/g, ' ')}</strong>
          {report.reviewedAt && (
            <> · {new Date(report.reviewedAt).toLocaleDateString()}</>
          )}
          {report.reviewNotes && <> · "{report.reviewNotes}"</>}
        </div>
      )}

      {/* ── Actions ─────────────────────────────────────────────────────── */}
      {isActive && (
        <div className="ar-action-bar">
          {report.status === 'pending' && (
            <button
              className="ar-btn ar-btn-review"
              disabled={loading}
              onClick={() => onAction(report._id, 'reviewing', report.action || 'none')}
            >
              {loading ? '…' : 'Start review'}
            </button>
          )}
          <button
            className="ar-btn ar-btn-warn"
            disabled={loading}
            onClick={() => onAction(report._id, 'resolved', 'warning')}
          >
            {loading ? '…' : '⚠ Warning'}
          </button>
          <button
            className="ar-btn ar-btn-remove"
            disabled={loading}
            onClick={() => onAction(report._id, 'resolved', 'content_removed')}
          >
            {loading ? '…' : '🗑 Remove'}
          </button>
          <button
            className="ar-btn ar-btn-suspend"
            disabled={loading}
            onClick={() => onAction(report._id, 'resolved', 'user_suspended')}
          >
            {loading ? '…' : '⏸ Suspend'}
          </button>
          <button
            className="ar-btn ar-btn-ban"
            disabled={loading}
            onClick={() => onAction(report._id, 'resolved', 'user_banned')}
          >
            {loading ? '…' : '🚫 Ban'}
          </button>
          <button
            className="ar-btn ar-btn-dismiss"
            disabled={loading}
            onClick={() => onAction(report._id, 'dismissed', 'none')}
          >
            {loading ? '…' : '✕ Dismiss'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── SnapshotPanel ─────────────────────────────────────────────────────────────

function SnapshotPanel({ report }) {
  const snap = report.contentSnapshot;
  const hasSnap = snap && (snap.text || snap.media?.length || snap.authorUsername);

  if (!hasSnap) {
    // Fallback to live user data for user-type reports
    if (report.reportType === 'user' && report.reportedUser) {
      const u = report.reportedUser;
      return (
        <div className="ar-snapshot">
          <div className="ar-snap-label">User profile</div>
          <div className="ar-snap-author">
            {u.profilePhoto && (
              <OptimizedImage
                src={getImageUrl(u.profilePhoto)}
                alt={u.username}
                className="ar-snap-avatar"
              />
            )}
            <div>
              <span className="ar-username">@{u.username}</span>
              {u.displayName && <span className="ar-display-name"> · {u.displayName}</span>}
            </div>
          </div>
          {u.bio && <p className="ar-snap-text">{u.bio}</p>}
        </div>
      );
    }
    return (
      <div className="ar-snapshot ar-snap-empty">
        Content snapshot not available for this report.
      </div>
    );
  }

  return (
    <div className="ar-snapshot">
      <div className="ar-snap-label">
        Content at time of report
        {snap.metadata?.isReply && (
          <span className="ar-reply-tag">nested reply</span>
        )}
      </div>
      {snap.authorUsername && (
        <div className="ar-snap-author">
          <span className="ar-username">@{snap.authorUsername}</span>
          {snap.authorDisplayName && snap.authorDisplayName !== snap.authorUsername && (
            <span className="ar-display-name"> · {snap.authorDisplayName}</span>
          )}
          {snap.createdAt && (
            <span className="ar-snap-date">
              {' · '}{new Date(snap.createdAt).toLocaleDateString()}
            </span>
          )}
        </div>
      )}
      {snap.text && <p className="ar-snap-text">{snap.text}</p>}
      {snap.media?.length > 0 && (
        <div className="ar-snap-media">
          {snap.media.slice(0, 4).map((url, i) => (
            <img key={i} src={getImageUrl(url)} alt="Reported media" className="ar-snap-img" />
          ))}
          {snap.media.length > 4 && (
            <span className="ar-snap-more">+{snap.media.length - 4} more</span>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminReports;
