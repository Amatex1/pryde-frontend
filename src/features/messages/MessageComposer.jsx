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

import React, { useRef, useState, lazy, Suspense } from 'react';
import './MessageComposer.css';

// PERFORMANCE: Lazy load emoji picker to save ~200KB from initial bundle
const EmojiPicker = lazy(() => import('emoji-picker-react'));

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

      {/*
        TWO-ROW LAYOUT FOR MOBILE:
        - Row 1: Action buttons (attachment, emoji, voice, content warning)
        - Row 2: Full-width input with send button
        On desktop, CSS will collapse this into a single row
      */}

      {/* Row 1: Actions */}
      <div className="composer-actions-row">
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
        <button
          className={`btn-composer ${showEmojiPicker ? 'active' : ''}`}
          onClick={onToggleEmojiPicker}
          title="Emoji"
        >
          😊
        </button>
        {!isRecording && !messageText.trim() && (
          <button
            className="btn-composer"
            onClick={onStartRecording}
            title="Record voice note"
          >
            🎤
          </button>
        )}
      </div>

      {/* Row 2: Input + Send */}
      <div className="composer-input-row">
        {isRecording ? (
          <div className="recording-indicator">
            <span className="recording-dot"></span>
            <span className="recording-time">{formatRecordingTime(recordingTime)}</span>
            <button className="btn-cancel-recording" onClick={onCancelRecording}>✕</button>
            <button className="btn-send-voice" onClick={onStopRecording} title="Send voice note">
              ✓
            </button>
          </div>
        ) : (
          <>
            <input
              type="text"
              className="composer-input"
              placeholder="Type a message..."
              value={messageText}
              onChange={(e) => onMessageChange?.(e.target.value)}
              onKeyDown={onKeyDown}
            />
            {messageText.trim() && (
              <button className="btn-send" onClick={onSend} title="Send message">
                ➤
              </button>
            )}
          </>
        )}
      </div>

      {/* Emoji picker - PERFORMANCE: Lazy loaded with Suspense */}
      {showEmojiPicker && (
        <div className="emoji-picker-container">
          <Suspense fallback={<div className="emoji-loading">Loading emojis...</div>}>
            <EmojiPicker onEmojiClick={(emoji) => onEmojiSelect?.(emoji.emoji)} />
          </Suspense>
        </div>
      )}
    </div>
  );
}

