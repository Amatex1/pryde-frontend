import { memo, useState } from 'react';
import { MessageCircle, Bookmark, Repeat2 } from 'lucide-react';
import { LUCIDE_DEFAULTS } from '../../utils/lucideDefaults';
import ReactionButton from '../ReactionButton';
import RepostModal from './RepostModal';
import './FeedPostActions.css';

/**
 * FeedPostActions - Renders the action buttons for a post (reaction, reply, repost, bookmark)
 */
const FeedPostActions = memo(function FeedPostActions({
  post,
  currentUser,
  isBookmarked,
  onReactionChange,
  onReactionCountClick,
  onToggleCommentBox,
  onBookmark,
  onRepost,
  getUserReactionEmoji,
}) {
  const [showRepostModal, setShowRepostModal] = useState(false);

  const repostCount = post.repostCount || 0;
  const hasReposted = post._hasReposted; // set by feed when user already reposted

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
        className={`action-btn subtle ${hasReposted ? 'reposted' : ''}`}
        onClick={() => setShowRepostModal(true)}
        aria-label={`Repost${!post.hideMetrics && repostCount > 0 ? ` (${repostCount})` : ''}`}
        data-tooltip={hasReposted ? 'Reposted' : 'Repost'}
      >
        <Repeat2 {...LUCIDE_DEFAULTS} size={20} aria-hidden="true" />
        <span className="action-text">
          {!post.hideMetrics && repostCount > 0 ? repostCount : 'Repost'}
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

      {showRepostModal && (
        <RepostModal
          post={post}
          currentUser={currentUser}
          hasReposted={hasReposted}
          onClose={() => setShowRepostModal(false)}
          onRepost={(type, content) => {
            onRepost?.(post._id, type, content);
            setShowRepostModal(false);
          }}
        />
      )}
    </div>
  );
});

export default FeedPostActions;

