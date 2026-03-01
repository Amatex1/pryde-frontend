import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import OptimizedImage from './OptimizedImage';
import ReactionButton from './ReactionButton';
import TieredBadgeDisplay from './TieredBadgeDisplay';
import PausableGif from './PausableGif';
import FormattedText from './FormattedText';
import { getImageUrl } from '../utils/imageUrl';

/**
 * Helper function to compare IDs safely
 * Handles MongoDB ObjectId comparison and various ID formats
 */
const compareIds = (id1, id2) => {
  if (!id1 || !id2) return false;
  return String(id1) === String(id2);
};

/**
 * CommentThread Component
 *
 * Renders a single comment with its replies (one level of nesting only).
 */
const CommentThread = ({
  comment,
  replies = [],
  currentUser,
  postId,
  showReplies,
  editingCommentId,
  editCommentText,
  showReactionPicker,
  commentRefs,
  getUserReactionEmoji,
  handleEditComment,
  handleSaveEditComment,
  handleCancelEditComment,
  handleDeleteComment,
  handleCommentReaction,
  toggleReplies,
  handleReplyToComment,
  setShowReactionPicker,
  setReactionDetailsModal,
  setReportModal,
  isFullSheet = false,
}) => {
  const reactionPickerTimeoutRef = useRef(null);

  // ── Resize-aware mobile detection ─────────────────────────────────────────
  // Using state + matchMedia listener so the limit updates on orientation change
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 600px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(max-width: 600px)');
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const isMobileInline = !isFullSheet && isMobile;
  const MAX_INLINE_REPLIES = isMobileInline ? 2 : Infinity;

  // ── 3-dot menu state ──────────────────────────────────────────────────────
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

  // ── Enter key submits edit (Shift+Enter = newline) ────────────────────────
  const handleEditKeyDown = useCallback(
    (e, commentId) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSaveEditComment(commentId);
      }
    },
    [handleSaveEditComment]
  );

  // Only render top-level comments (no parentCommentId)
  if (comment.parentCommentId !== null && comment.parentCommentId !== undefined) {
    return null;
  }

  const isEditing = editingCommentId === comment._id;
  const isOwnComment =
    compareIds(comment.authorId?._id, currentUser?.id) ||
    compareIds(comment.authorId?._id, currentUser?._id) ||
    compareIds(comment.authorId, currentUser?.id) ||
    compareIds(comment.authorId, currentUser?._id);

  return (
    <div key={comment._id} className="comment-thread">
      {/* ── Top-level comment row ─────────────────────────────────────────── */}
      <div
        className="comment-row"
        ref={(el) => (commentRefs.current[comment._id] = el)}
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
                  <span className="author-name">
                    {comment.authorId?.displayName || comment.authorId?.username}
                  </span>
                  {comment.authorId?.badges?.length > 0 && (
                    <TieredBadgeDisplay badges={comment.authorId.badges} context="card" />
                  )}
                </Link>

                {isEditing ? (
                  <div className="comment-edit-box">
                    <textarea
                      value={editCommentText}
                      onChange={(e) => handleEditComment(comment._id, e.target.value)}
                      onKeyDown={(e) => handleEditKeyDown(e, comment._id)}
                      className="comment-edit-input"
                      enterKeyHint="send"
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
              <div className="comment-actions">
                <ReactionButton
                  targetType="comment"
                  targetId={comment._id}
                  currentUserId={currentUser?.id}
                  onCountClick={() =>
                    setReactionDetailsModal({
                      isOpen: true,
                      targetType: 'comment',
                      targetId: comment._id,
                    })
                  }
                />
                <button
                  className="comment-action-btn"
                  onClick={() => handleReplyToComment(postId, comment._id)}
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
                  {comment.isEdited && (
                    <span className="edited-indicator"> (edited)</span>
                  )}
                </span>
                {comment.replyCount > 0 && (
                  <button
                    className="comment-action-btn view-replies-btn"
                    onClick={() => toggleReplies(comment._id)}
                  >
                    {showReplies[comment._id] ? '▲' : '▼'}{' '}
                    {comment.replyCount}{' '}
                    {comment.replyCount === 1 ? 'reply' : 'replies'}
                  </button>
                )}
              </div>
            </div>

            {/* 3-dot menu */}
            <div className="comment-menu-container">
              <button
                className="comment-menu-btn"
                onClick={() =>
                  setOpenMenuId(openMenuId === comment._id ? null : comment._id)
                }
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

      {/* ── Replies ───────────────────────────────────────────────────────── */}
      {showReplies[comment._id] && replies.length > 0 && (
        <div className="comment-replies">
          {replies.slice(0, MAX_INLINE_REPLIES).map((reply) => {
            const isEditingReply = editingCommentId === reply._id;
            const isOwnReply =
              compareIds(reply.authorId?._id, currentUser?.id) ||
              compareIds(reply.authorId?._id, currentUser?._id) ||
              compareIds(reply.authorId, currentUser?.id) ||
              compareIds(reply.authorId, currentUser?._id);

            return (
              <div
                key={reply._id}
                className="comment-row reply"
                ref={(el) => (commentRefs.current[reply._id] = el)}
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
                        <span>
                          {reply.authorId?.displayName?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      )}
                    </Link>

                    {/* Lane — author is now INSIDE the bubble (no more peer flex item),
                        giving the lane the full remaining width */}
                    <div className="comment-lane">
                      <div className="comment-bubble">
                        {/* Author header — same pattern as top-level comments */}
                        <Link
                          to={`/profile/${reply.authorId?.username}`}
                          className="comment-author"
                          style={{ textDecoration: 'none' }}
                        >
                          <span className="author-name">
                            {reply.authorId?.displayName || reply.authorId?.username}
                          </span>
                          {reply.authorId?.badges?.length > 0 && (
                            <TieredBadgeDisplay
                              badges={reply.authorId.badges}
                              context="card"
                            />
                          )}
                        </Link>

                        {isEditingReply ? (
                          <div className="comment-edit-box">
                            <textarea
                              value={editCommentText}
                              onChange={(e) =>
                                handleEditComment(reply._id, e.target.value)
                              }
                              onKeyDown={(e) => handleEditKeyDown(e, reply._id)}
                              className="comment-edit-input"
                              enterKeyHint="send"
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
                      <div className="comment-actions">
                        <ReactionButton
                          targetType="comment"
                          targetId={reply._id}
                          currentUserId={currentUser?.id}
                          onCountClick={() =>
                            setReactionDetailsModal({
                              isOpen: true,
                              targetType: 'comment',
                              targetId: reply._id,
                            })
                          }
                        />
                        <button
                          className="comment-action-btn reply-btn"
                          onClick={() => handleReplyToComment(postId, comment._id)}
                        >
                          Reply
                        </button>
                        <span className="comment-time">
                          {new Date(reply.createdAt).toLocaleString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                            month: 'short',
                            day: 'numeric',
                          })}
                          {reply.isEdited && (
                            <span className="edited-indicator"> (edited)</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* 3-dot menu */}
                    <div className="comment-menu-container">
                      <button
                        className="comment-menu-btn"
                        onClick={() =>
                          setOpenMenuId(
                            openMenuId === reply._id ? null : reply._id
                          )
                        }
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
      )}
    </div>
  );
};

export default CommentThread;
