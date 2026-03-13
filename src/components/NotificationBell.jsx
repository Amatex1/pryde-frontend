import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bell, Heart, MessageCircle, UserPlus, UserCheck,
  AtSign, Repeat2, Smile, FileText,
} from 'lucide-react';
import api from '../utils/api';
import { getSocket } from '../utils/socket';
import { useAuth } from '../context/AuthContext';
import logger from '../utils/logger';
import {
  filterSocialNotifications,
  shouldIncrementBellCount,
} from '../constants/notificationTypes';
import { LUCIDE_DEFAULTS } from '../utils/lucideDefaults';
import './NotificationBell.css';

// PHASE 3b: Track seen notification IDs to prevent duplicate processing
const seenNotificationIds = new Set();
const MAX_SEEN_NOTIFICATION_IDS = 200;

const NotificationBell = memo(() => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const listenersSetupRef = useRef(false); // Prevent duplicate listener setup
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isAuthReady, isAuthenticated, user } = useAuth();
  const userId = user?._id || user?.id;
  const isNotificationsRoute = pathname === '/notifications';

  // NOTE: Push notification subscription is now handled in Settings page
  // where users can explicitly enable/disable notifications with a user gesture.
  // This prevents browser console violations about requesting permission
  // without user interaction.

  const fetchNotifications = useCallback(async () => {
    if (!isAuthReady || !isAuthenticated || !userId) {
      return;
    }

    try {
      const response = await api.get('/notifications');
      // Filter to SOCIAL types only - MESSAGE types go to Messages badge
      const socialNotifications = filterSocialNotifications(response.data);
      // Section 10: Sort by engagementScore desc, then createdAt desc
      const sorted = [...socialNotifications].sort((a, b) => {
        const scoreDiff = (b.engagementScore || 0) - (a.engagementScore || 0);
        if (scoreDiff !== 0) return scoreDiff;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setNotifications(sorted.slice(0, 10));
      setUnreadCount(socialNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, [isAuthReady, isAuthenticated, userId]);

  useEffect(() => {
    if (!isAuthReady) {
      logger.debug('⏳ NotificationBell waiting for auth ready');
      return;
    }

    if (!isAuthenticated || !userId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    if (!isNotificationsRoute) {
      fetchNotifications();
    }

    let socket = getSocket();
    let retryInterval = null;
    let cleanupFn = null;

    // ✅ Define event handlers
    const handleNewNotification = (data) => {
      logger.debug('🔔 Real-time notification received:', data);

      // PHASE 3b: Duplicate event protection
      const notifId = data.notification?._id;
      if (notifId && seenNotificationIds.has(notifId)) {
        logger.debug('🔔 Duplicate notification ID, ignoring:', notifId);
        return;
      }
      if (notifId) {
        seenNotificationIds.add(notifId);
        // Cleanup old IDs to prevent memory leak
        if (seenNotificationIds.size > MAX_SEEN_NOTIFICATION_IDS) {
          const idsArray = Array.from(seenNotificationIds);
          for (let i = 0; i < 50; i++) {
            seenNotificationIds.delete(idsArray[i]);
          }
        }
      }

      // Validate: only SOCIAL types increment bell count
      if (!shouldIncrementBellCount(data.notification)) {
        return;
      }

      setNotifications(prev => [data.notification, ...prev].slice(0, 10));
      setUnreadCount(prev => prev + 1);
    };

    const handleNotificationRead = (data) => {
      logger.debug('✅ Notification marked as read:', data);
      setNotifications(prev =>
        prev.map(n => n._id === data.notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleNotificationReadAll = () => {
      logger.debug('✅ All notifications marked as read');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    };

    const handleNotificationDeleted = (data) => {
      logger.debug('🗑️ Notification deleted:', data);
      setNotifications(prev => prev.filter(n => n._id !== data.notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    };

    // Section 4: Replace existing notification when aggregated update arrives
    const handleNotificationUpdate = (updatedNotif) => {
      if (!updatedNotif?._id) return;
      logger.debug('🔄 Notification updated (aggregated):', updatedNotif._id);
      setNotifications(prev =>
        prev.map(n => n._id === updatedNotif._id ? updatedNotif : n)
      );
    };

    // ✅ Attach listeners to socket
    const attachListeners = (s) => {
      logger.debug('🔔 Attaching NotificationBell socket listeners');
      s.on('notification:new', handleNewNotification);
      s.on('notification:update', handleNotificationUpdate);
      s.on('notification:read', handleNotificationRead);
      s.on('notification:read_all', handleNotificationReadAll);
      s.on('notification:deleted', handleNotificationDeleted);
      listenersSetupRef.current = true;
    };

    // ✅ Detach listeners from socket
    const detachListeners = (s) => {
      if (s && typeof s.off === 'function') {
        logger.debug('🧹 Cleaning up NotificationBell socket listeners');
        s.off('notification:new', handleNewNotification);
        s.off('notification:update', handleNotificationUpdate);
        s.off('notification:read', handleNotificationRead);
        s.off('notification:read_all', handleNotificationReadAll);
        s.off('notification:deleted', handleNotificationDeleted);
      }
      listenersSetupRef.current = false;
    };

    // ✅ Try to setup immediately
    if (socket && !listenersSetupRef.current) {
      attachListeners(socket);
      cleanupFn = () => detachListeners(socket);
    } else if (!socket) {
      // Socket not ready - retry until available
      logger.debug('⏳ Socket not initialized yet, will retry...');

      retryInterval = setInterval(() => {
        socket = getSocket();
        if (socket && !listenersSetupRef.current) {
          clearInterval(retryInterval);
          retryInterval = null;
          attachListeners(socket);
          cleanupFn = () => detachListeners(socket);
        }
      }, 500);

      // Stop retrying after 10 seconds
      setTimeout(() => {
        if (retryInterval) {
          clearInterval(retryInterval);
          retryInterval = null;
          logger.warn('⚠️ Socket not available after 10s, notification listeners not set up');
        }
      }, 10000);
    }

    return () => {
      if (retryInterval) clearInterval(retryInterval);
      if (cleanupFn) cleanupFn();
    };
  }, [fetchNotifications, isAuthReady, isAuthenticated, isNotificationsRoute, userId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification._id);
    setShowDropdown(false);

    // Section 7: Prefer server-generated deep link url when available
    if (notification.url) {
      navigate(notification.url);
      return;
    }

    // Fallback navigation for older notifications without url field
    if (notification.type === 'friend_request' || notification.type === 'friend_accept') {
      if (notification.sender?._id) {
        navigate(`/profile/${notification.sender._id}`);
      } else {
        navigate('/feed');
      }
    } else if (notification.type === 'group_post' || notification.type === 'group_mention') {
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
    const props = { size: 16, strokeWidth: 1.75, 'aria-hidden': true };
    switch (type) {
      case 'like': {
        return <Heart {...props} />;
      }
      case 'comment': {
        return <MessageCircle {...props} />;
      }
      case 'friend_request': {
        return <UserPlus {...props} />;
      }
      case 'friend_accept': {
        return <UserCheck {...props} />;
      }
      case 'mention': {
        return <AtSign {...props} />;
      }
      case 'share': {
        return <Repeat2 {...props} />;
      }
      case 'reaction': {
        return <Smile {...props} />;
      }
      case 'group_post': {
        return <FileText {...props} />;
      }
      case 'group_mention': {
        return <AtSign {...props} />;
      }
      default: {
        return <Bell {...props} />;
      }
    }
  };

  // Section 9: Format aggregated notification text when multiple actors contributed
  const getAggregatedActorLabel = (notification) => {
    const actors = notification.actorIds;
    if (!actors || actors.length <= 1) return null;
    const first = actors[0];
    const firstName = first?.displayName || first?.username || 'Someone';
    const others = actors.length - 1;
    return `${firstName} and ${others} ${others === 1 ? 'other' : 'others'}`;
  };

  // CALM-FIRST: Notification text with no exclamation marks or urgency language
  const getNotificationText = (notification) => {
    const aggregatedLabel = getAggregatedActorLabel(notification);
    const senderName = aggregatedLabel ||
      notification.sender?.displayName || notification.sender?.username || 'Someone';
    const groupName = notification.groupName || 'a group';

    switch (notification.type) {
      case 'like': {
        return notification.commentId
          ? `${senderName} reacted to your comment`
          : `${senderName} liked your post`;
      }
      case 'comment': {
        return aggregatedLabel
          ? `${senderName} commented on your post`
          : `${senderName} commented on your post`;
      }
      case 'conversation_resurface': {
        return 'Conversation heating up on a post you commented on';
      }
      case 'friend_request': {
        return `${senderName} sent you a connection request`;
      }
      case 'friend_accept': {
        return `${senderName} accepted your request`;
      }
      case 'mention': {
        return `${senderName} mentioned you`;
      }
      case 'share': {
        return `${senderName} shared your post`;
      }
      case 'reaction': {
        return `${senderName} reacted to your post`;
      }
      case 'group_post': {
        return `New post in ${groupName}`;
      }
      case 'group_mention': {
        return `${senderName} mentioned you in ${groupName}`;
      }
      case 'resonance': {
        return 'Someone quietly resonated with your post';
      }
      case 'circle_invite': {
        return `${senderName} invited you to a circle`;
      }
      case 'circle_post': {
        return `New post in your circle`;
      }
      case 'login_approval': {
        return 'New login attempt needs approval';
      }
      case 'system': {
        return notification.message || 'System update';
      }
      case 'moderation': {
        return notification.message || 'Moderation update';
      }
      default: {
        // CALM-FIRST: Strip exclamation marks from any message
        const msg = notification.message || 'New update';
        return msg.replace(/!/g, '');
      }
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button
        className="bell-button"
        onClick={() => setShowDropdown(!showDropdown)}
        aria-label="Notifications"
        data-tooltip="Notifications"
      >
        <Bell {...LUCIDE_DEFAULTS} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button className="mark-all-read" onClick={markAllAsRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <Bell size={32} strokeWidth={1.5} className="no-notif-icon" aria-hidden="true" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification._id}
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <span className="notif-icon">{getNotificationIcon(notification.type)}</span>
                  <div className="notif-content">
                    <p className="notif-text">{getNotificationText(notification)}</p>
                    <span className="notif-time">{getTimeAgo(notification.createdAt)}</span>
                  </div>
                  {notification.count > 1 && (
                    <span className="notif-count-badge">{notification.count}</span>
                  )}
                  {!notification.read && <div className="unread-dot"></div>}
                </div>
              ))
            )}
          </div>

          <div className="notification-footer">
            <button
              className="notification-view-all"
              onClick={() => { setShowDropdown(false); navigate('/notifications'); }}
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

// PERFORMANCE: Component is already memoized with memo() wrapper
export default NotificationBell;
