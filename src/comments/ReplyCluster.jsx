/**
 * ReplyCluster — renders the collapsed list of replies for a single top-level comment.
 *
 * Extracted from CommentThread.jsx's "Replies Section" block.
 * Reads all state from CommentContext + CommentScopeContext — no props
 * except the parent comment (for context) and the replies array.
 *
 * Props:
 *   comment — the parent top-level comment object
 *   replies — pre-resolved array of reply objects
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

export default function ReplyCluster({ comment, replies }) {
  const { postId, currentUser, commentRefs, isFullSheet, setReportModal } = useCommentScope();
  const {
    editingCommentId,
    editCommentText,
    handleEditComment,
    handleSaveEditComment,
    handleCancelEditComment,
    handleDeleteComment,
  } = useComments();

  // Inline preview limit: on mobile (≤600px) and NOT in full sheet, limit to 2 replies.
  // Identical logic to the original CommentThread.jsx.
  const isMobileInline = !isFullSheet && typeof window !== 'undefined'
    && window.matchMedia('(max-width: 600px)').matches;
  const MAX_INLINE_REPLIES = isMobileInline ? 2 : Infinity;

  // 3-dot context menu state — same pattern as CommentThread.jsx.
  // Using closest() instead of a ref because menuRef would point to the last
  // rendered container (a reply), causing clicks on other menus to falsely
  // register as "outside" and close the menu before the click event fires.
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

  if (!replies.length) return null;

  return (
    <div className="comment-replies">
      {replies.slice(0, MAX_INLINE_REPLIES).map((reply) => {
        const isEditingReply = editingCommentId === reply._id;
        const isOwnReply = reply.authorId?._id === currentUser?._id || reply.authorId === currentUser?._id;

        return (
          <div
            key={reply._id}
            className="comment-row reply"
            ref={(el) => { commentRefs.current[reply._id] = el; }}
          >
            {reply.isDeleted ? (
              <div className="comment-deleted">
                <span className="deleted-icon">🗑️</span>
                <span className="deleted-text">This comment was deleted.</span>
              </div>
            ) : (
              <>
                {/* Avatar */}
                <Link
                  to={`/profile/${reply.authorId?.username}`}
                  className="comment-avatar"
                  style={{ textDecoration: 'none' }}
                  aria-label={`View ${reply.authorId?.displayName || reply.authorId?.username}'s profile`}
                >
                  {reply.authorId?.profilePhoto ? (
                    <OptimizedImage
                      src={getImageUrl(reply.authorId.profilePhoto)}
                      alt={reply.authorId.username}
                      className="avatar-image"
                    />
                  ) : (
                    <span>{reply.authorId?.displayName?.charAt(0).toUpperCase() || 'U'}</span>
                  )}
                </Link>

                {/* Author name — inline with avatar */}
                <Link
                  to={`/profile/${reply.authorId?.username}`}
                  className="comment-author-inline"
                  style={{ textDecoration: 'none' }}
                >
                  <span className="author-name">{reply.authorId?.displayName || reply.authorId?.username}</span>
                  {reply.authorId?.badges?.length > 0 && (
                    <TieredBadgeDisplay badges={reply.authorId.badges} context="card" />
                  )}
                </Link>

                {/* Lane: bubble + actions */}
                <div className="comment-lane">
                  <div className="comment-bubble">
                    {isEditingReply ? (
                      <div className="comment-edit-box">
                        <textarea
                          value={editCommentText}
                          onChange={(e) => handleEditComment(reply._id, e.target.value)}
                          className="comment-edit-input"
                          enterKeyHint="enter"
                          autoFocus
                        />
                        <div className="comment-edit-actions">
                          <button
                            className="btn-save-comment"
                            onClick={() => handleSaveEditComment(reply._id)}
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
                        <FormattedText text={reply.content} />
                      </span>
                    )}
                    {reply.gifUrl && (
                      <div className="comment-gif">
                        <PausableGif src={reply.gifUrl} alt="GIF" />
                      </div>
                    )}
                  </div>

                  {/* Inline actions */}
                  <ReactionBar
                    comment={reply}
                    isReply
                    parentCommentId={comment._id}
                  />
                </div>

                {/* 3-dot menu */}
                <div className="comment-menu-container">
                  <button
                    className="comment-menu-btn"
                    onClick={() => setOpenMenuId(openMenuId === reply._id ? null : reply._id)}
                    aria-label="Reply options"
                  >
                    <svg viewBox="0 0 16 16" fill="currentColor">
                      <circle cx="8" cy="3" r="1.5" />
                      <circle cx="8" cy="8" r="1.5" />
                      <circle cx="8" cy="13" r="1.5" />
                    </svg>
                  </button>
                  {openMenuId === reply._id && (
                    <div className="comment-menu">
                      {isOwnReply ? (
                        <>
                          <button
                            onClick={() => {
                              handleEditComment(reply._id, reply.content);
                              setOpenMenuId(null);
                            }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="delete"
                            onClick={() => {
                              handleDeleteComment(postId, reply._id, true);
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
                              contentId: reply._id,
                              userId: reply.authorId?._id,
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
        );
      })}
    </div>
  );
}
