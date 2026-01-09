/**
 * SkeletonLoader - Reusable skeleton loading components
 * 
 * Prevents CLS by reserving space for async content
 */

import './SkeletonLoader.css';

/**
 * Generic skeleton box
 */
export function SkeletonBox({ width, height, borderRadius = '4px', className = '' }) {
  return (
    <div 
      className={`skeleton-box ${className}`}
      style={{ 
        width: width || '100%', 
        height: height || '20px',
        borderRadius 
      }}
    />
  );
}

/**
 * Skeleton for navbar notification bell
 */
export function SkeletonNotificationBell() {
  return (
    <div className="skeleton-notification-bell">
      <SkeletonBox width="40px" height="40px" borderRadius="50%" />
    </div>
  );
}

/**
 * Skeleton for navbar message button
 */
export function SkeletonMessageButton() {
  return (
    <div className="skeleton-message-button">
      <SkeletonBox width="100px" height="40px" borderRadius="8px" />
    </div>
  );
}

/**
 * Skeleton for navbar actions (messages + notifications + profile)
 */
export function SkeletonNavbarActions() {
  return (
    <div className="skeleton-navbar-actions">
      <SkeletonBox width="100px" height="40px" borderRadius="8px" />
      <SkeletonBox width="40px" height="40px" borderRadius="50%" />
      <SkeletonBox width="40px" height="40px" borderRadius="50%" />
    </div>
  );
}

/**
 * Skeleton for profile header
 */
export function SkeletonProfileHeader() {
  return (
    <div className="skeleton-profile-header">
      {/* Cover photo */}
      <SkeletonBox height="200px" borderRadius="12px 12px 0 0" />
      
      {/* Avatar */}
      <div className="skeleton-profile-avatar">
        <SkeletonBox width="120px" height="120px" borderRadius="50%" />
      </div>
      
      {/* Name and username */}
      <div className="skeleton-profile-info">
        <SkeletonBox width="200px" height="32px" borderRadius="8px" />
        <SkeletonBox width="150px" height="20px" borderRadius="6px" />
        <SkeletonBox width="100%" height="60px" borderRadius="8px" />
      </div>
    </div>
  );
}

/**
 * Skeleton for a single post
 */
export function SkeletonPost() {
  return (
    <div className="skeleton-post">
      {/* Post header */}
      <div className="skeleton-post-header">
        <SkeletonBox width="48px" height="48px" borderRadius="50%" />
        <div className="skeleton-post-author">
          <SkeletonBox width="150px" height="20px" borderRadius="6px" />
          <SkeletonBox width="100px" height="16px" borderRadius="4px" />
        </div>
      </div>
      
      {/* Post content */}
      <div className="skeleton-post-content">
        <SkeletonBox width="100%" height="16px" borderRadius="4px" />
        <SkeletonBox width="90%" height="16px" borderRadius="4px" />
        <SkeletonBox width="70%" height="16px" borderRadius="4px" />
      </div>
      
      {/* Post actions */}
      <div className="skeleton-post-actions">
        <SkeletonBox width="60px" height="32px" borderRadius="6px" />
        <SkeletonBox width="60px" height="32px" borderRadius="6px" />
        <SkeletonBox width="60px" height="32px" borderRadius="6px" />
      </div>
    </div>
  );
}

/**
 * Skeleton for feed (multiple posts)
 */
export function SkeletonFeed({ count = 3 }) {
  return (
    <div className="skeleton-feed">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonPost key={index} />
      ))}
    </div>
  );
}

/**
 * Skeleton for sidebar
 */
export function SkeletonSidebar() {
  return (
    <div className="skeleton-sidebar">
      <SkeletonBox width="100%" height="200px" borderRadius="12px" />
      <SkeletonBox width="100%" height="150px" borderRadius="12px" />
    </div>
  );
}

/**
 * Skeleton circle (for avatars, icons)
 */
export function SkeletonCircle({ size = '48px' }) {
  return <SkeletonBox width={size} height={size} borderRadius="50%" />;
}

/**
 * Skeleton text line
 */
export function SkeletonText({ width = '100%', height = '16px' }) {
  return <SkeletonBox width={width} height={height} borderRadius="4px" />;
}

export default SkeletonBox;

