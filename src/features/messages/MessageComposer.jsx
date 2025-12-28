/**
 * MessageComposer - Message input and send controls
 * 
 * RESPONSIBILITIES:
 * - Text input with emoji picker
 * - Voice note recording
 * - Media attachment
 * - Reply preview
 * - Content warning toggle
 * 
 * RULES:
 * - NO layout logic (widths, grids, media queries)
 * - NO data fetching
 * - Layout-agnostic: renders the same on all platforms
 */

import React, { useRef, useState } from 'react';
import EmojiPicker from 'emoji-picker-react';
import './MessageComposer.css';

export default function MessageComposer({
  // State
  messageText = '',
  replyingTo = null,
  isRecording = false,
  recordingTime = 0,
  showEmojiPicker = false,
  showContentWarning = false,
  contentWarningText = '',
  isRecipientUnavailable = false,
  recipientUnavailableReason = '',
  
  // Handlers
  onMessageChange,
  onSend,
  onCancelReply,
  onStartRecording,
  onStopRecording,
  onCancelRecording,
  onToggleEmojiPicker,
  onEmojiSelect,
  onToggleContentWarning,
  onContentWarningChange,
  onMediaSelect,
  onKeyDown,
}) {
  const fileInputRef = useRef(null);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onMediaSelect?.(file);
    }
    e.target.value = '';
  };

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Disabled state
  if (isRecipientUnavailable) {
    return (
      <div className="message-composer-content disabled">
        <div className="unavailable-message">
          {recipientUnavailableReason || 'Cannot send messages to this user'}
        </div>
      </div>
    );
  }

  return (
    <div className="message-composer-content">
      {/* Reply preview */}
      {replyingTo && (
        <div className="reply-preview">
          <div className="reply-preview-content">
            <span className="reply-label">Replying to:</span>
            <span className="reply-text">{replyingTo.content}</span>
          </div>
          <button className="btn-cancel-reply" onClick={onCancelReply}>✕</button>
        </div>
      )}

      {/* Content warning toggle */}
      {showContentWarning && (
        <div className="content-warning-input">
          <input
            type="text"
            placeholder="Content warning label..."
            value={contentWarningText}
            onChange={(e) => onContentWarningChange?.(e.target.value)}
            className="cw-input"
          />
        </div>
      )}

      {/* Main input area */}
      <div className="composer-main">
        {/* Left actions */}
        <div className="composer-actions-left">
          <button
            className={`btn-composer ${showContentWarning ? 'active' : ''}`}
            onClick={onToggleContentWarning}
            title="Add content warning"
          >
            ⚠️
          </button>
          <button
            className="btn-composer"
            onClick={handleFileClick}
            title="Attach media"
          >
            📎
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>

        {/* Text input or recording indicator */}
        {isRecording ? (
          <div className="recording-indicator">
            <span className="recording-dot"></span>
            <span className="recording-time">{formatRecordingTime(recordingTime)}</span>
            <button className="btn-cancel-recording" onClick={onCancelRecording}>✕</button>
          </div>
        ) : (
          <div className="composer-input-wrapper">
            <input
              type="text"
              className="composer-input"
              placeholder="Type a message..."
              value={messageText}
              onChange={(e) => onMessageChange?.(e.target.value)}
              onKeyDown={onKeyDown}
            />
          </div>
        )}

        {/* Right actions */}
        <div className="composer-actions-right">
          <button
            className={`btn-composer ${showEmojiPicker ? 'active' : ''}`}
            onClick={onToggleEmojiPicker}
            title="Emoji"
          >
            😊
          </button>
          
          {isRecording ? (
            <button className="btn-send-voice" onClick={onStopRecording} title="Send voice note">
              ✓
            </button>
          ) : messageText.trim() ? (
            <button className="btn-send" onClick={onSend} title="Send message">
              ➤
            </button>
          ) : (
            <button className="btn-record" onClick={onStartRecording} title="Record voice note">
              🎤
            </button>
          )}
        </div>
      </div>

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div className="emoji-picker-container">
          <EmojiPicker onEmojiClick={(emoji) => onEmojiSelect?.(emoji.emoji)} />
        </div>
      )}
    </div>
  );
}

