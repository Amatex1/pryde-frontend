import { memo, forwardRef } from 'react';
import { Link } from 'react-router-dom';
import PostHeader from '../PostHeader';
import PinnedPostBadge from '../PinnedPostBadge';
import ReactionButton from '../ReactionButton';
import CommentThread from '../CommentThread';
import GifPicker from '../GifPicker';
import FeedPostContent from './FeedPostContent';
import { getImageUrl } from '../../utils/imageUrl';
import { getDisplayName } from '../../utils/getDisplayName';

/**
 * FeedPost - A single post card in the feed
 * 
 * This component is memoized for performance optimization.
 * All handler props should be stable (wrapped in useCallback in parent).
 */
const FeedPost = memo(forwardRef(function FeedPost({
  // Post data
  post,
  postIndex,
  
  // Current user
  currentUser,
  
  // UI state
  isFirstPost,
  shouldEagerLoad,
  openDropdownId,
  editingPostId,
  editPostText,
  editPostVisibility,
  editPostMedia,
  editPostTextareaRef,
  expandedPosts,
  revealedPosts,
  autoHideContentWarnings,
  bookmarkedPosts,
  postComments,
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
  
  // Handlers - Post actions
  onToggleDropdown,
  onPinPost,
  onEditPost,
  onDeletePost,
  onReportPost,
  onBookmark,
  onReactionChange,
  onReactionCountClick,
  
  // Handlers - Post editing
  onEditPostTextChange,
  onEditPostVisibilityChange,
  onRemoveEditMedia,
  onSaveEditPost,
  onCancelEditPost,
  onEditPostKeyDown,
  
  // Handlers - Content
  onExpandPost,
  onRevealPost,
  onPhotoClick,
  onPollVote,
  
  // Handlers - Comments
  onToggleCommentBox,
  onCommentChange,
  onCommentSubmit,
  onCommentGifSelect,
  onToggleGifPicker,
  
  // Handlers - Comment actions
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
  
  // Handlers - Replies
  onReplyTextChange,
  onReplyGifSelect,
  onSubmitReply,
  onCancelReply,
  
  // Utilities
  getUserReactionEmoji,
}, ref) {
  // Check if this is a system post (from pryde_prompts account)
  const isSystemPost = post.isSystemPost || post.author?.isSystemAccount;
  const isOwnPost = post.author?._id === currentUser?.id || post.author?._id === currentUser?._id;
  const isBookmarked = bookmarkedPosts.includes(post._id);
  const comments = postComments[post._id] || [];
  const isEditing = editingPostId === post._id;
  const isDropdownOpen = openDropdownId === post._id;

  return (
    <div
      id={`post-${post._id}`}
      className={`post-card glossy fade-in ${isSystemPost ? 'system-post' : ''}`}
      ref={ref}
    >
      {/* Pinned Post Badge */}
      {post.isPinned && <PinnedPostBadge />}

      {/* Post Header with Dropdown */}
      <PostHeader
        author={post.author}
        createdAt={post.createdAt}
        visibility={post.visibility}
        edited={post.edited}
        isPinned={post.isPinned}
        isSystemAccount={isSystemPost}
      >
        <div className="post-dropdown-container">
          <button
            className="btn-dropdown"
            onClick={() => onToggleDropdown(post._id)}
            title="More options"
          >
            ⋮
          </button>
          {isDropdownOpen && (
            <div className="dropdown-menu">
              {isOwnPost ? (
                <>
                  <button
                    className="dropdown-item"
                    onClick={() => onPinPost(post._id, post.isPinned)}
                  >
                    📌 {post.isPinned ? 'Unpin' : 'Pin to Profile'}
                  </button>
                  <button
                    className="dropdown-item"
                    onClick={() => onEditPost(post)}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="dropdown-item delete"
                    onClick={() => onDeletePost(post._id)}
                  >
                    🗑️ Delete
                  </button>
                </>
              ) : (
                <button
                  className="dropdown-item report"
                  onClick={() => onReportPost(post._id, post.author?._id)}
                >
                  🚩 Report
                </button>
              )}
            </div>
          )}
        </div>
      </PostHeader>

      {/* Post Content */}
      <FeedPostContent
        post={post}
        currentUser={currentUser}
        isFirstPost={isFirstPost}
        shouldEagerLoad={shouldEagerLoad}
        isEditing={isEditing}
        editPostText={editPostText}
        editPostVisibility={editPostVisibility}
        editPostMedia={editPostMedia}
        editPostTextareaRef={editPostTextareaRef}
        expandedPosts={expandedPosts}
        revealedPosts={revealedPosts}
        autoHideContentWarnings={autoHideContentWarnings}
        onEditPostTextChange={onEditPostTextChange}
        onEditPostVisibilityChange={onEditPostVisibilityChange}
        onRemoveEditMedia={onRemoveEditMedia}
        onSaveEditPost={onSaveEditPost}
        onCancelEditPost={onCancelEditPost}
        onEditPostKeyDown={onEditPostKeyDown}
        onExpandPost={onExpandPost}
        onRevealPost={onRevealPost}
        onPhotoClick={onPhotoClick}
        onPollVote={onPollVote}
      />

      {/* Post Actions */}
      <div className="post-actions soft-actions">
        <ReactionButton
          targetType="post"
          targetId={post._id}
          currentUserId={currentUser?.id}
          initialUserReaction={getUserReactionEmoji(post.reactions)}
          onReactionChange={(reactions, userReaction) => onReactionChange(post._id, reactions, userReaction)}
          onCountClick={() => onReactionCountClick(post._id)}
        />
        <button
          className="action-btn subtle"
          onClick={() => onToggleCommentBox(post._id)}
          aria-label={`Reply to post${!post.hideMetrics ? ` (${post.commentCount || 0} replies)` : ''}`}
          title="Reply to this post"
        >
          <span>💬</span>
          <span className="action-text">
            Reply {!post.hideMetrics && `(${post.commentCount || 0})`}
          </span>
        </button>
        <button
          className={`action-btn ghost ${isBookmarked ? 'bookmarked' : ''}`}
          onClick={() => onBookmark(post._id)}
          title={isBookmarked ? 'Remove save' : 'Keep this for later'}
          aria-label={isBookmarked ? 'Remove save from post' : 'Save post'}
        >
          <span>🔖</span>
          <span className="action-text">{isBookmarked ? 'Saved' : 'Save'}</span>
        </button>
      </div>

      {/* Tags Display */}
      {post.tags && post.tags.length > 0 && post.tags.some(tag => tag?.slug) && (
        <div className="post-tags">
          {post.tags
            .filter(tag => tag && tag.slug && tag._id)
            .map(tag => (
              <Link
                key={tag._id}
                to={`/tags/${tag.slug}`}
                className="post-tag"
              >
                {tag.icon} {tag.label || tag.slug}
              </Link>
            ))}
        </div>
      )}

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
    </div>
  );
}));

FeedPost.displayName = 'FeedPost';

export default FeedPost;

