import { memo, useEffect, useState, useCallback } from 'react';
import {
  X, Plus, Upload, Camera, BarChart2, AlertTriangle,
  VolumeX, FileText, Globe, Users, Lock, EyeOff,
} from 'lucide-react';
import GifPicker from '../GifPicker';
import PollCreator from '../PollCreator';
import DraftManager from '../DraftManager';
import { getImageUrl } from '../../utils/imageUrl';
import './FeedComposer.css';

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
  isAnonymous,
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
  onSetIsAnonymous,
  onSetShowDraftManager,
  onRestoreDraft,
  onSetShowMobileComposer,
  onSetShowAdvancedOptions,
}) {
  // Drag & drop state
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = { current: 0 };

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const files = e.dataTransfer.files;
    if (files.length > 0 && onMediaSelect && !uploadingMedia && selectedMedia.length < 3) {
      // Create a synthetic event matching what the file input onChange provides
      onMediaSelect({ target: { files } });
    }
  }, [onMediaSelect, uploadingMedia, selectedMedia]);

  // Lock body scroll while mobile composer is open (prevents background scroll on iOS)
  useEffect(() => {
    if (showMobileComposer) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showMobileComposer]);

  // Shared content warning options
  const contentWarningOptions = [
    { value: '', label: 'Select a content warning...' },
    { value: 'Artistic Nudity', label: 'Artistic Nudity' },
    { value: 'Suggestive (Non-Explicit)', label: 'Suggestive (Non-Explicit)' },
    { value: 'Sexual Discussion', label: 'Sexual Discussion' },
    { value: 'Mental Health', label: 'Mental Health' },
    { value: 'Violence', label: 'Violence' },
    { value: 'Self-Harm', label: 'Self-Harm' },
    { value: 'Substance Use', label: 'Substance Use' },
    { value: 'Death/Grief', label: 'Death/Grief' },
    { value: 'Eating Disorders', label: 'Eating Disorders' },
    { value: 'Abuse', label: 'Abuse' },
    { value: 'Discrimination', label: 'Discrimination' },
    { value: 'Medical Content', label: 'Medical Content' },
    { value: 'Flashing Lights', label: 'Flashing Lights' },
    { value: 'Spoilers', label: 'Spoilers' },
    { value: 'Other', label: 'Other (describe below)' },
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
              aria-label="Remove media"
              title="Remove"
            >
              <X size={14} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    );
  };

  // Shared content warning selector
  const renderContentWarning = (idPrefix = '') => {
    if (!showContentWarning) return null;
    const knownValues = contentWarningOptions.map(o => o.value);
    const isCustom = contentWarning && !knownValues.includes(contentWarning);
    const selectValue = isCustom ? 'Other' : contentWarning;
    return (
      <div className="content-warning-input">
        <select
          id={`${idPrefix}content-warning-select`}
          name={`${idPrefix}contentWarning`}
          value={selectValue}
          onChange={(e) => onSetContentWarning(e.target.value)}
          className={`cw-input ${!isMobile ? 'glossy' : ''}`}
        >
          {contentWarningOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {(selectValue === 'Other' || isCustom) && (
          <input
            type="text"
            className="cw-custom-input"
            placeholder="Describe the content warning..."
            value={isCustom ? contentWarning : ''}
            onChange={(e) => onSetContentWarning(e.target.value || 'Other')}
            maxLength={100}
            autoFocus
          />
        )}
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
    <div
      className={`create-post glossy fade-in${isDragging ? ' drag-over' : ''}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="drop-overlay">
          <Upload size={32} strokeWidth={1.5} />
          <span>Drop photos or videos here</span>
        </div>
      )}
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

        <div className="composer-actions">
          {/* QUIET MODE: Show "More Options" button to reveal advanced options */}
          {isQuietMode && !showAdvancedOptions && (
            <button
              type="button"
              className="btn-more-options"
              onClick={() => onSetShowAdvancedOptions(true)}
            >
              <Plus size={14} strokeWidth={1.75} aria-hidden="true" /> More posting options
            </button>
          )}

          {/* Advanced options - hidden by default in quiet mode */}
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
                {uploadingMedia
                  ? <><Upload size={20} strokeWidth={1.75} aria-hidden="true" /><span className="composer-label"> Uploading... {uploadProgress}%</span></>
                  : <><Camera size={20} strokeWidth={1.75} aria-hidden="true" /><span className="composer-label"> Add Photos/Videos</span></>
                }
              </label>

              <button
                type="button"
                className={`icon-btn poll-btn tap-target pressable${showPollCreator ? ' active' : ''}`}
                onClick={() => onSetShowPollCreator(!showPollCreator)}
                aria-label="Add poll"
                data-tooltip="Poll"
              >
                <BarChart2 size={20} strokeWidth={1.75} aria-hidden="true" /><span className="composer-label"> Poll</span>
              </button>

              <button
                type="button"
                className={`icon-btn cw-btn tap-target pressable${showContentWarning ? ' active' : ''}`}
                onClick={() => onSetShowContentWarning(!showContentWarning)}
                aria-label="Add content warning"
                data-tooltip="Content Warning"
              >
                <AlertTriangle size={20} strokeWidth={1.75} aria-hidden="true" /><span className="composer-label"> Content Warning</span>
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
                <span><VolumeX size={16} strokeWidth={1.75} aria-hidden="true" /><span className="composer-label"> Hide Metrics</span></span>
              </label>

              {/* Anonymous posting toggle */}
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
                  <span><EyeOff size={16} strokeWidth={1.75} aria-hidden="true" /><span className="composer-label"> Anonymous</span></span>
                </label>
              )}
              {isAnonymous && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  fontSize: '11px', color: '#7c3aed', background: '#ede9fe',
                  padding: '2px 8px', borderRadius: '999px', fontWeight: 500,
                  marginLeft: '4px'
                }}>
                  🔒 Visible to moderators only
                </span>
              )}
            </>
          )}

          {/* Privacy selector - always visible */}
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

          {/* Draft save status indicator */}
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
            <FileText size={20} strokeWidth={1.75} aria-hidden="true" /><span className="composer-label"> Drafts</span>
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

          <button type="submit" disabled={loading || uploadingMedia} className="btn-post composer-submit tap-target pressable">
            {loading ? 'Publishing...' : 'Publish'}
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
              aria-label="Remove GIF"
              title="Remove GIF"
            >
              <X size={14} strokeWidth={1.75} aria-hidden="true" />
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
            data-tooltip="Close"
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

        <div
          className={`mobile-composer-content${isDragging ? ' drag-over' : ''}`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isDragging && (
            <div className="drop-overlay">
              <Upload size={32} strokeWidth={1.5} />
              <span>Drop photos or videos here</span>
            </div>
          )}
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

            {/* Toolbar — always visible at bottom of content area */}
            <div className="mobile-composer-actions">
              <label
                className="mobile-btn-media"
                aria-label={uploadingMedia ? `Uploading... ${uploadProgress}%` : 'Add Photos / Videos'}
                data-tooltip={uploadingMedia ? `Uploading... ${uploadProgress}%` : 'Add Photos / Videos'}
              >
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
                {uploadingMedia
                  ? <Upload size={20} strokeWidth={1.75} aria-hidden="true" />
                  : <Camera size={20} strokeWidth={1.75} aria-hidden="true" />}
              </label>

              <button
                type="button"
                className={`mobile-btn-action ${showPollCreator ? 'active' : ''}`}
                onClick={() => onSetShowPollCreator(!showPollCreator)}
                aria-label="Add poll"
                data-tooltip="Poll"
              >
                <BarChart2 size={20} strokeWidth={1.75} aria-hidden="true" />
              </button>

              <button
                type="button"
                className={`mobile-btn-action ${showContentWarning ? 'active' : ''}`}
                onClick={() => onSetShowContentWarning(!showContentWarning)}
                aria-label="Add content warning"
                data-tooltip="Content Warning"
              >
                <AlertTriangle size={20} strokeWidth={1.75} aria-hidden="true" />
              </button>

              <label
                className="mobile-btn-action"
                data-tooltip="Hide Metrics"
                aria-label="Hide likes, comments, and shares count"
              >
                <input
                  id="mobile-hide-metrics-checkbox"
                  name="mobileHideMetrics"
                  type="checkbox"
                  checked={hideMetrics}
                  onChange={(e) => onSetHideMetrics(e.target.checked)}
                  style={{ display: 'none' }}
                />
                <VolumeX size={20} strokeWidth={1.75} aria-hidden="true"
                  style={{ opacity: hideMetrics ? 1 : 0.5 }} />
              </label>

              {/* Mobile anonymous posting toggle */}
              {onSetIsAnonymous && (
                <label
                  className="mobile-btn-action"
                  data-tooltip="Anonymous"
                  aria-label="Post anonymously"
                >
                  <input
                    id="mobile-anonymous-checkbox"
                    name="mobileIsAnonymous"
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => onSetIsAnonymous(e.target.checked)}
                    style={{ display: 'none' }}
                  />
                  <EyeOff size={20} strokeWidth={1.75} aria-hidden="true"
                    style={{ opacity: isAnonymous ? 1 : 0.5 }} />
                </label>
              )}
              {isAnonymous && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  fontSize: '10px', color: '#7c3aed', background: '#ede9fe',
                  padding: '2px 6px', borderRadius: '999px', fontWeight: 500
                }}>
                  🔒 Mods only
                </span>
              )}

              <button
                type="button"
                className="mobile-btn-action"
                onClick={() => onSetShowDraftManager(true)}
                aria-label="View saved drafts"
                data-tooltip="Drafts"
              >
                <FileText size={20} strokeWidth={1.75} aria-hidden="true" />
              </button>

              <select
                id="mobile-post-privacy-selector"
                name="mobilePostPrivacy"
                value={postVisibility}
                onChange={(e) => onSetPostVisibility(e.target.value)}
                className="mobile-privacy-selector"
                aria-label="Select post privacy"
              >
                <option value="public">Public</option>
                <option value="followers">Connections</option>
                <option value="private">Private</option>
              </select>
            </div>

            {/* CW and Poll expand below toolbar so they're visible where user looks */}
            {renderContentWarning('mobile-')}
            {renderPollCreator()}
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

