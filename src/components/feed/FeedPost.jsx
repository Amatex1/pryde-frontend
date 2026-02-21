import { memo, forwardRef } from 'react';
import { Link } from 'react-router-dom';
import PostHeader from '../PostHeader';
import PinnedPostBadge from '../PinnedPostBadge';
import FeedPostContent from './FeedPostContent';
import FeedPostActions from './FeedPostActions';
import FeedPostDropdown from './FeedPostDropdown';
import CommentProvider from '../../comments/CommentProvider';
import CommentList from '../../comments/CommentList';
import { getImageUrl } from '../../utils/imageUrl';
import { getDisplayName } from '../../utils/getDisplayName';

/**
 * FeedPost — a single post card in the feed.
 *
 * Phase 3: the comment section is now rendered via the modular
 * /src/comments/ components (CommentProvider + CommentList) which pull
 * all comment state directly from CommentContext and CommentScopeContext.
 * This removes ~34 comment-related props that were previously drilled from
 * FeedContent → FeedPost → FeedPostComments → CommentThread.
 *
 * Remaining comment-related props (4):
 *   onToggleCommentBox     — FeedPostActions' comment button handler
 *   onToggleGifPicker      — forwarded to per-post CommentProvider
 *   onSetReactionDetailsModal — forwarded to per-post CommentProvider
 *   onSetReportModal          — forwarded to per-post CommentProvider
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

  // Handlers — post actions
  onToggleDropdown,
  onPinPost,
  onEditPost,
  onDeletePost,
  onReportPost,
  onBookmark,
  onReactionChange,
  onReactionCountClick,

  // Handlers — post editing
  onEditPostTextChange,
  onEditPostVisibilityChange,
  onRemoveEditMedia,
  onSaveEditPost,
  onCancelEditPost,
  onEditPostKeyDown,

  // Handlers — content
  onExpandPost,
  onRevealPost,
  onPhotoClick,
  onPollVote,

  // Handler — comment box toggle (used by FeedPostActions)
  onToggleCommentBox,

  // Handlers forwarded to per-post CommentProvider
  onToggleGifPicker,
  onSetReactionDetailsModal,
  onSetReportModal,

  // Utility — post-level reaction emoji lookup (used by FeedPostActions)
  getUserReactionEmoji,
}, ref) {
  const isSystemPost = post.isSystemPost || post.author?.isSystemAccount;
  const isOwnPost = post.author?._id === currentUser?.id || post.author?._id === currentUser?._id;
  const isBookmarked = bookmarkedPosts.includes(post._id);
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

      {/* Comments Section — modular, context-driven */}
      <CommentProvider
        postId={post._id}
        onToggleGifPicker={onToggleGifPicker}
        setReactionDetailsModal={onSetReactionDetailsModal}
        setReportModal={onSetReportModal}
      >
        <CommentList />
      </CommentProvider>
    </div>
  );
}));

FeedPost.displayName = 'FeedPost';

export default FeedPost;
