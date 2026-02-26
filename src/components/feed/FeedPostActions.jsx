import { memo } from 'react';
import { MessageCircle, Bookmark } from 'lucide-react';
import { LUCIDE_DEFAULTS } from '../../utils/lucideDefaults';
import ReactionButton from '../ReactionButton';
import './FeedPostActions.css';

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
        data-tooltip={!post.hideMetrics ? `Reply (${post.commentCount || 0})` : 'Reply'}
      >
        <MessageCircle {...LUCIDE_DEFAULTS} size={20} aria-hidden="true" />
        <span className="action-text">
          Reply {!post.hideMetrics && `(${post.commentCount || 0})`}
        </span>
      </button>
      <button
        className={`action-btn ghost ${isBookmarked ? 'bookmarked' : ''}`}
        onClick={() => onBookmark(post._id)}
        aria-label={isBookmarked ? 'Remove save from post' : 'Save post'}
        data-tooltip={isBookmarked ? 'Saved' : 'Save'}
      >
        <Bookmark {...LUCIDE_DEFAULTS} size={20} aria-hidden="true" />
        <span className="action-text">{isBookmarked ? 'Saved' : 'Save'}</span>
      </button>
    </div>
  );
});

export default FeedPostActions;

