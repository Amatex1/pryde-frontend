import OptimizedImage from '../OptimizedImage';
import GifPicker from '../GifPicker';
import { getImageUrl } from '../../utils/imageUrl';

export default function FeedMobileCommentModal({
  isOpen,
  postId,
  currentUser,
  value,
  selectedGif,
  isGifPickerOpen,
  onClose,
  onSubmit,
  onChange,
  onKeyDown,
  onGifSelect,
  onGifPickerClose,
  onGifToggle,
  onGifClear,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="comment-modal-overlay" onClick={onClose} aria-hidden="true">
      <div
        className="comment-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Reply"
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onClose();
          }
        }}
      >
        <div className="comment-modal-header">
          <h3>Reply</h3>
          <button className="btn-close-modal" onClick={onClose} type="button">✕</button>
        </div>
        <div className="comment-modal-body">
          <form onSubmit={onSubmit}>
            <div className="comment-modal-input-wrapper">
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
                id={`modal-comment-${postId}`}
                name="modalComment"
                value={value}
                onChange={(e) => {
                  onChange(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onKeyDown={onKeyDown}
                placeholder="Reply, if you feel like it."
                className="comment-modal-textarea"
                autoFocus
                rows="3"
              />
            </div>
            {selectedGif && (
              <div className="comment-gif-preview">
                <img src={selectedGif} alt="Selected GIF" />
                <button
                  type="button"
                  className="btn-remove-gif"
                  onClick={onGifClear}
                >
                  ✕
                </button>
              </div>
            )}
            {isGifPickerOpen && (
              <GifPicker onGifSelect={onGifSelect} onClose={onGifPickerClose} />
            )}
            <div className="comment-modal-actions">
              <button
                type="button"
                onClick={onGifToggle}
                className="btn-gif"
                title="Add GIF"
              >
                GIF
              </button>
              <button
                type="submit"
                className="btn-submit-comment"
                disabled={!value?.trim() && !selectedGif}
              >
                Reply
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}