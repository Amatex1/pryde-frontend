import './EmptyState.css';

/**
 * EmptyState - Polished empty state component
 * 
 * Usage:
 * <EmptyState
 *   type="feed" // feed | messages | profile | search | groups | notifications | journals | stories | chat
 *   title="No posts yet"
 *   description="When you post, it'll show up here."
 *   action={{ label: 'Create Post', onClick: () => {} }}
 * />
 */
export function EmptyState({ 
  type = 'feed',
  title,
  description, 
  action,
  icon,
  className = ''
}) {
  // Default content based on type
  const getDefaultContent = () => {
    switch (type) {
      case 'feed':
        return {
          icon: '📝',
          title: title || "No posts yet",
          description: description || "When you post, it'll show up here. Share your thoughts with the world!"
        };
      case 'messages':
        return {
          icon: '💬',
          title: title || 'No messages yet',
          description: description || 'Start a conversation! Send a message to someone to see it here.'
        };
      case 'profile':
        return {
          icon: '📸',
          title: title || 'No posts',
          description: description || "When this user posts, it'll show up here."
        };
      case 'search':
        return {
          icon: '🔍',
          title: title || 'No results found',
          description: description || 'Try searching for something else.'
        };
      case 'groups':
        return {
          icon: '👥',
          title: title || 'No groups yet',
          description: description || 'Join or create a group to connect with others.'
        };
      case 'notifications':
        return {
          icon: '🔔',
          title: title || 'No notifications',
          description: description || "You're all caught up!"
        };
      case 'followers':
        return {
          icon: '👤',
          title: title || 'No followers yet',
          description: description || 'When someone follows you, they\'ll show up here.'
        };
      case 'following':
        return {
          icon: '🤝',
          title: title || 'Not following anyone yet',
          description: description || 'Find people to follow to see them here.'
        };
      case 'media':
        return {
          icon: '🖼️',
          title: title || 'No media yet',
          description: description || 'Photos and videos will appear here.'
        };
      case 'journals':
        return {
          icon: '📓',
          title: title || 'No journal entries yet',
          description: description || 'Write a journal entry to see it here.'
        };
      case 'stories':
        return {
          icon: '📖',
          title: title || 'No stories yet',
          description: description || 'Share a story to see it here.'
        };
      case 'chat':
        return {
          icon: '💬',
          title: title || 'No messages yet',
          description: description || 'Start a calm conversation'
        };
      default:
        return {
          icon: '📭',
          title: title || 'Nothing here',
          description: description || "There's nothing to show yet."
        };
    }
  };

  const content = getDefaultContent();

  return (
    <div className={`empty-state empty-state-${type} ${className}`}>
      <div className="empty-state-icon" aria-hidden="true">
        {icon || content.icon}
      </div>
      <h3 className="empty-state-title">{content.title}</h3>
      <p className="empty-state-description">{content.description}</p>
      {action && (
        <button 
          className="empty-state-action"
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
