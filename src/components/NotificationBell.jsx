import React, { useState, useEffect, useRef, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { getImageUrl } from '../utils/imageUrl';
import { getCurrentUser } from '../utils/auth';
import { getSocket } from '../utils/socket';
import logger from '../utils/logger';
import {
  filterSocialNotifications,
  shouldIncrementBellCount,
} from '../constants/notificationTypes';
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
  const user = getCurrentUser();
  const userId = user?.id; // Extract userId to use as dependency

  // NOTE: Push notification subscription is now handled in Settings page
  // where users can explicitly enable/disable notifications with a user gesture.
  // This prevents browser console violations about requesting permission
  // without user interaction.

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      // Filter to SOCIAL types only - MESSAGE types go to Messages badge
      const socialNotifications = filterSocialNotifications(response.data);
      setNotifications(socialNotifications.slice(0, 10)); // Show only latest 10
      setUnreadCount(socialNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  useEffect(() => {
    // Only fetch if user is logged in
    if (!userId) {
      return;
    }

    // ✅ Prevent duplicate listener setup (React Strict Mode protection)
    if (listenersSetupRef.current) {
      logger.debug('⚠️ NotificationBell listeners already set up, skipping');
      return;
    }

    // ✅ Fetch once on mount (NO POLLING!)
    fetchNotifications();

    const socket = getSocket();

    // ✅ Check if socket is available before setting up listeners
    if (!socket) {
      logger.debug('⏳ Socket not initialized yet, skipping notification listeners');
      return;
    }

    logger.debug('🔔 Setting up NotificationBell socket listeners');
    listenersSetupRef.current = true;

    // ✅ Listen for real-time notification events
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

    socket.on('notification:new', handleNewNotification);
    socket.on('notification:read', handleNotificationRead);
    socket.on('notification:read_all', handleNotificationReadAll);
    socket.on('notification:deleted', handleNotificationDeleted);

    return () => {
      logger.debug('🧹 Cleaning up NotificationBell socket listeners');
      listenersSetupRef.current = false;

      if (socket && typeof socket.off === 'function') {
        socket.off('notification:new', handleNewNotification);
        socket.off('notification:read', handleNotificationRead);
        socket.off('notification:read_all', handleNotificationReadAll);
        socket.off('notification:deleted', handleNotificationDeleted);
      }
    };
  }, [userId]); // ✅ Use userId instead of user object to prevent infinite loop

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

    // Navigate based on notification type
    if (notification.type === 'friend_request' || notification.type === 'friend_accept') {
      // Navigate to the sender's profile instead of non-existent /friends page
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
      if (notification.type === 'comment' && notification.commentId) {
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
      default: return '🔔';
    }
  };

  // CALM-FIRST: Notification text with no exclamation marks or urgency language
  const getNotificationText = (notification) => {
    const senderName = notification.sender?.displayName || notification.sender?.username || 'Someone';
    const groupName = notification.groupName || 'a group';

    switch (notification.type) {
      case 'like':
        return `${senderName} liked your post`;
      case 'comment':
        return `${senderName} commented on your post`;
      case 'friend_request':
        return `${senderName} sent you a connection request`;
      case 'friend_accept':
        return `${senderName} accepted your request`;
      case 'mention':
        return `${senderName} mentioned you`;
      case 'share':
        return `${senderName} shared your post`;
      case 'reaction':
        return `${senderName} reacted to your post`;
      case 'group_post':
        return `New post in ${groupName}`;
      case 'group_mention':
        return `${senderName} mentioned you in ${groupName}`;
      case 'resonance':
        return 'Someone quietly resonated with your post';
      case 'circle_invite':
        return `${senderName} invited you to a circle`;
      case 'circle_post':
        return `New post in your circle`;
      case 'login_approval':
        return 'New login attempt needs approval';
      case 'system':
        return notification.message || 'System update';
      case 'moderation':
        return notification.message || 'Moderation update';
      default:
        // CALM-FIRST: Strip exclamation marks from any message
        const msg = notification.message || 'New update';
        return msg.replace(/!/g, '');
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
      >
        🔔
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
                <span className="no-notif-icon">🔔</span>
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
                  {!notification.read && <div className="unread-dot"></div>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
});

// PERFORMANCE: Component is already memoized with memo() wrapper
export default NotificationBell;
