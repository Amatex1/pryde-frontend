/**
 * ReactionBar — inline comment action row (Like / Reply / Time / View replies).
 *
 * Extracted from CommentThread.jsx's "Inline actions" section.
 * Used by both CommentItem (top-level comments) and ReplyCluster (replies).
 *
 * Props:
 *   comment         — the comment or reply object
 *   isReply         — true when rendering inside a reply row
 *   parentCommentId — the parent comment's _id; used so a reply's Reply button
 *                     targets the parent (not the reply itself)
 */
import ReactionButton from '../components/ReactionButton';
import { useCommentScope } from './CommentScopeContext';
import { useComments } from '../context/CommentContext';

export default function ReactionBar({ comment, isReply = false, parentCommentId = null }) {
  const { postId, currentUser, setReactionDetailsModal } = useCommentScope();
  const { showReplies, toggleReplies, handleReplyToComment } = useComments();

  return (
    <div className="comment-actions">
      <ReactionButton
        targetType="comment"
        targetId={comment._id}
        currentUserId={currentUser?.id}
        onCountClick={() => setReactionDetailsModal({
          isOpen: true,
          targetType: 'comment',
          targetId: comment._id,
        })}
      />

      <button
        className={`comment-action-btn${isReply ? ' reply-btn' : ''}`}
        onClick={() => handleReplyToComment(postId, isReply ? parentCommentId : comment._id)}
      >
        Reply
      </button>

      <span className="comment-time">
        {new Date(comment.createdAt).toLocaleString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          month: 'short',
          day: 'numeric',
        })}
        {comment.isEdited && <span className="edited-indicator"> (edited)</span>}
      </span>

      {/* "View replies" button — only on top-level comments */}
      {!isReply && comment.replyCount > 0 && (
        <button
          className="comment-action-btn view-replies-btn"
          onClick={() => toggleReplies(comment._id)}
        >
          {showReplies[comment._id] ? '▲' : '▼'}{' '}
          {comment.replyCount} {comment.replyCount === 1 ? 'reply' : 'replies'}
        </button>
      )}
    </div>
  );
}
