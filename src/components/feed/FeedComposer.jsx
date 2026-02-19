import { memo } from 'react';
import GifPicker from '../GifPicker';
import PollCreator from '../PollCreator';
import DraftManager from '../DraftManager';
import { getImageUrl } from '../../utils/imageUrl';

/**
 * FeedComposer - Post creation component for both desktop and mobile
 * Extracted from Feed.jsx as part of Phase 2A.6
 * 
 * Renders:
 * - Desktop: Full composer form with all options
 * - Mobile: FAB button + bottom sheet composer
 * - Draft Manager modal
 */
const FeedComposer = memo(function FeedComposer({
  // Display props
  isMobile,
  isQuietMode,
  
  // State
  newPost,
  selectedMedia,
  uploadingMedia,
  uploadProgress,
  postVisibility,
  contentWarning,
  showContentWarning,
  selectedPostGif,
  showGifPicker,
  poll,
  showPollCreator,
  hideMetrics,
  showDraftManager,
  draftSaveStatus,
  showMobileComposer,
  isTyping,
  showAdvancedOptions,
  loading,
  
  // Handlers
  onPostSubmit,
  onPostTextChange,
  onMediaSelect,
  onRemoveMedia,
  onPaste,
  onSetIsTyping,
  onSetPostVisibility,
  onSetContentWarning,
  onSetShowContentWarning,
  onSetSelectedPostGif,
  onSetShowGifPicker,
  onSetPoll,
  onSetShowPollCreator,
  onSetHideMetrics,
  onSetShowDraftManager,
  onRestoreDraft,
  onSetShowMobileComposer,
  onSetShowAdvancedOptions,
}) {
  // Shared content warning options
  const contentWarningOptions = [
    { value: '', label: 'Select a content warning...' },
    { value: 'Mental Health', label: 'Mental Health' },
    { value: 'Violence', label: 'Violence' },
    { value: 'Sexual Content', label: 'Sexual Content' },
    { value: 'Substance Use', label: 'Substance Use' },
    { value: 'Self-Harm', label: 'Self-Harm' },
    { value: 'Death/Grief', label: 'Death/Grief' },
    { value: 'Eating Disorders', label: 'Eating Disorders' },
    { value: 'Abuse', label: 'Abuse' },
    { value: 'Discrimination', label: 'Discrimination' },
    { value: 'Medical Content', label: 'Medical Content' },
    { value: 'Flashing Lights', label: 'Flashing Lights' },
    { value: 'Other', label: 'Other' },
  ];

  // Shared media preview component
  const renderMediaPreview = () => {
    if (selectedMedia.length === 0) return null;
    return (
      <div className="media-preview">
        {selectedMedia.map((media, index) => (
          <div key={index} className="media-preview-item">
            {media.type === 'video' ? (
              <video src={getImageUrl(media.url)} controls />
            ) : (
              <img src={getImageUrl(media.url)} alt={`Upload ${index + 1}`} />
            )}
            <button
              type="button"
              className="remove-media"
              onClick={() => onRemoveMedia(index)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    );
  };

  // Shared content warning selector
  const renderContentWarning = (idPrefix = '') => {
    if (!showContentWarning) return null;
    return (
      <div className="content-warning-input">
        <select
          id={`${idPrefix}content-warning-select`}
          name={`${idPrefix}contentWarning`}
          value={contentWarning}
          onChange={(e) => onSetContentWarning(e.target.value)}
          className={`cw-input ${!isMobile ? 'glossy' : ''}`}
        >
          {contentWarningOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    );
  };

  // Shared poll creator
  const renderPollCreator = () => {
    if (!showPollCreator) return null;
    return (
      <PollCreator
        onPollChange={onSetPoll}
        onCancel={() => {
          onSetShowPollCreator(false);
          onSetPoll(null);
        }}
        initialPoll={poll}
      />
    );
  };

  // Handle textarea auto-resize + text change
  const handleTextareaChange = (e, minHeight = null) => {
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = minHeight 
      ? Math.max(el.scrollHeight, minHeight) + 'px'
      : el.scrollHeight + 'px';
    onPostTextChange(el.value);
  };

  // ========== DESKTOP COMPOSER ==========
  const renderDesktopComposer = () => (
    <div className="create-post glossy fade-in">
      <h2 className="section-title">Share something</h2>
      <form onSubmit={onPostSubmit}>
        <textarea
          id="new-post-input"
          name="newPost"
          value={newPost}
          onChange={(e) => handleTextareaChange(e, 120)}
          onPaste={onPaste}
          onFocus={() => onSetIsTyping(true)}
          onBlur={() => onSetIsTyping(false)}
          placeholder={showPollCreator ? "Ask a question..." : "Share something, if you feel like it."}
          className="post-input glossy"
          rows="4"
          style={{ overflow: 'hidden', resize: 'none', minHeight: '120px' }}
        />

        {renderMediaPreview()}
        {renderContentWarning()}
        {renderPollCreator()}

        <div className="post-actions-bar">
          {/* QUIET MODE: Show "More Options" button to reveal advanced options */}
          {isQuietMode && !showAdvancedOptions && (
            <button
              type="button"
              className="btn-more-options"
              onClick={() => onSetShowAdvancedOptions(true)}
            >
              ➕ More posting options
            </button>
          )}

          {/* Advanced options - hidden by default in quiet mode */}
          {(!isQuietMode || showAdvancedOptions) && (
            <>
              <label className="btn-media-upload">
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
                {uploadingMedia ? `⏳ Uploading... ${uploadProgress}%` : '📷 Add Photos/Videos'}
              </label>

              <button
                type="button"
                className={`btn-poll ${showPollCreator ? 'active' : ''}`}
                onClick={() => onSetShowPollCreator(!showPollCreator)}
                title="Add poll"
              >
                📊 Poll
              </button>

              <button
                type="button"
                className={`btn-content-warning ${showContentWarning ? 'active' : ''}`}
                onClick={() => onSetShowContentWarning(!showContentWarning)}
                title="Add content warning"
              >
                ⚠️ CW
              </button>

              <label className="hide-metrics-checkbox" title="Hide likes, comments, and shares count">
                <input
                  id="hide-metrics-checkbox"
                  name="hideMetrics"
                  type="checkbox"
                  checked={hideMetrics}
                  onChange={(e) => onSetHideMetrics(e.target.checked)}
                />
                <span>🔇 Hide Metrics</span>
              </label>
            </>
          )}

          {/* Privacy selector - always visible */}
          <select
            id="post-privacy-selector"
            name="postPrivacy"
            value={postVisibility}
            onChange={(e) => onSetPostVisibility(e.target.value)}
            className="privacy-selector glossy"
            aria-label="Select post privacy"
          >
            <option value="public">🌍 Public</option>
            <option value="followers">👥 Connections</option>
            <option value="private">🔒 Private</option>
          </select>

          {/* Draft save status indicator */}
          {draftSaveStatus && (
            <span className="draft-save-status">
              {draftSaveStatus === 'saving' ? '💾 Saving draft...' : '✅ Draft saved'}
            </span>
          )}

          <button
            type="button"
            className="btn-drafts"
            onClick={() => onSetShowDraftManager(true)}
            title="View saved drafts"
          >
            📝 Drafts
          </button>

          <button
            type="button"
            className="btn-gif"
            onClick={() => onSetShowGifPicker(showGifPicker === 'main-post' ? null : 'main-post')}
            disabled={selectedPostGif !== null}
            title="Add GIF"
          >
            GIF
          </button>

          <button type="submit" disabled={loading || uploadingMedia} className="btn-post glossy-gold">
            {loading ? 'Publishing...' : 'Publish ✨'}
          </button>
        </div>

        {/* GIF Preview */}
        {selectedPostGif && (
          <div className="post-gif-preview">
            <img src={selectedPostGif} alt="Selected GIF" />
            <button
              type="button"
              className="btn-remove-gif"
              onClick={() => onSetSelectedPostGif(null)}
            >
              ✕
            </button>
          </div>
        )}

        {/* GIF Picker */}
        {showGifPicker === 'main-post' && (
          <GifPicker
            onGifSelect={(gifUrl) => {
              onSetSelectedPostGif(gifUrl);
              onSetShowGifPicker(null);
            }}
            onClose={() => onSetShowGifPicker(null)}
          />
        )}
      </form>
    </div>
  );

  // ========== MOBILE FAB BUTTON ==========
  const renderMobileFab = () => (
    <button
      className={`mobile-create-post floating-layer ${
        !isTyping && !showMobileComposer ? 'visible' : 'hidden'
      }`}
      onClick={() => onSetShowMobileComposer(true)}
      aria-label="Create post"
      aria-hidden={isTyping || showMobileComposer}
    >
      ＋
    </button>
  );

  // ========== MOBILE COMPOSER BOTTOM SHEET ==========
  const renderMobileComposer = () => {
    if (!showMobileComposer) return null;
    return (
      <div className="mobile-composer-sheet">
        <div className="mobile-composer-header">
          <button
            className="mobile-composer-close"
            onClick={() => {
              onSetShowMobileComposer(false);
              onSetIsTyping(false);
            }}
            aria-label="Close composer"
          >
            ✕
          </button>
          <h2 className="mobile-composer-title">Share something</h2>
          <button
            type="button"
            onClick={onPostSubmit}
            disabled={loading || uploadingMedia}
            className="mobile-composer-post"
          >
            {loading ? 'Publishing...' : 'Publish'}
          </button>
        </div>

        <div className="mobile-composer-content">
          <form onSubmit={onPostSubmit}>
            <textarea
              id="mobile-post-input"
              name="mobileNewPost"
              value={newPost}
              onChange={(e) => handleTextareaChange(e)}
              onPaste={onPaste}
              onFocus={() => onSetIsTyping(true)}
              onBlur={() => onSetIsTyping(false)}
              placeholder={showPollCreator ? "Ask a question..." : "Share something, if you feel like it."}
              className="mobile-post-input"
              rows="3"
              autoFocus
              style={{ overflow: 'hidden', resize: 'none' }}
            />

            {renderMediaPreview()}
            {renderContentWarning('mobile-')}
            {renderPollCreator()}

            <div className="mobile-composer-actions">
              <label className="mobile-btn-media">
                <input
                  id="mobile-media-upload-input"
                  name="mobileMediaUpload"
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={onMediaSelect}
                  disabled={uploadingMedia || selectedMedia.length >= 3}
                  style={{ display: 'none' }}
                />
                📷
              </label>

              <button
                type="button"
                className={`mobile-btn-action ${showPollCreator ? 'active' : ''}`}
                onClick={() => onSetShowPollCreator(!showPollCreator)}
                title="Add poll"
              >
                📊
              </button>

              <button
                type="button"
                className={`mobile-btn-action ${showContentWarning ? 'active' : ''}`}
                onClick={() => onSetShowContentWarning(!showContentWarning)}
                title="Add content warning"
              >
                ⚠️
              </button>

              <select
                id="mobile-post-privacy-selector"
                name="mobilePostPrivacy"
                value={postVisibility}
                onChange={(e) => onSetPostVisibility(e.target.value)}
                className="mobile-privacy-selector"
                aria-label="Select post privacy"
              >
                <option value="public">🌍 Public</option>
                <option value="followers">👥 Connections</option>
                <option value="private">🔒 Private</option>
              </select>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ========== DRAFT MANAGER MODAL ==========
  const renderDraftManager = () => {
    if (!showDraftManager) return null;
    return (
      <div className="modal-overlay" onClick={() => onSetShowDraftManager(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <DraftManager
            draftType="post"
            onRestoreDraft={onRestoreDraft}
            onClose={() => onSetShowDraftManager(false)}
          />
        </div>
      </div>
    );
  };

  // ========== RENDER ==========
  return (
    <>
      {/* Desktop Composer */}
      {!isMobile && renderDesktopComposer()}

      {/* Draft Manager Modal (shared by both) */}
      {renderDraftManager()}

      {/* Mobile FAB Button */}
      {isMobile && renderMobileFab()}

      {/* Mobile Composer Bottom Sheet */}
      {isMobile && renderMobileComposer()}
    </>
  );
});

export default FeedComposer;

