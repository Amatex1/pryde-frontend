/**
 * CommentItem — renders a single top-level comment with its reply cluster.
 *
 * Extracted from CommentThread.jsx's top-level comment rendering block.
 * Reads all state from CommentContext + CommentScopeContext.
 *
 * Props:
 *   comment — the top-level comment object (parentCommentId must be null/undefined)
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import OptimizedImage from '../components/OptimizedImage';
import TieredBadgeDisplay from '../components/TieredBadgeDisplay';
import PausableGif from '../components/PausableGif';
import FormattedText from '../components/FormattedText';
import { getImageUrl } from '../utils/imageUrl';
import { useCommentScope } from './CommentScopeContext';
import { useComments } from '../context/CommentContext';
import ReactionBar from './ReactionBar';
import ReplyCluster from './ReplyCluster';

export default function CommentItem({ comment }) {
  const { postId, currentUser, commentRefs, setReportModal } = useCommentScope();
  const {
    commentReplies,
    showReplies,
    replyingToComment,
    editingCommentId,
    editCommentText,
    handleEditComment,
    handleSaveEditComment,
    handleCancelEditComment,
    handleDeleteComment,
  } = useComments();

  // 3-dot context menu — same pattern as CommentThread.jsx
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.comment-menu-container')) {
        setOpenMenuId(null);
      }
    };
    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openMenuId]);

  // Guard: only render top-level comments (same as CommentThread.jsx)
  if (comment.parentCommentId !== null && comment.parentCommentId !== undefined) {
    return null;
  }

  const isEditing = editingCommentId === comment._id;
  const isOwnComment = comment.authorId?._id === currentUser?._id || comment.authorId === currentUser?._id;
  const replies = commentReplies[comment._id] || [];
  // Phase 4: highlight the card border when the user is replying to this thread
  const isBeingRepliedTo = replyingToComment?.commentId === comment._id;

  return (
    <div className="comment-thread" data-replying={isBeingRepliedTo ? 'true' : undefined}>
      <div
        className="comment-row"
        ref={(el) => { commentRefs.current[comment._id] = el; }}
      >
        {comment.isDeleted ? (
          <div className="comment-deleted">
            <span className="deleted-icon">🗑️</span>
            <span className="deleted-text">This comment was deleted.</span>
          </div>
        ) : (
          <>
            {/* Avatar */}
            <Link
              to={`/profile/${comment.authorId?.username}`}
              className="comment-avatar"
              style={{ textDecoration: 'none' }}
              aria-label={`View ${comment.authorId?.displayName || comment.authorId?.username}'s profile`}
            >
              {comment.authorId?.profilePhoto ? (
                <OptimizedImage
                  src={getImageUrl(comment.authorId.profilePhoto)}
                  alt={comment.authorId.username}
                  className="avatar-image"
                />
              ) : (
                <span>{comment.authorId?.displayName?.charAt(0).toUpperCase() || 'U'}</span>
              )}
            </Link>

            {/* Lane: bubble + actions */}
            <div className="comment-lane">
              <div className="comment-bubble">
                <Link
                  to={`/profile/${comment.authorId?.username}`}
                  className="comment-author"
                  style={{ textDecoration: 'none' }}
                >
                  <span className="author-name">{comment.authorId?.displayName || comment.authorId?.username}</span>
                  {comment.authorId?.badges?.length > 0 && (
                    <TieredBadgeDisplay badges={comment.authorId.badges} context="card" />
                  )}
                </Link>

                {isEditing ? (
                  <div className="comment-edit-box">
                    <textarea
                      value={editCommentText}
                      onChange={(e) => handleEditComment(comment._id, e.target.value)}
                      className="comment-edit-input"
                      enterKeyHint="enter"
                      autoFocus
                    />
                    <div className="comment-edit-actions">
                      <button
                        className="btn-save-comment"
                        onClick={() => handleSaveEditComment(comment._id)}
                      >
                        Save
                      </button>
                      <button
                        className="btn-cancel-comment"
                        onClick={handleCancelEditComment}
                      >
                        Never mind
                      </button>
                    </div>
                  </div>
                ) : (
                  <span className="comment-text">
                    <FormattedText text={comment.content} />
                  </span>
                )}

                {comment.gifUrl && (
                  <div className="comment-gif">
                    <PausableGif src={comment.gifUrl} alt="GIF" />
                  </div>
                )}
              </div>

              {/* Inline actions */}
              <ReactionBar comment={comment} />
            </div>

            {/* 3-dot menu */}
            <div className="comment-menu-container">
              <button
                className="comment-menu-btn"
                onClick={() => setOpenMenuId(openMenuId === comment._id ? null : comment._id)}
                aria-label="Comment options"
              >
                <svg viewBox="0 0 16 16" fill="currentColor">
                  <circle cx="8" cy="3" r="1.5" />
                  <circle cx="8" cy="8" r="1.5" />
                  <circle cx="8" cy="13" r="1.5" />
                </svg>
              </button>
              {openMenuId === comment._id && (
                <div className="comment-menu">
                  {isOwnComment ? (
                    <>
                      <button
                        onClick={() => {
                          handleEditComment(comment._id, comment.content);
                          setOpenMenuId(null);
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="delete"
                        onClick={() => {
                          handleDeleteComment(postId, comment._id, false);
                          setOpenMenuId(null);
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setReportModal({
                          isOpen: true,
                          type: 'comment',
                          contentId: comment._id,
                          userId: comment.authorId?._id,
                        });
                        setOpenMenuId(null);
                      }}
                    >
                      🚩 Report
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Replies — only render if expanded */}
      {showReplies[comment._id] && replies.length > 0 && (
        <ReplyCluster comment={comment} replies={replies} />
      )}
    </div>
  );
}
