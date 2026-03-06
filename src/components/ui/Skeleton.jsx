/**
 * Skeleton loading components for improved perceived performance
 */

import './Skeleton.css';

/**
 * Skeleton loader for post cards
 */
export function PostSkeleton() {
  return (
    <div className="post-skeleton">
      <div className="skeleton-header">
        <div className="skeleton-avatar"></div>
        <div className="skeleton-author">
          <div className="skeleton-line short"></div>
          <div className="skeleton-line tiny"></div>
        </div>
      </div>
      <div className="skeleton-content">
        <div className="skeleton-line"></div>
        <div className="skeleton-line medium"></div>
        <div className="skeleton-line short"></div>
      </div>
      <div className="skeleton-actions">
        <div className="skeleton-button"></div>
        <div className="skeleton-button"></div>
        <div className="skeleton-button"></div>
      </div>
    </div>
  );
}

/**
 * Skeleton loader for multiple posts
 */
export function FeedSkeleton({ count = 5 }) {
  return (
    <div className="feed-skeleton">
      {Array.from({ length: count }).map((_, index) => (
        <PostSkeleton key={index} />
      ))}
    </div>
  );
}

/**
 * Generic skeleton component
 */
export function Skeleton({ 
  width, 
  height, 
  borderRadius = '4px',
  className = '' 
}) {
  return (
    <div 
      className={`skeleton ${className}`}
      style={{ 
        width: width || '100%', 
        height: height || '20px',
        borderRadius
      }}
    />
  );
}

export default PostSkeleton;
