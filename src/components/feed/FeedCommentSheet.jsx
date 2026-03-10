import OptimizedImage from '../OptimizedImage';
import CommentThread from '../CommentThread';
import CommentSheet from '../comments/CommentSheet';
import { CommentProvider } from '../comments/CommentContext';
import GifPicker from '../GifPicker';
import { getImageUrl } from '../../utils/imageUrl';

export default function FeedCommentSheet({
  isOpen,
  postId,
  currentUser,
  commentValue,
  selectedCommentGif,
  isCommentGifPickerOpen,
  onClose,
  onCommentSubmit,
  onCommentChange,
  onCommentGifToggle,
  onCommentGifSelect,
  onCommentGifClear,
  onCommentGifPickerClose,
  replyingToComment,
  replyTargetName,
  replyIsAnonymous,
  onReplyAnonymousChange,
  onReplyCancel,
  replyText,
  onReplyTextChange,
  onReplySubmit,
  replyGif,
  isReplyGifPickerOpen,
  onReplyGifToggle,
  onReplyGifSelect,
  onReplyGifClear,
  onReplyGifPickerClose,
  commentContextValue,
  comments,
  commentReplies,
}) {
  if (!isOpen) {
    return null;
  }

  const isReplyingToOpenPost = replyingToComment?.postId === postId;
  const rootComments = (comments || []).filter(
    (comment) => comment.parentCommentId === null || comment.parentCommentId === undefined
  );

  return (
    <CommentSheet onClose={onClose}>
      <form onSubmit={onCommentSubmit} className="comment-sheet-input-form">
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
            value={commentValue}
            onChange={(e) => onCommentChange(e.target.value)}
            placeholder="Add a comment..."
            className="comment-input"
          />
          <button
            type="button"
            onClick={onCommentGifToggle}
            className="btn-gif"
            title="Add GIF"
          >
            GIF
          </button>
          <button
            type="submit"
            className="comment-submit-btn"
            disabled={!commentValue?.trim() && !selectedCommentGif}
          >
            ➤
          </button>
        </div>

        {selectedCommentGif && (
          <div className="comment-gif-preview">
            <img src={selectedCommentGif} alt="Selected GIF" />
            <button
              type="button"
              className="btn-remove-gif"
              onClick={onCommentGifClear}
            >
              ✕
            </button>
          </div>
        )}

        {isCommentGifPickerOpen && (
          <GifPicker
            onGifSelect={onCommentGifSelect}
            onClose={onCommentGifPickerClose}
          />
        )}
      </form>

      {isReplyingToOpenPost && (
        <form onSubmit={onReplySubmit} className="comment-sheet-reply-form">
          <div className="reply-input-header">
            <span>
              ↩ Replying to <strong>{replyTargetName || 'comment'}</strong>
            </span>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                cursor: 'pointer',
                marginLeft: 'auto',
                marginRight: '8px',
              }}
            >
              <input
                type="checkbox"
                checked={replyIsAnonymous}
                onChange={(e) => onReplyAnonymousChange(e.target.checked)}
                style={{ margin: 0 }}
              />
              <span style={{ opacity: 0.7 }}>Anon</span>
            </label>
            {replyIsAnonymous && (
              <span
                style={{
                  fontSize: '10px',
                  color: 'var(--color-primary)',
                  background: 'var(--color-primary-soft)',
                  padding: '1px 6px',
                  borderRadius: '999px',
                  fontWeight: 500,
                  marginRight: '8px',
                }}
              >
                🔒 Mods only
              </span>
            )}
            <button type="button" onClick={onReplyCancel} className="btn-cancel-reply-small">✕</button>
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
            <textarea
              value={replyText}
              onChange={(e) => {
                onReplyTextChange(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onReplySubmit(e);
                }
              }}
              placeholder={replyGif ? "Caption, if you'd like" : 'Write a reply...'}
              className="comment-input reply-textarea"
              enterKeyHint="send"
              rows={1}
              autoFocus
            />
            <button
              type="button"
              onClick={onReplyGifToggle}
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
                onClick={onReplyGifClear}
              >
                ✕
              </button>
            </div>
          )}

          {isReplyGifPickerOpen && (
            <GifPicker
              onGifSelect={onReplyGifSelect}
              onClose={onReplyGifPickerClose}
            />
          )}
        </form>
      )}

      <CommentProvider value={commentContextValue}>
        <div className="comment-sheet-threads">
          {rootComments.map((comment) => (
            <CommentThread
              key={comment._id}
              comment={comment}
              replies={commentReplies[comment._id] || []}
              isFullSheet={true}
            />
          ))}
        </div>
      </CommentProvider>
    </CommentSheet>
  );
}