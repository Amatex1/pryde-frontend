import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { getImageUrl } from '../utils/imageUrl';
import { getCurrentUser } from '../utils/auth';
import './NotificationBell.css';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const user = getCurrentUser();

  // NOTE: Push notification subscription is now handled in Settings page
  // where users can explicitly enable/disable notifications with a user gesture.
  // This prevents browser console violations about requesting permission
  // without user interaction.

  useEffect(() => {
    // Only fetch if user is logged in
    if (!user) {
      return;
    }

    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      // Filter out message notifications - they should only appear in Messages page
      const filteredNotifications = response.data.filter(n => n.type !== 'message');
      setNotifications(filteredNotifications.slice(0, 10)); // Show only latest 10
      setUnreadCount(filteredNotifications.filter(n => !n.read).length);
    } catch (error) {
      // If 401, user session expired - silently fail
      if (error.response?.status === 401) {
        console.warn('Session expired - stopping notification polling');
        return;
      }
      console.error('Failed to fetch notifications:', error);
    }
  };

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
      navigate('/friends');
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
      default: return '🔔';
    }
  };

  const getNotificationText = (notification) => {
    const senderName = notification.sender?.displayName || notification.sender?.username || 'Someone';

    switch (notification.type) {
      case 'like':
        return `${senderName} liked your post`;
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
      default:
        return notification.message || 'New notification';
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
};

export default NotificationBell;
