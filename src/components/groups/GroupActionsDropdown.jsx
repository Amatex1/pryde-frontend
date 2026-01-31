import { memo } from 'react';

/**
 * GroupActionsDropdown - Dropdown menu for group management actions
 * 
 * Actions available (owner only):
 * - Edit Group Settings
 * - Delete Group
 */
const GroupActionsDropdown = memo(function GroupActionsDropdown({
  groupId,
  isDropdownOpen,
  onToggleDropdown,
  onEdit,
  onDelete,
}) {
  return (
    <div className="group-dropdown-container">
      <button
        className="btn-dropdown btn-group-dropdown"
        onClick={(e) => {
          e.stopPropagation();
          onToggleDropdown();
        }}
        title="Group options"
        aria-label="Group management options"
      >
        ⋮
      </button>
      {isDropdownOpen && (
        <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
          <button
            className="dropdown-item"
            onClick={() => {
              onEdit();
              onToggleDropdown();
            }}
          >
            ⚙️ Edit Settings
          </button>
          <button
            className="dropdown-item delete"
            onClick={() => {
              onDelete();
              onToggleDropdown();
            }}
          >
            🗑️ Delete Group
          </button>
        </div>
      )}
    </div>
  );
});

export default GroupActionsDropdown;

