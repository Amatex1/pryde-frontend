/**
 * VirtualizedFeedList - High-performance virtualized feed using react-window
 * 
 * Renders only visible posts, dramatically reducing DOM nodes for large feeds.
 * Uses VariableSizeList for dynamic height posts.
 * 
 * Features:
 * - Dynamic height measurement via useDynamicRowHeight hook
 * - Infinite scroll integration
 * - Maintains compatibility with all FeedPost props
 */

import { useRef, useCallback, useEffect, useState, memo, forwardRef } from 'react';
import { List, useDynamicRowHeight } from 'react-window';
import FeedPost from './FeedPost';
import PostSkeleton from '../PostSkeleton';
import EmptyState from '../EmptyState';
import './VirtualizedFeed.css';

// Default estimated height for posts (text + media + comments)
const DEFAULT_POST_HEIGHT = 400;
// Overscan to render extra items above/below viewport for smooth scrolling
const OVERSCAN_COUNT = 3;
// Threshold from bottom to trigger load more
const LOAD_MORE_THRESHOLD = 5;

/**
 * VirtualizedFeedList - Virtualized list for feed posts
 * 
 * @param {Object} props
 * @param {Array} props.posts - Array of post objects
 * @param {Function} props.renderItem - Custom render function (optional)
 * @param {Function} props.onLoadMore - Callback when near bottom
 * @param {boolean} props.hasMore - Whether more posts can be loaded
 * @param {boolean} props.loading - Whether currently loading
 * @param {number} props.height - Fixed height (optional)
 * @param {string|number} props.width - Width of the list
 * @param {Object} props.listRef - Ref to access the list
 * @param {React.ReactNode} props.emptyState - Empty state component
 * @param {React.ReactNode} props.loadingIndicator - Loading indicator
 * @param {React.ReactNode} props.endOfListIndicator - End of list indicator
 * 
 * All FeedPost props are passed through
 */
