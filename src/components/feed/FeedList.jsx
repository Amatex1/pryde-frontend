import PostSkeleton from '../PostSkeleton';
import FeedPost from './FeedPost';
import { quietCopy } from '../../config/uiCopy';

/**
 * FeedList — renders the scrollable post list with skeleton, empty, and loaded states.
 * Extracted from Feed.jsx (Phase 3 reorganisation). No logic changes.
 */
export default function FeedList({
  // Data
  posts,
  blockedUsers,
  fetchingPosts,
  hasMore,
  quietMode,
  postRefs,
  commentRefs,
  currentUser,

  // Per-post state (passed through to FeedPost)
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
}) {
  return (
    <>
      <div className="posts-list">
        {/* Only show skeletons on initial load (no posts yet), not during infinite scroll */}
        {fetchingPosts && posts.length === 0 ? (
          <>
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </>
        ) : posts.length === 0 ? (
          <div className="empty-state glossy">
            <p className="empty-state-primary">
              {quietMode ? quietCopy.emptyFeed : "There's nothing new right now — and that's okay."}
            </p>
            <p className="empty-state-secondary">When people share, you'll see it here.</p>
            <p className="empty-state-tertiary">Pryde moves at a human pace.</p>
          </div>
        ) : (
          posts
            .filter(post => !blockedUsers.includes(post.author?._id))
            .map((post, postIndex) => {
              const isFirstPost = postIndex === 0;
              const shouldEagerLoad = postIndex < 3;

              return (
                <FeedPost
                  key={post._id}
                  ref={(el) => postRefs.current[post._id] = el}
                  post={post}
                  postIndex={postIndex}
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
              );
            })
        )}
      </div>

      {/* Loading indicator for infinite scroll */}
      {fetchingPosts && posts.length > 0 && (
        <div className="load-more-container">
          <div className="loading-indicator">Loading more posts...</div>
        </div>
      )}

      {/* Load More Button - only show when not currently fetching */}
      {!fetchingPosts && hasMore && posts.length > 0 && (
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

      {/* End of Feed Message */}
      {!fetchingPosts && !hasMore && posts.length > 0 && (
        <div className="end-of-feed">
          <p className="end-of-feed-primary">🎉 You're all caught up!</p>
          <p className="end-of-feed-secondary">Take a break, or check back later.</p>
        </div>
      )}
    </>
  );
}
