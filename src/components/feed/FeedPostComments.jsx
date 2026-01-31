import { memo } from 'react';
import CommentThread from '../CommentThread';
import GifPicker from '../GifPicker';
import OptimizedImage from '../OptimizedImage';
import { getImageUrl } from '../../utils/imageUrl';

/**
 * FeedPostComments - Renders the comments section of a post
 * 
 * Includes: comments list, reply input box, comment input box
 * This component is memoized for performance optimization.
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
}) {
  return (
    <>
      {/* Comments Section */}
      {comments.length > 0 && (
        <div className="post-comments">
          {comments
            .filter(comment => comment.parentCommentId === null || comment.parentCommentId === undefined)
            .slice(-3)
            .map((comment) => (
              <CommentThread
                key={comment._id}
                comment={comment}
                replies={commentReplies[comment._id] || []}
                currentUser={currentUser}
                postId={post._id}
                showReplies={showReplies}
                editingCommentId={editingCommentId}
                editCommentText={editCommentText}
                showReactionPicker={showReactionPicker}
                commentRefs={commentRefs}
                getUserReactionEmoji={getUserReactionEmoji}
                handleEditComment={onEditComment}
                handleSaveEditComment={onSaveEditComment}
                handleCancelEditComment={onCancelEditComment}
                handleDeleteComment={onDeleteComment}
                handleCommentReaction={onCommentReaction}
                toggleReplies={onToggleReplies}
                handleReplyToComment={onReplyToComment}
                setShowReactionPicker={onSetShowReactionPicker}
                setReactionDetailsModal={onSetReactionDetailsModal}
                setReportModal={onSetReportModal}
              />
            ))}
        </div>
      )}

      {/* Reply Input Box - Shown when replying to a comment */}
      {replyingToComment?.postId === post._id && (
        <form onSubmit={onSubmitReply} className="reply-input-box">
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
            <button
              type="button"
              onClick={onCancelReply}
              className="btn-cancel-reply"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onToggleGifPicker(`reply-${replyingToComment._id}`)}
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
              ➤
            </button>
          </div>
          {replyGif && (
            <div className="reply-gif-preview">
              <img src={replyGif} alt="Selected GIF" />
              <button
                type="button"
                className="btn-remove-gif"
                onClick={() => onReplyGifSelect(null)}
              >
                ✕
              </button>
            </div>
          )}
          {showGifPicker === `reply-${replyingToComment._id}` && (
            <GifPicker
              onGifSelect={(gifUrl) => {
                onReplyGifSelect(gifUrl);
                onToggleGifPicker(null);
              }}
              onClose={() => onToggleGifPicker(null)}
            />
          )}
        </form>
      )}

      {/* Comment Input Box */}
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
              ➤
            </button>
          </div>
          {commentGif[post._id] && (
            <div className="comment-gif-preview">
              <img src={commentGif[post._id]} alt="Selected GIF" />
              <button
                type="button"
                className="btn-remove-gif"
                onClick={() => onCommentGifSelect(post._id, null)}
              >
                ✕
              </button>
            </div>
          )}
          {showGifPicker === `comment-${post._id}` && (
            <GifPicker
              onGifSelect={(gifUrl) => {
                onCommentGifSelect(post._id, gifUrl);
                onToggleGifPicker(null);
              }}
              onClose={() => onToggleGifPicker(null)}
            />
          )}
        </form>
      )}
    </>
  );
});

export default FeedPostComments;

