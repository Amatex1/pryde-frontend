/**
 * FeedStream - Renders the post list
 * 
 * RESPONSIBILITIES:
 * - Render posts from props
 * - Handle post-level interactions (delegated to parent)
 * - Show loading, empty, and error states
 * 
 * RULES:
 * - NO layout logic (widths, grids, media queries)
 * - NO data fetching (receives data via props)
 * - Layout-agnostic: renders the same on all platforms
 * - Interaction differences (tap vs hover) handled by atomic components
 */

import { Link } from 'react-router-dom';
import { forwardRef } from 'react';
import PostSkeleton from '../../components/PostSkeleton';
import OptimizedImage from '../../components/OptimizedImage';
import FormattedText from '../../components/FormattedText';
import ReactionButton from '../../components/ReactionButton';
import Poll from '../../components/Poll';
import PinnedPostBadge from '../../components/PinnedPostBadge';
import CommentThread from '../../components/CommentThread';
import { getImageUrl } from '../../utils/imageUrl';
import { quietCopy } from '../../config/uiCopy';
import './FeedStream.css';

const FeedStream = forwardRef(function FeedStream({
  // Data
  posts = [],
  blockedUsers = [],
  currentUser,
  bookmarkedPosts = [],
  postComments = {},
  commentReplies = {},
  
  // UI State
  loading = false,
  quietMode = false,
  showCommentBox = {},
  commentText = {},
  editingPostId,
  editPostText,
  openDropdownId,
  revealedPosts = {},
  
  // Handlers
  onLike,
  onReaction,
  onComment,
  onBookmark,
  onDelete,
  onEdit,
  onShare,
  onReport,
  onToggleCommentBox,
  onCommentTextChange,
  onCommentSubmit,
  onToggleDropdown,
  onRevealPost,
  onImageClick,
  getUserReactionEmoji,
  setReactionDetailsModal,
  
  // Refs
  postRefs,
  commentRefs,
}, ref) {
  // Filter out blocked users
  const visiblePosts = posts.filter(post => !blockedUsers.includes(post.author?._id));

  if (loading) {
    return (
      <div className="feed-stream-content">
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </div>
    );
  }

  if (visiblePosts.length === 0) {
    return (
      <div className="feed-stream-content">
        <div className="empty-state glossy">
          <p className="empty-state-primary">
            {quietMode ? quietCopy.emptyFeed : "There's nothing new right now — and that's okay."}
          </p>
          <p className="empty-state-secondary">When people share, you'll see it here.</p>
          <p className="empty-state-tertiary">Pryde moves at a human pace.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="feed-stream-content" ref={ref}>
      {visiblePosts.map((post) => {
        const isLiked = post.hasLiked || false;
        const isBookmarked = bookmarkedPosts.includes(post._id);
        const isRevealed = revealedPosts[post._id];
        const hasContentWarning = post.contentWarning && !isRevealed;

        return (
          <article
            key={post._id}
            id={`post-${post._id}`}
            className="post-card glossy fade-in"
            ref={(el) => postRefs && (postRefs.current[post._id] = el)}
          >
            {/* Post Header */}
            <div className="post-header">
              {post.isPinned && <PinnedPostBadge />}
              
              <div className="post-author">
                <Link
                  to={`/profile/${post.author?.username}`}
                  className="author-avatar"
                >
                  {post.author?.profilePhoto ? (
                    <OptimizedImage
                      src={getImageUrl(post.author.profilePhoto)}
                      alt={post.author.username}
                      className="avatar-image"
                    />
                  ) : (
                    <span>
                      {post.author?.displayName?.charAt(0).toUpperCase() || 
                       post.author?.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </Link>
                {/* Single-line post header matching comment style */}
                <div className="post-author-meta">
                  <Link to={`/profile/${post.author?.username}`} className="post-author-name">
                    {post.author?.displayName || post.author?.username || 'User'}
                  </Link>
                  {post.author?.isVerified && (
                    <span className="post-author-badge verified-badge" title="Verified">✓</span>
                  )}
                  {post.author?.pronouns && (
                    <span className="post-author-pronouns">({post.author.pronouns})</span>
                  )}
                  <span className="post-timestamp">
                    {new Date(post.createdAt).toLocaleString()}
                  </span>
                  {post.edited && (
                    <span className="post-author-edited">(edited)</span>
                  )}
                </div>
              </div>

              {/* Post Actions Dropdown - to be continued in next chunk */}
            </div>

            {/* Post Content - simplified for initial implementation */}
            {hasContentWarning ? (
              <div className="content-warning-overlay">
                <span className="cw-label">Content Warning: {post.contentWarning}</span>
                <button onClick={() => onRevealPost?.(post._id)} className="btn-reveal">
                  Show content
                </button>
              </div>
            ) : (
              <>
                {post.content && (
                  <div className="post-content">
                    <FormattedText text={post.content} />
                  </div>
                )}
              </>
            )}
          </article>
        );
      })}
    </div>
  );
});

export default FeedStream;

