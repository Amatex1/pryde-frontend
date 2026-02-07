import './PhotoEditSaveBar.css';

/**
 * PhotoEditSaveBar - Unified floating save bar for photo editing
 * 
 * Features:
 * - Fixed position at bottom of viewport
 * - Cancel + Save buttons
 * - Helper text
 * - Save disabled until changes detected
 * - Smooth animations (respects prefers-reduced-motion)
 * 
 * @param {Object} props
 * @param {boolean} props.hasChanges - Whether changes have been made
 * @param {Function} props.onSave - Save handler
 * @param {Function} props.onCancel - Cancel handler
 * @param {boolean} props.isSaving - Whether save is in progress
 */
function PhotoEditSaveBar({ hasChanges, onSave, onCancel, isSaving = false }) {
  return (
    <div className="photo-edit-save-bar" role="toolbar" aria-label="Photo editing controls">
      <div className="save-bar-content">
        <p className="save-bar-helper">
          Changes won't apply until you save
        </p>
        <div className="save-bar-actions">
          <button
            type="button"
            className="btn-cancel-edit"
            onClick={onCancel}
            disabled={isSaving}
            aria-label="Cancel photo editing"
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-save-edit"
            onClick={onSave}
            disabled={!hasChanges || isSaving}
            aria-label="Save photo changes"
          >
            {isSaving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PhotoEditSaveBar;
