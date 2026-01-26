/**
 * Composer — Message Input Component
 * Extracted from: src/pages/Messages.jsx lines 2179-2356
 */

import React, { lazy, Suspense } from 'react';
import { getImageUrl } from '../../../utils/imageUrl';
import { getDisplayName } from '../../../utils/getDisplayName';

const GifPicker = lazy(() => import('../../../components/GifPicker'));

export default function Composer({
  selectedChat,
  message,
  onMessageChange,
  onSendMessage,
  selectedFile,
  onFileSelect,
  onRemoveFile,
  fileInputRef,
  textareaRef,
  uploadingFile,
  uploadProgress,
  selectedGif,
  onRemoveGif,
  showGifPicker,
  onToggleGifPicker,
  onGifSelect,
  contentWarning,
  onContentWarningChange,
  showContentWarning,
  onToggleContentWarning,
  showVoiceRecorder,
  onToggleVoiceRecorder,
  replyingTo,
  onCancelReply,
  isRecipientUnavailable,
  recipientUnavailableReason,
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (selectedChat) onSendMessage(e);
    }
  };

  return (
    <form onSubmit={selectedChat ? onSendMessage : (e) => e.preventDefault()} className="messages-app__composer">
      {showContentWarning && (
        <div className="content-warning-input">
          <select value={contentWarning} onChange={(e) => onContentWarningChange(e.target.value)} className="cw-input glossy">
            <option value="">Select a content warning...</option>
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
            <option value="Spoilers">Spoilers</option>
            <option value="Other">Other</option>
          </select>
        </div>
      )}
      {replyingTo && (
        <div className="reply-preview">
          <div className="reply-preview-content">
            <div className="reply-preview-label">Replying to {getDisplayName(replyingTo.sender)}</div>
            <div className="reply-preview-text">{replyingTo.content}</div>
          </div>
          <button type="button" className="btn-cancel-reply" onClick={onCancelReply}>✕</button>
        </div>
      )}
      {selectedFile && (
        <div className="file-preview">
          <div className="file-preview-content">
            {selectedFile.type.startsWith('image/') ? (
              <img src={getImageUrl(selectedFile.url)} alt="Preview" className="file-preview-image" />
            ) : (<div className="file-preview-icon">🎥</div>)}
            <span className="file-preview-name">{selectedFile.name}</span>
          </div>
          <button type="button" className="btn-cancel-reply" onClick={onRemoveFile}>✕</button>
        </div>
      )}
      {selectedGif && (
        <div className="file-preview">
          <div className="file-preview-content">
            <img src={selectedGif} alt="Selected GIF" className="file-preview-image" />
          </div>
          <button type="button" className="btn-cancel-reply" onClick={onRemoveGif}>✕</button>
        </div>
      )}
      <div className="message-composer calm-composer">
        <input type="file" ref={fileInputRef} onChange={onFileSelect} accept="image/*,video/*" style={{ display: 'none' }} />
        <div className="composer-input-row">
          <button
            type="button"
            className="composer-action-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={!selectedChat || uploadingFile || selectedGif || isRecipientUnavailable}
            title={uploadingFile ? `Uploading... ${uploadProgress}%` : 'Attach'}
          >
            {uploadingFile ? `${uploadProgress}%` : '+'}
          </button>
          <textarea
            ref={textareaRef}
            rows="1"
            value={message}
            onChange={onMessageChange}
            onKeyDown={handleKeyDown}
            placeholder={!selectedChat ? 'Select a conversation...' : isRecipientUnavailable ? recipientUnavailableReason : replyingTo ? 'Reply...' : selectedGif || selectedFile ? 'Caption...' : 'Message...'}
            className="message-input"
            disabled={!selectedChat || isRecipientUnavailable}
          />
          <div className="composer-trailing-actions">
            <button type="button" className={`composer-action-btn ${showGifPicker ? 'active' : ''}`} onClick={onToggleGifPicker} disabled={!selectedChat || selectedFile || selectedGif || isRecipientUnavailable} title="GIF">GIF</button>
            <button type="button" className="composer-action-btn" onClick={onToggleVoiceRecorder} disabled={!selectedChat || selectedFile || selectedGif || isRecipientUnavailable} title="Voice note">🎤</button>
            <button type="button" className={`composer-action-btn ${showContentWarning ? 'active' : ''}`} onClick={onToggleContentWarning} disabled={!selectedChat || isRecipientUnavailable} title="Content warning">⚠️</button>
          </div>
          <button type="submit" className="send-btn" disabled={!selectedChat || uploadingFile || isRecipientUnavailable || (!message.trim() && !selectedFile && !selectedGif)} aria-label="Send">↑</button>
        </div>
        {showGifPicker && (
          <div className="composer-gif-picker-container">
            <Suspense fallback={<div className="gif-picker-loading">Loading...</div>}>
              <GifPicker
                onGifSelect={onGifSelect}
                onClose={onToggleGifPicker}
              />
            </Suspense>
          </div>
        )}
      </div>
    </form>
  );
}

