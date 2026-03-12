import { memo } from 'react';

/**
 * Search Results Skeleton - Premium shimmer loading
 * Matches Search page result card size/spacing
 */
const SearchSkeleton = memo(() => (
  <div className="search-skeleton-container">
    {/* 3 User result skeletons */}
    <div className="skeleton-section">
      <div className="skeleton-section-title">Users</div>
      {[1,2,3].map(i => (
        <div key={`user-${i}`} className="skeleton-user-card shimmer">
          <div className="skeleton-avatar"></div>
          <div className="skeleton-user-info">
            <div className="skeleton-line skeleton-line-long"></div>
            <div className="skeleton-line skeleton-line-short"></div>
          </div>
        </div>
      ))}
    </div>

    {/* 3 Post result skeletons */}
    <div className="skeleton-section">
      <div className="skeleton-section-title">Posts</div>
      {[1,2,3].map(i => (
        <div key={`post-${i}`} className="skeleton-post-card shimmer">
          <div className="skeleton-post-author"></div>
          <div className="skeleton-post-preview">
            <div className="skeleton-line skeleton-line-medium"></div>
            <div className="skeleton-line skeleton-line-short"></div>
          </div>
        </div>
      ))}
    </div>

    {/* 3 Group result skeletons */}
    <div className="skeleton-section">
      <div className="skeleton-section-title">Groups</div>
      {[1,2,3].map(i => (
        <div key={`group-${i}`} className="skeleton-group-card shimmer">
          <div className="skeleton-group-icon"></div>
          <div className="skeleton-group-info">
            <div className="skeleton-line skeleton-line-long"></div>
            <div className="skeleton-line skeleton-line-medium"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
));

SearchSkeleton.displayName = 'SearchSkeleton';

export default SearchSkeleton;

