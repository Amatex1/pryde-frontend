import { memo } from 'react';

/**
 * GroupPostDropdown - Dropdown menu for group post actions
 * 
 * Actions available:
 * - Author: Edit, Delete
 * - Moderator/Owner: Delete, Lock/Unlock
 * - Non-author: Report
 */
const GroupPostDropdown = memo(function GroupPostDropdown({
  postId,
  isAuthor,
  canDelete,
  canModerate,
  isLocked,
  isDropdownOpen,
  authorId,
  onToggleDropdown,
  onEdit,
  onDelete,
  onLock,
  onUnlock,
  onReport,
  post, // Full post object needed for onEdit
}) {
  return (
    <div className="post-dropdown-container">
      <button
        className="btn-dropdown"
        onClick={(e) => {
          e.stopPropagation();
          onToggleDropdown(postId);
        }}
        title="More options"
        aria-label="Post options"
      >
        ⋮
      </button>
      {isDropdownOpen && (
        <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
          {/* Author actions */}
          {isAuthor && (
            <button
              className="dropdown-item"
              onClick={() => {
                onEdit(post);
                onToggleDropdown(null);
              }}
            >
              ✏️ Edit
            </button>
          )}
          
          {/* Delete - available to author and moderators */}
          {canDelete && (
            <button
              className="dropdown-item delete"
              onClick={() => {
                onDelete(postId);
                onToggleDropdown(null);
              }}
            >
              🗑️ Delete
            </button>
          )}
          
          {/* Lock/Unlock - available to moderators/owners only */}
          {canModerate && (
            isLocked ? (
              <button
                className="dropdown-item"
                onClick={() => {
                  onUnlock(postId);
                  onToggleDropdown(null);
                }}
              >
                🔓 Unlock Post
              </button>
            ) : (
              <button
                className="dropdown-item"
                onClick={() => {
                  onLock(postId);
                  onToggleDropdown(null);
                }}
              >
                🔒 Lock Post
              </button>
            )
          )}
          
          {/* Report - available to non-authors */}
          {!isAuthor && (
            <button
              className="dropdown-item report"
              onClick={() => {
                onReport(postId, authorId);
                onToggleDropdown(null);
              }}
            >
              🚩 Report
            </button>
          )}
        </div>
      )}
    </div>
  );
});

export default GroupPostDropdown;

