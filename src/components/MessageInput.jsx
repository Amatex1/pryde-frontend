import React, { useState, useRef, useEffect, useCallback, Suspense, lazy } from 'react';
import { getImageUrl } from '../utils/imageUrl';
import { getDisplayName } from '../utils/getDisplayName';

// Lazy load heavy components
const VoiceRecorder = lazy(() => import('./VoiceRecorder'));

/**
 * MessageInput - Keyboard-safe message composer
 *
 * Features:
 * - Sticky positioning with safe-area padding
 * - Auto-growing textarea
 * - Inline action icons
 * - Auto-scroll on focus (critical for mobile keyboards)
 */
export default function MessageInput({
  message,
  setMessage,
  onSend,
  onFileSelect,
  selectedFile,
  onRemoveFile,
  selectedGif,
  onRemoveGif,
  replyingTo,
  onCancelReply,
  contentWarning,
  setContentWarning,
  showContentWarning,
  setShowContentWarning,
  uploadingFile,
  uploadProgress,
  isRecipientUnavailable,
  recipientUnavailableReason,
  fileInputRef,
  scrollContainerId = 'message-scroll'
}) {
  const textareaRef = useRef(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

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
    if (files.length > 0 && onFileSelect && !uploadingFile && !selectedGif && !isRecipientUnavailable) {
      onFileSelect({ target: { files } });
    }
  }, [onFileSelect, uploadingFile, selectedGif, isRecipientUnavailable]);

  // Auto-grow textarea
  const handleInput = (e) => {
    const textarea = e.target;
    setMessage(textarea.value);

    // Reset and recalculate height
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  // Reset height when message is cleared
  useEffect(() => {
    if (!message && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [message]);

  // Auto-scroll to bottom on focus (keyboard safety)
  const handleFocus = () => {
    setTimeout(() => {
      const scrollContainer = document.getElementById(scrollContainerId);
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }, 200);
  };

  // Handle Enter to send (Shift+Enter for new line)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend(e);
    }
  };

  const hasContent = message.trim() || selectedFile || selectedGif;

  return (
    <div
      className={`message-input-container${isDragging ? ' drag-over' : ''}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="drop-overlay">
          <span>📎</span>
          <span>Drop file here</span>
        </div>
      )}
      {/* Content Warning Selector */}
      {showContentWarning && (
        <div className="input-addon cw-selector">
          <label htmlFor="cw-select" className="sr-only">Select content warning</label>
          <select
            id="cw-select"
            value={contentWarning}
            onChange={(e) => setContentWarning(e.target.value)}
            className="cw-select"
            aria-label="Select content warning"
          >
            <option value="">Select content warning...</option>
            <option value="Mental Health">Mental Health</option>
            <option value="Violence">Violence</option>
            <option value="Sexual Content">Sexual Content</option>
            <option value="Substance Use">Substance Use</option>
            <option value="Self-Harm">Self-Harm</option>
            <option value="Death/Grief">Death/Grief</option>
            <option value="Eating Disorders">Eating Disorders</option>
            <option value="Abuse">Abuse</option>
            <option value="Discrimination">Discrimination</option>
            <option value="Medical Content">Medical Content</option>
            <option value="Flashing Lights">Flashing Lights</option>
            <option value="Spoilers">Spoilers</option>
            <option value="Other">Other (describe below)</option>
          </select>
          {(['Other'].includes(contentWarning) || (contentWarning && !['', 'Mental Health', 'Violence', 'Sexual Content', 'Substance Use', 'Self-Harm', 'Death/Grief', 'Eating Disorders', 'Abuse', 'Discrimination', 'Medical Content', 'Flashing Lights', 'Spoilers', 'Other'].includes(contentWarning))) && (
            <input
              type="text"
              className="cw-custom-input"
              placeholder="Describe the content warning..."
              value={contentWarning === 'Other' ? '' : contentWarning}
              onChange={(e) => setContentWarning(e.target.value || 'Other')}
              maxLength={100}
              autoFocus
            />
          )}
        </div>
      )}

      {/* Reply Preview */}
      {replyingTo && (
        <div className="input-addon reply-preview">
          <div className="reply-content">
            <span className="reply-label">Replying to {getDisplayName(replyingTo.sender)}</span>
            <span className="reply-text">{replyingTo.content}</span>
          </div>
          <button className="addon-close" onClick={onCancelReply}>✕</button>
        </div>
      )}

      {/* File Preview */}
      {selectedFile && (
        <div className="input-addon file-preview">
          <div className="preview-content">
            {selectedFile.type?.startsWith('image/') ? (
              <img src={getImageUrl(selectedFile.url)} alt="Preview" className="preview-thumb" />
            ) : (
              <span className="preview-icon">🎥</span>
            )}
            <span className="preview-name">{selectedFile.name}</span>
          </div>
          <button className="addon-close" onClick={onRemoveFile}>✕</button>
        </div>
      )}

      {/* GIF Preview */}
      {selectedGif && (
        <div className="input-addon gif-preview">
          <img src={selectedGif} alt="GIF" className="preview-thumb" />
          <button className="addon-close" onClick={onRemoveGif}>✕</button>
        </div>
      )}

      {/* Main Input Row */}
      <div className="input-row">
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileSelect}
          accept="image/*,video/*"
          style={{ display: 'none' }}
        />

        {/* Attach button */}
        <button
          type="button"
          className="input-action"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingFile || selectedGif || isRecipientUnavailable}
          title={uploadingFile ? `Uploading ${uploadProgress}%` : 'Attach file'}
        >
          {uploadingFile ? `${uploadProgress}%` : '+'}
        </button>

        {/* Text input */}
        <textarea
          ref={textareaRef}
          rows="1"
          value={message}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={
            isRecipientUnavailable
              ? recipientUnavailableReason
              : replyingTo
                ? 'Reply...'
                : selectedGif || selectedFile
                  ? 'Caption...'
                  : 'Message...'
          }
          className="input-textarea"
          disabled={isRecipientUnavailable}
        />

        {/* Secondary actions */}
        <div className="input-actions-group">
          <button
            type="button"
            className="input-action"
            onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
            disabled={selectedFile || selectedGif || isRecipientUnavailable}
            title="Voice note"
          >
            🎤
          </button>
          <button
            type="button"
            className={`input-action ${showContentWarning ? 'active' : ''}`}
            onClick={() => setShowContentWarning(!showContentWarning)}
            disabled={isRecipientUnavailable}
            title="Content warning"
          >
            ⚠️
          </button>
        </div>

        {/* Send button */}
        <button
          type="submit"
          className="input-send"
          onClick={onSend}
          disabled={uploadingFile || isRecipientUnavailable || !hasContent}
          aria-label="Send message"
        >
          ↑
        </button>
      </div>

      {/* Voice Recorder */}
      {showVoiceRecorder && (
        <Suspense fallback={<div className="loading-voice">Loading...</div>}>
          <VoiceRecorder
            onRecordingComplete={(audioBlob, duration) => {
              // Parent handles the upload and send
              if (typeof onSend === 'function') {
                onSend(null, { audioBlob, duration });
              }
              setShowVoiceRecorder(false);
            }}
            onCancel={() => setShowVoiceRecorder(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
