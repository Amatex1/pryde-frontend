/**
 * ConversationResurfaceBanner
 * 
 * Shows when an older conversation becomes active again.
 * Displays a gentle banner encouraging users to join the discussion.
 */

import { memo } from 'react';
import PropTypes from 'prop-types';
import './ConversationResurfaceBanner.css';

const ConversationResurfaceBanner = memo(function ConversationResurfaceBanner({
  conversation,
  onClick,
  onDismiss,
}) {
  if (!conversation) return null;

  const { post, recentComments, message } = conversation;

  const handleClick = () => {
    if (onClick) {
      onClick(post._id);
    }
  };

  const handleDismiss = (e) => {
    e.stopPropagation();
    if (onDismiss) {
      onDismiss(post._id);
    }
  };

  return (
    <div 
      className="conversation-resurface-banner"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      <div className="resurface-icon">
        🔥
      </div>
      
      <div className="resurface-content">
        <span className="resurface-message">
          {message || `This discussion is active again (${recentComments} new comments)`}
        </span>
        {post?.author && (
          <span className="resurface-author">
            Originally by @{post.author.username}
          </span>
        )}
      </div>

      <button 
        className="resurface-dismiss"
        onClick={handleDismiss}
        aria-label="Dismiss"
        type="button"
      >
        ✕
      </button>
    </div>
  );
});

ConversationResurfaceBanner.propTypes = {
  conversation: PropTypes.shape({
    post: PropTypes.shape({
      _id: PropTypes.string.isRequired,
      author: PropTypes.shape({
        username: PropTypes.string,
        displayName: PropTypes.string,
      }),
      content: PropTypes.string,
    }),
    recentComments: PropTypes.number,
    message: PropTypes.string,
  }),
  onClick: PropTypes.func,
  onDismiss: PropTypes.func,
};

export default ConversationResurfaceBanner;

