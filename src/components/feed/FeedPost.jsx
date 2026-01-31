import { memo, forwardRef } from 'react';
import { Link } from 'react-router-dom';
import PostHeader from '../PostHeader';
import PinnedPostBadge from '../PinnedPostBadge';
import FeedPostContent from './FeedPostContent';
import FeedPostActions from './FeedPostActions';
import FeedPostComments from './FeedPostComments';
import FeedPostDropdown from './FeedPostDropdown';
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
        <FeedPostDropdown
          postId={post._id}
          isPinned={post.isPinned}
          isOwnPost={isOwnPost}
          isDropdownOpen={isDropdownOpen}
          authorId={post.author?._id}
          onToggleDropdown={onToggleDropdown}
          onPinPost={onPinPost}
          onEditPost={onEditPost}
          onDeletePost={onDeletePost}
          onReportPost={onReportPost}
          post={post}
        />
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
      <FeedPostActions
        post={post}
        currentUser={currentUser}
        isBookmarked={isBookmarked}
        onReactionChange={onReactionChange}
        onReactionCountClick={onReactionCountClick}
        onToggleCommentBox={onToggleCommentBox}
        onBookmark={onBookmark}
        getUserReactionEmoji={getUserReactionEmoji}
      />

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
      <FeedPostComments
        post={post}
        currentUser={currentUser}
        comments={comments}
        commentReplies={commentReplies}
        showReplies={showReplies}
        showCommentBox={showCommentBox}
        commentText={commentText}
        commentGif={commentGif}
        showGifPicker={showGifPicker}
        replyingToComment={replyingToComment}
        replyText={replyText}
        replyGif={replyGif}
        editingCommentId={editingCommentId}
        editCommentText={editCommentText}
        showReactionPicker={showReactionPicker}
        commentRefs={commentRefs}
        onEditComment={onEditComment}
        onSaveEditComment={onSaveEditComment}
        onCancelEditComment={onCancelEditComment}
        onDeleteComment={onDeleteComment}
        onCommentReaction={onCommentReaction}
        onToggleReplies={onToggleReplies}
        onReplyToComment={onReplyToComment}
        onSetShowReactionPicker={onSetShowReactionPicker}
        onSetReactionDetailsModal={onSetReactionDetailsModal}
        onSetReportModal={onSetReportModal}
        onReplyTextChange={onReplyTextChange}
        onReplyGifSelect={onReplyGifSelect}
        onSubmitReply={onSubmitReply}
        onCancelReply={onCancelReply}
        onCommentChange={onCommentChange}
        onCommentGifSelect={onCommentGifSelect}
        onCommentSubmit={onCommentSubmit}
        onToggleGifPicker={onToggleGifPicker}
        getUserReactionEmoji={getUserReactionEmoji}
      />
    </div>
  );
}));

FeedPost.displayName = 'FeedPost';

export default FeedPost;

