/**
 * ThankYouNotification
 * 
 * Shows thank you messages when users reach milestones.
 * Displayed in notifications as special thank-you moments.
 */

import { memo } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import './ThankYouNotification.css';

const THANK_YOU_CONFIG = {
  first_post: {
    emoji: '✨',
    title: 'Your First Post!',
    color: '#6366f1'
  },
  first_comment: {
    emoji: '💬',
    title: 'Welcome to the Conversation!',
    color: '#8b5cf6'
  },
  ten_posts: {
    emoji: '🎉',
    title: '10 Posts Milestone!',
    color: '#ec4899'
  },
  fifty_posts: {
    emoji: '🌟',
    title: '50 Posts Champion!',
    color: '#f59e0b'
  },
  hundred_posts: {
    emoji: '💜',
    title: 'Century Club!',
    color: '#10b981'
  },
  active_member: {
    emoji: '🌈',
    title: 'Thank You!',
    color: '#6366f1'
  }
};

const ThankYouNotification = memo(function ThankYouNotification({
  notification,
  onDismiss,
}) {
  if (!notification || notification.type !== 'thank_you') {
    return null;
  }

  const { data, createdAt } = notification;
  const config = THANK_YOU_CONFIG[data?.milestoneType] || THANK_YOU_CONFIG.active_member;

  const formatTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now - notifDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifDate.toLocaleDateString();
  };

  return (
    <div 
      className="thank-you-notification"
      style={{ '--thank-you-color': config.color }}
    >
      <div className="thank-you-icon">
        {config.emoji}
      </div>

      <div className="thank-you-content">
        <span className="thank-you-title">
          {config.title}
        </span>
        <span className="thank-you-message">
          {notification.message?.replace(`${config.emoji} ${config.title} `, '')}
        </span>
        <span className="thank-you-time">
          {formatTime(createdAt)}
        </span>
      </div>

      {onDismiss && (
        <button 
          className="thank-you-dismiss"
          onClick={() => onDismiss(notification._id)}
          aria-label="Dismiss"
          type="button"
        >
          ✕
        </button>
      )}
    </div>
  );
});

ThankYouNotification.propTypes = {
  notification: PropTypes.shape({
    _id: PropTypes.string,
    type: PropTypes.string,
    message: PropTypes.string,
    data: PropTypes.shape({
      milestoneType: PropTypes.string,
      thankYou: PropTypes.bool,
    }),
    createdAt: PropTypes.string,
  }),
  onDismiss: PropTypes.func,
};

export default ThankYouNotification;

