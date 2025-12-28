/**
 * MessageThread - Active conversation thread display
 * 
 * RESPONSIBILITIES:
 * - Render message history
 * - Show typing indicator
 * - Date headers between messages
 * - Handle message actions (react, reply, edit, delete)
 * 
 * RULES:
 * - NO layout logic (widths, grids, media queries)
 * - NO data fetching
 * - Layout-agnostic: renders the same on all platforms
 */

import React, { useRef, useEffect } from 'react';
import { getImageUrl } from '../../utils/imageUrl';
import { getDisplayName, getDisplayNameInitial } from '../../utils/getDisplayName';
import { getSentMessageColor, getUserChatColor } from '../../utils/chatColors';
import { sanitizeMessage } from '../../utils/sanitize';
import AudioPlayer from '../../components/AudioPlayer';
import './MessageThread.css';

export default function MessageThread({
  // Data
  messages = [],
  currentUser,
  selectedUser,
  selectedGroup,
  selectedChatType = 'user',
  onlineUsers = [],
  mutedConversations = [],
  selectedChatId,
  
  // State
  isTyping = false,
  isRecipientUnavailable = false,
  recipientUnavailableReason = '',
  editingMessageId,
  editMessageText,
  
  // Handlers
  onBack,
  onReply,
  onReact,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onRemoveReaction,
  onEditTextChange,
  onToggleMute,
  
  // Refs
  messagesEndRef,
}) {
  const containerRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef?.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, messagesEndRef]);

  // Helpers
  const formatDateHeader = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const messageDateMidnight = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayMidnight = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    if (messageDateMidnight.getTime() === todayMidnight.getTime()) return 'Today';
    if (messageDateMidnight.getTime() === yesterdayMidnight.getTime()) return 'Yesterday';
    return messageDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const shouldShowDateHeader = (currentMsg, previousMsg) => {
    if (!previousMsg) return true;
    const currentDate = new Date(currentMsg.createdAt);
    const previousDate = new Date(previousMsg.createdAt);
    return currentDate.toDateString() !== previousDate.toDateString();
  };

  // Determine chat display info
  const isSelfChat = selectedUser?._id === currentUser?._id;
  const chatName = selectedChatType === 'group' 
    ? (selectedGroup?.name || 'Group Chat')
    : isSelfChat 
      ? '📝 Notes to self' 
      : getDisplayName(selectedUser);
  const isOnline = onlineUsers.includes(selectedChatId);
  const isMuted = mutedConversations.includes(selectedChatId);

  return (
    <div className="message-thread-content">
      {/* Header */}
      <div className="chat-header">
        <button className="mobile-back-btn" onClick={onBack}>
          ← Back
        </button>
        
        <div className="chat-user">
          <div className="chat-avatar">
            {selectedChatType === 'group' ? (
              <span>{selectedGroup?.name?.charAt(0).toUpperCase() || 'G'}</span>
            ) : isSelfChat ? (
              <span>📝</span>
            ) : selectedUser?.profilePhoto ? (
              <img src={getImageUrl(selectedUser.profilePhoto)} alt={chatName} />
            ) : (
              <span>{getDisplayNameInitial(selectedUser)}</span>
            )}
          </div>
          
          <div className="chat-user-info">
            <div className="chat-user-name">
              <span className="display-name">{chatName}</span>
              {isMuted && <span className="muted-indicator">🔕</span>}
            </div>
            {selectedChatType !== 'group' && !isSelfChat && !isRecipientUnavailable && (
              <div className={`chat-user-status ${isOnline ? 'online' : 'offline'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </div>
            )}
          </div>
        </div>

        <button
          className="btn-chat-settings"
          onClick={onToggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? '🔔' : '🔕'}
        </button>
      </div>

      {/* Messages */}
      <div className="chat-messages" ref={containerRef}>
        {!currentUser ? (
          <div className="loading-messages">Loading messages...</div>
        ) : (
          messages.map((msg, index) => {
            const isSent = msg.sender._id === currentUser._id;
            const showDateHeader = shouldShowDateHeader(msg, messages[index - 1]);
            const isEditing = editingMessageId === msg._id;

            return (
              <MessageBubble
                key={msg._id}
                message={msg}
                isSent={isSent}
                isEditing={isEditing}
                showDateHeader={showDateHeader}
                formatDateHeader={formatDateHeader}
                editMessageText={editMessageText}
                currentUser={currentUser}
                onReply={() => onReply?.(msg)}
                onReact={() => onReact?.(msg._id)}
                onEdit={() => onEdit?.(msg._id, msg.content)}
                onSaveEdit={() => onSaveEdit?.(msg._id)}
                onCancelEdit={onCancelEdit}
                onDelete={() => onDelete?.(msg._id)}
                onRemoveReaction={(emoji) => onRemoveReaction?.(msg._id, emoji)}
                onEditTextChange={onEditTextChange}
              />
            );
          })
        )}
        
        {isTyping && (
          <div className="typing-indicator">
            <span></span><span></span><span></span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

/**
 * MessageBubble - Single message display
 */
function MessageBubble({
  message,
  isSent,
  isEditing,
  showDateHeader,
  formatDateHeader,
  editMessageText,
  currentUser,
  onReply,
  onReact,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onRemoveReaction,
  onEditTextChange,
}) {
  const bubbleStyle = isSent
    ? { background: getSentMessageColor(), color: '#ffffff' }
    : { background: getUserChatColor(message.sender._id), color: '#ffffff' };

  return (
    <React.Fragment>
      {showDateHeader && (
        <div className="message-date-header">
          <span>{formatDateHeader(message.createdAt)}</span>
        </div>
      )}

      <div className={`message-group ${isSent ? 'sent' : 'received'}`}>
        <div className="message-content">
          {/* Sender header */}
          <div className="message-header">
            <div className="message-avatar-small">
              {message.sender.profilePhoto ? (
                <img src={getImageUrl(message.sender.profilePhoto)} alt={getDisplayName(message.sender)} />
              ) : (
                <span>{getDisplayNameInitial(message.sender)}</span>
              )}
            </div>
            <div className="message-sender-name">{getDisplayName(message.sender)}</div>
          </div>

          {isEditing ? (
            <div className="message-edit-box">
              <input
                type="text"
                value={editMessageText}
                onChange={(e) => onEditTextChange?.(e.target.value)}
                className="message-edit-input"
                autoFocus
              />
              <div className="message-edit-actions">
                <button onClick={onSaveEdit} className="btn-save-edit">✓</button>
                <button onClick={onCancelEdit} className="btn-cancel-edit">✕</button>
              </div>
            </div>
          ) : (
            <>
              {/* Reply reference */}
              {message.replyTo && (
                <div className="reply-reference">
                  <span className="reply-to-label">Replying to {getDisplayName(message.replyTo.sender)}</span>
                  <span className="reply-to-content">{message.replyTo.content}</span>
                </div>
              )}

              {/* Message bubble */}
              <div className="message-bubble" style={bubbleStyle}>
                {message.contentWarning && (
                  <div className="content-warning-badge">⚠️ {message.contentWarning}</div>
                )}
                {message.voiceNote?.url ? (
                  <AudioPlayer src={getImageUrl(message.voiceNote.url)} />
                ) : message.media?.url ? (
                  message.media.type === 'image' ? (
                    <img src={getImageUrl(message.media.url)} alt="Shared" className="message-media" />
                  ) : (
                    <video src={getImageUrl(message.media.url)} controls className="message-media" />
                  )
                ) : (
                  <span dangerouslySetInnerHTML={{ __html: sanitizeMessage(message.content) }} />
                )}

                {/* Reactions */}
                {message.reactions && message.reactions.length > 0 && (
                  <div className="message-reactions">
                    {Object.entries(
                      message.reactions.reduce((acc, r) => {
                        acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([emoji, count]) => {
                      const userReacted = message.reactions.some(
                        r => r.emoji === emoji && r.user === currentUser._id
                      );
                      return (
                        <button
                          key={emoji}
                          className={`reaction-badge ${userReacted ? 'user-reacted' : ''}`}
                          onClick={() => userReacted && onRemoveReaction?.(emoji)}
                        >
                          {emoji} {count > 1 && count}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Meta */}
              <div className="message-meta">
                <div className="message-time">
                  {new Date(message.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                </div>
                {message.edited && <div className="message-edited-indicator">(edited)</div>}
              </div>

              {/* Actions */}
              <div className="message-actions">
                <button onClick={onReply} className="btn-message-action" title="Reply">↩️</button>
                <button onClick={onReact} className="btn-message-action" title="React">😊</button>
                {isSent && (
                  <>
                    <button onClick={onEdit} className="btn-message-action" title="Edit">✏️</button>
                    <button onClick={onDelete} className="btn-message-action" title="Delete">🗑️</button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </React.Fragment>
  );
}

