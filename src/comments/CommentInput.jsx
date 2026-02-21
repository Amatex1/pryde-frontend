/**
 * CommentInput — reply form + comment input form for a single post's comment section.
 *
 * Extracted from FeedPostComments.jsx (inline) and the CommentSheet block in Feed.jsx (sheet).
 * Renders nothing when neither form is active.
 *
 * Layout differences between inline and full-sheet are driven by `isFullSheet`
 * from CommentScopeContext:
 *
 *   Inline order:   reply-input-box → comment-input-box
 *   Sheet order:    comment-sheet-input-form → comment-sheet-reply-form
 *
 * GIF picker keys:
 *   Inline comment: `comment-${postId}`
 *   Sheet  comment: `sheet-comment-${postId}`
 *   Inline reply:   `reply-${replyingToComment?._id}` (replyingToComment has no ._id —
 *                   this matches the original FeedPostComments behavior exactly)
 *   Sheet  reply:   `sheet-reply-${replyingToComment?.commentId}`
 */
import OptimizedImage from '../components/OptimizedImage';
import GifPicker from '../components/GifPicker';
import { getImageUrl } from '../utils/imageUrl';
import { useCommentScope } from './CommentScopeContext';
import { useComments } from '../context/CommentContext';

export default function CommentInput() {
  const {
    postId,
    currentUser,
    showGifPicker,
    onToggleGifPicker,
    isFullSheet,
  } = useCommentScope();

  const {
    showCommentBox,
    commentText,
    commentGif,
    replyingToComment,
    replyText,
    replyGif,
    handleCommentSubmit,
    handleCommentChange,
    handleCommentGifSelect,
    handleSubmitReply,
    handleCancelReply,
    handleReplyTextChange,
    handleReplyGifSelect,
  } = useComments();

  const isReplyingHere = replyingToComment?.postId === postId;
  const showCommentForm = showCommentBox[postId] || isFullSheet;

  if (!showCommentForm && !isReplyingHere) return null;

  // GIF picker keys — must match the originals exactly so existing open-picker
  // state is not lost during a re-render.
  const gifCommentKey = isFullSheet
    ? `sheet-comment-${postId}`
    : `comment-${postId}`;
  // Note: replyingToComment._id is intentionally preserved from the original
  // FeedPostComments code (it is undefined since replyingToComment = { postId, commentId }).
  const gifReplyKey = isFullSheet
    ? `sheet-reply-${replyingToComment?.commentId}`
    : `reply-${replyingToComment?._id}`;

  // ── Sheet layout (comment input THEN reply input) ─────────────────────────
  if (isFullSheet) {
    return (
      <>
        {/* Sheet: comment input at the top */}
        {showCommentForm && (
          <form
            onSubmit={(e) => handleCommentSubmit(postId, e)}
            className="comment-sheet-input-form"
          >
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
                type="text"
                value={commentText[postId] || ''}
                onChange={(e) => handleCommentChange(postId, e.target.value)}
                placeholder="Add a comment..."
                className="comment-input"
              />
              <button
                type="button"
                onClick={() => onToggleGifPicker(showGifPicker === gifCommentKey ? null : gifCommentKey)}
                className="btn-gif"
                title="Add GIF"
              >
                GIF
              </button>
              <button
                type="submit"
                className="comment-submit-btn"
                disabled={!commentText[postId]?.trim() && !commentGif[postId]}
              >
                ➤
              </button>
            </div>
            {commentGif[postId] && (
              <div className="comment-gif-preview">
                <img src={commentGif[postId]} alt="Selected GIF" />
                <button
                  type="button"
                  className="btn-remove-gif"
                  onClick={() => handleCommentGifSelect(postId, null)}
                >
                  ✕
                </button>
              </div>
            )}
            {showGifPicker === gifCommentKey && (
              <GifPicker
                onGifSelect={(gifUrl) => {
                  handleCommentGifSelect(postId, gifUrl);
                  onToggleGifPicker(null);
                }}
                onClose={() => onToggleGifPicker(null)}
              />
            )}
          </form>
        )}

        {/* Sheet: reply input below the comment input */}
        {isReplyingHere && (
          <form onSubmit={handleSubmitReply} className="comment-sheet-reply-form">
            <div className="reply-input-header">
              <span>Replying to comment</span>
              <button type="button" onClick={handleCancelReply} className="btn-cancel-reply-small">✕</button>
            </div>
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
                type="text"
                value={replyText}
                onChange={(e) => handleReplyTextChange(e.target.value)}
                placeholder={replyGif ? "Caption, if you'd like" : 'Write a reply...'}
                className="comment-input"
                autoFocus
              />
              <button
                type="button"
                onClick={() => onToggleGifPicker(showGifPicker === gifReplyKey ? null : gifReplyKey)}
                className="btn-gif"
                title="Add GIF"
              >
                GIF
              </button>
              <button
                type="submit"
                className="comment-submit-btn"
                disabled={!replyText?.trim() && !replyGif}
              >
                ➤
              </button>
            </div>
            {replyGif && (
              <div className="comment-gif-preview">
                <img src={replyGif} alt="Selected GIF" />
                <button
                  type="button"
                  className="btn-remove-gif"
                  onClick={() => handleReplyGifSelect(null)}
                >
                  ✕
                </button>
              </div>
            )}
            {showGifPicker === gifReplyKey && (
              <GifPicker
                onGifSelect={(gifUrl) => {
                  handleReplyGifSelect(gifUrl);
                  onToggleGifPicker(null);
                }}
                onClose={() => onToggleGifPicker(null)}
              />
            )}
          </form>
        )}
      </>
    );
  }

  // ── Inline layout (reply input THEN comment input) ─────────────────────────
  return (
    <>
      {/* Inline: reply input first */}
      {isReplyingHere && (
        <form onSubmit={handleSubmitReply} className="reply-input-box">
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
              id={`feed-reply-${replyingToComment?.commentId}`}
              name="reply"
              type="text"
              value={replyText}
              onChange={(e) => handleReplyTextChange(e.target.value)}
              placeholder={replyGif ? "Caption, if you'd like" : 'Write a reply...'}
              className="reply-input"
              autoFocus
            />
          </div>
          <div className="reply-composer-actions">
            <button
              type="button"
              onClick={handleCancelReply}
              className="btn-cancel-reply"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onToggleGifPicker(showGifPicker === gifReplyKey ? null : gifReplyKey)}
              className="btn-gif"
              title="Add GIF"
            >
              GIF
            </button>
            <button
              type="submit"
              className="reply-submit-btn"
              disabled={!replyText?.trim() && !replyGif}
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
                onClick={() => handleReplyGifSelect(null)}
              >
                ✕
              </button>
            </div>
          )}
          {showGifPicker === gifReplyKey && (
            <GifPicker
              onGifSelect={(gifUrl) => {
                handleReplyGifSelect(gifUrl);
                onToggleGifPicker(null);
              }}
              onClose={() => onToggleGifPicker(null)}
            />
          )}
        </form>
      )}

      {/* Inline: comment input second */}
      {showCommentForm && (
        <form
          onSubmit={(e) => handleCommentSubmit(postId, e)}
          className="comment-input-box"
        >
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
              id={`comment-input-${postId}`}
              name="comment"
              type="text"
              value={commentText[postId] || ''}
              onChange={(e) => handleCommentChange(postId, e.target.value)}
              placeholder="Reply, if you feel like it."
              className="comment-input glossy"
            />
            <button
              type="button"
              onClick={() => onToggleGifPicker(showGifPicker === gifCommentKey ? null : gifCommentKey)}
              className="btn-gif"
              title="Add GIF"
            >
              GIF
            </button>
            <button
              type="submit"
              className="comment-submit-btn"
              disabled={!commentText[postId]?.trim() && !commentGif[postId]}
            >
              ➤
            </button>
          </div>
          {commentGif[postId] && (
            <div className="comment-gif-preview">
              <img src={commentGif[postId]} alt="Selected GIF" />
              <button
                type="button"
                className="btn-remove-gif"
                onClick={() => handleCommentGifSelect(postId, null)}
              >
                ✕
              </button>
            </div>
          )}
          {showGifPicker === gifCommentKey && (
            <GifPicker
              onGifSelect={(gifUrl) => {
                handleCommentGifSelect(postId, gifUrl);
                onToggleGifPicker(null);
              }}
              onClose={() => onToggleGifPicker(null)}
            />
          )}
        </form>
      )}
    </>
  );
}
