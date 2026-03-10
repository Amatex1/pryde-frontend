import {
  X,
  Plus,
  Upload,
  Camera,
  BarChart2,
  AlertTriangle,
  VolumeX,
  FileText,
  EyeOff,
} from 'lucide-react';
import GifPicker from '../GifPicker';

export default function FeedComposerDesktopActions({
  isQuietMode,
  showAdvancedOptions,
  uploadingMedia,
  uploadProgress,
  selectedMedia,
  showPollCreator,
  showContentWarning,
  hideMetrics,
  isAnonymous,
  draftSaveStatus,
  showGifPicker,
  selectedPostGif,
  loading,
  postVisibility,
  onMediaSelect,
  onSetShowAdvancedOptions,
  onSetShowPollCreator,
  onSetShowContentWarning,
  onSetHideMetrics,
  onSetIsAnonymous,
  onSetPostVisibility,
  onSetShowDraftManager,
  onSetShowGifPicker,
  onSetSelectedPostGif,
}) {
  return (
    <>
      <div className="composer-actions">
        {isQuietMode && !showAdvancedOptions && (
          <button
            type="button"
            className="btn-more-options"
            onClick={() => onSetShowAdvancedOptions(true)}
          >
            <Plus size={14} strokeWidth={1.75} aria-hidden="true" /> More posting options
          </button>
        )}

        {(!isQuietMode || showAdvancedOptions) && (
          <>
            <label
              className="icon-btn media-btn tap-target pressable"
              data-tooltip={uploadingMedia ? `Uploading... ${uploadProgress}%` : 'Add Photos / Videos'}
              aria-label={uploadingMedia ? `Uploading... ${uploadProgress}%` : 'Add Photos / Videos'}
            >
              <input
                id="media-upload-input"
                name="mediaUpload"
                type="file"
                multiple
                accept="image/*,image/gif,video/*"
                onChange={onMediaSelect}
                disabled={uploadingMedia || selectedMedia.length >= 3}
                style={{ display: 'none' }}
              />
              {uploadingMedia ? (
                <>
                  <Upload size={20} strokeWidth={1.75} aria-hidden="true" />
                  <span className="composer-label"> Uploading... {uploadProgress}%</span>
                </>
              ) : (
                <>
                  <Camera size={20} strokeWidth={1.75} aria-hidden="true" />
                  <span className="composer-label"> Add Photos/Videos</span>
                </>
              )}
            </label>

            <button
              type="button"
              className={`icon-btn poll-btn tap-target pressable${showPollCreator ? ' active' : ''}`}
              onClick={() => onSetShowPollCreator(!showPollCreator)}
              aria-label="Add poll"
              data-tooltip="Poll"
            >
              <BarChart2 size={20} strokeWidth={1.75} aria-hidden="true" />
              <span className="composer-label"> Poll</span>
            </button>

            <button
              type="button"
              className={`icon-btn cw-btn tap-target pressable${showContentWarning ? ' active' : ''}`}
              onClick={() => onSetShowContentWarning(!showContentWarning)}
              aria-label="Add content warning"
              data-tooltip="Content Warning"
            >
              <AlertTriangle size={20} strokeWidth={1.75} aria-hidden="true" />
              <span className="composer-label"> Content Warning</span>
            </button>

            <label
              className="hide-metrics-checkbox"
              data-tooltip="Hide Metrics"
              aria-label="Hide likes, comments, and shares count"
            >
              <input
                id="hide-metrics-checkbox"
                name="hideMetrics"
                type="checkbox"
                checked={hideMetrics}
                onChange={(e) => onSetHideMetrics(e.target.checked)}
              />
              <span>
                <VolumeX size={16} strokeWidth={1.75} aria-hidden="true" />
                <span className="composer-label"> Hide Metrics</span>
              </span>
            </label>

            {onSetIsAnonymous && (
              <label
                className="hide-metrics-checkbox"
                data-tooltip="Post Anonymously"
                aria-label="Post anonymously — your identity will be hidden from other users"
              >
                <input
                  id="anonymous-post-checkbox"
                  name="isAnonymous"
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => onSetIsAnonymous(e.target.checked)}
                />
                <span>
                  <EyeOff size={16} strokeWidth={1.75} aria-hidden="true" />
                  <span className="composer-label"> Anonymous</span>
                </span>
              </label>
            )}

            {isAnonymous && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  color: 'var(--color-primary)',
                  background: 'var(--color-primary-soft)',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontWeight: 500,
                  marginLeft: '4px',
                }}
              >
                🔒 Visible to moderators only
              </span>
            )}
          </>
        )}

        <select
          id="post-privacy-selector"
          name="postPrivacy"
          value={postVisibility}
          onChange={(e) => onSetPostVisibility(e.target.value)}
          className="privacy-selector"
          aria-label="Select post privacy"
        >
          <option value="public">Public</option>
          <option value="followers">Connections</option>
          <option value="private">Private</option>
        </select>

        {draftSaveStatus && (
          <span className="draft-save-status">
            {draftSaveStatus === 'saving' ? 'Saving draft...' : 'Draft saved'}
          </span>
        )}

        <button
          type="button"
          className="icon-btn draft-btn tap-target pressable"
          onClick={() => onSetShowDraftManager(true)}
          aria-label="View saved drafts"
          data-tooltip="Drafts"
        >
          <FileText size={20} strokeWidth={1.75} aria-hidden="true" />
          <span className="composer-label"> Drafts</span>
        </button>

        <button
          type="button"
          className="icon-btn gif-btn tap-target pressable"
          onClick={() => onSetShowGifPicker(showGifPicker === 'main-post' ? null : 'main-post')}
          disabled={selectedPostGif !== null}
          title="Add GIF"
        >
          GIF
        </button>

        <button
          type="submit"
          disabled={loading || uploadingMedia}
          className="btn-post composer-submit tap-target pressable"
        >
          {loading ? 'Publishing...' : 'Publish'}
        </button>
      </div>

      {selectedPostGif && (
        <div className="post-gif-preview">
          <img src={selectedPostGif} alt="Selected GIF" />
          <button
            type="button"
            className="btn-remove-gif"
            onClick={() => onSetSelectedPostGif(null)}
            aria-label="Remove GIF"
            title="Remove GIF"
          >
            <X size={14} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      )}

      {showGifPicker === 'main-post' && (
        <GifPicker
          onGifSelect={(gifUrl) => {
            onSetSelectedPostGif(gifUrl);
            onSetShowGifPicker(null);
          }}
          onClose={() => onSetShowGifPicker(null)}
        />
      )}
    </>
  );
}