import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import './PlatformBrain.css';

/**
 * PlatformBrain — Admin aggregated platform signal dashboard.
 *
 * Sections:
 *   1. Community Activity
 *   2. Feed Intelligence
 *   3. Moderation Signals
 *   4. Trust Signals
 *   5. Discovery
 *   6. Notifications
 */
function PlatformBrain() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/platform-brain');
      setStats(res.data);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load Platform Brain stats.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="pb-root">
        <div className="pb-header">
          <h2 className="pb-title">🧠 Platform Brain</h2>
        </div>
        <div className="pb-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="pb-card pb-card--skeleton">
              <div className="pb-skeleton pb-skeleton--title" />
              <div className="pb-skeleton pb-skeleton--row" />
              <div className="pb-skeleton pb-skeleton--row pb-skeleton--short" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pb-root">
        <div className="pb-header">
          <h2 className="pb-title">🧠 Platform Brain</h2>
        </div>
        <div className="pb-error">
          <span className="pb-error__icon">⚠️</span>
          <p>{error}</p>
          <button className="pb-refresh-btn" onClick={fetchStats}>Retry</button>
        </div>
      </div>
    );
  }

  const {
    communityActivity,
    feedIntelligence,
    moderationSignals,
    trustSignals,
    discovery,
    notifications,
    platform,
    generatedAt,
  } = stats;

  return (
    <div className="pb-root">
      <div className="pb-header">
        <div className="pb-header__left">
          <h2 className="pb-title">🧠 Platform Brain</h2>
          <span className="pb-subtitle">Aggregated platform signals</span>
        </div>
        <div className="pb-header__right">
          {lastRefresh && (
            <span className="pb-timestamp">
              Updated {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button className="pb-refresh-btn" onClick={fetchStats}>
            ↻ Refresh
          </button>
        </div>
      </div>

      <div className="pb-grid">

        {/* ── Community Activity ─────────────────────────────────── */}
        <div className="pb-card">
          <div className="pb-card__header">
            <span className="pb-card__icon">🌱</span>
            <h3 className="pb-card__title">Community Activity</h3>
            <span className="pb-card__badge pb-card__badge--subtle">24 h</span>
          </div>
          <div className="pb-card__body">
            <div className="pb-stat-row">
              <span className="pb-stat-label">Posts created</span>
              <span className="pb-stat-value">{communityActivity.postsLast24h.toLocaleString()}</span>
            </div>
            <div className="pb-stat-row">
              <span className="pb-stat-label">Comments created</span>
              <span className="pb-stat-value">{communityActivity.commentsLast24h.toLocaleString()}</span>
            </div>
            <div className="pb-stat-row">
              <span className="pb-stat-label">New users</span>
              <span className="pb-stat-value pb-stat-value--accent">{communityActivity.newUsersLast24h.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* ── Feed Intelligence ──────────────────────────────────── */}
        <div className="pb-card">
          <div className="pb-card__header">
            <span className="pb-card__icon">📡</span>
            <h3 className="pb-card__title">Feed Intelligence</h3>
            <span className={`pb-card__badge ${feedIntelligence.redisConnected ? 'pb-card__badge--green' : 'pb-card__badge--red'}`}>
              {feedIntelligence.redisConnected ? 'Redis live' : 'Redis offline'}
            </span>
          </div>
          <div className="pb-card__body">
            <div className="pb-stat-row">
              <span className="pb-stat-label">Trending posts in cache</span>
              <span className="pb-stat-value">
                {feedIntelligence.trendingPostCount !== null
                  ? feedIntelligence.trendingPostCount.toLocaleString()
                  : <span className="pb-stat-na">N/A</span>}
              </span>
            </div>
            <div className="pb-stat-row">
              <span className="pb-stat-label">Cache layer</span>
              <span className="pb-stat-value">{feedIntelligence.redisConnected ? 'Active' : 'Bypassed'}</span>
            </div>
          </div>
        </div>

        {/* ── Moderation Signals ─────────────────────────────────── */}
        <div className={`pb-card ${moderationSignals.totalQueued > 0 ? 'pb-card--warn' : ''}`}>
          <div className="pb-card__header">
            <span className="pb-card__icon">🚩</span>
            <h3 className="pb-card__title">Moderation Signals</h3>
            {moderationSignals.totalQueued > 0 && (
              <span className="pb-card__badge pb-card__badge--orange">
                {moderationSignals.totalQueued} queued
              </span>
            )}
          </div>
          <div className="pb-card__body">
            <div className="pb-stat-row">
              <span className="pb-stat-label">Pending reports</span>
              <span className={`pb-stat-value ${moderationSignals.pendingReports > 0 ? 'pb-stat-value--warn' : ''}`}>
                {moderationSignals.pendingReports.toLocaleString()}
              </span>
            </div>
            <div className="pb-stat-row">
              <span className="pb-stat-label">Under review</span>
              <span className="pb-stat-value">{moderationSignals.reviewingReports.toLocaleString()}</span>
            </div>
            <div className="pb-stat-row pb-stat-row--total">
              <span className="pb-stat-label">Total queued</span>
              <span className="pb-stat-value pb-stat-value--bold">{moderationSignals.totalQueued.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* ── Trust Signals ──────────────────────────────────────── */}
        <div className={`pb-card ${trustSignals.unresolvedMinorSignals > 0 ? 'pb-card--danger' : ''}`}>
          <div className="pb-card__header">
            <span className="pb-card__icon">🛡️</span>
            <h3 className="pb-card__title">Trust Signals</h3>
            {trustSignals.unresolvedMinorSignals > 0 && (
              <span className="pb-card__badge pb-card__badge--red">
                Action needed
              </span>
            )}
          </div>
          <div className="pb-card__body">
            <div className="pb-stat-row">
              <span className="pb-stat-label">Unresolved minor signals</span>
              <span className={`pb-stat-value ${trustSignals.unresolvedMinorSignals > 0 ? 'pb-stat-value--danger' : 'pb-stat-value--green'}`}>
                {trustSignals.unresolvedMinorSignals.toLocaleString()}
              </span>
            </div>
            <div className="pb-stat-row">
              <span className="pb-stat-label">Active users (non-suspended)</span>
              <span className="pb-stat-value">{platform.nonSuspendedUsers.toLocaleString()}</span>
            </div>
            <div className="pb-stat-row">
              <span className="pb-stat-label">Total active accounts</span>
              <span className="pb-stat-value">{platform.totalActiveUsers.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* ── Discovery ─────────────────────────────────────────── */}
        <div className="pb-card">
          <div className="pb-card__header">
            <span className="pb-card__icon">🔭</span>
            <h3 className="pb-card__title">Discovery</h3>
          </div>
          <div className="pb-card__body">
            <div className="pb-stat-row">
              <span className="pb-stat-label">Trending pool size</span>
              <span className="pb-stat-value">
                {discovery.trendingPostCount !== null
                  ? discovery.trendingPostCount.toLocaleString()
                  : <span className="pb-stat-na">Cache unavailable</span>}
              </span>
            </div>
            <div className="pb-stat-row">
              <span className="pb-stat-label">New content today</span>
              <span className="pb-stat-value">{communityActivity.postsLast24h.toLocaleString()} posts</span>
            </div>
          </div>
        </div>

        {/* ── Notifications ─────────────────────────────────────── */}
        <div className="pb-card">
          <div className="pb-card__header">
            <span className="pb-card__icon">🔔</span>
            <h3 className="pb-card__title">Notifications</h3>
            <span className="pb-card__badge pb-card__badge--subtle">24 h</span>
          </div>
          <div className="pb-card__body">
            <div className="pb-stat-row">
              <span className="pb-stat-label">Sent last 24 h</span>
              <span className="pb-stat-value">{notifications.sentLast24h.toLocaleString()}</span>
            </div>
            <div className="pb-stat-row">
              <span className="pb-stat-label">Currently unread</span>
              <span className="pb-stat-value">{notifications.currentlyUnread.toLocaleString()}</span>
            </div>
          </div>
        </div>

      </div>

      <p className="pb-generated-at">
        Snapshot generated at {new Date(generatedAt).toLocaleString()}
      </p>
    </div>
  );
}

export default PlatformBrain;
