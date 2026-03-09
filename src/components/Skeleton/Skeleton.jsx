/**
 * Skeleton Loaders
 * Loading placeholders that improve perceived performance
 */

import React from 'react';
import './Skeleton.css';

export function SkeletonLine({ width = '100%', height = '16px' }) {
  return (
    <div 
      className="skeleton-line" 
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCircle({ size = '40px' }) {
  return (
    <div 
      className="skeleton-circle" 
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}

export function SkeletonRect({ width = '100%', height = '200px' }) {
  return (
    <div 
      className="skeleton-rect" 
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export function SkeletonAvatar({ size = '40px' }) {
  return (
    <div className="skeleton-avatar" aria-hidden="true">
      <SkeletonCircle size={size} />
      <SkeletonLine width="60px" height="12px" />
    </div>
  );
}

export function SkeletonPost() {
  return (
    <div className="skeleton-post" aria-hidden="true">
      <div className="skeleton-post-header">
        <SkeletonCircle size="48px" />
        <div className="skeleton-post-meta">
          <SkeletonLine width="120px" height="14px" />
          <SkeletonLine width="80px" height="12px" />
        </div>
      <div className="skeleton-post-content">
        <SkeletonLine width="100%" />
        <SkeletonLine width="90%" />
        <SkeletonLine width="60%" />
      </div>
      <div className="skeleton-post-actions">
        <SkeletonLine width="60px" height="24px" />
        <SkeletonLine width="60px" height="24px" />
        <SkeletonLine width="60px" height="24px" />
      </div>
  );
}

export function SkeletonCard({ hasImage = false }) {
  return (
    <div className="skeleton-card" aria-hidden="true">
      {hasImage && <SkeletonRect height="150px" />}
      <div className="skeleton-card-content">
        <SkeletonLine width="80%" height="18px" />
        <SkeletonLine width="100%" />
        <SkeletonLine width="70%" />
      </div>
  );
}

export function SkeletonList({ count = 5, item: ItemComponent = SkeletonLine }) {
  const items = Array.from({ length: count }, (_, i) => i);
  return (
    <div className="skeleton-list" aria-label="Loading...">
      {items.map((i) => (
        <div key={i} className="skeleton-list-item">
          <ItemComponent />
        </div>
      ))}
    </div>
  );
}

export function SkeletonFeed({ count = 3 }) {
  const items = Array.from({ length: count }, (_, i) => i);
  return (
    <div className="skeleton-feed" aria-label="Loading feed...">
      {items.map((i) => (
        <SkeletonPost key={i} />
      ))}
    </div>
  );
}

export function SkeletonUserCard() {
  return (
    <div className="skeleton-user-card" aria-hidden="true">
      <SkeletonCircle size="64px" />
      <SkeletonLine width="100px" height="16px" />
      <SkeletonLine width="80px" height="14px" />
    </div>
  );
}

export function useSkeleton(isLoading, data) {
  return {
    isLoading,
    showSkeleton: isLoading && !data,
    data
  };
}

export default {
  SkeletonLine,
  SkeletonCircle,
  SkeletonRect,
  SkeletonAvatar,
  SkeletonPost,
  SkeletonCard,
  SkeletonList,
  SkeletonFeed,
  SkeletonUserCard,
  useSkeleton
};