const VirtualizedFeedList = memo(forwardRef(function VirtualizedFeedList({
  posts = [],
  renderItem,
  onLoadMore,
  hasMore = true,
  loading = false,
  height,
  width = '100%',
  listRef: externalListRef,
  emptyState,
  loadingIndicator,
  endOfListIndicator,
  
  // FeedPost props (passed through)
  blockedUsers,
  currentUser,
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
  postRefs,
  onToggleDropdown,
  onPinPost,
  onEditPost,
  onDeletePost,
  onReportPost,
  onBookmark,
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
  
  // Other props
  ...rest
}, ref) {
  const internalListRef = useRef(null);
  const listRef = externalListRef || internalListRef;
  const containerRef = useRef(null);

  // Use the useDynamicRowHeight hook for dynamic sizing
  const { getRowHeight, setRowHeight } = useDynamicRowHeight({
    defaultRowHeight: DEFAULT_POST_HEIGHT,
    key: posts?.length || 0,
  });
  
  // Container height state
  const [containerHeight, setContainerHeight] = useState(height || 600);
  
  // Auto-calculate container height
  useEffect(() => {
    if (height) {
      setContainerHeight(height);
      return;
    }
    
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const viewportHeight = document.documentElement.clientHeight;
        const calculatedHeight = Math.max(viewportHeight - rect.top - 20, 400);
        setContainerHeight(calculatedHeight);
      }
    };
    
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [height]);
  
  // Safe array handling
  const postsLength = posts?.length || 0;
  
  // Calculate total item count including loading/end indicators
  const itemCount = postsLength + (loading || (!hasMore && endOfListIndicator) ? 1 : 0);
  
  // Handle scroll to detect when to load more
  const handleItemsRendered = useCallback(({ overscanStopIndex, visibleStopIndex }) => {
    // Trigger load more when near bottom
    if (onLoadMore && !loading && hasMore) {
      if (visibleStopIndex >= postsLength - LOAD_MORE_THRESHOLD || 
          overscanStopIndex >= postsLength - 1) {
        onLoadMore();
      }
    }
  }, [onLoadMore, loading, hasMore, postsLength]);
  
  // Default render function for FeedPost
  const defaultRenderItem = useCallback((post, index, style, measureRef) => {
    const isFirstPost = index === 0;
    const shouldEagerLoad = index < 3;
    
    return (
      <div ref={measureRef} style={style} className="virtualized-post-wrapper">
        <FeedPost
          post={post}
          postIndex={index}
          currentUser={currentUser}
          isFirstPost={isFirstPost}
          shouldEagerLoad={shouldEagerLoad}
          openDropdownId={openDropdownId}
          editingPostId={editingPostId}
          editPostText={editPostText}
          editPostVisibility={editPostVisibility}
          editPostMedia={editPostMedia}
          editPostTextareaRef={editPostTextareaRef}
          expandedPosts={expandedPosts}
          revealedPosts={revealedPosts}
          autoHideContentWarnings={autoHideContentWarnings}
          bookmarkedPosts={bookmarkedPosts}
          postComments={postComments}
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
          onToggleDropdown={onToggleDropdown}
          onPinPost={onPinPost}
          onEditPost={onEditPost}
          onDeletePost={onDeletePost}
          onReportPost={onReportPost}
          onBookmark={onBookmark}
          onReactionChange={onReactionChange}
          onReactionCountClick={onReactionCountClick}
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
          onToggleCommentBox={onToggleCommentBox}
          onCommentChange={onCommentChange}
          onCommentSubmit={onCommentSubmit}
          onCommentGifSelect={onCommentGifSelect}
          onToggleGifPicker={onToggleGifPicker}
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
          getUserReactionEmoji={getUserReactionEmoji}
          viewerRole={viewerRole}
          replyIsAnonymous={replyIsAnonymous}
          onReplyIsAnonymousChange={onReplyIsAnonymousChange}
        />
      </div>
    );
  }, [
    currentUser, openDropdownId, editingPostId, editPostText, editPostVisibility,
    editPostMedia, editPostTextareaRef, expandedPosts, revealedPosts,
    autoHideContentWarnings, bookmarkedPosts, postComments, commentReplies,
    showReplies, showCommentBox, commentText, commentGif, showGifPicker,
    replyingToComment, replyText, replyGif, editingCommentId, editCommentText,
    showReactionPicker, commentRefs, onToggleDropdown, onPinPost, onEditPost,
    onDeletePost, onReportPost, onBookmark, onReactionChange, onReactionCountClick,
    onEditPostTextChange, onEditPostVisibilityChange, onRemoveEditMedia,
    onSaveEditPost, onCancelEditPost, onEditPostKeyDown, onExpandPost,
    onRevealPost, onPhotoClick, onPollVote, onToggleCommentBox, onCommentChange,
    onCommentSubmit, onCommentGifSelect, onToggleGifPicker, onEditComment,
    onSaveEditComment, onCancelEditComment, onDeleteComment, onCommentReaction,
    onToggleReplies, onReplyToComment, onSetShowReactionPicker,
    onSetReactionDetailsModal, onSetReportModal, onReplyTextChange,
    onReplyGifSelect, onSubmitReply, onCancelReply, getUserReactionEmoji,
    viewerRole, replyIsAnonymous, onReplyIsAnonymousChange
  ]);
  
  // Use custom render or default
  const itemRenderer = renderItem || defaultRenderItem;
  
  // Row component for react-window
  const RowComponent = useCallback(({ index, style }) => {
    // Handle loading or end indicators
    if (index >= postsLength) {
      if (loading && loadingIndicator) return <div style={style}>{loadingIndicator}</div>;
      if (!hasMore && endOfListIndicator) return <div style={style}>{endOfListIndicator}</div>;
      return null;
    }
    
    const post = posts[index];
    return itemRenderer(post, index, style);
  }, [posts, postsLength, loading, loadingIndicator, hasMore, endOfListIndicator, itemRenderer]);
  
  // Handle empty state
  if (!posts || postsLength === 0) {
    return emptyState || (
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
  }
  
  return (
    <div ref={containerRef} className="virtualized-feed-list-container">
      <List
        ref={listRef}
        style={{ height: containerHeight, width }}
        rowCount={itemCount}
        rowHeight={getRowHeight}
        rowComponent={RowComponent}
        rowProps={{}}
        onRowsRendered={handleItemsRendered}
        overscanCount={OVERSCAN_COUNT}
        className="virtualized-feed-list"
        {...rest}
      />
    </div>
  );
}));

VirtualizedFeedList.displayName = 'VirtualizedFeedList';

export default VirtualizedFeedList;

