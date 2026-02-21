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
 */
import { memo } from 'react';
import { useCommentScope } from './CommentScopeContext';
import { useComments } from '../context/CommentContext';
import CommentItem from './CommentItem';
import CommentInput from './CommentInput';

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
    <>
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
    </>
  );
});

export default CommentList;
