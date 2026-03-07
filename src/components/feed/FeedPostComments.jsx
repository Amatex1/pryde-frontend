import { memo, useMemo } from 'react';
import { X, Send } from 'lucide-react';
import CommentThread from '../CommentThread';
import GifPicker from '../GifPicker';
import OptimizedImage from '../OptimizedImage';
import { getImageUrl } from '../../utils/imageUrl';
import { CommentProvider } from '../comments/CommentContext';

/**
 * FeedPostComments - Renders the comments section of a post.
 *
 * All comment/reply handlers are injected into CommentContext so that
 * CommentThread and CommentRow can consume them without deep prop drilling.
 */
const FeedPostComments = memo(function FeedPostComments({
  post,
  currentUser,
  comments,
  commentReplies,
  showReplies,
  showCommentBox,
  commentText,
  commentGif,
  showGifPicker,
  replyingToComment,
  replyText,
  replyGif,
  editingCommentId,
  editCommentText,
  showReactionPicker,
  commentRefs,

  // Handlers
  onEditComment,
  onSaveEditComment,
  onCancelEditComment,
  onDeleteComment,
  onCommentReaction,
  onToggleReplies,
  onReplyToComment,
  onSetShowReactionPicker,
  onSetReactionDetailsModal,
  onSetReportModal,
  onReplyTextChange,
  onReplyGifSelect,
  onSubmitReply,
  onCancelReply,
  onCommentChange,
  onCommentGifSelect,
  onCommentSubmit,
  onToggleGifPicker,

  // Utilities
  getUserReactionEmoji,
  viewerRole,
  replyIsAnonymous,
  onReplyIsAnonymousChange,
}) {
  // Build context value once per render — all handlers + state CommentThread needs
  const contextValue = useMemo(() => ({
    currentUser,
    postId: post._id,
    viewerRole,
    editingCommentId,
    editCommentText,
    showReplies,
    showReactionPicker,
    commentRefs,
    getUserReactionEmoji,
    handleEditComment: onEditComment,
    handleSaveEditComment: onSaveEditComment,
    handleCancelEditComment: onCancelEditComment,
    handleDeleteComment: onDeleteComment,
    handleCommentReaction: onCommentReaction,
    toggleReplies: onToggleReplies,
    handleReplyToComment: onReplyToComment,
    setShowReactionPicker: onSetShowReactionPicker,
    setReactionDetailsModal: onSetReactionDetailsModal,
    setReportModal: onSetReportModal,
  }), [
    currentUser, post._id, viewerRole, editingCommentId, editCommentText,
    showReplies, showReactionPicker, commentRefs, getUserReactionEmoji,
    onEditComment, onSaveEditComment, onCancelEditComment, onDeleteComment,
    onCommentReaction, onToggleReplies, onReplyToComment, onSetShowReactionPicker,
    onSetReactionDetailsModal, onSetReportModal,
  ]);

  // Only top-level comments shown inline on the feed card (last 3)
  const topLevelComments = comments.filter(
    (c) => c.parentCommentId === null || c.parentCommentId === undefined
  );
  const hiddenCount = Math.max(0, topLevelComments.length - 3);
  const visibleComments = topLevelComments.slice(-3);

  // "Replying to @username" indicator
  const replyTarget = replyingToComment?.commentId
    ? comments.find((c) => String(c._id) === String(replyingToComment.commentId))
    : null;
  const replyTargetName =
    replyTarget?.authorId?.displayName ||
    replyTarget?.authorId?.username ||
    null;

  return (
    <CommentProvider value={contextValue}>
      {/* Comments list */}
      {visibleComments.length > 0 && (
        <div className="post-comments">
          {hiddenCount > 0 && (
            <button
              className="comment-action-btn view-all-comments-btn"
              onClick={() => onReplyToComment(post._id, null)}
              style={{ display: 'block', marginBottom: '4px', color: 'var(--color-brand)', fontWeight: 500 }}
            >
              View all {topLevelComments.length} comments
            </button>
          )}
          {visibleComments.map((comment) => (
            <CommentThread
              key={comment._id}
              comment={comment}
              replies={commentReplies[comment._id] || []}
            />
          ))}
        </div>
      )}

      {/* Reply input box */}
      {replyingToComment?.postId === post._id && (
        <form onSubmit={onSubmitReply} className="reply-input-box">
          {replyTargetName && (
            <div className="reply-target-indicator">
              <span>↩ Replying to <strong>@{replyTargetName}</strong></span>
              <button type="button" className="btn-cancel-reply-small" onClick={onCancelReply} aria-label="Cancel reply">
                <X size={13} strokeWidth={2} aria-hidden="true" />
              </button>
            </div>
          )}
          <div className="reply-input-wrapper">
            <div className="reply-user-avatar">
              {currentUser?.profilePhoto ? (
                <OptimizedImage
                  src={getImageUrl(currentUser.profilePhoto)}
                  alt="You"
                  className="avatar-image"
                  imageSize="avatar"
                />
              ) : (
                <span>{currentUser?.displayName?.charAt(0).toUpperCase() || 'U'}</span>
              )}
            </div>
            <input
              id={`feed-reply-${replyingToComment.commentId}`}
              name="reply"
              type="text"
              value={replyText}
              onChange={(e) => onReplyTextChange(e.target.value)}
              placeholder={replyGif ? "Caption, if you'd like" : "Write a reply..."}
              className="reply-input"
              autoFocus
            />
          </div>
          <div className="reply-composer-actions">
            {onReplyIsAnonymousChange && (
              <label className="anon-toggle-label">
                <input
                  type="checkbox"
                  checked={replyIsAnonymous || false}
                  onChange={(e) => onReplyIsAnonymousChange(e.target.checked)}
                />
                <span>Anon</span>
              </label>
            )}
            {replyIsAnonymous && (
              <span className="anon-mods-badge">🔒 Mods only</span>
            )}
            <button type="button" onClick={onCancelReply} className="btn-cancel-reply">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onToggleGifPicker(`reply-${replyingToComment.commentId}`)}
              className="btn-gif"
              title="Add GIF"
            >
              GIF
            </button>
            <button
              type="submit"
              className="reply-submit-btn"
              disabled={!replyText.trim() && !replyGif}
            >
              <Send size={14} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
          {replyGif && (
            <div className="reply-gif-preview">
              <img src={replyGif} alt="Selected GIF" />
              <button type="button" className="btn-remove-gif" onClick={() => onReplyGifSelect(null)}>
                <X size={14} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
          )}
          {showGifPicker === `reply-${replyingToComment.commentId}` && (
            <GifPicker
              onGifSelect={(gifUrl) => { onReplyGifSelect(gifUrl); onToggleGifPicker(null); }}
              onClose={() => onToggleGifPicker(null)}
            />
          )}
        </form>
      )}

      {/* Comment input box */}
      {showCommentBox[post._id] && (
        <form onSubmit={(e) => onCommentSubmit(post._id, e)} className="comment-input-box">
          <div className="comment-input-wrapper">
            <div className="comment-user-avatar">
              {currentUser?.profilePhoto ? (
                <OptimizedImage
                  src={getImageUrl(currentUser.profilePhoto)}
                  alt="You"
                  className="avatar-image"
                  imageSize="avatar"
                />
              ) : (
                <span>{currentUser?.displayName?.charAt(0).toUpperCase() || 'U'}</span>
              )}
            </div>
            <input
              id={`comment-input-${post._id}`}
              name="comment"
              type="text"
              value={commentText[post._id] || ''}
              onChange={(e) => onCommentChange(post._id, e.target.value)}
              placeholder="Reply, if you feel like it."
              className="comment-input glossy"
            />
            <button
              type="button"
              onClick={() => onToggleGifPicker(showGifPicker === `comment-${post._id}` ? null : `comment-${post._id}`)}
              className="btn-gif"
              title="Add GIF"
            >
              GIF
            </button>
            <button
              type="submit"
              className="comment-submit-btn"
              disabled={!commentText[post._id]?.trim() && !commentGif[post._id]}
            >
              <Send size={14} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
          {commentGif[post._id] && (
            <div className="comment-gif-preview">
              <img src={commentGif[post._id]} alt="Selected GIF" />
              <button type="button" className="btn-remove-gif" onClick={() => onCommentGifSelect(post._id, null)}>
                <X size={14} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
          )}
          {showGifPicker === `comment-${post._id}` && (
            <GifPicker
              onGifSelect={(gifUrl) => { onCommentGifSelect(post._id, gifUrl); onToggleGifPicker(null); }}
              onClose={() => onToggleGifPicker(null)}
            />
          )}
        </form>
      )}
    </CommentProvider>
  );
});

export default FeedPostComments;
