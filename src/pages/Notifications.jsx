import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { getImageUrl } from '../utils/imageUrl';
import logger from '../utils/logger';
import './Notifications.css';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  // Get menu handler from AppLayout outlet context
  const { onMenuOpen } = useOutletContext() || {};

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications');
      // Filter out message notifications - they should only appear in Messages page
      const filteredNotifications = response.data.filter(n => n.type !== 'message');
      setNotifications(filteredNotifications);
    } catch (error) {
      logger.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
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
      case 'announcement': return '📢';
      default: return '🔔';
    }
  };

  const getNotificationText = (notification) => {
    const senderName = notification.sender?.displayName || notification.sender?.username || 'Someone';
    const groupName = notification.groupName || 'a group';

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
      case 'group_post':
        return `${senderName} posted in ${groupName}`;
      case 'group_mention':
        return `${senderName} mentioned you in ${groupName}`;
      case 'announcement':
        return notification.message || `${senderName} sent an @everyone announcement`;
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
    return `${Math.floor(seconds / 604800)}w ago`;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="notifications-page">
      <Navbar onMenuClick={onMenuOpen} />
      
      <div className="notifications-container">
        <div className="notifications-header">
          <h1>Notifications</h1>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="mark-all-read-btn">
              Mark all as read
            </button>
          )}
        </div>

        {loading ? (
          <div className="loading-state">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🔔</span>
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map(notification => (
              <div
                key={notification._id}
                className={`notification-card ${!notification.read ? 'unread' : ''} ${notification.type === 'announcement' ? 'announcement' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notification-icon">{getNotificationIcon(notification.type)}</div>
                <div className="notification-content">
                  <p className="notification-text">{getNotificationText(notification)}</p>
                  <span className="notification-time">{getTimeAgo(notification.createdAt)}</span>
                </div>
                {!notification.read && <div className="unread-indicator"></div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;

