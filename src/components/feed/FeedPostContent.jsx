import { memo } from 'react';
import OptimizedImage from '../OptimizedImage';
import FormattedText from '../FormattedText';
import Poll from '../Poll';
import PausableGif from '../PausableGif';
import { getImageUrl } from '../../utils/imageUrl';

/**
 * FeedPostContent - Renders the content section of a post
 * 
 * Handles: edit mode, poll, content warning, text, media grid, GIF
 * This component is memoized for performance optimization.
 */
const FeedPostContent = memo(function FeedPostContent({
  post,
  currentUser,
  isFirstPost,
  shouldEagerLoad,
  
  // Edit state
  isEditing,
  editPostText,
  editPostVisibility,
  editPostMedia,
  editPostTextareaRef,
  
  // Display state
  expandedPosts,
  revealedPosts,
  autoHideContentWarnings,
  
  // Handlers
  onEditPostTextChange,
  onEditPostVisibilityChange,
  onRemoveEditMedia,
  onSaveEditPost,
  onCancelEditPost,
  onEditPostKeyDown,
  onExpandPost,
  onRevealPost,
  onPhotoClick,
  onPollVote,
}) {
  // Content warning should hide content
  const isContentHidden = post.contentWarning && !revealedPosts[post._id] && autoHideContentWarnings;

  return (
    <div className="post-content">
      {isEditing ? (
        <div className="post-edit-box">
          <textarea
            id={`edit-post-${post._id}`}
            name="editPost"
            ref={editPostTextareaRef}
            value={editPostText}
            onChange={(e) => {
              onEditPostTextChange(e.target.value);
              // Auto-resize on change
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            onKeyDown={(e) => onEditPostKeyDown(e, post._id)}
            className="post-edit-textarea"
            enterKeyHint="enter"
            autoFocus
          />
          {/* Show existing media with delete buttons */}
          {editPostMedia.length > 0 && (
            <div className="edit-media-preview">
              {editPostMedia.map((media, index) => (
                <div key={index} className="edit-media-item">
                  {media.type === 'video' ? (
                    <video src={getImageUrl(media.url)} />
                  ) : (
                    <img src={getImageUrl(media.url)} alt={`Media ${index + 1}`} />
                  )}
                  <button
                    type="button"
                    className="btn-remove-media"
                    onClick={() => onRemoveEditMedia(media.url)}
                    title="Remove this media"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="post-edit-privacy">
            <div className="post-edit-privacy-label">Privacy:</div>
            <select
              id="edit-post-privacy-selector"
              name="editPostPrivacy"
              value={editPostVisibility}
              onChange={(e) => onEditPostVisibilityChange(e.target.value)}
              aria-label="Edit post privacy"
            >
              <option value="public">🌍 Public</option>
              <option value="followers">👥 Connections</option>
              <option value="private">🔒 Private</option>
            </select>
          </div>
          <div className="post-edit-actions">
            <button
              onClick={() => onSaveEditPost(post._id)}
              className="btn-save-post"
            >
              Save
            </button>
            <button
              onClick={onCancelEditPost}
              className="btn-cancel-post"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Poll posts render poll UI, NOT text content */}
          {post.poll && post.poll.question ? (
            <Poll
              poll={post.poll}
              postId={post._id}
              currentUserId={currentUser?._id}
              onVote={onPollVote}
            />
          ) : (
            <>
              {isContentHidden ? (
                <div className="content-warning-overlay">
                  <div className="cw-header">
                    <span className="cw-icon">⚠️</span>
                    <span className="cw-text">Content Warning: {post.contentWarning}</span>
                  </div>
                  <button
                    className="btn-reveal-content"
                    onClick={() => onRevealPost(post._id)}
                  >
                    Show Content
                  </button>
                </div>
              ) : (
                <>
                  {/* Text Content */}
                  {post.content && (
                    <>
                      <div
                        className={`post-text-clamp${expandedPosts[post._id] ? ' post-text-expanded' : ''}`}
                      >
                        <p>
                          <FormattedText text={post.content} />
                        </p>
                      </div>
                      {/* See more toggle - show only for long posts */}
                      {post.content.length > 280 && (
                        <button
                          type="button"
                          className="see-more-toggle"
                          onClick={() => onExpandPost(post._id)}
                          aria-expanded={expandedPosts[post._id] || false}
                          aria-label={expandedPosts[post._id] ? 'Show less content' : 'Show more content'}
                        >
                          {expandedPosts[post._id] ? 'See less' : 'See more'}
                        </button>
                      )}
                    </>
                  )}

                  {/* Media Grid */}
                  {post.media && post.media.length > 0 && (
                    <div className={`post-media-grid ${post.media.length === 1 ? 'single' : post.media.length === 2 ? 'double' : 'multiple'}`}>
                      {post.media.map((media, index) => (
                        <div key={index} className="post-media-item">
                          {media.type === 'video' ? (
                            <video src={getImageUrl(media.url)} controls />
                          ) : (
                            <OptimizedImage
                              src={getImageUrl(media.url)}
                              alt={`Post media ${index + 1}`}
                              onClick={() => onPhotoClick(getImageUrl(media.url))}
                              style={{ cursor: 'pointer' }}
                              fetchPriority={isFirstPost && index === 0 ? 'high' : undefined}
                              loading={shouldEagerLoad && index === 0 ? 'eager' : 'lazy'}
                              responsiveSizes={media.sizes}
                              imageSize="feed"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Display GIF if present */}
                  {post.gifUrl && (
                    <div className="post-gif">
                      <PausableGif src={post.gifUrl} alt="GIF" loading="lazy" />
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
});

export default FeedPostContent;

