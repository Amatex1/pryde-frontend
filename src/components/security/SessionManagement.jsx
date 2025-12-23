import { useState, useEffect } from 'react';
import api from '../../utils/api';
import CustomModal from '../CustomModal';
import { useModal } from '../../hooks/useModal';
import './SessionManagement.css';

function SessionManagement() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [expandedSessions, setExpandedSessions] = useState({});
  const { modalState, closeModal, showConfirm } = useModal();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/sessions');
      // Safe array default to prevent undefined errors
      setSessions(response.data?.sessions ?? []);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      setMessage('Failed to load active sessions');
      // Set empty array on error to prevent crashes
      setSessions([]);
    } finally {
      // CRITICAL: Always set loading to false to prevent infinite loading
      setLoading(false);
    }
  };

  // Deduplicate sessions by device fingerprint (browser + OS + IP)
  // Keep the most recent session in each group, preserve current session
  const dedupeSessionsByFingerprint = (sessionList) => {
    // Safe array handling - return empty array if input is invalid
    if (!Array.isArray(sessionList)) {
      return [];
    }

    const fingerprints = {};

    sessionList.forEach(session => {
      const fingerprint = `${session.browser}-${session.os}-${session.ipAddress}`;

      // Always keep current session
      if (session.isCurrent) {
        fingerprints[fingerprint] = session;
        return;
      }

      // Keep the most recent session for each fingerprint
      if (!fingerprints[fingerprint] ||
          new Date(session.lastActive) > new Date(fingerprints[fingerprint].lastActive)) {
        // Don't overwrite current session
        if (!fingerprints[fingerprint]?.isCurrent) {
          fingerprints[fingerprint] = session;
        }
      }
    });

    return Object.values(fingerprints);
  };

  const toggleSessionExpand = (sessionId) => {
    setExpandedSessions(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId]
    }));
  };

  const handleLogoutSession = async (sessionId) => {
    try {
      await api.delete(`/sessions/${sessionId}`);
      setMessage('Session logged out successfully');
      fetchSessions();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to logout session:', error);
      setMessage('Failed to logout session');
    }
  };

  const handleLogoutOthers = async () => {
    try {
      await api.post('/sessions/logout-others');
      setMessage('All other sessions logged out successfully');
      fetchSessions();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to logout other sessions:', error);
      setMessage('Failed to logout other sessions');
    }
  };

  const handleLogoutAll = async () => {
    const confirmed = await showConfirm(
      'This will log you out from ALL devices, including this one. You will need to log in again.',
      'Logout All Sessions',
      'Logout All',
      'Cancel'
    );

    if (!confirmed) return;

    try {
      await api.post('/sessions/logout-all');
      // Redirect to login page
      window.location.href = '/login';
    } catch (error) {
      console.error('Failed to logout all sessions:', error);
      setMessage('Failed to logout all sessions');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
    });
  };

  const getDeviceIcon = (browser, os) => {
    // OS icons
    if (os.includes('Windows')) return '🖥️';
    if (os.includes('Mac')) return '💻';
    if (os.includes('Linux')) return '🐧';
    if (os.includes('Android')) return '📱';
    if (os.includes('iOS')) return '📱';
    
    // Browser icons as fallback
    if (browser.includes('Chrome')) return '🌐';
    if (browser.includes('Firefox')) return '🦊';
    if (browser.includes('Safari')) return '🧭';
    if (browser.includes('Edge')) return '🌊';
    
    return '💻';
  };

  // Deduplicate sessions for display
  const uniqueSessions = dedupeSessionsByFingerprint(sessions);

  if (loading) {
    return <div className="sessions-loading">Loading active sessions...</div>;
  }

  return (
    <div className="session-management">
      {message && (
        <div className={`session-message ${message.includes('success') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {uniqueSessions.length > 1 && (
        <div className="session-actions">
          <button onClick={handleLogoutOthers} className="btn-ghost">
            Logout Other Sessions
          </button>
          <button onClick={handleLogoutAll} className="btn-danger-primary">
            Logout All Sessions
          </button>
        </div>
      )}

      <div className="sessions-list">
        {uniqueSessions.map((session) => (
          <div
            key={session.sessionId}
            className={`session-card ${session.isCurrent ? 'current-session' : ''}`}
          >
            <div className="session-header">
              <div className="session-icon">
                {getDeviceIcon(session.browser, session.os)}
              </div>
              <div className="session-info">
                <div className="session-device">
                  <strong>{session.browser}</strong> on {session.os}
                  {session.isCurrent && (
                    <span className="current-badge">Current</span>
                  )}
                </div>
                <div className="session-meta">
                  <span className="session-ip">{session.ipAddress}</span>
                  <span className="session-separator">•</span>
                  <span className="session-time-compact">Active {formatDate(session.lastActive)}</span>
                </div>

                {/* Expandable details */}
                <button
                  className="session-expand-btn"
                  onClick={() => toggleSessionExpand(session.sessionId)}
                >
                  {expandedSessions[session.sessionId] ? '▼ Hide details' : '▶ Show details'}
                </button>

                {expandedSessions[session.sessionId] && (
                  <div className="session-expanded-details">
                    {session.location?.city && (
                      <div className="session-detail-row">
                        <span className="detail-label">Location:</span>
                        <span>{session.location.city}, {session.location.country}</span>
                      </div>
                    )}
                    <div className="session-detail-row">
                      <span className="detail-label">Created:</span>
                      <span>{formatDate(session.createdAt)}</span>
                    </div>
                  </div>
                )}
              </div>
              {!session.isCurrent && (
                <button
                  onClick={() => handleLogoutSession(session.sessionId)}
                  className="btn-logout-session-ghost"
                  title="Logout this session"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {uniqueSessions.length === 0 && (
        <div className="no-sessions">
          <p>No active sessions found.</p>
        </div>
      )}

      <CustomModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        onConfirm={modalState.onConfirm}
      />
    </div>
  );
}

export default SessionManagement;

