import { memo, useEffect, useRef } from 'react';
import { MoreVertical, Pin, PinOff, Pencil, Trash2, Flag } from 'lucide-react';

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
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onToggleDropdown(postId);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen, postId, onToggleDropdown]);

  return (
    <div className="post-dropdown-container" ref={containerRef}>
      <button
        className="btn-dropdown"
        onClick={() => onToggleDropdown(postId)}
        aria-label="More options"
        data-tooltip="Options"
      >
        <MoreVertical size={18} strokeWidth={1.75} aria-hidden="true" />
      </button>
      {isDropdownOpen && (
        <div className="dropdown-menu">
          {isOwnPost ? (
            <>
              <button
                className="dropdown-item"
                onClick={() => onPinPost(postId, isPinned)}
              >
                {isPinned
                  ? <><PinOff size={14} strokeWidth={1.75} aria-hidden="true" /> Unpin</>
                  : <><Pin size={14} strokeWidth={1.75} aria-hidden="true" /> Pin to Profile</>
                }
              </button>
              <button
                className="dropdown-item"
                onClick={() => onEditPost(post)}
              >
                <Pencil size={14} strokeWidth={1.75} aria-hidden="true" /> Edit
              </button>
              <button
                className="dropdown-item delete"
                onClick={() => onDeletePost(postId)}
              >
                <Trash2 size={14} strokeWidth={1.75} aria-hidden="true" /> Delete
              </button>
            </>
          ) : (
            <button
              className="dropdown-item report"
              onClick={() => onReportPost(postId, authorId)}
            >
              <Flag size={14} strokeWidth={1.75} aria-hidden="true" /> Report
            </button>
          )}
        </div>
      )}
    </div>
  );
});

export default FeedPostDropdown;

