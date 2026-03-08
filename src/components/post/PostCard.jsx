import { memo, forwardRef } from 'react';
import PostHeader from '../PostHeader';
import PinnedPostBadge from '../PinnedPostBadge';
import OptimizedImage from '../OptimizedImage';
import FormattedText from '../FormattedText';
import FeedPostActions from '../feed/FeedPostActions';
import FeedPostContent from '../feed/FeedPostContent';
import { getImageUrl } from '../../utils/imageUrl';

/**
 * PostCard - Generic unified post component
 * 
 * Encapsulates the common post structure:
 * - PostHeader (author, timestamp, visibility)
 * - PostContent (text, media, polls)
 * - PostActions (reactions, comments, bookmarks)
 * 
 * This is a simplified wrapper. For full post functionality
 * (comments, editing, etc.), use FeedPost directly.
 * 
 * @param {Object} props
 * @param {Object} props.post - Post data object
 * @param {React.ReactNode} props.children - Optional children for extensibility
 * @param {string} props.className - Additional CSS classes
 */
const PostCard = memo(forwardRef(function PostCard({
  post,
  children,
  className = '',
  currentUser,
  isBookmarked = false,
  onReactionChange,
  onReactionCountClick,
  onToggleCommentBox,
  onBookmark,
  getUserReactionEmoji,
  ...rest
}, ref) {
  // Determine if this is a system post
  const isSystemPost = post.isSystemPost || post.author?.isSystemAccount;
  
  // Check if current user owns this post
  const isOwnPost = post.isOwnPost === true || (() => {
    if (!post.author || !currentUser) return false;
    const authorId = typeof post.author === 'object' ? String(post.author._id || '') : String(post.author);
    const userId = String(currentUser.id || currentUser._id || '');
    return authorId && userId && authorId === userId;
  })();

  return (
    <div
      ref={ref}
      id={`post-${post._id}`}
      className={`post-card glossy fade-in ${isSystemPost ? 'system-post' : ''} ${className}`}
      {...rest}
    >
      {/* Pinned Post Badge */}
      {post.isPinned && <PinnedPostBadge />}

      {/* Post Header */}
      <PostHeader
        author={post.author}
        createdAt={post.createdAt}
        visibility={post.visibility}
        edited={post.edited}
        isPinned={post.isPinned}
        isSystemAccount={isSystemPost}
        isAnonymous={post.isAnonymous}
        _staffAnonymousView={post._staffAnonymousView}
      />

      {/* Post Content */}
      <div className="post-cw-wrapper">
        <div className="post-cw-body">
          {post.content && (
            <div className="post-content">
              <FormattedText text={post.content} />
            </div>
          )}
          
          {/* Simple Media Display */}
          {post.media && post.media.length > 0 && (
            <div className="post-media-grid">
              {post.media.map((media, index) => (
                <div key={index} className="post-media-item">
                  {media.type === 'image' || media.type === 'gif' ? (
                    <OptimizedImage
                      src={getImageUrl(media.url)}
                      alt={`Media ${index + 1}`}
                      className="post-media-image"
                    />
                  ) : media.type === 'video' ? (
                    <video
                      src={getImageUrl(media.url)}
                      controls
                      className="post-media-video"
                    />
                  ) : null}
                </div>
              ))}
            </div>
          )}

          {/* Legacy images array */}
          {post.images && post.images.length > 0 && (
            <div className="post-media-grid">
              {post.images.map((img, index) => (
                <OptimizedImage
                  key={index}
                  src={getImageUrl(img)}
                  alt={`Image ${index + 1}`}
                  className="post-media-image"
                />
              ))}
            </div>
          )}
        </div>
      </div>

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

      {/* Children (for extensibility - e.g., comments) */}
      {children}
    </div>
  );
}));

PostCard.displayName = 'PostCard';

export default PostCard;

