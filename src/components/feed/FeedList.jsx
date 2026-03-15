import { useRef, useMemo } from 'react';
import PostSkeleton from '../PostSkeleton';
import EmptyState from '../EmptyState';
import VirtualizedFeed from '../VirtualizedFeed';
import FeedListPostItem from './FeedListPostItem';

/**
 * FeedList — renders the scrollable post list with skeleton, empty, and loaded states.
 * Extracted from Feed.jsx (Phase 3 reorganisation). No logic changes.
 * 
 * CALM FEED: Supports activity tags and conversation headers
 * 
 * OPTIMIZATION: Uses VirtualizedFeed for performance when posts > 20
 */
export default function FeedList({
  // Data
  posts,
  blockedUsers,
  fetchingPosts,
  hasMore,
  feedHeader,
  postRefs,
  commentRefs,
  currentUser,

  // Per-post state
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

  // Handlers
  onLoadMore,
  onToggleDropdown,
  onPinPost,
  onEditPost,
  onDeletePost,
  onReportPost,
  onBookmark,
  onRepost,
  onReactionChange,
  onReactionCountClick,
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
  onToggleCommentBox,
  onOpenComments,
  onCommentChange,
  onCommentSubmit,
  onCommentGifSelect,
  onToggleGifPicker,
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
  getUserReactionEmoji,
  viewerRole,
  replyIsAnonymous,
  onReplyIsAnonymousChange,
}) {
  const listRef = useRef(null);
  
  // Filter blocked users and memoize
  // Safe array handling - return empty array if posts is undefined/null
  const filteredPosts = useMemo(() => 
    (posts || []).filter(post => !blockedUsers?.includes(post.author?._id)),
    [posts, blockedUsers]
  );
  
  // Virtualization disabled — react-window creates a nested scroll container
  // which conflicts with page scroll and causes overlapping/glitching.
  const useVirtualization = false;
  const useNewVirtualization = false;
  
  const feedPostProps = {
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
    onToggleDropdown,
    onPinPost,
    onEditPost,
    onDeletePost,
    onReportPost,
    onBookmark,
    onRepost,
    onReactionChange,
    onReactionCountClick,
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
    onToggleCommentBox,
    onOpenComments,
    onCommentChange,
    onCommentSubmit,
    onCommentGifSelect,
    onToggleGifPicker,
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
    getUserReactionEmoji,
    viewerRole,
    replyIsAnonymous,
    onReplyIsAnonymousChange,
  };

  // Render a single post item
  const renderPostItem = (post, postIndex, style, measureRef) => (
    <FeedListPostItem
      key={post._id}
      post={post}
      postIndex={postIndex}
      currentUser={currentUser}
      wrapperRef={measureRef}
      wrapperStyle={style}
      {...feedPostProps}
    />
  );

  const loadingIndicator = (
    <div className="load-more-container">
      <div className="loading-indicator">Loading more posts...</div>
    </div>
  );
  
  const endOfListIndicator = (
    <div className="end-of-feed">
      <p className="end-of-feed-primary">You're all caught up!</p>
      <p className="end-of-feed-secondary">Take a break, or check back later.</p>
    </div>
  );
  
  const emptyState = (
    <EmptyState
      type="feed"
      className="glossy"
      action={{
        label: 'Create Post',
        onClick: () => {
          const composer = document.querySelector('.feed-composer textarea, .composer-textarea');
          if (composer) composer.focus();
        }
      }}
    />
  );

  if (fetchingPosts && (posts || []).length === 0) {
    return (
      <div className="posts-list">
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </div>
    );
  }

  if ((posts || []).length === 0) {
    return emptyState;
  }

  if (useVirtualization) {
    return (
      <>
        {feedHeader && (
          <div className="feed-conversation-header">
            <span className="feed-conversation-header-icon">🌿</span>
            <span className="feed-conversation-header-text">{feedHeader}</span>
          </div>
        )}
        
        <VirtualizedFeed
          posts={filteredPosts}
          renderItem={renderPostItem}
          listRef={listRef}
          loading={fetchingPosts}
          hasMore={hasMore}
          onLoadMore={onLoadMore}
          loadingIndicator={loadingIndicator}
          endOfListIndicator={endOfListIndicator}
          emptyState={emptyState}
        />
      </>
    );
  }

  // Regular rendering for small lists
  return (
    <>
      <div className="posts-list">
        {feedHeader && (
          <div className="feed-conversation-header">
            <span className="feed-conversation-header-icon">🌿</span>
            <span className="feed-conversation-header-text">{feedHeader}</span>
          </div>
        )}
        
        {filteredPosts.map((post, postIndex) => {
          return (
            <FeedListPostItem
              key={post._id}
              post={post}
              postIndex={postIndex}
              currentUser={currentUser}
              postRef={(el) => {
                postRefs.current[post._id] = el;
              }}
              {...feedPostProps}
            />
          );
        })}
      </div>

      {fetchingPosts && (posts || []).length > 0 && (
        <div className="load-more-container">
          <div className="loading-indicator">Loading more posts...</div>
        </div>
      )}

      {!fetchingPosts && hasMore && (posts || []).length > 0 && (posts || []).length <= 20 && (
        <div className="load-more-container">
          <button
            className="btn-load-more glossy"
            onClick={onLoadMore}
            disabled={fetchingPosts}
          >
            Load more
          </button>
        </div>
      )}

      {!fetchingPosts && !hasMore && (posts || []).length > 0 && (
        <div className="end-of-feed">
          <p className="end-of-feed-primary">You're all caught up!</p>
          <p className="end-of-feed-secondary">Take a break, or check back later.</p>
        </div>
      )}
    </>
  );
}
