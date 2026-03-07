import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import OptimizedImage from './OptimizedImage';
import ReactionButton from './ReactionButton';
import TieredBadgeDisplay from './TieredBadgeDisplay';
import PausableGif from './PausableGif';
import FormattedText from './FormattedText';
import { Pencil, Trash2, Flag, ChevronUp, ChevronDown } from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';
import { useCommentContext } from './comments/CommentContext';
import { useMediaQuery } from '../hooks/useMediaQuery';

const STAFF_ROLES = ['moderator', 'admin', 'super_admin'];

const compareIds = (id1, id2) => {
  if (!id1 || !id2) return false;
  return String(id1) === String(id2);
};

function formatCommentTime(dateStr) {
  return new Date(dateStr).toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    month: 'short',
    day: 'numeric',
  });
}

// ── CommentRow ─────────────────────────────────────────────────────────────
// Renders a single comment or reply row. Reads all handlers from CommentContext.
// isReply:        whether this is a threaded reply (affects CSS class, delete flag)
// parentCommentId: the top-level comment's ID — reply button targets this
// openMenuId / setOpenMenuId: 3-dot menu state, owned by the parent CommentThread

function CommentRow({ item, isReply = false, parentCommentId = null, openMenuId, setOpenMenuId }) {
  const {
    currentUser,
    viewerRole,
    postId,
    editingCommentId,
    editCommentText,
    commentRefs,
    showReplies,
    handleEditComment,
    handleSaveEditComment,
    handleCancelEditComment,
    handleDeleteComment,
    toggleReplies,
    handleReplyToComment,
    setReactionDetailsModal,
    setReportModal,
  } = useCommentContext();

  const isStaff = STAFF_ROLES.includes(viewerRole);
  const isEditing = editingCommentId === item._id;
  const isOwnItem =
    compareIds(item.authorId?._id, currentUser?.id) ||
    compareIds(item.authorId?._id, currentUser?._id) ||
    compareIds(item.authorId, currentUser?.id) ||
    compareIds(item.authorId, currentUser?._id);

  const handleEditKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSaveEditComment(item._id);
      }
    },
    [handleSaveEditComment, item._id]
  );

  // The reply button always targets the top-level comment (for replies) or itself (for top-level)
  const replyTargetId = isReply ? parentCommentId : item._id;

  if (item.isDeleted) {
    return (
      <div className="comment-deleted">
        <span className="deleted-icon">🗑️</span>
        <span className="deleted-text">This comment was deleted.</span>
      </div>
    );
  }

  return (
    <>
      {/* Avatar */}
      {item.isAnonymous && !isStaff ? (
        <div className="comment-avatar">
          <span>?</span>
        </div>
      ) : (
        <Link
          to={`/profile/${item.authorId?.username}`}
          className="comment-avatar"
          style={{ textDecoration: 'none' }}
          aria-label={`View ${item.authorId?.displayName || item.authorId?.username}'s profile`}
        >
          {item.authorId?.profilePhoto ? (
            <OptimizedImage
              src={getImageUrl(item.authorId.profilePhoto)}
              alt={item.authorId.username}
              className="avatar-image"
            />
          ) : (
            <span>{item.authorId?.displayName?.charAt(0).toUpperCase() || 'U'}</span>
          )}
        </Link>
      )}

      {/* Lane: bubble + actions */}
      <div className="comment-lane">
        <div className="comment-bubble">
          {/* Author name */}
          {item.isAnonymous && !isStaff ? (
            <span className="comment-author">
              <span className="author-name">Anonymous Member</span>
            </span>
          ) : item.isAnonymous && isStaff ? (
            <Link
              to={`/profile/${item.authorId?.username}`}
              className="comment-author"
              style={{ textDecoration: 'none' }}
            >
              <span className="author-name">
                Anonymous Member{' '}
                <span style={{ fontSize: '11px', opacity: 0.7 }}>(Author: @{item.authorId?.username})</span>
              </span>
              <span style={{ fontSize: '11px', marginLeft: '4px' }}>🕵️</span>
            </Link>
          ) : (
            <Link
              to={`/profile/${item.authorId?.username}`}
              className="comment-author"
              style={{ textDecoration: 'none' }}
            >
              <span className="author-name">
                {item.authorId?.displayName || item.authorId?.username}
              </span>
              {item.authorId?.badges?.length > 0 && (
                <TieredBadgeDisplay badges={item.authorId.badges} context="card" />
              )}
            </Link>
          )}

          {/* Edit box or comment text */}
          {isEditing ? (
            <div className="comment-edit-box">
              <textarea
                value={editCommentText}
                onChange={(e) => handleEditComment(item._id, e.target.value)}
                onKeyDown={handleEditKeyDown}
                className="comment-edit-input"
                enterKeyHint="send"
                autoFocus
              />
              <div className="comment-edit-actions">
                <button className="btn-save-comment" onClick={() => handleSaveEditComment(item._id)}>
                  Save
                </button>
                <button className="btn-cancel-comment" onClick={handleCancelEditComment}>
                  Never mind
                </button>
              </div>
            </div>
          ) : (
            <span className="comment-text">
              <FormattedText text={item.content} />
            </span>
          )}

          {item.gifUrl && (
            <div className="comment-gif">
              <PausableGif src={item.gifUrl} alt="GIF" />
            </div>
          )}
        </div>

        {/* Inline actions */}
        <div className="comment-actions">
          <ReactionButton
            targetType="comment"
            targetId={item._id}
            currentUserId={currentUser?.id}
            onCountClick={() =>
              setReactionDetailsModal({ isOpen: true, targetType: 'comment', targetId: item._id })
            }
          />
          <button
            className="comment-action-btn"
            onClick={() => handleReplyToComment(postId, replyTargetId)}
          >
            Reply
          </button>
          <time
            className="comment-time"
            dateTime={new Date(item.createdAt).toISOString()}
          >
            {formatCommentTime(item.createdAt)}
            {item.isEdited && <span className="edited-indicator"> (edited)</span>}
          </time>
          {!isReply && item.replyCount > 0 && (
            <button
              className="comment-action-btn view-replies-btn"
              onClick={() => toggleReplies(item._id)}
              aria-expanded={!!showReplies[item._id]}
            >
              {showReplies[item._id]
                ? <ChevronUp size={12} aria-hidden="true" />
                : <ChevronDown size={12} aria-hidden="true" />}
              {' '}{item.replyCount}{' '}{item.replyCount === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>
      </div>

      {/* 3-dot menu */}
      <div className="comment-menu-container">
        <button
          className="comment-menu-btn"
          onClick={() => setOpenMenuId(openMenuId === item._id ? null : item._id)}
          aria-label={isReply ? 'Reply options' : 'Comment options'}
          aria-haspopup="menu"
          aria-expanded={openMenuId === item._id}
        >
          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <circle cx="8" cy="3" r="1.5" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="8" cy="13" r="1.5" />
          </svg>
        </button>
        {openMenuId === item._id && (
          <div className="comment-menu" role="menu">
            {isOwnItem ? (
              <>
                <button
                  role="menuitem"
                  onClick={() => {
                    handleEditComment(item._id, item.content);
                    setOpenMenuId(null);
                  }}
                >
                  <Pencil size={14} strokeWidth={1.75} aria-hidden="true" /> Edit
                </button>
                <button
                  role="menuitem"
                  className="delete"
                  onClick={() => {
                    handleDeleteComment(postId, item._id, isReply);
                    setOpenMenuId(null);
                  }}
                >
                  <Trash2 size={14} strokeWidth={1.75} aria-hidden="true" /> Delete
                </button>
              </>
            ) : (
              <button
                role="menuitem"
                onClick={() => {
                  setReportModal({
                    isOpen: true,
                    type: 'comment',
                    contentId: item._id,
                    userId: item.authorId?._id,
                  });
                  setOpenMenuId(null);
                }}
              >
                <Flag size={14} strokeWidth={1.75} aria-hidden="true" /> Report
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ── CommentThread ──────────────────────────────────────────────────────────
// Renders a top-level comment and its (optionally visible) replies.
// All business logic lives in CommentContext — this component is purely structural.

const CommentThread = ({ comment, replies = [], isFullSheet = false }) => {
  const { showReplies, commentRefs } = useCommentContext();
  const isMobile = useMediaQuery('(max-width: 600px)');
  const isMobileInline = !isFullSheet && isMobile;
  const MAX_INLINE_REPLIES = isMobileInline ? 2 : Infinity;

  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    if (!openMenuId) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest('.comment-menu-container')) setOpenMenuId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  // Skip reply items — they are rendered via their parent thread
  if (comment.parentCommentId !== null && comment.parentCommentId !== undefined) {
    return null;
  }

  return (
    <div className="comment-thread">
      <div
        className="comment-row"
        ref={(el) => (commentRefs.current[comment._id] = el)}
      >
        <CommentRow
          item={comment}
          isReply={false}
          openMenuId={openMenuId}
          setOpenMenuId={setOpenMenuId}
        />
      </div>

      {showReplies[comment._id] && replies.length > 0 && (
        <div className="comment-replies">
          {replies.slice(0, MAX_INLINE_REPLIES).map((reply) => (
            <div
              key={reply._id}
              className="comment-row reply"
              ref={(el) => (commentRefs.current[reply._id] = el)}
            >
              <CommentRow
                item={reply}
                isReply={true}
                parentCommentId={comment._id}
                openMenuId={openMenuId}
                setOpenMenuId={setOpenMenuId}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentThread;
