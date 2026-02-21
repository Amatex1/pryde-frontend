/**
 * CommentList — renders the full comment section for a single post.
 *
 * Replaces FeedPostComments.jsx (inline) and the comment-sheet-threads block
 * in Feed.jsx (mobile sheet). Must be used inside a comments/CommentProvider.
 *
 * Ordering:
 *   Inline (isFullSheet=false): comment threads → CommentInput
 *   Sheet  (isFullSheet=true):  CommentInput    → comment threads
 *
 * Slice:
 *   Inline: last 3 top-level comments (matching FeedPostComments original)
 *   Sheet:  all top-level comments
 *
 * Phase 4: wraps everything in .comments-v2 so the visual-upgrade stylesheet
 * (comments-v2.css) can scope styles without touching CommentThread.jsx (legacy).
 */
import { memo } from 'react';
import { useCommentScope } from './CommentScopeContext';
import { useComments } from '../context/CommentContext';
import CommentItem from './CommentItem';
import CommentInput from './CommentInput';
import './comments-v2.css';

const CommentList = memo(function CommentList() {
  const { postId, isFullSheet } = useCommentScope();
  const { postComments } = useComments();

  const allComments = postComments[postId] || [];
  const topLevelComments = allComments.filter(
    c => c.parentCommentId === null || c.parentCommentId === undefined
  );
  // Inline: show last 3 (same behaviour as original FeedPostComments .slice(-3))
  const displayComments = isFullSheet ? topLevelComments : topLevelComments.slice(-3);

  return (
    <div className="comments-v2">
      {/* Sheet: input forms above the thread list */}
      {isFullSheet && <CommentInput />}

      {allComments.length > 0 && (
        <div className={isFullSheet ? 'comment-sheet-threads' : 'post-comments'}>
          {displayComments.map((comment) => (
            <CommentItem key={comment._id} comment={comment} />
          ))}
        </div>
      )}

      {/* Inline: input forms below the thread list */}
      {!isFullSheet && <CommentInput />}
    </div>
  );
});

export default CommentList;
