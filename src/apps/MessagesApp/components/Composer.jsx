/**
 * Composer — Message Input Component
 * Extracted from: src/pages/Messages.jsx lines 2179-2356
 */

import React, { lazy, Suspense, useEffect, useState } from 'react';
import { X, Mic, AlertTriangle, ArrowUp, Video, Paperclip, MoreHorizontal } from 'lucide-react';
import { getImageUrl } from '../../../utils/imageUrl';
import { getDisplayName } from '../../../utils/getDisplayName';

const GifPicker = lazy(() => import('../../../components/GifPicker'));
const VoiceRecorder = lazy(() => import('../../../components/VoiceRecorder'));

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
  onRecordingComplete,
  replyingTo,
  onCancelReply,
  isRecipientUnavailable,
  recipientUnavailableReason,
}) {
  const [showComposerTools, setShowComposerTools] = useState(false);

  useEffect(() => {
    setShowComposerTools(false);
  }, [selectedChat, selectedFile, selectedGif]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (selectedChat) onSendMessage(e);
    }
  };

  const canUseSecondaryTools = Boolean(selectedChat) && !selectedFile && !selectedGif && !isRecipientUnavailable;
  const toolsTrayOpen = showComposerTools || showGifPicker || showVoiceRecorder || showContentWarning;

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
              onChange={(e) => onContentWarningChange(e.target.value || 'Other')}
              maxLength={100}
              autoFocus
            />
          )}
        </div>
      )}
      {replyingTo && (
        <div className="reply-preview">
          <div className="reply-preview-content">
            <div className="reply-preview-label">Replying to {getDisplayName(replyingTo.sender)}</div>
            <div className="reply-preview-text">{replyingTo.content}</div>
          </div>
          <button type="button" className="btn-cancel-reply" onClick={onCancelReply} aria-label="Cancel"><X size={14} strokeWidth={1.75} aria-hidden="true" /></button>
        </div>
      )}
      {selectedFile && (
        <div className="file-preview">
          <div className="file-preview-content">
            {selectedFile.type.startsWith('image/') ? (
              <img src={getImageUrl(selectedFile.url)} alt="Preview" className="file-preview-image" />
            ) : (<div className="file-preview-icon"><Video size={20} strokeWidth={1.75} aria-hidden="true" /></div>)}
            <span className="file-preview-name">{selectedFile.name}</span>
          </div>
          <button type="button" className="btn-cancel-reply" onClick={onRemoveFile} aria-label="Remove file"><X size={14} strokeWidth={1.75} aria-hidden="true" /></button>
        </div>
      )}
      {selectedGif && (
        <div className="file-preview">
          <div className="file-preview-content">
            <img src={selectedGif} alt="Selected GIF" className="file-preview-image" />
          </div>
          <button type="button" className="btn-cancel-reply" onClick={onRemoveGif} aria-label="Remove GIF"><X size={14} strokeWidth={1.75} aria-hidden="true" /></button>
        </div>
      )}
      <div className="message-composer calm-composer">
        <input type="file" ref={fileInputRef} onChange={onFileSelect} accept="image/*,video/*" style={{ display: 'none' }} />
        {toolsTrayOpen && (
          <div className="composer-tools-tray">
            <button
              type="button"
              className={`composer-tray-btn ${showGifPicker ? 'active' : ''}`}
              onClick={onToggleGifPicker}
              disabled={!canUseSecondaryTools}
            >
              GIF
            </button>
            <button
              type="button"
              className={`composer-tray-btn ${showVoiceRecorder ? 'active' : ''}`}
              onClick={onToggleVoiceRecorder}
              disabled={!canUseSecondaryTools}
            >
              <Mic size={14} strokeWidth={1.75} aria-hidden="true" /> Voice note
            </button>
            <button
              type="button"
              className={`composer-tray-btn ${showContentWarning ? 'active' : ''}`}
              onClick={onToggleContentWarning}
              disabled={!selectedChat || isRecipientUnavailable}
            >
              <AlertTriangle size={14} strokeWidth={1.75} aria-hidden="true" /> Content warning
            </button>
          </div>
        )}
        <div className="composer-input-row">
          <button
            type="button"
            className={`composer-action-btn composer-action-btn--attach ${uploadingFile ? 'composer-action-btn--progress' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            disabled={!selectedChat || uploadingFile || selectedGif || isRecipientUnavailable}
            title={uploadingFile ? `Uploading... ${uploadProgress}%` : 'Attach'}
            aria-label={uploadingFile ? `Uploading attachment ${uploadProgress}%` : 'Attach file'}
          >
            {uploadingFile ? `${uploadProgress}%` : <Paperclip size={16} strokeWidth={1.9} aria-hidden="true" />}
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
          <button
            type="button"
            className={`composer-action-btn composer-action-btn--tools ${toolsTrayOpen ? 'active' : ''}`}
            onClick={() => setShowComposerTools(prev => !prev)}
            disabled={!selectedChat || isRecipientUnavailable}
            title="More tools"
            aria-label="More tools"
          >
            <MoreHorizontal size={16} strokeWidth={1.9} aria-hidden="true" />
          </button>
          <button type="submit" className="send-btn" disabled={!selectedChat || uploadingFile || isRecipientUnavailable || (!message.trim() && !selectedFile && !selectedGif)} aria-label="Send"><ArrowUp size={18} strokeWidth={2} aria-hidden="true" /></button>
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
        {showVoiceRecorder && (
          <div className="composer-voice-recorder-container">
            <Suspense fallback={<div className="voice-recorder-loading">Loading...</div>}>
              <VoiceRecorder
                onRecordingComplete={onRecordingComplete}
                onCancel={onToggleVoiceRecorder}
              />
            </Suspense>
          </div>
        )}
      </div>
    </form>
  );
}

