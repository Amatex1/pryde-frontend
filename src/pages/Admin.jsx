import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link, useOutletContext } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CustomModal from '../components/CustomModal';
import OptimizedImage from '../components/OptimizedImage';
import ModerationV3Panel from '../components/admin/ModerationV3Panel';
import { useModal } from '../hooks/useModal';
import api from '../utils/api';
import { getCurrentUser } from '../utils/auth';
import { getImageUrl } from '../utils/imageUrl';
import { getSocket, setupSocketListeners } from '../utils/socketHelpers';
import './Admin.css';
import '../styles/admin-layout.css';

function Admin() {
  const { modalState, closeModal, showAlert, showConfirm, showPrompt } = useModal();
  const location = useLocation();
  const navigate = useNavigate();
  // Get menu handler from AppLayout outlet context
  const { onMenuOpen } = useOutletContext() || {};

  // Get tab from URL or default to dashboard
  const getTabFromUrl = () => {
    const params = new URLSearchParams(location.search);
    return params.get('tab') || 'dashboard';
  };

  const toggleActionMenu = (id) => {
    setOpenMenuId(prev => prev === id ? null : id);
  };

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
  const [securityLoading, setSecurityLoading] = useState(() => getTabFromUrl() === 'security');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const listenersSetUpRef = useRef(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadTabData();
    }
  }, [activeTab, currentUser]);

  // Sync tab with URL
  useEffect(() => {
    const tab = getTabFromUrl();
    if (tab !== activeTab) {
      setSecurityLoading(tab === 'security');
      setActiveTab(tab);
    }
  }, [location.search]);

  // Set up real-time socket listeners for user updates
  useEffect(() => {
    if (listenersSetUpRef.current) return;

    const cleanupFunctions = [];

    const setupListeners = (socket) => {
      if (socket) {
        // Listen for new user registrations
        const handleUserCreated = (data) => {
          console.log('[Pryde] Real-time user created:', data);
          if (activeTab === 'users') {
            setUsers((prevUsers) => [data.user, ...prevUsers]);
          }
          // Update stats if on dashboard
          if (activeTab === 'dashboard' && stats) {
            setStats((prevStats) => ({
              ...prevStats,
              totalUsers: prevStats.totalUsers + 1
            }));
          }
        };
        socket.on('user_created', handleUserCreated);
        cleanupFunctions.push(() => socket.off('user_created', handleUserCreated));

        // Listen for user account deactivation
        const handleUserDeactivated = (data) => {
          console.log('[Pryde] Real-time user deactivated:', data);
          setUsers((prevUsers) =>
            prevUsers.map(u => u._id === data.userId ? { ...u, isActive: false } : u)
          );
        };
        socket.on('user_deactivated', handleUserDeactivated);
        cleanupFunctions.push(() => socket.off('user_deactivated', handleUserDeactivated));

        // Listen for user account reactivation
        const handleUserReactivated = (data) => {
          console.log('[Pryde] Real-time user reactivated:', data);
          setUsers((prevUsers) =>
            prevUsers.map(u => u._id === data.userId ? { ...u, isActive: true } : u)
          );
        };
        socket.on('user_reactivated', handleUserReactivated);
        cleanupFunctions.push(() => socket.off('user_reactivated', handleUserReactivated));

        // Listen for user account deletion
        const handleUserDeleted = (data) => {
          console.log('[Pryde] Real-time user deleted:', data);
          setUsers((prevUsers) => prevUsers.filter(u => u._id !== data.userId));
          // Update stats if on dashboard
          if (activeTab === 'dashboard' && stats) {
            setStats((prevStats) => ({
              ...prevStats,
              totalUsers: prevStats.totalUsers - 1
            }));
          }
        };
        socket.on('user_deleted', handleUserDeleted);
        cleanupFunctions.push(() => socket.off('user_deleted', handleUserDeleted));

        // Listen for user suspension
        const handleUserSuspended = (data) => {
          console.log('[Pryde] Real-time user suspended:', data);
          setUsers((prevUsers) =>
            prevUsers.map(u => u._id === data.userId ? { ...u, isSuspended: true } : u)
          );
        };
        socket.on('user_suspended', handleUserSuspended);
        cleanupFunctions.push(() => socket.off('user_suspended', handleUserSuspended));

        // Listen for user unsuspension
        const handleUserUnsuspended = (data) => {
          console.log('[Pryde] Real-time user unsuspended:', data);
          setUsers((prevUsers) =>
            prevUsers.map(u => u._id === data.userId ? { ...u, isSuspended: false } : u)
          );
        };
        socket.on('user_unsuspended', handleUserUnsuspended);
        cleanupFunctions.push(() => socket.off('user_unsuspended', handleUserUnsuspended));

        // Listen for user ban
        const handleUserBanned = (data) => {
          console.log('[Pryde] Real-time user banned:', data);
          setUsers((prevUsers) =>
            prevUsers.map(u => u._id === data.userId ? { ...u, isBanned: true } : u)
          );
        };
        socket.on('user_banned', handleUserBanned);
        cleanupFunctions.push(() => socket.off('user_banned', handleUserBanned));

        // Listen for user unban
        const handleUserUnbanned = (data) => {
          console.log('[Pryde] Real-time user unbanned:', data);
          setUsers((prevUsers) =>
            prevUsers.map(u => u._id === data.userId ? { ...u, isBanned: false } : u)
          );
        };
        socket.on('user_unbanned', handleUserUnbanned);
        cleanupFunctions.push(() => socket.off('user_unbanned', handleUserUnbanned));
      }
    };

    listenersSetUpRef.current = true;

    // Use shared socket helper with retry logic
    const cancelSocketRetry = setupSocketListeners((socket) => {
      setupListeners(socket);
    });

    return () => {
      // Cancel pending socket retries
      cancelSocketRetry();
      cleanupFunctions.forEach(cleanup => cleanup?.());
    };
  }, [activeTab, stats]);

  const handleTabChange = (tab) => {
    setSecurityLoading(tab === 'security');
    setActiveTab(tab);
    navigate(`/admin?tab=${tab}`);
  };

  const handleViewPost = async (postId) => {
    try {
      const response = await api.get(`/admin/posts?postId=${postId}`);
      setSelectedPost(response.data);
      setShowPostModal(true);
    } catch (error) {
      console.error('Error fetching post:', error);
      showAlert('Error', 'Failed to load post details');
    }
  };

  const handleClosePostModal = () => {
    setShowPostModal(false);
    setSelectedPost(null);
  };

  const checkAdminAccess = async () => {
    try {
      const user = getCurrentUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Try to fetch stats to verify admin access
      const response = await api.get('/admin/stats');
      setCurrentUser(user);
      setStats(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Admin access denied:', error);
      console.error('Error details:', error.response?.data || error.message);

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

  const loadTabData = async () => {
    const isSecurityTab = activeTab === 'security';

    if (isSecurityTab) {
      setSecurityLoading(true);
    }

    try {
      if (activeTab === 'dashboard') {
        const response = await api.get('/admin/stats');
        setStats(response.data);
      } else if (activeTab === 'reports') {
        const response = await api.get('/admin/reports?status=pending');
        setReports(response.data.reports);
      } else if (activeTab === 'users') {
        // Fetch users AND badges (needed for badge management modal)
        const [usersResponse, badgesResponse] = await Promise.all([
          api.get('/admin/users'),
          api.get('/badges/admin/catalog').catch(() => api.get('/badges'))
        ]);
        setUsers(usersResponse.data.users);
        // Flatten badges catalog if needed
        const allBadges = badgesResponse.data?.automatic?.badges
          ? [
              ...(badgesResponse.data.automatic.badges || []),
              ...(badgesResponse.data.manual.badges || [])
            ]
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
        // Try admin catalog first, fall back to public endpoint
        try {
          const response = await api.get('/badges/admin/catalog');
          // Flatten the categorized response into a single array
          const allBadges = [
            ...(response.data?.automatic?.badges || []),
            ...(response.data?.manual?.badges || [])
          ];
          setBadges(allBadges);
        } catch (catalogError) {
          // Fall back to public badges endpoint
          console.warn('Admin catalog failed, falling back to public endpoint:', catalogError);
          const response = await api.get('/badges');
          setBadges(response.data || []);
        }
      } else if (activeTab === 'moderation') {
        // Load moderation settings and history
        const [settingsRes, historyRes] = await Promise.all([
          api.get('/admin/moderation/settings'),
          api.get('/admin/moderation/history?limit=50')
        ]);
        setModerationSettings(settingsRes.data);
        setModerationHistory(historyRes.data.history || []);
      } else if (activeTab === 'maintenance') {
        // Load maintenance status
        try {
          const response = await api.get('/admin/debug/maintenance/status');
          setMaintenanceStatus(response.data);
        } catch (error) {
          console.error('Load maintenance status error:', error);
          // Set default state if endpoint doesn't exist yet
          setMaintenanceStatus({ enabled: false, message: null });
        }
      }
    } catch (error) {
      console.error('Load data error:', error);
      setError('Failed to load data');
    } finally {
      if (isSecurityTab) {
        setSecurityLoading(false);
      }
    }
  };

  const handleResolveReport = async (reportId, status, action) => {
    try {
      await api.put(`/admin/reports/${reportId}`, {
        status,
        action,
        reviewNotes: `Reviewed by admin`
      });
      showAlert('Report updated successfully', 'Success');
      loadTabData();
    } catch (error) {
      console.error('Resolve report error:', error);
      showAlert('Failed to update report', 'Error');
    }
  };

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

  const handleChangeRole = async (userId, newRole) => {
    const confirmed = await showConfirm(
      `Are you sure you want to change this user's role to ${newRole}?`,
      'Change User Role',
      'Change Role',
      'Cancel'
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

  // Badge management handlers
  const handleAssignBadge = async (userId, badgeId, reason) => {
    try {
      await api.post('/badges/admin/assign', { userId, badgeId, reason });
      showAlert('Badge assigned successfully', 'Success');
      // Refresh users to show updated badges
      if (activeTab === 'users') {
        loadTabData();
      }
    } catch (error) {
      console.error('Assign badge error:', error);
      showAlert(error.response?.data?.message || 'Failed to assign badge', 'Error');
    }
  };

  const handleRevokeBadge = async (userId, badgeId) => {
    const confirmed = await showConfirm(
      'Are you sure you want to revoke this badge?',
      'Revoke Badge',
      'Revoke',
      'Cancel'
    );

    if (!confirmed) return;

    try {
      await api.post('/badges/admin/revoke', { userId, badgeId });
      showAlert('Badge revoked successfully', 'Success');
      // Refresh users to show updated badges
      if (activeTab === 'users') {
        loadTabData();
      }
    } catch (error) {
      console.error('Revoke badge error:', error);
      showAlert(error.response?.data?.message || 'Failed to revoke badge', 'Error');
    }
  };

  const handleSendPasswordReset = async (userId, userEmail, username) => {
    const confirmed = await showConfirm(
      `Send password reset link to ${userEmail}?`,
      'Send Password Reset',
      'Send Link',
      'Cancel'
    );

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
    const newEmail = await showPrompt(
      `Update email for @${username}:`,
      'Update User Email',
      'New email address',
      currentEmail
    );

    if (!newEmail || newEmail === currentEmail) return;

    // Basic email validation
    if (!newEmail.includes('@') || !newEmail.includes('.')) {
      showAlert('Please enter a valid email address', 'Error');
      return;
    }

    const confirmed = await showConfirm(
      `Change email from ${currentEmail} to ${newEmail}?`,
      'Confirm Email Change',
      'Update Email',
      'Cancel'
    );

    if (!confirmed) return;

    try {
      const response = await api.put(`/admin/users/${userId}/email`, { newEmail });
      showAlert(`Email updated successfully. Notifications sent to both addresses.`, 'Success');
      loadTabData();
    } catch (error) {
      console.error('Update email error:', error);
      showAlert(error.response?.data?.message || 'Failed to update email', 'Error');
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) return;
    const confirmed = await showConfirm(
      `Send "@everyone" announcement to ALL active users?\n\nMessage: "${broadcastMessage.trim()}"`,
      'Send @everyone Announcement',
      'Send Announcement',
      'Cancel'
    );
    if (!confirmed) return;

    setBroadcastSending(true);
    setBroadcastResult(null);
    try {
      const response = await api.post('/admin/broadcast', {
        message: broadcastMessage.trim()
      });
      setBroadcastResult({ success: true, notified: response.data.notified });
      setBroadcastMessage('');
    } catch (error) {
      console.error('Broadcast error:', error);
      setBroadcastResult({ success: false, error: error.response?.data?.message || 'Failed to send announcement' });
    } finally {
      setBroadcastSending(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <Navbar onMenuClick={onMenuOpen} />
        <div className="admin-container admin-state-shell">
          <section className="admin-card admin-state admin-state--loading" role="status" aria-live="polite">
            <p className="admin-state__eyebrow">Admin Panel</p>
            <h1 className="admin-state__title">🔒 Verifying admin access...</h1>
            <p className="admin-state__message">
              Checking your session and loading the admin workspace.
            </p>
          </section>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <Navbar onMenuClick={onMenuOpen} />
        <div className="admin-container admin-state-shell">
          <section className="admin-card admin-state admin-state--error" role="alert">
            <p className="admin-state__eyebrow">Admin Panel</p>
            <h1 className="admin-state__title">⛔ Access issue</h1>
            <p className="admin-state__message">{error}</p>
            <p className="admin-state__meta">Redirecting to home in a few seconds, or you can leave now.</p>
            <div className="admin-state__actions">
              <button
                type="button"
                className="admin-state__button"
                onClick={() => navigate('/')}
              >
                Go to Home
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  const handleNavClick = (tab) => {
    handleTabChange(tab);
    setSidebarOpen(false); // Close sidebar on mobile after selection
  };

  const renderSidebar = () => {
    return (
      <>
        <div className="admin-section">
          <div className="admin-section-title">Overview</div>
          <button
            className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavClick('dashboard')}
          >
            📊 Dashboard
          </button>
          <button
            className={`admin-nav-item ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => handleNavClick('activity')}
          >
            📈 Activity
          </button>
        </div>

        <div className="admin-section">
          <div className="admin-section-title">Moderation</div>
          <button
            className={`admin-nav-item ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => handleNavClick('reports')}
          >
            🚩 Reports
          </button>
          <button
            className={`admin-nav-item ${activeTab === 'moderation-v3' ? 'active' : ''}`}
            onClick={() => handleNavClick('moderation-v3')}
          >
            🛡️ Moderation V5
          </button>
          <button
            className={`admin-nav-item ${activeTab === 'blocks' ? 'active' : ''}`}
            onClick={() => handleNavClick('blocks')}
          >
            🚫 Blocks
          </button>
        </div>

        <div className="admin-section">
          <div className="admin-section-title">User Management</div>
          <button
            className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => handleNavClick('users')}
          >
            👥 Users
          </button>
          <button
            className={`admin-nav-item ${activeTab === 'badges' ? 'active' : ''}`}
            onClick={() => handleNavClick('badges')}
          >
            🏅 Badges
          </button>
        </div>

        <div className="admin-section">
          <div className="admin-section-title">Platform & Security</div>
          <button
            className={`admin-nav-item ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => handleNavClick('security')}
          >
            🔒 Security
          </button>
          <button
            className={`admin-nav-item ${activeTab === 'emails' ? 'active' : ''}`}
            onClick={() => handleNavClick('emails')}
          >
            📧 Emails
          </button>
          <button
            className={`admin-nav-item ${activeTab === 'maintenance' ? 'active' : ''}`}
            onClick={() => handleNavClick('maintenance')}
          >
            🔧 Maintenance
          </button>
        </div>

        {currentUser?.role === 'super_admin' && (
          <div className="admin-section">
            <div className="admin-section-title">Announcements</div>
            <button
              className={`admin-nav-item ${activeTab === 'broadcast' ? 'active' : ''}`}
              onClick={() => handleNavClick('broadcast')}
            >
              📢 @everyone Broadcast
            </button>
          </div>
        )}
      </>
    );
  };

  const renderSelectedTab = () => {
    return (
      <>
        {activeTab === 'dashboard' && stats && (
          <section id="content-dashboard" aria-labelledby="tab-dashboard">
            <DashboardTab stats={stats} />
          </section>
        )}
        {activeTab === 'reports' && (
          <ReportsTab reports={reports} onResolve={handleResolveReport} />
        )}
        {activeTab === 'users' && (
          <UsersTab
            users={users}
            badges={badges}
            onSuspend={handleSuspendUser}
            onBan={handleBanUser}
            onUnsuspend={handleUnsuspendUser}
            onUnban={handleUnbanUser}
            onChangeRole={handleChangeRole}
            onSendPasswordReset={handleSendPasswordReset}
            onUpdateEmail={handleUpdateEmail}
            onAssignBadge={handleAssignBadge}
            onRevokeBadge={handleRevokeBadge}
          />
        )}
        {activeTab === 'blocks' && (
          <BlocksTab blocks={blocks} />
        )}
        {activeTab === 'activity' && activity && (
          <ActivityTab activity={activity} onViewPost={handleViewPost} />
        )}
        {activeTab === 'security' && (
          securityLoading ? (
            <div
              className="loading-state loading-state--stack security-loading-state"
              role="status"
              aria-live="polite"
              aria-label="Loading security logs"
            >
              <p className="loading-state__message">Loading security logs...</p>
              <div className="security-loading-skeleton security-loading-skeleton--hero" aria-hidden="true"></div>
              <div className="security-loading-skeleton security-loading-skeleton--row" aria-hidden="true"></div>
              <div className="security-loading-skeleton security-loading-skeleton--row" aria-hidden="true"></div>
              <div className="security-loading-skeleton security-loading-skeleton--row" aria-hidden="true"></div>
            </div>
          ) : (
            <SecurityTab
              logs={securityLogs}
              stats={securityStats}
              onResolve={handleResolveSecurityLog}
            />
          )
        )}
        {activeTab === 'badges' && (
          <BadgesTab
            badges={badges}
            onRefresh={() => loadTabData()}
          />
        )}
        {activeTab === 'moderation' && (
          <ModerationTab
            settings={moderationSettings}
            history={moderationHistory}
            onRefresh={() => loadTabData()}
            showAlert={showAlert}
            showConfirm={showConfirm}
            showPrompt={showPrompt}
          />
        )}
        {activeTab === 'moderation-v3' && (
          <ModerationV3Panel
            showAlert={showAlert}
            showConfirm={showConfirm}
          />
        )}
        {activeTab === 'emails' && (
          <EmailsTab />
        )}
        {activeTab === 'maintenance' && (
          <section id="content-maintenance" aria-labelledby="tab-maintenance">
            <div className="admin-tab-content">
              <h2 className="admin-section-heading">🔧 Maintenance Mode</h2>
              <p className="admin-section-description">
                Enable maintenance mode to temporarily redirect all users to a maintenance page. Use this during upgrades or critical updates.
              </p>

              {/* Status Card */}
              <div className={`maintenance-status ${maintenanceStatus?.enabled ? 'maintenance-status--enabled' : 'maintenance-status--disabled'}`}>
                <div className="maintenance-status__header">
                  <span className="maintenance-status__icon" aria-hidden="true">
                    {maintenanceStatus?.enabled ? '🚫' : '✅'}
                  </span>
                  <div>
                    <h3 className="maintenance-status__title">
                      {maintenanceStatus?.enabled ? 'Maintenance Mode Active' : 'Site is Live'}
                    </h3>
                    {maintenanceStatus?.enabled && maintenanceStatus.message && (
                      <p className="maintenance-status__message">
                        Message: {maintenanceStatus.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Toggle Button */}
              <div className="maintenance-actions">
                {maintenanceStatus?.enabled ? (
                  <button
                    className="maintenance-action-button maintenance-action-button--disable"
                    onClick={async () => {
                      setMaintenanceLoading(true);
                      try {
                        await api.post('/admin/debug/maintenance/disable');
                        setMaintenanceStatus({ enabled: false, message: null });
                        showAlert('Maintenance mode disabled', 'Success');
                      } catch (error) {
                        showAlert('Failed to disable maintenance mode', 'Error');
                      } finally {
                        setMaintenanceLoading(false);
                      }
                    }}
                    disabled={maintenanceLoading}
                  >
                    {maintenanceLoading ? 'Disabling...' : '🟢 Disable Maintenance Mode'}
                  </button>
                ) : (
                  <button
                    className="maintenance-action-button maintenance-action-button--enable"
                    onClick={async () => {
                      const message = await showPrompt(
                        'Enter a message to show users (optional):',
                        'Enable Maintenance Mode',
                        'Message',
                        'We are performing scheduled maintenance'
                      );
                      setMaintenanceLoading(true);
                      try {
                        await api.post('/admin/debug/maintenance/enable', { message: message || undefined });
                        setMaintenanceStatus({ enabled: true, message: message || 'We are performing scheduled maintenance' });
                        showAlert('Maintenance mode enabled', 'Success');
                      } catch (error) {
                        showAlert('Failed to enable maintenance mode', 'Error');
                      } finally {
                        setMaintenanceLoading(false);
                      }
                    }}
                    disabled={maintenanceLoading}
                  >
                    {maintenanceLoading ? 'Enabling...' : '🔴 Enable Maintenance Mode'}
                  </button>
                )}
              </div>

              {/* Info Box */}
              <div className="broadcast-info-box">
                <strong>How it works:</strong>
                <ul>
                  <li>When enabled, all users will be redirected to a maintenance page.</li>
                  <li>Admins will still be able to access the site normally.</li>
                  <li>The maintenance page auto-refreshes every 30 seconds to check if the site is back.</li>
                  <li>Make sure to disable maintenance mode when you're done!</li>
                </ul>
              </div>
            </div>
          </section>
        )}
        {activeTab === 'broadcast' && currentUser?.role === 'super_admin' && (
          <section id="content-broadcast" aria-labelledby="tab-broadcast">
            <div className="admin-tab-content">
              <h2 className="admin-section-heading">📢 @everyone Announcement</h2>
              <p className="admin-section-description">
                Send a site-wide announcement notification to all active users. Use this for important updates only.
              </p>

              <div className="broadcast-form">
                <div className="broadcast-field">
                  <label htmlFor="broadcast-message" className="broadcast-label">
                    Announcement message <span className="required">*</span>
                  </label>
                  <textarea
                    id="broadcast-message"
                    className="broadcast-textarea"
                    placeholder="Write your announcement here..."
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    rows={4}
                    disabled={broadcastSending}
                  />
                  <div className="broadcast-char-count">
                    {broadcastMessage.length} characters
                  </div>
                </div>

                {broadcastResult && (
                  <div className={`broadcast-result ${broadcastResult.success ? 'broadcast-result--success' : 'broadcast-result--error'}`}>
                    {broadcastResult.success
                      ? `Announcement post created and delivered to ${broadcastResult.notified} users.`
                      : `Error: ${broadcastResult.error}`}
                  </div>
                )}

                <button
                  className="broadcast-send-btn"
                  onClick={handleBroadcast}
                  disabled={broadcastSending || !broadcastMessage.trim()}
                >
                  {broadcastSending ? 'Sending...' : 'Send @everyone Announcement'}
                </button>
              </div>

              <div className="broadcast-info-box">
                <strong>How it works:</strong>
                <ul>
                  <li>A public post is created in the timeline and all active users receive a bell notification and mobile push notification immediately.</li>
                  <li>Clicking the notification takes users directly to the announcement post.</li>
                  <li>You can also include <code>@everyone</code> in any post you create — it will trigger the same broadcast automatically.</li>
                  <li>Only Super Admins can use this feature.</li>
                </ul>
              </div>
            </div>
          </section>
        )}
      </>
    );
  };

  return (
    <div className="page-container">
      <Navbar onMenuClick={onMenuOpen} />
      <div className="admin-layout">
        {/* Mobile Menu Toggle */}
        <button
          className="admin-mobile-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle navigation"
        >
          {sidebarOpen ? '✕' : '☰'} Menu
        </button>

        <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
          {renderSidebar()}
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="admin-sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
          />
        )}

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

      {/* Post Modal for Admin Content Viewing */}
      {showPostModal && selectedPost && (
        <PostModal post={selectedPost} onClose={handleClosePostModal} />
      )}
    </div>
  );
}

// Dashboard Tab Component
function DashboardTab({ stats }) {
  return (
    <div className="dashboard-grid">
      <div className="stat-card">
        <h3>👥 Users</h3>
        <div className="stat-number">{stats.users.total}</div>
        <div className="stat-details">
          <span>✅ Active: {stats.users.active}</span>
          <span>⏸️ Suspended: {stats.users.suspended}</span>
          <span>🚫 Banned: {stats.users.banned}</span>
          <span>🆕 New this week: {stats.users.newThisWeek}</span>
          <span>📱 Active today: {stats.users.activeToday}</span>
        </div>
      </div>

      <div className="stat-card">
        <h3>📝 Content</h3>
        <div className="stat-number">{stats.content.totalPosts}</div>
        <div className="stat-details">
          <span>Posts: {stats.content.totalPosts}</span>
          <span>Messages: {stats.content.totalMessages}</span>
        </div>
      </div>

      <div className="stat-card">
        <h3>🛡️ Moderation</h3>
        <div className="stat-number">{stats.moderation.pendingReports}</div>
        <div className="stat-details">
          <span>⏳ Pending: {stats.moderation.pendingReports}</span>
          <span>📋 Total Reports: {stats.moderation.totalReports}</span>
          <span>🚫 Total Blocks: {stats.moderation.totalBlocks}</span>
        </div>
      </div>
    </div>
  );
}

// Reports Tab Component
function ReportsTab({ reports, onResolve }) {
  const [expandedReport, setExpandedReport] = useState(null);

  const renderContentPreview = (report) => {
    if (report.reportType === 'post' && report.reportedPost) {
      const post = report.reportedPost;
      return (
        <div className="content-preview">
          <h4>📝 Reported Post Preview:</h4>
          <div className="preview-card">
            <div className="preview-author">
              {post.author?.profilePhoto && (
                <img src={getImageUrl(post.author.profilePhoto)} alt={post.author.username} className="preview-avatar" />
              )}
              <span>{post.author?.displayName || post.author?.username || 'Unknown'}</span>
            </div>
            <p className="preview-content">{post.content}</p>
            {post.media && post.media.length > 0 && (
              <div className="preview-media">
                {post.media.slice(0, 3).map((media, idx) => (
                  <div key={idx} className="preview-media-item">
                    {media.type === 'image' ? (
                      <img src={getImageUrl(media.url)} alt="Post media" />
                    ) : (
                      <video src={getImageUrl(media.url)} />
                    )}
                  </div>
                ))}
                {post.media.length > 3 && <span>+{post.media.length - 3} more</span>}
              </div>
            )}
            <div className="preview-stats">
              <span>❤️ {post.likes?.length || 0}</span>
              <span>💬 {post.comments?.length || 0}</span>
              <span>📅 {new Date(post.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      );
    }

    if (report.reportType === 'comment' && report.reportedComment) {
      const comment = report.reportedComment;
      return (
        <div className="content-preview">
          <h4>💬 Reported Comment Preview:</h4>
          <div className="preview-card">
            <div className="preview-author">
              {comment.user?.profilePhoto && (
                <img src={getImageUrl(comment.user.profilePhoto)} alt={comment.user.username} className="preview-avatar" />
              )}
              <span>{comment.user?.displayName || comment.user?.username || 'Unknown'}</span>
            </div>
            <p className="preview-content">{comment.content}</p>
            <div className="preview-stats">
              <span>📅 {new Date(comment.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      );
    }

    if (report.reportType === 'user' && report.reportedUser) {
      const user = report.reportedUser;
      return (
        <div className="content-preview">
          <h4>👤 Reported User Profile:</h4>
          <div className="preview-card">
            <div className="preview-author">
              {user.profilePhoto && (
                <img src={getImageUrl(user.profilePhoto)} alt={user.username} className="preview-avatar" />
              )}
              <div>
                <div><strong>{user.displayName || user.username}</strong></div>
                <div className="preview-meta">@{user.username}</div>
                <div className="preview-meta">{user.email}</div>
              </div>
            </div>
            {user.bio && <p className="preview-content">{user.bio}</p>}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="reports-list">
      <h2>Pending Reports</h2>
      {reports.length === 0 ? (
        <div className="no-data" role="status" aria-live="polite">
          <p>No pending reports.</p>
        </div>
      ) : (
        reports.map(report => (
          <div key={report._id} className="report-card">
            <div className="report-header">
              <span className="report-type">{report.reportType}</span>
              <span className="report-reason">{report.reason}</span>
              <span className="report-date">{new Date(report.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="report-body">
              <p><strong>Reporter:</strong> {report.reporter?.username || 'Unknown'} ({report.reporter?.email})</p>
              <p><strong>Reported User:</strong> {report.reportedUser?.username || 'N/A'} ({report.reportedUser?.email || 'N/A'})</p>
              {report.description && <p><strong>Description:</strong> {report.description}</p>}

              <button
                className="btn-preview"
                onClick={() => setExpandedReport(expandedReport === report._id ? null : report._id)}
              >
                {expandedReport === report._id ? '🔼 Hide Preview' : '🔽 Show Content Preview'}
              </button>

              {expandedReport === report._id && renderContentPreview(report)}
            </div>
            <div className="report-actions">
              <button
                className="btn-resolve"
                onClick={() => onResolve(report._id, 'resolved', 'warning')}
              >
                ⚠️ Warning
              </button>
              <button
                className="btn-resolve"
                onClick={() => onResolve(report._id, 'resolved', 'content_removed')}
              >
                🗑️ Remove Content
              </button>
              <button
                className="btn-resolve"
                onClick={() => onResolve(report._id, 'dismissed', 'none')}
              >
                ❌ Dismiss
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function useEscapeToClose(onClose) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
}

// Badge Management Modal Component
function BadgeManagementModal({ user, badges = [], onAssignBadge, onRevokeBadge, onClose }) {
  useEscapeToClose(onClose);
  const [selectedBadge, setSelectedBadge] = useState('');
  const [reason, setReason] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [isRevoking, setIsRevoking] = useState(null);
  const badgeSelectId = `badge-select-${user._id}`;
  const badgeReasonId = `badge-reason-${user._id}`;
  const badgeReasonHelpId = `badge-reason-help-${user._id}`;
  const badgeReasonCountId = `badge-reason-count-${user._id}`;

  const userBadges = user.badges || [];
  // Handle both string IDs and full badge objects from resolveBadges()
  // userBadges can be: ["founder", "early_member"] OR [{id: "founder", ...}, {id: "early_member", ...}]
  const availableBadges = badges.filter(b => !userBadges.some(ub => {
    const userBadgeId = typeof ub === 'string' ? ub : ub.id;
    return userBadgeId === b.id;
  }));

  // Check if selected badge is manual (requires reason)
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
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content badge-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Manage Badges for ${user.username}`}
      >
        <div className="modal-header">
          <h3>Manage Badges for {user.username}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close badge management">×</button>
        </div>

        <div className="modal-body">
          {/* Current Badges Section */}
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
                      type="button"
                      className="badge-revoke-btn"
                      onClick={() => handleRevoke(badge.id)}
                      disabled={isRevoking === badge.id}
                      title={`Revoke ${badge.label}`}
                      aria-label={`Revoke ${badge.label}`}
                    >
                      {isRevoking === badge.id ? '...' : '×'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assign New Badge Section */}
          <div className="badge-section">
            <h4>Assign New Badge</h4>
            {availableBadges.length === 0 ? (
              <p className="empty-badges">All badges already assigned</p>
            ) : (
              <div className="badge-assign-form">
                <div className="badge-reason-input">
                  <label className="badge-select-label" htmlFor={badgeSelectId}>Choose a badge to assign</label>
                  <select
                    id={badgeSelectId}
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
                </div>

                {/* Reason input for manual badges */}
                {selectedBadge && isManualBadge && (
                  <div className="badge-reason-input">
                    <label htmlFor={badgeReasonId}>Reason for assignment (required, min 10 chars):</label>
                    <textarea
                      id={badgeReasonId}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Why is this badge being assigned? This is logged for accountability."
                      rows="2"
                      className="badge-reason-textarea"
                      aria-describedby={`${badgeReasonHelpId} ${badgeReasonCountId}`}
                    />
                    <small id={badgeReasonHelpId}>
                      Manual badge assignments require a short audit note for accountability.
                    </small>
                    <small id={badgeReasonCountId} className={reason.trim().length >= 10 ? 'valid' : 'invalid'}>
                      {reason.trim().length}/10 characters minimum
                    </small>
                  </div>
                )}

                <button
                  type="button"
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

// Users Tab Component
function UsersTab({ users, badges = [], onSuspend, onBan, onUnsuspend, onUnban, onChangeRole, onSendPasswordReset, onUpdateEmail, onAssignBadge, onRevokeBadge }) {
  const [badgeModalUser, setBadgeModalUser] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  const toggleActionMenu = (id) => {
    setOpenMenuId(prev => prev === id ? null : id);
  };

  return (
    <div className="users-list">
      <h2>User Management ({users.length} total users)</h2>
      {users.length === 0 ? (
        <div className="no-data" role="status" aria-live="polite">
          <p>No users found.</p>
        </div>
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
                  <td data-label="Full Name">{user.fullName || <span className="identity-muted">Not provided</span>}</td>
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
                    <div className="user-email-cell">
                      <span className="user-email-text">{user.email}</span>
                      <button
                        className="btn-action btn-small"
                        onClick={() => onUpdateEmail(user._id, user.email, user.username)}
                        title="Update email address"
                      >
                        ✏️ Edit
                      </button>
                    </div>
                  </td>
                  <td data-label="Role">
                    {user.role?.toLowerCase() === 'super_admin' ? (
                      <span className={`role-badge role-${user.role}`}>
                        {user.role}
                      </span>
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
                      {/* Show badge preview (max 2 icons) */}
                      <div className="badge-preview">
                        {user.badges && user.badges.length > 0 ? (
                          <>
                            {user.badges.slice(0, 2).map(badge => (
                              <span
                                key={badge.id}
                                className="badge-icon-preview"
                                title={badge.tooltip || badge.label}
                              >
                                {badge.icon}
                              </span>
                            ))}
                            {user.badges.length > 2 && (
                              <span className="badge-count">+{user.badges.length - 2}</span>
                            )}
                          </>
                        ) : (
                          <span className="no-badges">—</span>
                        )}
                      </div>
                      <button
                        className="badge-manage-btn"
                        onClick={() => setBadgeModalUser(user)}
                        title="Manage badges"
                      >
                        Manage
                      </button>
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
                      <span className="platform-owner-label">
                        🛡️ Platform Owner (Protected)
                      </span>
                    ) : (
                      <div className="admin-actions">
                        <button
                          className="admin-action-trigger"
                          onClick={() => toggleActionMenu(user._id)}
                          title="Actions"
                        >
                          ⋯
                        </button>

                        {openMenuId === user._id && (
                          <div className="admin-action-menu">
                            <button onClick={() => {
                              onSendPasswordReset(user._id, user.email, user.username);
                              setOpenMenuId(null);
                            }}>
                              🔑 Reset Password
                            </button>
                            {user.isSuspended ? (
                              <button onClick={() => {
                                onUnsuspend(user._id);
                                setOpenMenuId(null);
                              }}>
                                🔓 Unsuspend
                              </button>
                            ) : (
                              <button onClick={() => {
                                onSuspend(user._id);
                                setOpenMenuId(null);
                              }}>
                                ⏸️ Suspend
                              </button>
                            )}
                            {user.isBanned ? (
                              <button onClick={() => {
                                onUnban(user._id);
                                setOpenMenuId(null);
                              }}>
                                ✅ Unban
                              </button>
                            ) : (
                              <button onClick={() => {
                                onBan(user._id);
                                setOpenMenuId(null);
                              }}>
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

      {/* Badge Management Modal */}
      {badgeModalUser && (
        <BadgeManagementModal
          user={badgeModalUser}
          badges={badges}
          onAssignBadge={async (userId, badgeId, reason) => {
            await onAssignBadge(userId, badgeId, reason);
            // Update the modal user's badges after assignment
            const updatedUser = users.find(u => u._id === userId);
            if (updatedUser) setBadgeModalUser(updatedUser);
          }}
          onRevokeBadge={async (userId, badgeId) => {
            await onRevokeBadge(userId, badgeId);
            // Update the modal user's badges after revocation
            const updatedUser = users.find(u => u._id === userId);
            if (updatedUser) setBadgeModalUser(updatedUser);
          }}
          onClose={() => setBadgeModalUser(null)}
        />
      )}
    </div>
  );
}

// Blocks Tab Component
function BlocksTab({ blocks }) {
  return (
    <div className="blocks-list">
      <h2>User Blocks</h2>
      {blocks.length === 0 ? (
        <div className="no-data" role="status" aria-live="polite">
          <p>No blocks found.</p>
        </div>
      ) : (
        <table className="blocks-table">
          <thead>
            <tr>
              <th>Blocker</th>
              <th>Blocked User</th>
              <th>Date</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {blocks.map(block => (
              <tr key={block._id}>
                <td data-label="Blocker">{block.blocker?.username} ({block.blocker?.email})</td>
                <td data-label="Blocked User">{block.blocked?.username} ({block.blocked?.email})</td>
                <td data-label="Date">{new Date(block.createdAt).toLocaleDateString()}</td>
                <td data-label="Reason">{block.reason || 'No reason provided'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// Activity Tab Component
function ActivityTab({ activity, onViewPost }) {
  const navigate = useNavigate();

  return (
    <div className="activity-container">
      <h2>Recent Activity ({activity.period})</h2>

      <div className="activity-section">
        <h3>📝 Recent Posts ({activity.recentPosts.length})</h3>
        <div className="activity-table">
          <div className="activity-table-header">
            <span className="activity-header-author">Author</span>
            <span className="activity-header-post">Post</span>
            <span className="activity-header-date">Date Posted</span>
          </div>
          <div className="activity-list">
            {activity.recentPosts.slice(0, 10).map(post => (
              <div key={post._id} className="activity-item">
                <span
                  className="activity-user-link"
                  onClick={() => navigate(`/profile/${post.author?._id}`)}
                >
                  {post.author?.displayName || post.author?.username}
                </span>
                <span
                  className="activity-post-link"
                  onClick={() => onViewPost(post._id)}
                  title="Click to view full post in modal"
                >
                  {post.content?.substring(0, 100)}{post.content?.length > 100 ? '...' : ''}
                </span>
                <span className="activity-date">{new Date(post.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="activity-section">
        <h3>👥 New Users ({activity.recentUsers.length})</h3>
        <div className="activity-table">
          <div className="activity-table-header">
            <span className="activity-header-realname">Display Name</span>
            <span className="activity-header-username">Username</span>
            <span className="activity-header-email">Email</span>
            <span className="activity-header-date">Date Joined</span>
          </div>
          <div className="activity-list">
            {activity.recentUsers.slice(0, 10).map(user => (
              <div key={user._id} className="activity-item">
                <span className="activity-realname">{user.displayName || user.username}</span>
                <span
                  className="activity-user-link"
                  onClick={() => navigate(`/profile/${user._id}`)}
                  title="View profile"
                >
                  {user.username}
                </span>
                <span className="activity-email">{user.email}</span>
                <span className="activity-date">{new Date(user.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="activity-section">
        <h3>🚩 Recent Reports ({activity.recentReports.length})</h3>
        <div className="activity-table">
          <div className="activity-table-header">
            <span className="activity-header-reporter">Reporter</span>
            <span className="activity-header-report">Report Details</span>
            <span className="activity-header-date">Date Reported</span>
          </div>
          <div className="activity-list">
            {activity.recentReports.slice(0, 10).map(report => (
              <div key={report._id} className="activity-item">
                <span
                  className="activity-user-link"
                  onClick={() => navigate(`/profile/${report.reporter?._id}`)}
                  title="View reporter profile"
                >
                  {report.reporter?.displayName || report.reporter?.username}
                </span>
                <span className="activity-content">
                  Reported {report.reportType}: {report.reason}
                </span>
                <span className="activity-date">{new Date(report.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Emails Tab Component
function EmailsTab() {
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
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const STATUS_COLORS = { new: 'var(--color-primary)', read: '#6c757d', replied: 'var(--color-success)', archived: '#adb5bd', spam: 'var(--color-danger)' };
  const STATUS_LABELS = { new: '🔵 New', read: '👁️ Read', replied: '↩️ Replied', archived: '📦 Archived', spam: '🚫 Spam' };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const fetchEmails = async () => {
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
  };

  useEffect(() => { fetchEmails(); }, [mailboxFilter, statusFilter, search, page]);

  const handleSelectEmail = async (emailId) => {
    setDetailLoading(true);
    try {
      const res = await api.get(`/admin/emails/${emailId}`);
      setSelectedEmail(res.data);
      setNotes(res.data.adminNotes || '');
      setEmails(prev => prev.map(e => e._id === emailId && e.status === 'new' ? { ...e, status: 'read' } : e));
    } catch (err) {
      console.error('Failed to fetch email:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setStatusUpdating(true);
    try {
      await api.patch(`/admin/emails/${selectedEmail._id}`, { status: newStatus });
      setSelectedEmail(prev => ({ ...prev, status: newStatus }));
      setEmails(prev => prev.map(e => e._id === selectedEmail._id ? { ...e, status: newStatus } : e));
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      await api.patch(`/admin/emails/${selectedEmail._id}`, { adminNotes: notes });
      setSelectedEmail(prev => ({ ...prev, adminNotes: notes }));
    } catch (err) {
      console.error('Failed to save notes:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSearch = (e) => { e.preventDefault(); setSearch(searchInput); setPage(1); };
  const changeFilter = (setter, val) => { setter(val); setPage(1); };

  if (detailLoading || selectedEmail) {
    return (
      <div className="admin-tab-content">
        <h2 className="admin-section-heading">📧 Inbound Emails</h2>
        {detailLoading ? (
          <div className="loading-state">
            <div className="shimmer" style={{ height: '200px', borderRadius: '12px' }}></div>
          </div>
        ) : (
          <div className="email-detail-panel">
            <div className="email-detail-header">
              <button className="email-detail-back" onClick={() => setSelectedEmail(null)}>← Back</button>
              <span className="email-status-badge" style={{ background: STATUS_COLORS[selectedEmail.status] || '#6c757d' }}>
                {STATUS_LABELS[selectedEmail.status] || selectedEmail.status}
              </span>
            </div>
            <h3 className="email-detail-subject">{selectedEmail.subject || '(no subject)'}</h3>
            <div className="email-detail-meta">
              <div><strong>From:</strong> {selectedEmail.sender?.name ? `${selectedEmail.sender.name} <${selectedEmail.sender.email}>` : selectedEmail.sender?.email}</div>
              <div><strong>To:</strong> {selectedEmail.mailbox === 'noreply' ? 'noreply@prydeapp.com' : 'support@prydeapp.com'}</div>
              <div><strong>Received:</strong> {formatDate(selectedEmail.createdAt)}</div>
              {selectedEmail.attachments?.length > 0 && <div><strong>Attachments:</strong> {selectedEmail.attachments.length}</div>}
            </div>
            <div className="email-detail-body">
              {selectedEmail.bodyHtml
                ? <div className="email-html-body" dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml }} />
                : <pre className="email-text-body">{selectedEmail.bodyText || '(empty body)'}</pre>}
            </div>
            <div className="email-detail-actions">
              <div className="email-action-row">
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Mark as:</span>
                {['replied', 'archived', 'spam'].map(s => (
                  <button key={s} className={`email-action-btn ${selectedEmail.status === s ? 'active' : ''}`}
                    onClick={() => handleStatusChange(s)} disabled={statusUpdating || selectedEmail.status === s}>
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
              <div className="email-notes-section">
                <label className="email-notes-label">Admin Notes</label>
                <textarea className="email-notes-input" value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Internal notes visible only to admins..." rows={3} />
                <button className="email-save-notes-btn" onClick={handleSaveNotes} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
            </div>
          </div>
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
              <button key={m} className={`filter-btn ${mailboxFilter === m ? 'active' : ''}`}
                onClick={() => changeFilter(setMailboxFilter, m)}>
                {m === 'all' ? 'All' : m === 'noreply' ? 'noreply@' : 'support@'}
              </button>
            ))}
          </div>
        </div>
        <div className="email-filter-group">
          <label>Status</label>
          <div className="filter-btn-group">
            {['all', 'new', 'read', 'replied', 'archived', 'spam'].map(s => (
              <button key={s} className={`filter-btn ${statusFilter === s ? 'active' : ''}`}
                onClick={() => changeFilter(setStatusFilter, s)}>
                {s === 'all' ? 'All' : STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
        <form className="email-search-form" onSubmit={handleSearch}>
          <input type="text" className="email-search-input" placeholder="Search sender or subject..."
            value={searchInput} onChange={e => setSearchInput(e.target.value)} />
          <button type="submit" className="email-search-btn">Search</button>
          {search && <button type="button" className="email-search-btn" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}>Clear</button>}
        </form>
      </div>
      {loading ? (
        <div className="loading-state">
          {[1,2,3,4,5].map(i => <div key={i} className="shimmer" style={{ height: '60px', borderRadius: '8px', marginBottom: '0.5rem' }}></div>)}
        </div>
      ) : emails.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</p>
          <p>No emails found</p>
        </div>
      ) : (
        <>
          <div className="email-list">
            {emails.map(email => (
              <button key={email._id} className={`email-list-item ${email.status === 'new' ? 'email-list-item--unread' : ''}`}
                onClick={() => handleSelectEmail(email._id)}>
                <div className="email-list-item-left">
                  <span className="email-status-dot" style={{ background: STATUS_COLORS[email.status] || '#6c757d' }} title={email.status} />
                  <div className="email-list-item-info">
                    <span className="email-list-sender">{email.sender?.name || email.sender?.email || 'Unknown'}</span>
                    <span className="email-list-subject">{email.subject || '(no subject)'}</span>
                  </div>
                </div>
                <div className="email-list-item-right">
                  <span className="email-mailbox-tag">{email.mailbox === 'noreply' ? 'noreply@' : 'support@'}</span>
                  <span className="email-list-date">{formatDate(email.createdAt)}</span>
                </div>
              </button>
            ))}
          </div>
          {pagination?.pages > 1 && (
            <div className="email-pagination">
              <button className="filter-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Page {page} of {pagination.pages} · {pagination.total} total</span>
              <button className="filter-btn" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Security Tab Component
function SecurityTab({ logs, stats, onResolve }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [openMenuId, setOpenMenuId] = useState(null);

  const toggleActionMenu = (id) => {
    setOpenMenuId(prev => prev === id ? null : id);
  };

  const filteredLogs = logs.filter(log => {
    // Status filter - must pass this first
    let passesStatusFilter = true;
    if (statusFilter === 'unresolved') {
      passesStatusFilter = !log.resolved;
    } else if (statusFilter === 'resolved') {
      passesStatusFilter = log.resolved;
    }
    // If doesn't pass status filter, exclude it
    if (!passesStatusFilter) return false;

    // Type filter - only check if status filter passed
    if (typeFilter === 'all') return true;
    if (typeFilter === 'underage') return log.type && log.type.includes('underage');
    if (typeFilter === 'email_verification') return log.type === 'email_verification';
    if (typeFilter === 'failed_login') return log.type === 'failed_login';
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

  const getSeverityClassName = (severity) => {
    switch (severity) {
      case 'critical':
        return 'log-severity log-severity--critical';
      case 'high':
      case 'medium':
        return 'log-severity log-severity--warning';
      case 'low':
        return 'log-severity log-severity--success';
      default:
        return 'log-severity log-severity--neutral';
    }
  };

  const getActionBadgeClassName = (action) => {
    switch (action) {
      case 'banned':
        return 'log-action-badge log-action-badge--danger';
      case 'blocked':
        return 'log-action-badge log-action-badge--warning';
      default:
        return 'log-action-badge log-action-badge--neutral';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'underage_registration': return '🚫 Underage Registration';
      case 'underage_login': return '🔒 Underage Login';
      case 'underage_access': return '⚠️ Underage Access';
      case 'failed_login': return '❌ Failed Login';
      case 'suspicious_activity': return '🔍 Suspicious Activity';
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
            <p className="stat-number stat-number--warning">{stats.unresolved}</p>
          </div>
          <div className="stat-card">
            <h3>Underage Attempts</h3>
            <p className="stat-number stat-number--danger">
              {stats.byType.underage_registration + stats.byType.underage_login + stats.byType.underage_access}
            </p>
          </div>
          <div className="stat-card">
            <h3>Critical</h3>
            <p className="stat-number stat-number--danger">{stats.bySeverity.critical}</p>
          </div>
        </div>
      )}

      <div className="security-filters">
        <div className="filter-group">
          <label className="filter-label">Status:</label>
          <button
            className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All ({logs.length})
          </button>
          <button
            className={`filter-btn ${statusFilter === 'unresolved' ? 'active' : ''}`}
            onClick={() => setStatusFilter('unresolved')}
          >
            Unresolved ({logs.filter(l => !l.resolved).length})
          </button>
          <button
            className={`filter-btn ${statusFilter === 'resolved' ? 'active' : ''}`}
            onClick={() => setStatusFilter('resolved')}
          >
            Resolved ({logs.filter(l => l.resolved).length})
          </button>
        </div>

        <div className="filter-group">
          <label className="filter-label">Type:</label>
          <button
            className={`filter-btn ${typeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setTypeFilter('all')}
          >
            All Types
          </button>
          <button
            className={`filter-btn ${typeFilter === 'underage' ? 'active' : ''}`}
            onClick={() => setTypeFilter('underage')}
          >
            Underage ({logs.filter(l => l.type && l.type.includes('underage')).length})
          </button>
          <button
            className={`filter-btn ${typeFilter === 'email_verification' ? 'active' : ''}`}
            onClick={() => setTypeFilter('email_verification')}
          >
            Email Verification ({logs.filter(l => l.type === 'email_verification').length})
          </button>
          <button
            className={`filter-btn ${typeFilter === 'failed_login' ? 'active' : ''}`}
            onClick={() => setTypeFilter('failed_login')}
          >
            Failed Logins ({logs.filter(l => l.type === 'failed_login').length})
          </button>
        </div>

        <div className="filter-group">
          <button
            className="btn-resolve-all"
            onClick={handleResolveAll}
            disabled={filteredLogs.filter(l => !l.resolved).length === 0}
          >
            ✅ Resolve All ({filteredLogs.filter(l => !l.resolved).length})
          </button>
        </div>
      </div>

      <div className="security-logs-list">
        {filteredLogs.length === 0 ? (
          <div className="no-data" role="status" aria-live="polite">
            <p>No security logs found.</p>
          </div>
        ) : (
          filteredLogs.map(log => (
            <div key={log._id} className={`security-log-item ${log.resolved ? 'resolved' : 'unresolved'}`}>
              <div className="log-header">
                <span className="log-type">{getTypeLabel(log.type)}</span>
                <span className={getSeverityClassName(log.severity)}>
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
                    <span className={getActionBadgeClassName(log.action)}>
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
                  <button
                    className="admin-action-trigger"
                    onClick={() => toggleActionMenu(log._id)}
                    title="Actions"
                  >
                    ⋯
                  </button>

                  {openMenuId === log._id && (
                    <div className="admin-action-menu">
                      <button onClick={() => {
                        onResolve(log._id);
                        setOpenMenuId(null);
                      }}>
                        ✅ Mark as Resolved
                      </button>
                      <button onClick={() => {
                        // Copy log details to clipboard
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

// BadgesTab Component - Manage platform badges
function BadgesTab({ badges, onRefresh }) {
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
        <div className="badges-toolbar">
          <button
            type="button"
            className="badges-toolbar__button badges-toolbar__button--primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? '✕ Cancel' : '+ Create Badge'}
          </button>
          <button
            type="button"
            className="badges-toolbar__button badges-toolbar__button--success"
            onClick={handleSeedAutoBadges}
          >
            🌱 Seed Auto Badges
          </button>
          <button
            type="button"
            className="badges-toolbar__button badges-toolbar__button--info"
            onClick={() => {
              setShowAuditLog(!showAuditLog);
              if (!showAuditLog) loadAuditLog();
            }}
          >
            {showAuditLog ? '✕ Hide Log' : '📋 Audit Log'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleCreateBadge} className="admin-card badge-form">
          <div className="badge-form-grid">
            <div className="badge-field">
              <label htmlFor="badge-id">Badge ID</label>
              <input
                id="badge-id"
                type="text"
                className="badge-form-input"
                value={newBadge.id}
                onChange={(e) => setNewBadge({ ...newBadge, id: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                placeholder="early_member"
                required
              />
            </div>
            <div className="badge-field">
              <label htmlFor="badge-label">Label</label>
              <input
                id="badge-label"
                type="text"
                className="badge-form-input"
                value={newBadge.label}
                onChange={(e) => setNewBadge({ ...newBadge, label: e.target.value })}
                placeholder="Early Member"
                required
              />
            </div>
            <div className="badge-field">
              <label htmlFor="badge-icon">Icon (emoji)</label>
              <input
                id="badge-icon"
                type="text"
                className="badge-form-input"
                value={newBadge.icon}
                onChange={(e) => setNewBadge({ ...newBadge, icon: e.target.value })}
                placeholder="⭐"
              />
            </div>
            <div className="badge-field">
              <label htmlFor="badge-type">Type</label>
              <select
                id="badge-type"
                className="badge-form-input"
                value={newBadge.type}
                onChange={(e) => setNewBadge({ ...newBadge, type: e.target.value })}
              >
                <option value="platform">Platform (Official)</option>
                <option value="community">Community</option>
                <option value="activity">Activity</option>
              </select>
            </div>
            <div className="badge-field badge-field--wide">
              <label htmlFor="badge-tooltip">Tooltip</label>
              <input
                id="badge-tooltip"
                type="text"
                className="badge-form-input"
                value={newBadge.tooltip}
                onChange={(e) => setNewBadge({ ...newBadge, tooltip: e.target.value })}
                placeholder="Joined during beta launch"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="badge-form-submit"
          >
            {creating ? 'Creating...' : 'Create Badge'}
          </button>
        </form>
      )}

      {/* Audit Log Section */}
      {showAuditLog && (
        <div className="admin-card badge-audit-card">
          <h3 className="badge-audit-heading">📋 Badge Assignment Audit Log</h3>
          {loadingAudit ? (
            <div className="loading-state">Loading audit log...</div>
          ) : auditLog.length === 0 ? (
            <div className="no-data">
              <p>No badge assignments recorded yet.</p>
            </div>
          ) : (
            <div className="badge-audit-list">
              {auditLog.map((log, index) => (
                <div key={log._id || index} className="badge-audit-row">
                  <div className="badge-audit-main">
                    <span className={`badge-pill ${log.action === 'assigned' ? 'badge-pill--success' : 'badge-pill--danger'}`}>
                      {log.action}
                    </span>
                    <strong>{log.badgeLabel}</strong> → @{log.username}
                    {log.isAutomatic && (
                      <span className="badge-pill badge-pill--info">AUTO</span>
                    )}
                  </div>
                  <div className="badge-audit-meta">
                    {new Date(log.createdAt).toLocaleString()}
                    {log.assignedBy && ` by @${log.assignedByUsername}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="badges-list">
        {badges.length === 0 ? (
          <div className="no-data">
            <p>No badges created yet. Create your first badge above!</p>
          </div>
        ) : (
          badges.map(badge => (
            <div key={badge._id || badge.id} className="badge-card">
              <span className="badge-card__icon" aria-hidden="true">{badge.icon}</span>
              <div className="badge-card__content">
                <div className="badge-card__heading">
                  <span className="badge-card__label">{badge.label}</span>
                  {badge.assignmentType === 'automatic' && (
                    <span className="badge-pill badge-pill--info">AUTO</span>
                  )}
                </div>
                <div className="badge-card__tooltip">{badge.tooltip}</div>
                {badge.description && (
                  <div className="badge-card__description">
                    {badge.description}
                  </div>
                )}
                <div className="badge-card__meta">
                  <span className={`badge-pill badge-pill--${badge.type || 'default'}`}>
                    {badge.type}
                  </span>
                  <span className="badge-meta-text">ID: {badge.id}</span>
                  {badge.automaticRule && (
                    <span className="badge-meta-text">
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

// Post Modal Component for Admin Content Viewing
function PostModal({ post, onClose }) {
  useEscapeToClose(onClose);
  if (!post) return null;

  return (
    <div className="admin-post-modal-overlay" onClick={onClose}>
      <div
        className="admin-post-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Post Details"
      >
        <div className="admin-post-modal-header">
          <h2>Post Details</h2>
          <button className="admin-modal-close" onClick={onClose} aria-label="Close post details">✕</button>
        </div>

        <div className="admin-post-modal-content">
          {/* Author Info */}
          <div className="admin-post-author">
            {post.author?.profilePhoto && (
              <img
                src={getImageUrl(post.author.profilePhoto)}
                alt={post.author.displayName || post.author.username}
                className="admin-post-author-avatar"
              />
            )}
            <div className="admin-post-author-info">
              <div className="admin-post-author-name">
                {post.author?.displayName || post.author?.username}
                {/* REMOVED 2025-12-28: Verification tick replaced by badge system */}
              </div>
              <div className="admin-post-author-username">@{post.author?.username}</div>
              {post.author?.pronouns && (
                <div className="admin-post-author-pronouns">{post.author.pronouns}</div>
              )}
            </div>
          </div>

          {/* Post Content */}
          {post.content && (
            <div className="admin-post-content">
              <p>{post.content}</p>
            </div>
          )}

          {/* Content Warning */}
          {post.contentWarning && (
            <div className="admin-post-warning">
              <strong>⚠️ Content Warning:</strong> {post.contentWarning}
            </div>
          )}

          {/* Media */}
          {post.media && post.media.length > 0 && (
            <div className="admin-post-media">
              {post.media.map((item, index) => (
                <div key={index} className="admin-post-media-item">
                  {item.type === 'image' && (
                    <img src={getImageUrl(item.url)} alt={`Media ${index + 1}`} />
                  )}
                  {item.type === 'video' && (
                    <video src={getImageUrl(item.url)} controls />
                  )}
                  {item.type === 'gif' && (
                    <img src={getImageUrl(item.url)} alt={`GIF ${index + 1}`} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Legacy Images */}
          {post.images && post.images.length > 0 && (
            <div className="admin-post-media">
              {post.images.map((img, index) => (
                <OptimizedImage
                  key={index}
                  src={getImageUrl(img)}
                  alt={`Image ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="admin-post-tags">
              <strong>Tags:</strong>
              {post.tags.map(tag => (
                <span key={tag._id} className="admin-post-tag">
                  {tag.icon} {tag.label}
                </span>
              ))}
            </div>
          )}

          {/* Post Metadata */}
          <div className="admin-post-metadata">
            <div className="admin-post-meta-item">
              <strong>Visibility:</strong> {post.visibility}
            </div>
            <div className="admin-post-meta-item">
              <strong>Created:</strong> {new Date(post.createdAt).toLocaleString()}
            </div>
            {post.updatedAt && post.updatedAt !== post.createdAt && (
              <div className="admin-post-meta-item">
                <strong>Updated:</strong> {new Date(post.updatedAt).toLocaleString()}
              </div>
            )}
            <div className="admin-post-meta-item">
              <strong>Reactions:</strong> {post.reactions?.length || 0}
            </div>
            <div className="admin-post-meta-item">
              <strong>Comments:</strong> {post.comments?.length || 0}
            </div>
          </div>

          {/* Reactions */}
          {post.reactions && post.reactions.length > 0 && (
            <div className="admin-post-reactions">
              <h3>Reactions ({post.reactions.length})</h3>
              <div className="admin-reactions-list">
                {post.reactions.map((reaction, index) => (
                  <div key={index} className="admin-reaction-item">
                    <span className="admin-reaction-emoji">{reaction.emoji}</span>
                    <span className="admin-reaction-user">
                      {reaction.user?.displayName || reaction.user?.username}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          {post.comments && post.comments.length > 0 && (
            <div className="admin-post-comments">
              <h3>Comments ({post.comments.length})</h3>
              <div className="admin-comments-list">
                {post.comments.map((comment) => (
                  <div key={comment._id} className="admin-comment-item">
                    <div className="admin-comment-header">
                      <strong>{comment.user?.displayName || comment.user?.username}</strong>
                      <span className="admin-comment-date">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="admin-comment-content">{comment.content}</div>
                    {comment.reactions && comment.reactions.length > 0 && (
                      <div className="admin-comment-reactions">
                        {comment.reactions.map((reaction, index) => (
                          <span key={index} className="admin-comment-reaction">
                            {reaction.emoji}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Moderation Tab Component
function ModerationTab({ settings, history, onRefresh, showAlert, showConfirm, showPrompt }) {
  const [activeSection, setActiveSection] = useState('settings');
  const [newWord, setNewWord] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('custom');
  const [isUpdating, setIsUpdating] = useState(false);
  const [localSettings, setLocalSettings] = useState(null);
  const autoMuteEnabledId = 'moderation-auto-mute-enabled';
  const autoMuteEnabledHelpId = 'moderation-auto-mute-enabled-help';
  const violationThresholdId = 'moderation-violation-threshold';
  const violationThresholdHelpId = 'moderation-violation-threshold-help';
  const minutesPerViolationId = 'moderation-minutes-per-violation';
  const minutesPerViolationHelpId = 'moderation-minutes-per-violation-help';
  const maxMuteDurationId = 'moderation-max-mute-duration';
  const maxMuteDurationHelpId = 'moderation-max-mute-duration-help';
  const spamMuteDurationId = 'moderation-spam-mute-duration';
  const spamMuteDurationHelpId = 'moderation-spam-mute-duration-help';
  const pointsPerBlockedWordId = 'moderation-points-per-blocked-word';
  const pointsPerBlockedWordHelpId = 'moderation-points-per-blocked-word-help';
  const pointsForSpamId = 'moderation-points-for-spam';
  const pointsForSpamHelpId = 'moderation-points-for-spam-help';
  const blockedWordId = 'moderation-blocked-word';
  const blockedWordHelpId = 'moderation-blocked-word-help';
  const blockedWordCategoryId = 'moderation-blocked-word-category';
  const blockedWordCategoryHelpId = 'moderation-blocked-word-category-help';

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleUpdateSettings = async () => {
    if (!localSettings) return;
    setIsUpdating(true);
    try {
      await api.put('/admin/moderation/settings', {
        autoMute: localSettings.autoMute,
        toxicity: localSettings.toxicity
      });
      showAlert('Settings updated successfully', 'Success');
      onRefresh();
    } catch (error) {
      console.error('Update settings error:', error);
      showAlert(error.response?.data?.message || 'Failed to update settings', 'Error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddWord = async () => {
    if (!newWord.trim()) return;
    try {
      await api.post('/admin/moderation/blocked-words', {
        word: newWord.trim(),
        category: selectedCategory
      });
      showAlert(`Word "${newWord}" added to ${selectedCategory}`, 'Success');
      setNewWord('');
      onRefresh();
    } catch (error) {
      console.error('Add word error:', error);
      showAlert(error.response?.data?.message || 'Failed to add word', 'Error');
    }
  };

  const handleRemoveWord = async (word, category) => {
    const confirmed = await showConfirm(
      `Remove "${word}" from ${category}?`,
      'Remove Word',
      'Remove',
      'Cancel'
    );
    if (!confirmed) return;

    try {
      await api.delete('/admin/moderation/blocked-words', {
        data: { word, category }
      });
      showAlert(`Word "${word}" removed`, 'Success');
      onRefresh();
    } catch (error) {
      console.error('Remove word error:', error);
      showAlert(error.response?.data?.message || 'Failed to remove word', 'Error');
    }
  };

  if (!localSettings) {
    return (
      <div className="loading-state loading-state--stack" role="status" aria-live="polite">
        <p className="loading-state__message">Loading moderation settings...</p>
      </div>
    );
  }

  return (
    <div className="moderation-container">
      <h2>🔧 Moderation Settings</h2>

      <div className="moderation-sections">
        <button
          type="button"
          className={`section-tab ${activeSection === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveSection('settings')}
        >
          ⚙️ Settings
        </button>
        <button
          type="button"
          className={`section-tab ${activeSection === 'words' ? 'active' : ''}`}
          onClick={() => setActiveSection('words')}
        >
          🚫 Blocked Words
        </button>
        <button
          type="button"
          className={`section-tab ${activeSection === 'history' ? 'active' : ''}`}
          onClick={() => setActiveSection('history')}
        >
          📜 History
        </button>
      </div>

      {activeSection === 'settings' && (
        <div className="moderation-settings">
          <div className="settings-section">
            <h3>🔇 Auto-Mute Configuration</h3>

            <div className="setting-row setting-row-checkbox">
              <label className="checkbox-label" htmlFor={autoMuteEnabledId}>
                <input
                  id={autoMuteEnabledId}
                  type="checkbox"
                  checked={localSettings.autoMute?.enabled ?? true}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    autoMute: { ...localSettings.autoMute, enabled: e.target.checked }
                  })}
                  aria-describedby={autoMuteEnabledHelpId}
                />
                <span>Enable Auto-Mute</span>
              </label>
              <p id={autoMuteEnabledHelpId} className="setting-help">When enabled, users are automatically muted after repeated violations.</p>
            </div>

            <div className="setting-row">
              <label htmlFor={violationThresholdId}>Violation Threshold (mute after X violations):</label>
              <input
                id={violationThresholdId}
                type="number"
                min="1"
                max="10"
                value={localSettings.autoMute?.violationThreshold ?? 3}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  autoMute: { ...localSettings.autoMute, violationThreshold: parseInt(e.target.value) }
                })}
                aria-describedby={violationThresholdHelpId}
              />
              <p id={violationThresholdHelpId} className="setting-help">Number of violations before a user gets automatically muted. Lower = stricter.</p>
            </div>

            <div className="setting-row">
              <label htmlFor={minutesPerViolationId}>Minutes per Violation:</label>
              <input
                id={minutesPerViolationId}
                type="number"
                min="5"
                max="1440"
                value={localSettings.autoMute?.minutesPerViolation ?? 30}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  autoMute: { ...localSettings.autoMute, minutesPerViolation: parseInt(e.target.value) }
                })}
                aria-describedby={minutesPerViolationHelpId}
              />
              <p id={minutesPerViolationHelpId} className="setting-help">Mute duration = violations × this value. E.g., 3 violations × 30 min = 90 min mute.</p>
            </div>

            <div className="setting-row">
              <label htmlFor={maxMuteDurationId}>Max Mute Duration (minutes):</label>
              <input
                id={maxMuteDurationId}
                type="number"
                min="60"
                max="10080"
                value={localSettings.autoMute?.maxMuteDuration ?? 1440}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  autoMute: { ...localSettings.autoMute, maxMuteDuration: parseInt(e.target.value) }
                })}
                aria-describedby={maxMuteDurationHelpId}
              />
              <p id={maxMuteDurationHelpId} className="setting-help">Maximum mute time regardless of violation count. 1440 min = 24 hours.</p>
            </div>

            <div className="setting-row">
              <label htmlFor={spamMuteDurationId}>Spam Mute Duration (minutes):</label>
              <input
                id={spamMuteDurationId}
                type="number"
                min="15"
                max="1440"
                value={localSettings.autoMute?.spamMuteDuration ?? 60}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  autoMute: { ...localSettings.autoMute, spamMuteDuration: parseInt(e.target.value) }
                })}
                aria-describedby={spamMuteDurationHelpId}
              />
              <p id={spamMuteDurationHelpId} className="setting-help">Immediate mute duration when spam is detected (excessive links, caps, etc.).</p>
            </div>
          </div>

          <div className="settings-section">
            <h3>☠️ Toxicity Scoring</h3>
            <p className="section-help">Toxicity score is calculated per-post. Higher scores = more toxic content.</p>

            <div className="setting-row">
              <label htmlFor={pointsPerBlockedWordId}>Points per Blocked Word:</label>
              <input
                id={pointsPerBlockedWordId}
                type="number"
                min="1"
                max="50"
                value={localSettings.toxicity?.pointsPerBlockedWord ?? 10}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  toxicity: { ...localSettings.toxicity, pointsPerBlockedWord: parseInt(e.target.value) }
                })}
                aria-describedby={pointsPerBlockedWordHelpId}
              />
              <p id={pointsPerBlockedWordHelpId} className="setting-help">Points added to toxicity score for each blocked word found in content.</p>
            </div>

            <div className="setting-row">
              <label htmlFor={pointsForSpamId}>Points for Spam:</label>
              <input
                id={pointsForSpamId}
                type="number"
                min="5"
                max="50"
                value={localSettings.toxicity?.pointsForSpam ?? 20}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  toxicity: { ...localSettings.toxicity, pointsForSpam: parseInt(e.target.value) }
                })}
                aria-describedby={pointsForSpamHelpId}
              />
              <p id={pointsForSpamHelpId} className="setting-help">Points added when content is flagged as spam (excessive caps, links, emojis).</p>
            </div>
          </div>

          <button
            type="button"
            className="btn-save-settings"
            onClick={handleUpdateSettings}
            disabled={isUpdating}
          >
            {isUpdating ? 'Saving...' : '💾 Save Settings'}
          </button>
        </div>
      )}

      {activeSection === 'words' && (
        <div className="blocked-words-section">
          <div className="add-word-form">
            <h3>Add Blocked Word</h3>
            <p className="section-help">Add a word or phrase and choose the moderation category it belongs to.</p>
            <div className="add-word-row">
              <label className="sr-only" htmlFor={blockedWordId}>Blocked word or phrase</label>
              <input
                id={blockedWordId}
                type="text"
                placeholder="Enter word or phrase..."
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddWord();
                  }
                }}
                aria-describedby={blockedWordHelpId}
              />
              <label className="sr-only" htmlFor={blockedWordCategoryId}>Blocked word category</label>
              <select
                id={blockedWordCategoryId}
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-describedby={blockedWordCategoryHelpId}
              >
                <option value="custom">Custom</option>
                <option value="profanity">Profanity</option>
                <option value="slurs">Slurs</option>
                <option value="sexual">Sexual</option>
                <option value="spam">Spam</option>
              </select>
              <button type="button" onClick={handleAddWord} aria-label={`Add blocked word to ${selectedCategory} category`}>➕ Add</button>
            </div>
            <p id={blockedWordHelpId} className="setting-help">Use this field to add a word or phrase that should be moderated automatically.</p>
            <p id={blockedWordCategoryHelpId} className="setting-help">Choose which moderation category this word should be saved under.</p>
          </div>

          {['profanity', 'slurs', 'sexual', 'spam', 'custom'].map(category => (
            <div key={category} className="word-category">
              <h4>{category.charAt(0).toUpperCase() + category.slice(1)} ({localSettings.blockedWords?.[category]?.length || 0})</h4>
              <div className="word-list">
                {(localSettings.blockedWords?.[category] || []).map(word => (
                  <span key={word} className="word-tag">
                    {word}
                    <button
                      type="button"
                      className="remove-word-btn"
                      onClick={() => handleRemoveWord(word, category)}
                      title="Remove word"
                      aria-label={`Remove ${word} from ${category}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
                {(!localSettings.blockedWords?.[category] || localSettings.blockedWords[category].length === 0) && (
                  <span className="empty-category">No words in this category</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeSection === 'history' && (
        <div className="moderation-history">
          <h3>Recent Moderation Actions</h3>
          {history.length === 0 ? (
            <div className="no-data" role="status" aria-live="polite">
              <p>No moderation history found.</p>
            </div>
          ) : (
            <div className="history-cards">
              {history.map((entry, index) => (
                <div key={index} className="history-card">
                  <div className="history-card-header">
                    <div className="history-card-user">
                      <span className="history-user-name">
                        {entry.displayName || entry.username}
                      </span>
                      <span className={`action-badge action-${entry.action}`}>
                        {entry.action}
                      </span>
                    </div>
                    <div className="history-card-meta">
                      <span className="history-type">
                        {entry.automated ? '🤖 Auto' : '👤 Manual'}
                      </span>
                      <span className="history-date">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="history-card-body">
                    <div className="history-reason">
                      <strong>Reason:</strong> {entry.reason}
                    </div>

                    {entry.contentType && entry.contentType !== 'other' && (
                      <div className="history-content-type">
                        <strong>Content Type:</strong> {entry.contentType}
                      </div>
                    )}

                    {entry.detectedViolations && entry.detectedViolations.length > 0 && (
                      <div className="history-violations">
                        <strong>Detected Violations:</strong>
                        <div className="violation-tags">
                          {entry.detectedViolations.map((v, i) => (
                            <span key={i} className="violation-tag">{v}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {entry.contentPreview && (
                      <div className="history-content-preview">
                        <strong>Content Preview:</strong>
                        <div className="content-preview-box">
                          {entry.contentPreview}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Admin;

