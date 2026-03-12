import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import CustomModal from '../../components/CustomModal';
import ModerationV3Panel from '../../components/admin/ModerationV3Panel';
import { useModal } from '../../hooks/useModal';
import api from '../../utils/api';
import { getCurrentUser } from '../../utils/auth';
import { getSocket, setupSocketListeners } from '../../utils/socketHelpers';
import AdminDashboard from './AdminDashboard';
import AdminUsers from './AdminUsers';
import AdminReports from './AdminReports';
import AdminBlocks from './AdminBlocks';
import AdminActivity from './AdminActivity';
import AdminSecurity from './AdminSecurity';
import AdminBadges from './AdminBadges';
import AdminModeration from './AdminModeration';
import AdminEmails from './AdminEmails';
import './Admin.css';
import '../../styles/admin-layout.css';

/**
 * AdminPage - Main Admin container and tab router
 * 
 * This component acts as the container for all admin sections.
 * It manages:
 * - Tab state and URL synchronization
 * - Real-time socket listeners
 * - Authentication and authorization
 * - Common modal handlers
 * 
 * Individual tabs are rendered as separate components for better maintainability.
 */
function AdminPage() {
  const { modalState, closeModal, showAlert, showConfirm, showPrompt } = useModal();
  const location = useLocation();
  const navigate = useNavigate();
  const { onMenuOpen } = useOutletContext() || {};

  // Get tab from URL or default to dashboard
  const getTabFromUrl = () => {
    const params = new URLSearchParams(location.search);
    return params.get('tab') || 'dashboard';
  };

  // Core state
  const [activeTab, setActiveTab] = useState(getTabFromUrl());
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [activity, setActivity] = useState(null);
  const [securityLogs, setSecurityLogs] = useState([]);
  const [securityStats, setSecurityStats] = useState(null);
  const [badges, setBadges] = useState([]);
  const [moderationSettings, setModerationSettings] = useState(null);
  const [moderationHistory, setModerationHistory] = useState([]);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState(null);
  const [maintenanceStatus, setMaintenanceStatus] = useState(null);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const listenersSetUpRef = useRef(false);

  // Effect: Check admin access on mount
  useEffect(() => {
    checkAdminAccess();
  }, []);

  // Effect: Load tab data when tab or user changes
  useEffect(() => {
    if (currentUser) {
      loadTabData();
    }
  }, [activeTab, currentUser]);

  // Effect: Sync tab with URL
  useEffect(() => {
    const tab = getTabFromUrl();
    if (tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [location.search]);

  // Effect: Set up real-time socket listeners
  useEffect(() => {
    if (listenersSetUpRef.current) return;

    const cleanupFunctions = [];

    const setupListeners = (socket) => {
      if (!socket) return;

      const handleUserCreated = (data) => {
        console.log('[Pryde] Real-time user created:', data);
        if (activeTab === 'users') {
          setUsers((prevUsers) => [data.user, ...prevUsers]);
        }
        if (activeTab === 'dashboard' && stats) {
          setStats((prevStats) => ({
            ...prevStats,
            totalUsers: prevStats.totalUsers + 1
          }));
        }
      };

      const handleUserDeactivated = (data) => {
        setUsers((prevUsers) =>
          prevUsers.map(u => u._id === data.userId ? { ...u, isActive: false } : u)
        );
      };

      const handleUserReactivated = (data) => {
        setUsers((prevUsers) =>
          prevUsers.map(u => u._id === data.userId ? { ...u, isActive: true } : u)
        );
      };

      const handleUserDeleted = (data) => {
        setUsers((prevUsers) => prevUsers.filter(u => u._id !== data.userId));
        if (activeTab === 'dashboard' && stats) {
          setStats((prevStats) => ({
            ...prevStats,
            totalUsers: prevStats.totalUsers - 1
          }));
        }
      };

      const handleUserSuspended = (data) => {
        setUsers((prevUsers) =>
          prevUsers.map(u => u._id === data.userId ? { ...u, isSuspended: true } : u)
        );
      };

      const handleUserUnsuspended = (data) => {
        setUsers((prevUsers) =>
          prevUsers.map(u => u._id === data.userId ? { ...u, isSuspended: false } : u)
        );
      };

      const handleUserBanned = (data) => {
        setUsers((prevUsers) =>
          prevUsers.map(u => u._id === data.userId ? { ...u, isBanned: true } : u)
        );
      };

      const handleUserUnbanned = (data) => {
        setUsers((prevUsers) =>
          prevUsers.map(u => u._id === data.userId ? { ...u, isBanned: false } : u)
        );
      };

      // Register all listeners
      socket.on('user_created', handleUserCreated);
      socket.on('user_deactivated', handleUserDeactivated);
      socket.on('user_reactivated', handleUserReactivated);
      socket.on('user_deleted', handleUserDeleted);
      socket.on('user_suspended', handleUserSuspended);
      socket.on('user_unsuspended', handleUserUnsuspended);
      socket.on('user_banned', handleUserBanned);
      socket.on('user_unbanned', handleUserUnbanned);

      // Collect cleanup functions
      cleanupFunctions.push(() => socket.off('user_created', handleUserCreated));
      cleanupFunctions.push(() => socket.off('user_deactivated', handleUserDeactivated));
      cleanupFunctions.push(() => socket.off('user_reactivated', handleUserReactivated));
      cleanupFunctions.push(() => socket.off('user_deleted', handleUserDeleted));
      cleanupFunctions.push(() => socket.off('user_suspended', handleUserSuspended));
      cleanupFunctions.push(() => socket.off('user_unsuspended', handleUserUnsuspended));
      cleanupFunctions.push(() => socket.off('user_banned', handleUserBanned));
      cleanupFunctions.push(() => socket.off('user_unbanned', handleUserUnbanned));
    };

    listenersSetUpRef.current = true;

    const cancelSocketRetry = setupSocketListeners((socket) => {
      setupListeners(socket);
    });

    return () => {
      cancelSocketRetry();
      cleanupFunctions.forEach(cleanup => cleanup?.());
    };
  }, [activeTab, stats]);

  // Handle tab change with URL sync
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/admin?tab=${tab}`);
  };

  // Check admin access
  const checkAdminAccess = async () => {
    try {
      const user = getCurrentUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const response = await api.get('/admin/stats');
      setCurrentUser(user);
      setStats(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Admin access denied:', error);

      if (error.response?.status === 403) {
        setError('Access denied. You need admin privileges to access this page.');
      } else if (error.response?.status === 404) {
        setError('Admin routes not found. Please make sure the backend is updated and deployed.');
      } else if (error.message === 'Network Error') {
        setError('Cannot connect to server. Please check if the backend is running.');
      } else {
        setError(`Error: ${error.response?.data?.message || error.message}`);
      }

      setLoading(false);
      setTimeout(() => navigate('/'), 5000);
    }
  };

  // Load data for active tab
  const loadTabData = async () => {
    try {
      if (activeTab === 'dashboard') {
        const response = await api.get('/admin/stats');
        setStats(response.data);
      } else if (activeTab === 'reports') {
        const response = await api.get('/admin/reports?status=pending');
        setReports(response.data.reports);
      } else if (activeTab === 'users') {
        const [usersResponse, badgesResponse] = await Promise.all([
          api.get('/admin/users'),
          api.get('/badges/admin/catalog').catch(() => api.get('/badges'))
        ]);
        setUsers(usersResponse.data.users);
        const allBadges = badgesResponse.data?.automatic?.badges
          ? [...(badgesResponse.data.automatic.badges || []), ...(badgesResponse.data.manual.badges || [])]
          : (badgesResponse.data || []);
        setBadges(allBadges);
      } else if (activeTab === 'blocks') {
        const response = await api.get('/admin/blocks');
        setBlocks(response.data.blocks);
      } else if (activeTab === 'activity') {
        const response = await api.get('/admin/activity?days=7');
        setActivity(response.data);
      } else if (activeTab === 'security') {
        const response = await api.get('/admin/security-logs?limit=50');
        setSecurityLogs(response.data.logs);
        setSecurityStats(response.data.stats);
      } else if (activeTab === 'badges') {
        try {
          const response = await api.get('/badges/admin/catalog');
          const allBadges = [...(response.data?.automatic?.badges || []), ...(response.data?.manual?.badges || [])];
          setBadges(allBadges);
        } catch {
          const response = await api.get('/badges');
          setBadges(response.data || []);
        }
      } else if (activeTab === 'moderation') {
        const [settingsRes, historyRes] = await Promise.all([
          api.get('/admin/moderation/settings'),
          api.get('/admin/moderation/history?limit=50')
        ]);
        setModerationSettings(settingsRes.data);
        setModerationHistory(historyRes.data.history || []);
      } else if (activeTab === 'maintenance') {
        try {
          const response = await api.get('/admin/debug/maintenance/status');
          setMaintenanceStatus(response.data);
        } catch {
          setMaintenanceStatus({ enabled: false, message: null });
        }
      }
    } catch (error) {
      console.error('Load data error:', error);
      setError('Failed to load data');
    }
  };

  // Handle view post (for activity tab)
  const handleViewPost = async (postId) => {
    try {
      const response = await api.get(`/admin/posts?postId=${postId}`);
      // TODO: Show post modal - extract to component
      console.log('Post:', response.data);
    } catch (error) {
      console.error('Error fetching post:', error);
      showAlert('Error', 'Failed to load post details');
    }
  };

  // Report handlers
  const handleResolveReport = async (reportId, status, action) => {
    try {
      await api.put(`/admin/reports/${reportId}`, { status, action, reviewNotes: 'Reviewed by admin' });
      showAlert('Report updated successfully', 'Success');
      loadTabData();
    } catch (error) {
      console.error('Resolve report error:', error);
      showAlert('Failed to update report', 'Error');
    }
  };

  // User management handlers
  const handleSuspendUser = async (userId) => {
    const days = await showPrompt('Suspend for how many days?', 'Suspend User', 'Number of days', '7', 'number');
    if (!days) return;
    const reason = await showPrompt('Reason for suspension:', 'Suspension Reason', 'Enter reason', 'Violation of Terms of Service');
    if (!reason) return;

    try {
      await api.put(`/admin/users/${userId}/suspend`, { days: parseInt(days), reason });
      showAlert('User suspended successfully', 'Success');
      loadTabData();
    } catch (error) {
      console.error('Suspend user error:', error);
      showAlert(error.response?.data?.message || 'Failed to suspend user', 'Error');
    }
  };

  const handleBanUser = async (userId) => {
    const confirmed = await showConfirm('Are you sure you want to permanently ban this user?', 'Ban User', 'Ban', 'Cancel');
    if (!confirmed) return;
    const reason = await showPrompt('Reason for ban:', 'Ban Reason', 'Enter reason', 'Severe violation of Terms of Service');
    if (!reason) return;

    try {
      await api.put(`/admin/users/${userId}/ban`, { reason });
      showAlert('User banned successfully', 'Success');
      loadTabData();
    } catch (error) {
      console.error('Ban user error:', error);
      showAlert(error.response?.data?.message || 'Failed to ban user', 'Error');
    }
  };

  const handleUnsuspendUser = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/unsuspend`);
      showAlert('User unsuspended successfully', 'Success');
      loadTabData();
    } catch (error) {
      console.error('Unsuspend user error:', error);
      showAlert('Failed to unsuspend user', 'Error');
    }
  };

  const handleUnbanUser = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/unban`);
      showAlert('User unbanned successfully', 'Success');
      loadTabData();
    } catch (error) {
      console.error('Unban user error:', error);
      showAlert('Failed to unban user', 'Error');
    }
  };

  const handleUnlockUser = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/unlock`);
      showAlert('User account unlocked successfully', 'Success');
      loadTabData();
    } catch (error) {
      console.error('Unlock user error:', error);
      showAlert('Failed to unlock user account', 'Error');
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    const confirmed = await showConfirm(
      `Are you sure you want to change this user's role to ${newRole}?`,
      'Change User Role', 'Change Role', 'Cancel'
    );
    if (!confirmed) return;

    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      showAlert(`User role changed to ${newRole} successfully`, 'Success');
      loadTabData();
    } catch (error) {
      console.error('Change role error:', error);
      showAlert(error.response?.data?.message || 'Failed to change user role', 'Error');
    }
  };

  const handleSendPasswordReset = async (userId, userEmail, username) => {
    const confirmed = await showConfirm(`Send password reset link to ${userEmail}?`, 'Send Password Reset', 'Send Link', 'Cancel');
    if (!confirmed) return;

    try {
      const response = await api.post(`/admin/users/${userId}/send-reset-link`);
      showAlert(`Password reset link sent to ${response.data.email}`, 'Success');
    } catch (error) {
      console.error('Send password reset error:', error);
      showAlert(error.response?.data?.message || 'Failed to send password reset link', 'Error');
    }
  };

  const handleUpdateEmail = async (userId, currentEmail, username) => {
    const newEmail = await showPrompt(`Update email for @${username}:`, 'Update User Email', 'New email address', currentEmail);
    if (!newEmail || newEmail === currentEmail) return;

    if (!newEmail.includes('@') || !newEmail.includes('.')) {
      showAlert('Please enter a valid email address', 'Error');
      return;
    }

    const confirmed = await showConfirm(`Change email from ${currentEmail} to ${newEmail}?`, 'Confirm Email Change', 'Update Email', 'Cancel');
    if (!confirmed) return;

    try {
      await api.put(`/admin/users/${userId}/email`, { newEmail });
      showAlert('Email updated successfully. Notifications sent to both addresses.', 'Success');
      loadTabData();
    } catch (error) {
      console.error('Update email error:', error);
      showAlert(error.response?.data?.message || 'Failed to update email', 'Error');
    }
  };

  const handleAssignBadge = async (userId, badgeId, reason) => {
    try {
      await api.post('/badges/admin/assign', { userId, badgeId, reason });
      showAlert('Badge assigned successfully', 'Success');
      if (activeTab === 'users') loadTabData();
    } catch (error) {
      console.error('Assign badge error:', error);
      showAlert(error.response?.data?.message || 'Failed to assign badge', 'Error');
    }
  };

  const handleRevokeBadge = async (userId, badgeId) => {
    const confirmed = await showConfirm('Are you sure you want to revoke this badge?', 'Revoke Badge', 'Revoke', 'Cancel');
    if (!confirmed) return;

    try {
      await api.post('/badges/admin/revoke', { userId, badgeId });
      showAlert('Badge revoked successfully', 'Success');
      if (activeTab === 'users') loadTabData();
    } catch (error) {
      console.error('Revoke badge error:', error);
      showAlert(error.response?.data?.message || 'Failed to revoke badge', 'Error');
    }
  };

  const handleResolveSecurityLog = async (logId) => {
    const notes = await showPrompt('Add notes (optional):', 'Resolve Security Log', 'Notes', '');
    try {
      await api.put(`/admin/security-logs/${logId}/resolve`, { notes });
      showAlert('Security log marked as resolved', 'Success');
      loadTabData();
    } catch (error) {
      console.error('Resolve security log error:', error);
      showAlert('Failed to resolve security log', 'Error');
    }
  };

  // Broadcast handler
  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) return;
    const confirmed = await showConfirm(
      `Send "@everyone" announcement to ALL active users?\n\nMessage: "${broadcastMessage.trim()}"`,
      'Send @everyone Announcement', 'Send Announcement', 'Cancel'
    );
    if (!confirmed) return;

    setBroadcastSending(true);
    setBroadcastResult(null);
    try {
      const response = await api.post('/admin/broadcast', { message: broadcastMessage.trim() });
      setBroadcastResult({ success: true, notified: response.data.notified });
      setBroadcastMessage('');
    } catch (error) {
      console.error('Broadcast error:', error);
      setBroadcastResult({ success: false, error: error.response?.data?.message || 'Failed to send announcement' });
    } finally {
      setBroadcastSending(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="page-container">
        <Navbar onMenuClick={onMenuOpen} />
        <div className="admin-loading">🔒 Verifying admin access...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="page-container">
        <Navbar onMenuClick={onMenuOpen} />
        <div className="admin-error">
          <h2>⛔ {error}</h2>
          <p>Redirecting to home...</p>
        </div>
      </div>
    );
  }

  const handleNavClick = (tab) => {
    handleTabChange(tab);
    setSidebarOpen(false);
  };

  // Render sidebar
  const renderSidebar = () => (
    <>
      <div className="admin-section">
        <div className="admin-section-title">Overview</div>
        <button className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => handleNavClick('dashboard')}>📊 Dashboard</button>
        <button className={`admin-nav-item ${activeTab === 'activity' ? 'active' : ''}`} onClick={() => handleNavClick('activity')}>📈 Activity</button>
      </div>

      <div className="admin-section">
        <div className="admin-section-title">Moderation</div>
        <button className={`admin-nav-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => handleNavClick('reports')}>🚩 Reports</button>
        <button className={`admin-nav-item ${activeTab === 'moderation-v3' ? 'active' : ''}`} onClick={() => handleNavClick('moderation-v3')}>🛡️ Moderation V5</button>
        <button className={`admin-nav-item ${activeTab === 'blocks' ? 'active' : ''}`} onClick={() => handleNavClick('blocks')}>🚫 Blocks</button>
      </div>

      <div className="admin-section">
        <div className="admin-section-title">User Management</div>
        <button className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => handleNavClick('users')}>👥 Users</button>
        <button className={`admin-nav-item ${activeTab === 'badges' ? 'active' : ''}`} onClick={() => handleNavClick('badges')}>🏅 Badges</button>
      </div>

      <div className="admin-section">
        <div className="admin-section-title">Platform & Security</div>
        <button className={`admin-nav-item ${activeTab === 'security' ? 'active' : ''}`} onClick={() => handleNavClick('security')}>🔒 Security</button>
        <button className={`admin-nav-item ${activeTab === 'emails' ? 'active' : ''}`} onClick={() => handleNavClick('emails')}>📧 Emails</button>
        <button className={`admin-nav-item ${activeTab === 'maintenance' ? 'active' : ''}`} onClick={() => handleNavClick('maintenance')}>🔧 Maintenance</button>
      </div>

      {currentUser?.role === 'super_admin' && (
        <div className="admin-section">
          <div className="admin-section-title">Announcements</div>
          <button className={`admin-nav-item ${activeTab === 'broadcast' ? 'active' : ''}`} onClick={() => handleNavClick('broadcast')}>📢 @everyone Broadcast</button>
        </div>
      )}
    </>
  );

  // Render selected tab content
  const renderSelectedTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return stats && <AdminDashboard stats={stats} />;
      
      case 'reports':
        return <AdminReports reports={reports} onResolve={handleResolveReport} />;
      
      case 'users':
        return (
          <AdminUsers
            users={users}
            badges={badges}
            onSuspend={handleSuspendUser}
            onBan={handleBanUser}
            onUnsuspend={handleUnsuspendUser}
            onUnban={handleUnbanUser}
            onUnlock={handleUnlockUser}
            onChangeRole={handleChangeRole}
            onSendPasswordReset={handleSendPasswordReset}
            onUpdateEmail={handleUpdateEmail}
            onAssignBadge={handleAssignBadge}
            onRevokeBadge={handleRevokeBadge}
          />
        );
      
      case 'blocks':
        return <AdminBlocks blocks={blocks} />;
      
      case 'activity':
        return activity && <AdminActivity activity={activity} onViewPost={handleViewPost} />;
      
      case 'security':
        return loading ? (
          <div className="loading-state">
            <div className="shimmer" style={{ height: '100px', borderRadius: '12px', marginBottom: '1rem' }}></div>
            <div className="shimmer" style={{ height: '60px', borderRadius: '12px', marginBottom: '1rem' }}></div>
          </div>
        ) : (
          <AdminSecurity logs={securityLogs} stats={securityStats} onResolve={handleResolveSecurityLog} />
        );
      
      case 'badges':
        return <AdminBadges badges={badges} onRefresh={loadTabData} />;
      
      case 'moderation':
        return (
          <AdminModeration
            settings={moderationSettings}
            history={moderationHistory}
            onRefresh={loadTabData}
            showAlert={showAlert}
            showConfirm={showConfirm}
            showPrompt={showPrompt}
          />
        );
      
      case 'emails':
        return <AdminEmails />;

      case 'moderation-v3':
        return <ModerationV3Panel showAlert={showAlert} showConfirm={showConfirm} />;
      
      case 'maintenance':
        return (
          <section id="content-maintenance" aria-labelledby="tab-maintenance">
            <div className="admin-tab-content">
              <h2 className="admin-section-heading">🔧 Maintenance Mode</h2>
              <p className="admin-section-description">
                Enable maintenance mode to temporarily redirect all users to a maintenance page.
              </p>
              <div style={{ background: 'var(--card-surface)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', border: `2px solid ${maintenanceStatus?.enabled ? 'var(--color-danger)' : 'var(--color-success)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '2rem' }}>{maintenanceStatus?.enabled ? '🚫' : '✅'}</span>
                  <div>
                    <h3 style={{ margin: 0 }}>{maintenanceStatus?.enabled ? 'Maintenance Mode Active' : 'Site is Live'}</h3>
                  </div>
                </div>
              </div>
              <button
                onClick={async () => {
                  setMaintenanceLoading(true);
                  try {
                    if (maintenanceStatus?.enabled) {
                      await api.post('/admin/debug/maintenance/disable');
                      setMaintenanceStatus({ enabled: false, message: null });
                    } else {
                      const message = await showPrompt('Enter a message:', 'Enable Maintenance Mode', 'Message', 'Maintenance in progress');
                      await api.post('/admin/debug/maintenance/enable', { message: message || undefined });
                      setMaintenanceStatus({ enabled: true, message });
                    }
                    showAlert('Maintenance mode updated', 'Success');
                  } catch (error) {
                    showAlert('Failed to update maintenance mode', 'Error');
                  } finally {
                    setMaintenanceLoading(false);
                  }
                }}
                disabled={maintenanceLoading}
                style={{
                  padding: '1rem 2rem',
                  background: maintenanceStatus?.enabled ? 'var(--color-success)' : 'var(--color-danger)',
                  color: 'var(--color-surface)', border: 'none', borderRadius: '12px', cursor: maintenanceLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {maintenanceLoading ? 'Loading...' : maintenanceStatus?.enabled ? '🟢 Disable' : '🔴 Enable'}
              </button>
            </div>
          </section>
        );
      
      case 'broadcast':
        if (currentUser?.role !== 'super_admin') return null;
        return (
          <section id="content-broadcast">
            <div className="admin-tab-content">
              <h2 className="admin-section-heading">📢 @everyone Announcement</h2>
              <div className="broadcast-form">
                <div className="broadcast-field">
                  <textarea
                    className="broadcast-textarea"
                    placeholder="Write your announcement here..."
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    rows={4}
                    disabled={broadcastSending}
                  />
                </div>
                {broadcastResult && (
                  <div className={`broadcast-result ${broadcastResult.success ? 'broadcast-result--success' : 'broadcast-result--error'}`}>
                    {broadcastResult.success ? `Delivered to ${broadcastResult.notified} users.` : `Error: ${broadcastResult.error}`}
                  </div>
                )}
                <button className="broadcast-send-btn" onClick={handleBroadcast} disabled={broadcastSending || !broadcastMessage.trim()}>
                  {broadcastSending ? 'Sending...' : 'Send @everyone Announcement'}
                </button>
              </div>
            </div>
          </section>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="page-container">
      <Navbar onMenuClick={onMenuOpen} />
      <div className="admin-layout">
        <button className="admin-mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle navigation">
          {sidebarOpen ? '✕' : '☰'} Menu
        </button>

        <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
          {renderSidebar()}
        </aside>

        {sidebarOpen && <div className="admin-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

        <main className="admin-content">
          {renderSelectedTab()}
        </main>
      </div>

      <CustomModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        placeholder={modalState.placeholder}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        onConfirm={modalState.onConfirm}
        inputType={modalState.inputType}
        defaultValue={modalState.defaultValue}
      />
    </div>
  );
}

export default AdminPage;

