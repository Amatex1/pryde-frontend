import { memo } from 'react';

/**
 * FeedPostDropdown - Dropdown menu for post actions (pin, edit, delete, report)
 * 
 * This component is memoized for performance optimization.
 */
const FeedPostDropdown = memo(function FeedPostDropdown({
  postId,
  isPinned,
  isOwnPost,
  isDropdownOpen,
  authorId,
  onToggleDropdown,
  onPinPost,
  onEditPost,
  onDeletePost,
  onReportPost,
  post, // Full post object needed for onEditPost
}) {
  return (
    <div className="post-dropdown-container">
      <button
        className="btn-dropdown"
        onClick={() => onToggleDropdown(postId)}
        title="More options"
      >
        ⋮
      </button>
      {isDropdownOpen && (
        <div className="dropdown-menu">
          {isOwnPost ? (
            <>
              <button
                className="dropdown-item"
                onClick={() => onPinPost(postId, isPinned)}
              >
                📌 {isPinned ? 'Unpin' : 'Pin to Profile'}
              </button>
              <button
                className="dropdown-item"
                onClick={() => onEditPost(post)}
              >
                ✏️ Edit
              </button>
              <button
                className="dropdown-item delete"
                onClick={() => onDeletePost(postId)}
              >
                🗑️ Delete
              </button>
            </>
          ) : (
            <button
              className="dropdown-item report"
              onClick={() => onReportPost(postId, authorId)}
            >
              🚩 Report
            </button>
          )}
        </div>
      )}
    </div>
  );
});

export default FeedPostDropdown;

