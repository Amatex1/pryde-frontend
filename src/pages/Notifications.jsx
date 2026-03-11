import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AsyncStateWrapper from '../components/AsyncStateWrapper';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { getSocket } from '../utils/socket';
import logger from '../utils/logger';
import { sendTestNotification } from '../utils/pushNotifications';
import './Notifications.css';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [pendingApprovalIds, setPendingApprovalIds] = useState(new Set());
  const [approvalActionId, setApprovalActionId] = useState('');
  const [approvalStateById, setApprovalStateById] = useState(() => new Map());
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [testPushStatus, setTestPushStatus] = useState(null); // null | 'sending' | 'ok' | 'error' | 'no-sub'
  const [testPushError, setTestPushError] = useState(null);
  const navigate = useNavigate();
  const { isAuthReady, isAuthenticated } = useAuth();
  // Get menu handler from AppLayout outlet context
  const { onMenuOpen } = useOutletContext() || {};

  const isVisibleNotification = useCallback((notification) => {
    return notification?.type !== 'message';
  }, []);

  const upsertNotification = useCallback((prevNotifications, nextNotification) => {
    if (!nextNotification?._id || !isVisibleNotification(nextNotification)) {
      return prevNotifications;
    }

    const dedupedNotifications = prevNotifications.filter(
      notification => notification._id !== nextNotification._id
    );

    return [nextNotification, ...dedupedNotifications];
  }, [isVisibleNotification]);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthReady) {
      return;
    }

    if (!isAuthenticated) {
      setNotifications([]);
      setPendingApprovalIds(new Set());
      setFetchError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setFetchError(null);

      const [notificationsResult, pendingApprovalsResult] = await Promise.allSettled([
        api.get('/notifications'),
        api.get('/login-approval/pending')
      ]);

      if (notificationsResult.status !== 'fulfilled') {
        throw notificationsResult.reason;
      }

      const response = notificationsResult.value;
      // Filter out message notifications - they should only appear in Messages page
      const filteredNotifications = response.data.filter(isVisibleNotification);
      setNotifications(filteredNotifications);

      if (pendingApprovalsResult.status === 'fulfilled') {
        const nextPendingIds = new Set(
          (pendingApprovalsResult.value.data?.approvals || []).map(approval => String(approval._id))
        );
        setPendingApprovalIds(nextPendingIds);
      } else {
        logger.error('Failed to fetch pending login approvals:', pendingApprovalsResult.reason);
        setPendingApprovalIds(new Set());
      }
    } catch (error) {
      logger.error('Failed to fetch notifications:', error);
      setFetchError(error);
    } finally {
      setLoading(false);
    }
  }, [isAuthReady, isAuthenticated, isVisibleNotification]);

  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    fetchNotifications();
  }, [fetchNotifications, isAuthReady]);

  useEffect(() => {
    if (!isAuthReady || !isAuthenticated) {
      return undefined;
    }

    let socket = getSocket();
    let retryInterval = null;
    let stopRetryTimeout = null;
    let cleanupFn = null;

    const handleNewNotification = (data) => {
      const nextNotification = data?.notification || data;

      if (!nextNotification?._id || !isVisibleNotification(nextNotification)) {
        return;
      }

      setNotifications(prevNotifications => upsertNotification(prevNotifications, nextNotification));

      if (nextNotification.type === 'login_approval') {
        const approvalId = String(
          nextNotification.loginApprovalId?._id || nextNotification.loginApprovalId || ''
        );

        if (approvalId) {
          setPendingApprovalIds(prevPendingIds => {
            const nextPendingIds = new Set(prevPendingIds);
            nextPendingIds.add(approvalId);
            return nextPendingIds;
          });
        }
      }
    };

    const handleNotificationRead = (data) => {
      setNotifications(prevNotifications => prevNotifications.map(notification => (
        notification._id === data?.notificationId
          ? { ...notification, read: true }
          : notification
      )));
    };

    const handleNotificationReadAll = () => {
      setNotifications(prevNotifications => prevNotifications.map(notification => ({
        ...notification,
        read: true,
      })));
    };

    const handleNotificationDeleted = (data) => {
      setNotifications(prevNotifications => prevNotifications.filter(
        notification => notification._id !== data?.notificationId
      ));
    };

    const attachListeners = (activeSocket) => {
      activeSocket.on('notification:new', handleNewNotification);
      activeSocket.on('notification:read', handleNotificationRead);
      activeSocket.on('notification:read_all', handleNotificationReadAll);
      activeSocket.on('notification:deleted', handleNotificationDeleted);

      cleanupFn = () => {
        activeSocket.off('notification:new', handleNewNotification);
        activeSocket.off('notification:read', handleNotificationRead);
        activeSocket.off('notification:read_all', handleNotificationReadAll);
        activeSocket.off('notification:deleted', handleNotificationDeleted);
      };
    };

    if (socket) {
      attachListeners(socket);
    } else {
      retryInterval = setInterval(() => {
        socket = getSocket();

        if (socket) {
          clearInterval(retryInterval);
          retryInterval = null;
          attachListeners(socket);
        }
      }, 500);

      stopRetryTimeout = setTimeout(() => {
        if (retryInterval) {
          clearInterval(retryInterval);
          retryInterval = null;
          logger.warn('Notifications page socket listeners were not attached within 10 seconds');
        }
      }, 10000);
    }

    return () => {
      if (retryInterval) {
        clearInterval(retryInterval);
      }
      if (stopRetryTimeout) {
        clearTimeout(stopRetryTimeout);
      }
      cleanupFn?.();
    };
  }, [isAuthReady, isAuthenticated, isVisibleNotification, upsertNotification]);

  const getApprovalId = (notification) => {
    if (!notification?.loginApprovalId) {
      return null;
    }

    return String(notification.loginApprovalId._id || notification.loginApprovalId);
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      logger.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      logger.error('Failed to mark all as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (notification.type === 'login_approval') {
      markAsRead(notification._id);
      return;
    }

    markAsRead(notification._id);

    // Navigate based on notification type
    if (notification.type === 'friend_request' || notification.type === 'friend_accept') {
      // Navigate to the sender's profile
      if (notification.sender?._id) {
        navigate(`/profile/${notification.sender._id}`);
      } else {
        navigate('/feed');
      }
    } else if (notification.type === 'group_post' || notification.type === 'group_mention') {
      // Phase 4B: Group notifications - navigate to the group
      if (notification.groupSlug) {
        navigate(`/groups/${notification.groupSlug}`);
      } else if (notification.link) {
        navigate(notification.link);
      } else {
        navigate('/groups');
      }
    } else if (notification.postId) {
      if (notification.commentId && (notification.type === 'comment' || notification.type === 'like')) {
        navigate(`/feed?post=${notification.postId}&comment=${notification.commentId}`);
      } else {
        navigate(`/feed?post=${notification.postId}`);
      }
    } else if (notification.link) {
      navigate(notification.link);
    } else {
      navigate('/feed');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like': return '❤️';
      case 'comment': return '💬';
      case 'friend_request': return '👥';
      case 'friend_accept': return '✅';
      case 'mention': return '@';
      case 'share': return '🔄';
      case 'reaction': return '😊';
      case 'group_post': return '📝';
      case 'group_mention': return '💬';
      case 'announcement': return '📢';
      case 'login_approval': return '🔐';
      default: return '🔔';
    }
  };

  const getNotificationText = (notification) => {
    const senderName = notification.sender?.displayName || notification.sender?.username || 'Someone';
    const groupName = notification.groupName || 'a group';

    switch (notification.type) {
      case 'like':
        return notification.commentId
          ? `${senderName} reacted to your comment`
          : `${senderName} liked your post`;
      case 'comment':
        return `${senderName} commented on your post`;
      case 'friend_request':
        return `${senderName} sent you a friend request`;
      case 'friend_accept':
        return `${senderName} accepted your friend request`;
      case 'mention':
        return `${senderName} mentioned you in a post`;
      case 'share':
        return `${senderName} shared your post`;
      case 'reaction':
        return `${senderName} reacted to your post`;
      case 'group_post':
        return `${senderName} posted in ${groupName}`;
      case 'group_mention':
        return `${senderName} mentioned you in ${groupName}`;
      case 'announcement':
        return notification.message || `${senderName} sent an @everyone announcement`;
      case 'login_approval':
        return `Approve sign in from ${notification.loginApprovalData?.deviceInfo || 'another device'}`;
      default:
        return notification.message || 'New notification';
    }
  };

  const getLoginApprovalLocation = (notification) => {
    const location = notification.loginApprovalData?.location;
    return [location?.city, location?.region, location?.country].filter(Boolean).join(', ');
  };

  const handleLoginApprovalAction = async (notification, action, event) => {
    event.stopPropagation();

    const approvalId = getApprovalId(notification);
    if (!approvalId) {
      return;
    }

    setApprovalActionId(approvalId);
    setApprovalStateById(prev => new Map(prev).set(approvalId, {
        status: 'pending',
        message: action === 'approve' ? 'Approving login…' : 'Denying login…'
      }));

    try {
      const response = await api.post(`/login-approval/${action}`, { approvalId });

      setPendingApprovalIds(prev => {
        const next = new Set(prev);
        next.delete(approvalId);
        return next;
      });

      setNotifications(prev => prev.map(n => (
        n._id === notification._id ? { ...n, read: true } : n
      )));

      setApprovalStateById(prev => new Map(prev).set(approvalId, {
          status: action === 'approve' ? 'approved' : 'denied',
          message: response.data?.message || (action === 'approve' ? 'Login approved successfully' : 'Login denied successfully')
        }));

      await markAsRead(notification._id);
    } catch (error) {
      logger.error(`Failed to ${action} login approval:`, error);
      setApprovalStateById(prev => new Map(prev).set(approvalId, {
          status: 'error',
          message: error.response?.data?.message || `Could not ${action} this login request.`
        }));
    } finally {
      setApprovalActionId('');
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 604800)}w ago`;
  };

  const handleTestPush = async () => {
    setTestPushStatus('sending');
    setTestPushError(null);
    try {
      const result = await sendTestNotification();
      if (result?.hasSubscription === false) {
        setTestPushStatus('no-sub');
      } else if (result?.success) {
        setTestPushStatus('ok');
      } else {
        setTestPushStatus('error');
        setTestPushError(result?.message || null);
      }
    } catch {
      setTestPushStatus('error');
    } finally {
      setTimeout(() => { setTestPushStatus(null); setTestPushError(null); }, 6000);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="notifications-page">
      <Navbar onMenuClick={onMenuOpen} />
      
      <div className="notifications-container">
        <div className="notifications-header">
          <h1>Notifications</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="mark-all-read-btn">
                Mark all as read
              </button>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <button
                onClick={handleTestPush}
                disabled={testPushStatus === 'sending'}
                className="mark-all-read-btn"
                title="Send a test push notification to your device"
                style={{ opacity: testPushStatus === 'sending' ? 0.6 : 1 }}
              >
                {testPushStatus === 'sending' ? 'Sending...'
                  : testPushStatus === 'ok' ? 'Sent'
                  : testPushStatus === 'no-sub' ? 'Enable notifications first'
                  : testPushStatus === 'error' ? 'Failed'
                  : 'Test push'}
              </button>
              {testPushError && (
                <span style={{ fontSize: '11px', color: 'var(--color-danger)', maxWidth: '240px', textAlign: 'right', lineHeight: '1.3' }}>
                  {testPushError}
                </span>
              )}
            </div>
          </div>
        </div>

        <AsyncStateWrapper
          isLoading={loading}
          isError={Boolean(fetchError)}
          isEmpty={!loading && !fetchError && notifications.length === 0}
          error={fetchError}
          onRetry={fetchNotifications}
          loadingMessage="Loading notifications..."
          emptyComponent={(
            <EmptyState
              type="notifications"
              title="No notifications yet"
              description="You're all caught up for now."
            />
          )}
        >
          <div className="notifications-list">
            {notifications.map(notification => (
              notification.type === 'login_approval' ? (() => {
                const approvalId = getApprovalId(notification);
                const approvalState = approvalId ? approvalStateById.get(approvalId) : null;
                const isPendingApproval = approvalId ? pendingApprovalIds.has(approvalId) : false;
                const loginApprovalLocation = getLoginApprovalLocation(notification);
                const loginApprovalDetails = [
                  notification.loginApprovalData?.browser,
                  notification.loginApprovalData?.os
                ].filter(Boolean).join(' • ');

                return (
                  <div
                    key={notification._id}
                    className={`notification-card notification-card-static login-approval-card ${!notification.read ? 'unread' : ''}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleNotificationClick(notification)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleNotificationClick(notification);
                      }
                    }}
                    aria-label={getNotificationText(notification)}
                  >
                    <div className="notification-icon">{getNotificationIcon(notification.type)}</div>
                    <div className="notification-content">
                      <p className="notification-text">{getNotificationText(notification)}</p>

                      <div className="login-approval-meta">
                        <div className="login-approval-code-row">
                          <span className="login-approval-label">Verification code</span>
                          <span className="login-approval-code">
                            {notification.loginApprovalData?.verificationCode || '--'}
                          </span>
                        </div>

                        {loginApprovalDetails && (
                          <p className="login-approval-detail">{loginApprovalDetails}</p>
                        )}

                        {notification.loginApprovalData?.ipAddress && (
                          <p className="login-approval-detail">IP: {notification.loginApprovalData.ipAddress}</p>
                        )}

                        {loginApprovalLocation && (
                          <p className="login-approval-detail">{loginApprovalLocation}</p>
                        )}
                      </div>

                      <span className="notification-time">{getTimeAgo(notification.createdAt)}</span>

                      {approvalState?.message && (
                        <p className={`login-approval-feedback ${approvalState.status || 'info'}`}>
                          {approvalState.message}
                        </p>
                      )}

                      {isPendingApproval && (
                        <div className="login-approval-actions">
                          <button
                            type="button"
                            className="login-approval-btn login-approval-btn-approve"
                            disabled={approvalActionId === approvalId}
                            onClick={(event) => handleLoginApprovalAction(notification, 'approve', event)}
                          >
                            {approvalActionId === approvalId ? 'Working…' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            className="login-approval-btn login-approval-btn-deny"
                            disabled={approvalActionId === approvalId}
                            onClick={(event) => handleLoginApprovalAction(notification, 'deny', event)}
                          >
                            {approvalActionId === approvalId ? 'Working…' : 'Deny'}
                          </button>
                        </div>
                      )}
                    </div>
                    {!notification.read && <div className="unread-indicator"></div>}
                  </div>
                );
              })() : (
                <button
                  key={notification._id}
                  className={`notification-card ${!notification.read ? 'unread' : ''} ${notification.type === 'announcement' ? 'announcement' : ''}`}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  aria-label={getNotificationText(notification)}
                >
                  <div className="notification-icon">{getNotificationIcon(notification.type)}</div>
                  <div className="notification-content">
                    <p className="notification-text">{getNotificationText(notification)}</p>
                    <span className="notification-time">{getTimeAgo(notification.createdAt)}</span>
                  </div>
                  {!notification.read && <div className="unread-indicator"></div>}
                </button>
              )
            ))}
          </div>
        </AsyncStateWrapper>
      </div>
    </div>
  );
}

export default Notifications;

