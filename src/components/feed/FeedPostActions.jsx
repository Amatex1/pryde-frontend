import { memo } from 'react';
import ReactionButton from '../ReactionButton';

/**
 * FeedPostActions - Renders the action buttons for a post (reaction, reply, bookmark)
 * 
 * This component is memoized for performance optimization.
 */
const FeedPostActions = memo(function FeedPostActions({
  post,
  currentUser,
  isBookmarked,
  
  // Handlers
  onReactionChange,
  onReactionCountClick,
  onToggleCommentBox,
  onBookmark,
  
  // Utilities
  getUserReactionEmoji,
}) {
  return (
    <div className="post-actions soft-actions">
      <ReactionButton
        targetType="post"
        targetId={post._id}
        currentUserId={currentUser?.id}
        initialUserReaction={getUserReactionEmoji(post.reactions)}
        onReactionChange={(reactions, userReaction) => onReactionChange(post._id, reactions, userReaction)}
        onCountClick={() => onReactionCountClick(post._id)}
      />
      <button
        className="action-btn subtle"
        onClick={() => onToggleCommentBox(post._id)}
        aria-label={`Reply to post${!post.hideMetrics ? ` (${post.commentCount || 0} replies)` : ''}`}
        title="Reply to this post"
      >
        <span>💬</span>
        <span className="action-text">
          Reply {!post.hideMetrics && `(${post.commentCount || 0})`}
        </span>
      </button>
      <button
        className={`action-btn ghost ${isBookmarked ? 'bookmarked' : ''}`}
        onClick={() => onBookmark(post._id)}
        title={isBookmarked ? 'Remove save' : 'Keep this for later'}
        aria-label={isBookmarked ? 'Remove save from post' : 'Save post'}
      >
        <span>🔖</span>
        <span className="action-text">{isBookmarked ? 'Saved' : 'Save'}</span>
      </button>
    </div>
  );
});

export default FeedPostActions;

